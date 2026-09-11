import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import net from 'node:net';
import crypto from 'node:crypto';
import { spawn, type ChildProcess } from 'node:child_process';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import {
  runTraumaFilter,
  computeFallbackScores,
  generateVictimDashboardPayload,
  generateOfficialsDashboardPayload
} from './src/lib/traumaFilter.ts';
import { executeBackendPipeline } from './src/lib/pipelineEngine.ts';
import { getVictimDatabase } from './src/lib/victimDatabase.ts';
import {
  getDatabaseAdapter,
  setDatabaseAdapter,
  SQL_SCHEMA_PLACEHOLDER,
  MONGOOSE_SCHEMA_PLACEHOLDER,
  PRISMA_SCHEMA_PLACEHOLDER,
  NEON_REST_QUERY_EXAMPLES
} from './src/db/databasePlaceholder.ts';
import { getDatabaseUrl, isNeonPostgresConfigured, NeonPostgresAdapter } from './src/db/neonPostgresAdapter.ts';
import type {
  FilterSettings,
  TraumaScores,
  IngestionChannel,
  ChannelMetadata,
  ProcessedAtrocityRecord,
  FullEvaluationResponse,
  PipelineProcessPayload,
  VictimProfile,
  VictimDbRecord,
  CheckinDbRecord,
  VictimDashboardPayload,
  OfficialsDashboardPayload,
  OfficialDbRecord
} from './src/types.ts';


function hashVictimPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyVictimPassword(password: string, stored: string): boolean {
  const [salt, expected] = stored.split(':');
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
}

type OfficialSession = { username: string; role: 'admin' | 'sub_official'; displayName: string; createdAt: number };
const officialSessions = new Map<string, OfficialSession>();

function createOfficialSession(session: OfficialSession): string {
  const token = crypto.randomBytes(32).toString('hex');
  officialSessions.set(token, session);
  return token;
}

function getOfficialSession(req: express.Request): OfficialSession | null {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return officialSessions.get(header.slice(7)) || null;
}

function requireOfficial(req: express.Request, res: express.Response): OfficialSession | null {
  const session = getOfficialSession(req);
  if (!session) { res.status(401).json({ error: 'Official login required.' }); return null; }
  return session;
}

function requireAdmin(req: express.Request, res: express.Response): OfficialSession | null {
  const session = requireOfficial(req, res);
  if (!session) return null;
  if (session.role !== 'admin') { res.status(403).json({ error: 'Only the Admin official can add sub-official accounts.' }); return null; }
  return session;
}


let telegramBotProcess: ChildProcess | null = null;

function startTelegramBot(port: number): void {
  const token = process.env.BOT_TOKEN?.trim();
  const enabled = (process.env.BOT_ENABLED ?? 'true').toLowerCase() !== 'false';
  if (!enabled) {
    console.log('[Telegram] Auto-start disabled with BOT_ENABLED=false.');
    return;
  }
  if (!token) {
    console.log('[Telegram] BOT_TOKEN is not configured; Telegram bot is disabled.');
    return;
  }

  const scriptPath = path.join(process.cwd(), 'checkin_bot.py');
  const pythonCommand = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');
  const botEnv = {
    ...process.env,
    BOT_TOKEN: token,
    CAREBRIDGE_API_URL: process.env.CAREBRIDGE_API_URL || `http://127.0.0.1:${port}`,
  };

  console.log(`[Telegram] Starting bot automatically with ${pythonCommand}...`);
  telegramBotProcess = spawn(pythonCommand, [scriptPath], {
    cwd: process.cwd(),
    env: botEnv,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  telegramBotProcess.stdout?.on('data', data => process.stdout.write(`[Telegram] ${data}`));
  telegramBotProcess.stderr?.on('data', data => process.stderr.write(`[Telegram] ${data}`));
  telegramBotProcess.on('error', err => {
    console.error(`[Telegram] Failed to start bot: ${err.message}`);
    telegramBotProcess = null;
  });
  telegramBotProcess.on('exit', (code, signal) => {
    if (code !== 0 && signal !== 'SIGTERM') {
      console.error(`[Telegram] Bot exited unexpectedly (code=${code}, signal=${signal}).`);
    } else {
      console.log('[Telegram] Bot stopped.');
    }
    telegramBotProcess = null;
  });
}

function stopTelegramBot(): void {
  if (!telegramBotProcess) return;
  console.log('[Telegram] Stopping bot...');
  telegramBotProcess.kill('SIGTERM');
  telegramBotProcess = null;
}

async function findAvailablePort(preferredPort: number): Promise<number> {
  for (let port = preferredPort; port < preferredPort + 20; port += 1) {
    const available = await new Promise<boolean>(resolve => {
      const probe = net.createServer();
      probe.once('error', () => resolve(false));
      probe.listen(port, '0.0.0.0', () => {
        probe.close(() => resolve(true));
      });
    });

    if (available) return port;
  }

  throw new Error(`No available port found near ${preferredPort}`);
}

// Helper function to process an incoming text disclosure through the filter & AI scoring
async function processDisclosure(
  input: string,
  channel: IngestionChannel,
  victimId: string,
  channelMetadata: ChannelMetadata = { channel },
  customSettings?: Partial<FilterSettings>
): Promise<FullEvaluationResponse> {
  const database = getDatabaseAdapter();
  const registeredVictim = await database.getVictim(victimId);
  if (!registeredVictim) {
    throw new Error(`Victim ${victimId} is not registered in the database. Register the case before ingestion.`);
  }

  const settings: FilterSettings = {
    redactPii: true,
    redactLocations: true,
    redactIdentifiers: true,
    sensitivityLevel: 'standard',
    includeCrisisSafetyShield: true,
    ...customSettings
  };

  // 1. Run Trauma Filter (PII Redaction & Crisis Pre-screening)
  const filterResult = runTraumaFilter(input, settings);

  // 2. AI Scoring with Gemini 3.8 Flash
  const apiKey = process.env.GEMINI_API_KEY;
  let scores: TraumaScores;
  let evalSource: 'gemini-3.8-flash' | 'clinical-rule-engine-fallback' = 'clinical-rule-engine-fallback';

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemPrompt = `You are a specialized clinical AI trauma assessment module within the "AI-Powered Dynamic Mental Health Monitoring and Distress Prediction System for Victims of Atrocities".
You evaluate input originating from multiple channels (Victim Dashboard, WhatsApp bot, Telegram bot, IVR telephony, or Speech-to-text) regarding victims of armed conflict, state violence, ethnic persecution, displacement, and atrocities.
The text has already been filtered and sanitized to redact personal identifiers and private locations.

Your task:
Analyze this filtered disclosure from an atrocity victim and evaluate:
1. Overall Trauma Severity Impact Score (0 to 100)
2. Acute Distress & Arousal Score (0 to 100)
3. Resilience, Agency & Insight Score (0 to 100)
4. Urgency Tier: Mild, Moderate, High, Severe / Crisis
5. PCL-5 Symptom Clusters: Intrusion, Avoidance, Negative Cognition/Mood, Hyperarousal
6. Objective Clinical Observations for Officials & Caseworkers
7. An Empathetic, Dignifying Feedback Message tailored for the Victim's Dashboard (avoid medical jargon, provide warmth, safety, and validation)
8. Immediate Grounding & Somatic Stabilization Exercises
9. Recommended Care Pathway for Officials and Support Facilitators.`;

      const prompt = `SOURCE CHANNEL: ${channel.toUpperCase()}
VICTIM IDENTIFIER HASH: ${victimId}
FILTERED TRAUMA NARRATIVE:
"""
${filterResult.filteredText}
"""

PRE-FILTER SAFETY DATA:
- Crisis Status: ${filterResult.crisisDetection.severity}
- Detected Categories: ${filterResult.traumaTags.map(t => t.label).join(', ') || 'General Atrocity Trauma'}
- Sanitized Entities: ${filterResult.redactedCount}

Return the structured assessment JSON.`;

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI scoring timeout (8s limit exceeded)')), 8000)
      );

      const aiPromise = ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallImpactScore: { type: Type.INTEGER },
              acuteDistressScore: { type: Type.INTEGER },
              resilienceScore: { type: Type.INTEGER },
              urgencyLevel: {
                type: Type.STRING,
                enum: ['Mild', 'Moderate', 'High', 'Severe / Crisis']
              },
              clusters: {
                type: Type.OBJECT,
                properties: {
                  intrusion: {
                    type: Type.OBJECT,
                    properties: {
                      score: { type: Type.INTEGER },
                      level: { type: Type.STRING, enum: ['Minimal', 'Mild', 'Moderate', 'Severe'] },
                      indicators: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['score', 'level', 'indicators']
                  },
                  avoidance: {
                    type: Type.OBJECT,
                    properties: {
                      score: { type: Type.INTEGER },
                      level: { type: Type.STRING, enum: ['Minimal', 'Mild', 'Moderate', 'Severe'] },
                      indicators: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['score', 'level', 'indicators']
                  },
                  negativeCognitionMood: {
                    type: Type.OBJECT,
                    properties: {
                      score: { type: Type.INTEGER },
                      level: { type: Type.STRING, enum: ['Minimal', 'Mild', 'Moderate', 'Severe'] },
                      indicators: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['score', 'level', 'indicators']
                  },
                  hyperarousal: {
                    type: Type.OBJECT,
                    properties: {
                      score: { type: Type.INTEGER },
                      level: { type: Type.STRING, enum: ['Minimal', 'Mild', 'Moderate', 'Severe'] },
                      indicators: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['score', 'level', 'indicators']
                  }
                },
                required: ['intrusion', 'avoidance', 'negativeCognitionMood', 'hyperarousal']
              },
              clinicalObservations: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              empatheticSummary: {
                type: Type.STRING
              },
              traumaInformedRecommendations: {
                type: Type.OBJECT,
                properties: {
                  immediateGrounding: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  carePathway: { type: Type.STRING },
                  facilitatorGuidance: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ['immediateGrounding', 'carePathway', 'facilitatorGuidance']
              }
            },
            required: [
              'overallImpactScore',
              'acuteDistressScore',
              'resilienceScore',
              'urgencyLevel',
              'clusters',
              'clinicalObservations',
              'empatheticSummary',
              'traumaInformedRecommendations'
            ]
          }
        }
      });

      const response: any = await Promise.race([aiPromise, timeoutPromise]);

      if (response.text) {
        scores = JSON.parse(response.text.trim()) as TraumaScores;
        evalSource = 'gemini-3.8-flash';
      } else {
        scores = computeFallbackScores(filterResult);
      }
    } catch (err) {
      console.warn('Gemini evaluation error, using trauma rule engine:', err);
      scores = computeFallbackScores(filterResult);
      evalSource = 'clinical-rule-engine-fallback';
    }
  } else {
    scores = computeFallbackScores(filterResult);
    evalSource = 'clinical-rule-engine-fallback';
  }

  if (filterResult.crisisDetection.severity === 'critical') {
    scores.urgencyLevel = 'Severe / Crisis';
  }

  const recordId = `REC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  // 3. Generate Dual Tailored Payloads
  const victimDashboardData = generateVictimDashboardPayload(victimId, filterResult, scores);
  const officialsDashboardData = generateOfficialsDashboardPayload(recordId, victimId, channel, filterResult, scores);

  const processedRecord: ProcessedAtrocityRecord = {
    recordId,
    victimId,
    channel,
    channelMetadata,
    rawInput: input,
    filter: filterResult,
    scores,
    victimDashboardData,
    officialsDashboardData,
    evalSource,
    timestamp: new Date().toISOString()
  };

  // Keep every channel on the same durable database path as the backend pipeline.
  const databaseScore = scores.acuteDistressScore;
  const databaseRisk = filterResult.crisisDetection.requiresImmediateHelp || databaseScore >= 75
    ? 'Critical'
    : scores.urgencyLevel === 'High' || databaseScore >= 55
      ? 'High'
      : databaseScore >= 35
        ? 'Medium'
        : 'Low';
  await database.insertCheckin({
    id: `CHK-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    victim_id: victimId,
    message: filterResult.filteredText,
    score: databaseScore,
    risk_category: databaseRisk,
    trigger_factors: filterResult.traumaTags.map(tag => tag.label),
    created_at: processedRecord.timestamp,
    ingestion_channel: channel
  });

  await database.updateVictimScore(victimId, databaseRisk, databaseScore);

  return {
    filter: filterResult,
    scores,
    record: processedRecord,
    victimDashboard: victimDashboardData,
    officialsDashboard: officialsDashboardData,
    evalSource,
    timestamp: processedRecord.timestamp
  };
}

async function getDatabaseVictimDashboard(victimId: string): Promise<VictimDashboardPayload | null> {
  const db = getDatabaseAdapter();
  const victim = await db.getVictim(victimId);
  if (!victim) return null;

  const checkins = await db.getCheckinsForVictim(victimId, 1);
  const latestCheckin = checkins[0];
  const score = latestCheckin?.score ?? victim.latest_score;
  const status: VictimDashboardPayload['status'] = score >= 75 ? 'Needs Attention' : score >= 35 ? 'Supported' : 'Safe';
  const plainTextDistressLevel: VictimDashboardPayload['plainTextDistressLevel'] =
    score >= 75 ? 'Intense Overwhelm' : score >= 50 ? 'High Distress' : score >= 25 ? 'Mild Stress' : 'Balanced';

  return {
    victimId,
    status,
    compassionateGreeting: 'Welcome back. Your latest check-in has been securely recorded and is available to your support team.',
    plainTextDistressLevel,
    supportiveInsights: latestCheckin
      ? [`Your latest recorded distress score is ${score}/100. Your support team can use this to guide the next check-in.`]
      : ['No check-in has been recorded yet. Your support team is ready when you are.'],
    dailyGroundingExercises: [
      'Place both feet on the floor and name five things you can see around you.',
      'Breathe in for four counts, hold for four, and breathe out for four.'
    ],
    privacyConfirmation: 'Your check-in is stored in the isolated database record for this victim ID.',
    crisisContacts: [
      { name: 'Emergency Lifeline (24/7)', contact: '988', description: 'Free, confidential crisis counseling by call or text' },
      { name: 'Victim Advocacy Network', contact: '1-800-656-4673', description: 'Specialized assistance for victims of violence' }
    ],
    allocatedSupportWorker: `Assigned support team: ${victim.name}`,
    lastUpdated: latestCheckin?.created_at || new Date().toISOString()
  };
}

async function getDatabaseOfficialsFeed(): Promise<OfficialsDashboardPayload[]> {
  const checkins = await getDatabaseAdapter().listCheckins(100);

  return checkins.map(checkin => {
    const score = checkin.score;
    const isCritical = score >= 75 || checkin.risk_category === 'Critical';
    const isElevated = !isCritical && (score >= 55 || checkin.risk_category === 'High');
    const triagePriority: OfficialsDashboardPayload['triagePriority'] = isCritical
      ? 'CRITICAL_RED'
      : isElevated
        ? 'ELEVATED_AMBER'
        : score >= 35
          ? 'MONITOR_YELLOW'
          : 'STABLE_GREEN';
    const escalationRisk: OfficialsDashboardPayload['escalationRisk'] = isCritical
      ? 'Immediate Crisis'
      : isElevated
        ? 'High'
        : score >= 35
          ? 'Moderate'
          : 'Low';

    return {
      recordId: checkin.id,
      victimId: checkin.victim_id,
      ingestionChannel: checkin.ingestion_channel || 'victim_dashboard',
      triagePriority,
      atrocityType: 'Database check-in',
      traumaSeverityScore: score,
      distressPredictionScore: score,
      resilienceScore: Math.max(0, 100 - score),
      escalationRisk,
      sanitizedNarrative: checkin.message,
      redactedTokensCount: 0,
      crisisFlags: isCritical ? ['Database risk level requires immediate review'] : [],
      recommendedOfficialProtocol: isCritical
        ? 'IMMEDIATE ESCALATION: Review this case and contact the assigned protection team.'
        : isElevated
          ? 'PRIORITY OUTREACH: Assign a caseworker for follow-up.'
          : 'SCHEDULED SUPPORT: Continue trauma-informed periodic check-ins.',
      assignedAgency: 'Humanitarian Trauma & Casework Services',
      timeline: [{ timestamp: checkin.created_at, action: 'Check-in loaded from database', actor: 'Database Adapter' }],
      ingestedAt: checkin.created_at
    };
  });
}

async function startServer() {
  const app = express();
  const preferredPort = Number(process.env.PORT || 3000);
  const PORT = await findAvailablePort(preferredPort);
  const runningCompiledServer = path.basename(path.dirname(process.argv[1] || '')) === 'dist';
  const isProduction = process.env.NODE_ENV === 'production' || runningCompiledServer;

  if (PORT !== preferredPort) {
    console.warn(`[CareBridge] Port ${preferredPort} is busy; using port ${PORT}.`);
  }

  if (isNeonPostgresConfigured()) {
    const adapter = new NeonPostgresAdapter(getDatabaseUrl());
    try {
      await adapter.connect();
      setDatabaseAdapter(adapter);
      const adminPasswordHash = hashVictimPassword('12345678');
      const admin = await adapter.getOfficialByUsername('Admin');
      if (!admin) {
        await adapter.createOfficial({
          id: 'OFF-ADMIN', username: 'Admin', display_name: 'System Administrator',
          role: 'admin', active: true, created_at: new Date().toISOString()
        }, adminPasswordHash);
        console.log('[Officials] Created initial Admin account (username: Admin)');
      } else {
        // Keep the built-in bootstrap account usable after schema/data migrations.
        // This also repairs an Admin row that was created with an invalid/old password hash.
        await adapter.setOfficialPassword('Admin', adminPasswordHash);
        console.log('[Officials] Verified Admin account and refreshed bootstrap password');
      }
      console.log('[DatabaseAdapter] Neon PostgreSQL connected and schema verified');
    } catch (error) {
      await adapter.disconnect().catch(() => undefined);
      console.error('[DatabaseAdapter] Neon connection failed:', error);
      throw error;
    }
  } else {
    console.warn('[DatabaseAdapter] DATABASE_URL is not configured. Database-backed routes will fail closed.');
  }

  app.use(express.json({ limit: '10mb' }));

  // 1. Health check & System info
  app.get('/api/health', async (req, res) => {
    try {
      const checkins = await getDatabaseAdapter().listCheckins(1000);
      const victims = await getDatabaseAdapter().listVictims();
      res.json({
        status: 'ok',
        module: 'Trauma Ingestion, Filtering & Distress Prediction Module',
        system: 'AI-Powered Dynamic Mental Health Monitoring and Distress Prediction System for Victims of Atrocities',
        activeChannels: ['victim_dashboard', 'whatsapp', 'telegram', 'ivr', 'speech'],
        storedRecordsCount: checkins.length,
        registeredVictimsCount: victims.length,
        database: {
          configured: isNeonPostgresConfigured(),
          connected: getDatabaseAdapter().isConnected(),
          adapter: getDatabaseAdapter().name,
          note: 'Runtime victim and check-in data is read from and written to Neon PostgreSQL. No sample records are seeded.'
        },
        hasGeminiApiKey: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY',
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(503).json({
        status: 'degraded',
        database: { configured: isNeonPostgresConfigured(), connected: false, adapter: getDatabaseAdapter().name },
        error: err.message || 'Database health check failed',
        timestamp: new Date().toISOString()
      });
    }
  });

  // 2. Generic Ingestion Endpoint
  app.post('/api/ingest', async (req, res) => {
    try {
      const { channel, input, victimId, metadata, settings } = req.body;
      if (!input || typeof input !== 'string' || !input.trim()) {
        res.status(400).json({ error: 'Input text is required' });
        return;
      }

      const activeChannel: IngestionChannel = channel || 'victim_dashboard';
      if (!victimId || typeof victimId !== 'string' || !victimId.trim()) {
        res.status(400).json({ error: 'victimId is required. Register the victim in the database before starting a check-in.' });
        return;
      }

      const result = await processDisclosure(input, activeChannel, victimId.trim(), metadata, settings);
      res.json(result);
    } catch (err) {
      console.error('Ingestion error:', err);
      res.status(500).json({ error: 'Failed to process ingestion payload' });
    }
  });

  // 3. Victim Dashboard Direct Ingestion
  app.post('/api/ingest/victim-dashboard', async (req, res) => {
    try {
      const { victimId, text, input, emotionalState } = req.body;
      const content = text || input;
      if (!content) {
        res.status(400).json({ error: 'Missing narrative text' });
        return;
      }

      if (!victimId || typeof victimId !== 'string' || !victimId.trim()) {
        res.status(400).json({ error: 'victimId is required. Register the victim before starting a web check-in.' });
        return;
      }
      const vId = victimId.trim();
      const result = await processDisclosure(content, 'victim_dashboard', vId, {
        channel: 'victim_dashboard',
        senderIdentifier: vId,
        sessionId: `sess_${Date.now()}`
      });

      res.json({
        success: true,
        message: 'Successfully ingested from Victim Dashboard',
        victimDashboardData: result.victimDashboard,
        officialsTriageLevel: result.officialsDashboard.triagePriority,
        recordId: result.record.recordId
      });
    } catch (err) {
      res.status(422).json({ error: err instanceof Error ? err.message : 'Victim dashboard ingestion failed' });
    }
  });

  // 4. WhatsApp Chatbot Webhook Ingestion
  app.post('/api/ingest/whatsapp', async (req, res) => {
    try {
      const { victimId, from, body, text, messageId } = req.body;
      const content = body || text;
      if (!content) {
        res.status(400).json({ error: 'Missing WhatsApp message body' });
        return;
      }

      if (!victimId || typeof victimId !== 'string' || !victimId.trim()) {
        res.status(400).json({ error: 'victimId is required for WhatsApp ingestion. Map the channel identity to a registered database victim first.' });
        return;
      }
      const vId = victimId.trim();
      const result = await processDisclosure(content, 'whatsapp', vId, {
        channel: 'whatsapp',
        senderIdentifier: from ? `${from.slice(0, 4)}***${from.slice(-4)}` : 'Masked Phone',
        sessionId: messageId || `wa_${Date.now()}`
      });

      res.json({
        success: true,
        replyToVictim: result.victimDashboard.compassionateGreeting + " " + result.victimDashboard.supportiveInsights[0],
        officialsTriagePriority: result.officialsDashboard.triagePriority,
        recordId: result.record.recordId
      });
    } catch (err) {
      res.status(500).json({ error: 'WhatsApp webhook processing failed' });
    }
  });

  // 5. Telegram Chatbot Webhook Ingestion
  app.post('/api/ingest/telegram', async (req, res) => {
    try {
      const msg = req.body.message || req.body;
      const content = msg.text || req.body.text;
      if (!content) {
        res.status(400).json({ error: 'Missing Telegram text message' });
        return;
      }

      const senderId = msg.from?.id ? String(msg.from.id) : 'anon_tg';
      const telegramUsername = msg.from?.username ? String(msg.from.username).replace(/^@/, '').trim() : '';
      let vId = typeof req.body.victimId === 'string' ? req.body.victimId.trim() : '';
      const db: any = getDatabaseAdapter();

      // Prefer the verified Telegram username mapping. A client cannot claim another victim ID.
      if (telegramUsername && typeof db.getVictimByTelegramUsername === 'function') {
        const mapped = await db.getVictimByTelegramUsername(telegramUsername);
        if (!mapped) {
          res.status(403).json({ error: `Telegram username @${telegramUsername} is not registered to an active victim case.` });
          return;
        }
        if (vId && vId !== mapped.id) {
          res.status(403).json({ error: 'Telegram account is not authorized for that victim ID.' });
          return;
        }
        vId = mapped.id;
      }
      if (!vId) {
        res.status(403).json({ error: 'Your Telegram username is not linked to an active victim record. Ask an official to register your Telegram username first.' });
        return;
      }
      const result = await processDisclosure(content, 'telegram', vId, {
        channel: 'telegram',
        senderIdentifier: msg.from?.username ? `@${msg.from.username}` : `TG_USER_${senderId.slice(-4)}`,
        sessionId: `tg_${msg.message_id || Date.now()}`
      });

      res.json({
        success: true,
        replyToVictim: result.victimDashboard.compassionateGreeting + "\n\n" + result.victimDashboard.supportiveInsights[0],
        officialsTriagePriority: result.officialsDashboard.triagePriority,
        recordId: result.record.recordId
      });
    } catch (err) {
      res.status(422).json({ error: err instanceof Error ? err.message : 'Telegram webhook processing failed' });
    }
  });

  // 6. IVR Telephony Call Ingestion
  app.post('/api/ingest/ivr', async (req, res) => {
    try {
      const { victimId, callerNumber, audioTranscript, text, dtmfDistressRating, durationSeconds } = req.body;
      const content = audioTranscript || text;
      if (!content) {
        res.status(400).json({ error: 'Missing IVR audio transcript' });
        return;
      }

      if (!victimId || typeof victimId !== 'string' || !victimId.trim()) {
        res.status(400).json({ error: 'victimId is required for IVR ingestion. Map the caller to a registered database victim first.' });
        return;
      }
      const vId = victimId.trim();
      const result = await processDisclosure(content, 'ivr', vId, {
        channel: 'ivr',
        senderIdentifier: callerNumber ? `${callerNumber.slice(0, 3)}***${callerNumber.slice(-4)}` : 'Anonymous Hotline Caller',
        durationSeconds: durationSeconds || 120,
        ivrDtmfTone: dtmfDistressRating ? `DTMF Score: ${dtmfDistressRating}` : 'None'
      });

      res.json({
        success: true,
        audioGuidanceSummary: result.victimDashboard.compassionateGreeting,
        officialsTriagePriority: result.officialsDashboard.triagePriority,
        recordId: result.record.recordId
      });
    } catch (err) {
      res.status(500).json({ error: 'IVR telephony ingestion failed' });
    }
  });

  // 7. Speech / Voice-to-Text Ingestion
  app.post('/api/ingest/speech', async (req, res) => {
    try {
      const { victimId, transcript, audioQuality, durationSeconds } = req.body;
      if (!transcript) {
        res.status(400).json({ error: 'Missing speech transcript' });
        return;
      }

      if (!victimId || typeof victimId !== 'string' || !victimId.trim()) {
        res.status(400).json({ error: 'victimId is required for voice ingestion.' });
        return;
      }
      const vId = victimId.trim();
      const result = await processDisclosure(transcript, 'speech', vId, {
        channel: 'speech',
        senderIdentifier: vId,
        audioQuality: audioQuality || '16kHz Single-channel',
        durationSeconds: durationSeconds || 45
      });

      res.json({
        success: true,
        victimDashboardData: result.victimDashboard,
        officialsDashboardData: result.officialsDashboard,
        recordId: result.record.recordId
      });
    } catch (err) {
      res.status(500).json({ error: 'Speech ingestion failed' });
    }
  });

  // 8. Backward-compatible endpoint for general filtering & scoring
  app.post('/api/filter-and-score', async (req, res) => {
    try {
      const { input, victimId, settings } = req.body;
      if (!victimId || typeof victimId !== 'string' || !victimId.trim()) {
        res.status(400).json({ error: 'victimId is required for filter-and-score.' });
        return;
      }
      const vId = victimId.trim();
      const result = await processDisclosure(input, 'victim_dashboard', vId, { channel: 'victim_dashboard' }, settings);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Processing error' });
    }
  });

  // 9. Data Feed for Victim Dashboard
  app.get('/api/dashboards/victim/latest', async (req, res) => {
    try {
      const latestCheckins = await getDatabaseAdapter().listCheckins(1);
      const latestCheckin = latestCheckins[0];
      if (!latestCheckin) {
        res.status(404).json({ message: 'No database check-ins available for victim dashboard' });
        return;
      }
      const payload = await getDatabaseVictimDashboard(latestCheckin.victim_id);
      if (!payload) {
        res.status(404).json({ message: 'No database victim record available for victim dashboard' });
        return;
      }
      res.json(payload);
    } catch {
      res.status(500).json({ error: 'Failed to load latest victim dashboard from database' });
    }
  });

  app.get('/api/dashboards/victim/:victimId', async (req, res) => {
    try {
      const payload = await getDatabaseVictimDashboard(req.params.victimId);
      if (!payload) {
        res.status(404).json({ error: `No database record found for victim ID: ${req.params.victimId}` });
        return;
      }
      res.json(payload);
    } catch {
      res.status(500).json({ error: 'Failed to load victim dashboard from database' });
    }
  });

  // 10. Data Feed for Officials & Clinicians Dashboard
  app.get('/api/dashboards/officials', async (req, res) => {
    if (!requireOfficial(req, res)) return;
    try {
      const records = await getDatabaseOfficialsFeed();
      res.json({
        totalMonitoredVictims: new Set(records.map(record => record.victimId)).size,
        criticalRedCount: records.filter(record => record.triagePriority === 'CRITICAL_RED').length,
        elevatedAmberCount: records.filter(record => record.triagePriority === 'ELEVATED_AMBER').length,
        monitorYellowCount: records.filter(record => record.triagePriority === 'MONITOR_YELLOW').length,
        stableGreenCount: records.filter(record => record.triagePriority === 'STABLE_GREEN').length,
        byChannel: { victim_dashboard: records.length, whatsapp: 0, telegram: 0, ivr: 0, speech: 0 },
        records,
        lastUpdated: new Date().toISOString()
      });
    } catch {
      res.status(500).json({ error: 'Failed to load officials dashboard from database' });
    }
  });

  // 11. All Records Endpoint (Full Audit Data)
  app.get('/api/records', async (req, res) => {
    try {
      const checkins = await getDatabaseAdapter().listCheckins(100);
      res.json({ count: checkins.length, records: checkins });
    } catch {
      res.status(503).json({ error: 'Database is unavailable; no in-memory records are used.' });
    }
  });

  // =========================================================================
  // 12. BACKEND PIPELINE ENGINE API (Matching System Architecture Flowchart)
  // VICTIM -> Periodic Check -> [Text | Voice | Events] ->
  // [AI Engine | NLP + Emotion | Voice + ML] -> Dynamic Distress Score ->
  // Trend + Prediction -> Risk Classification -> [Low/Med] vs [High/Critical]
  // =========================================================================

  // Core Pipeline Execution
  app.post('/api/pipeline/process', async (req, res) => {
    try {
      const payload: PipelineProcessPayload = req.body || {};
      if (payload.victimId && typeof payload.victimId !== 'string') {
        const candidate = payload.victimId as unknown as { id?: unknown };
        payload.victimId = typeof candidate === 'object' && candidate !== null && 'id' in candidate
          ? String(candidate.id ?? '')
          : String(payload.victimId);
      }
      if (!payload.input && !payload.eventData) {
        res.status(400).json({ error: 'Missing input text, voice transcript, or event data' });
        return;
      }
      const result = await executeBackendPipeline(payload);
      res.json(result);
    } catch (err: any) {
      console.error('[Pipeline Engine Error]:', err);
      res.status(422).json({ error: err.message || 'Pipeline execution failed' });
    }
  });

  // Automated Periodic Check Trigger
  app.post('/api/pipeline/periodic-check', async (req, res) => {
    try {
      const { victimId, checkPrompt, simulatedResponse, modality } = req.body;
      if (!victimId) {
        res.status(400).json({ error: 'victimId is required for periodic check' });
        return;
      }
      const input = simulatedResponse || checkPrompt;
      if (!input || typeof input !== 'string' || !input.trim()) {
        res.status(400).json({ error: 'A real check-in response is required' });
        return;
      }
      const result = await executeBackendPipeline({
        victimId,
        modality: modality || 'text',
        checkType: 'periodic_check',
        input,
        channel: 'victim_dashboard'
      });
      res.json({
        success: true,
        checkType: 'periodic_check',
        pipelineResult: result
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Periodic check failed' });
    }
  });

  // Database Victims List (Isolated profiles)
  app.get('/api/pipeline/victims', async (req, res) => {
    try {
      const db = getVictimDatabase();
      const victims = await db.listVictimProfiles();
      res.json({
        count: victims.length,
        victims
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to list victims from database' });
    }
  });

  // Database Specific Victim Profile
  app.get('/api/pipeline/victims/:victimId', async (req, res) => {
    try {
      const db = getVictimDatabase();
      const profile = await db.getVictimProfile(req.params.victimId);
      if (!profile) {
        res.status(404).json({ error: `Victim profile ${req.params.victimId} not found in database` });
        return;
      }
      res.json(profile);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch victim profile' });
    }
  });

  // Isolated Conversations for a Specific Victim (Strict boundary)
  app.get('/api/pipeline/victims/:victimId/conversations', async (req, res) => {
    try {
      const db = getVictimDatabase();
      const turns = await db.getIsolatedConversations(req.params.victimId);
      res.json({
        victimId: req.params.victimId,
        isolatedTurnsCount: turns.length,
        conversations: turns
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch isolated conversations' });
    }
  });

  // Dynamic Distress Score History & Trend for a Specific Victim
  app.get('/api/pipeline/victims/:victimId/trend', async (req, res) => {
    try {
      const db = getVictimDatabase();
      const history = await db.getDistressHistory(req.params.victimId);
      res.json({
        victimId: req.params.victimId,
        historyCount: history.length,
        distressHistory: history
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch distress history' });
    }
  });

  // Register New Victim Profile into Database
  app.post('/api/pipeline/victims', async (req, res) => {
    try {
      const db = getVictimDatabase();
      const { victimId, pseudonym, demographics, traumaContext, baselineDistressScore, assignedAgency, assignedCaseworker, safetyNotes } = req.body;
      if (!victimId) {
        res.status(400).json({ error: 'victimId is required' });
        return;
      }
      const newProfile: VictimProfile = {
        victimId,
        pseudonym: pseudonym || `Survivor-${victimId.slice(-4)}`,
        demographics: demographics || {},
        traumaContext: traumaContext || 'Atrocity disclosure record',
        baselineDistressScore: typeof baselineDistressScore === 'number' ? baselineDistressScore : 50,
        assignedAgency: assignedAgency || 'Humanitarian Trauma & Casework Services',
        assignedCaseworker: assignedCaseworker || 'Assigned Protection Caseworker',
        safetyNotes: safetyNotes || '',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await db.saveVictimProfile(newProfile);
      res.json({ success: true, profile: newProfile });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to save victim profile' });
    }
  });

  // Database Adapter Status & Metadata
  app.get('/api/pipeline/database-status', async (req, res) => {
    try {
      const db = getVictimDatabase();
      const meta = await db.getAdapterMeta();
      res.json({
        ...meta,
        geminiApiKeyConfigured: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY',
        databaseApi: '/api/database',
        connectionTest: '/api/database/connection-test'
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch database status' });
    }
  });

  // Architecture Spec (Matching image.png)
  app.get('/api/pipeline/architecture', (req, res) => {
    res.json({
      architecture: 'AI-Powered Dynamic Mental Health Monitoring and Distress Prediction Pipeline',
      flowchart: [
        { step: 1, name: 'VICTIM', description: 'Monitored individual registered in database' },
        { step: 2, name: 'Periodic Check', description: 'Scheduled or automated wellness polling' },
        { step: 3, name: 'Text | Voice | Events', description: 'Multi-modal incoming disclosure signals' },
        { step: 4, name: 'AI Engine (NLP + Emotion | Voice + ML)', description: 'Gemini 3.8 Flash + clinical NLP + acoustic prosody' },
        { step: 5, name: 'Dynamic Distress Score', description: 'Real-time computed 0-100 composite index' },
        { step: 6, name: 'Trend + Prediction', description: 'Historical velocity comparison & 24-72h predictive trajectory' },
        {
          step: 7,
          name: 'Risk Classification',
          branches: {
            lowMedium: {
              target: 'Monitoring',
              action: 'Log in active/routine monitoring queue; schedule next check-in'
            },
            highCritical: {
              target: 'Alert',
              subSteps: [
                'Alert triggered immediately',
                'Human Intervention (Caseworker / Mobile Crisis Unit dispatch)',
                'Follow-up & Recovery (Stabilization protocol & milestone tracker)'
              ]
            }
          }
        }
      ]
    });
  });

  // =========================================================================
  // 13. EXPLICIT DATABASE REST APIS (VICTIMS & CHECKINS)
  // Schema 1: victims (id, name, case_id, risk_level, latest_score)
  // Schema 2: checkins (id, victim_id, message, score, risk_category, trigger_factors, created_at)
  // =========================================================================

  // List all victims from the explicit database table
  app.get('/api/database/victims', async (req, res) => {
    try {
      const db = getDatabaseAdapter();
      const victims = await db.listVictims();
      res.json({
        table: 'victims',
        schema: ['id', 'name', 'case_id', 'risk_level', 'latest_score'],
        count: victims.length,
        victims
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve victims from database' });
    }
  });

  // Verify the active adapter can reach its configured database.
  app.get('/api/database/connection-test', async (req, res) => {
    try {
      const db = getDatabaseAdapter();
      await db.connect?.();
      const victims = await db.listVictims();
      res.json({
        success: true,
        adapter: db.name,
        connected: db.isConnected(),
        victimsReadable: true,
        victimCount: victims.length,
        queryExamples: NEON_REST_QUERY_EXAMPLES
      });
    } catch (err: any) {
      res.status(503).json({
        success: false,
        adapter: getDatabaseAdapter().name,
        connected: false,
        error: err.message || 'Database connection test failed'
      });
    }
  });

  app.get('/api/database/victims/resolve', async (req, res) => {
    try {
      const name = String(req.query.name || '').trim().toLowerCase();
      if (!name) {
        res.status(400).json({ error: 'name is required' });
        return;
      }
      const matches = (await getDatabaseAdapter().listVictims()).filter(victim => victim.name.trim().toLowerCase() === name);
      if (matches.length === 0) {
        res.status(404).json({ error: 'No victim record matches that name' });
        return;
      }
      if (matches.length > 1) {
        res.status(409).json({ error: 'Multiple victim records match that name', victims: matches });
        return;
      }
      res.json({ victim: matches[0] });
    } catch {
      res.status(500).json({ error: 'Failed to resolve victim name' });
    }
  });

  // Resolve a Telegram account username to exactly one active victim record.
  app.get('/api/database/victims/resolve-telegram', async (req, res) => {
    try {
      const username = String(req.query.username || '').replace(/^@/, '').trim();
      if (!username) { res.status(400).json({ error: 'username is required' }); return; }
      const db = getDatabaseAdapter() as any;
      if (typeof db.getVictimByTelegramUsername !== 'function') {
        res.status(503).json({ error: 'Telegram username lookup is not available' }); return;
      }
      const victim = await db.getVictimByTelegramUsername(username);
      if (!victim) { res.status(404).json({ error: 'No active victim is registered with that Telegram username' }); return; }
      const { password_hash: _passwordHash, ...safeVictim } = victim;
      res.json({ victim: safeVictim });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Failed to resolve Telegram username' });
    }
  });

  // Get specific victim by id
  app.get('/api/database/victims/:id', async (req, res) => {
    try {
      const db = getDatabaseAdapter();
      const victim = await db.getVictim(req.params.id);
      if (!victim) {
        res.status(404).json({ error: `Victim record with id '${req.params.id}' not found` });
        return;
      }
      const { password_hash: _passwordHash, ...safeVictim } = victim;
      res.json({
        table: 'victims',
        victim: safeVictim
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch victim record' });
    }
  });

  // Create or update a victim record
  app.post('/api/database/victims', async (req, res) => {
    if (!requireOfficial(req, res)) return;
    try {
      const { id, name, case_id, risk_level, latest_score, password, baseline_distress_score, doctor_initial_score, doctor_name, doctor_notes, telegram_username } = req.body;
      if (!id || !name || !case_id) {
        res.status(400).json({
          error: 'Missing required victim fields. Required: id, name, case_id. Optional: risk_level, latest_score'
        });
        return;
      }
      const db = getDatabaseAdapter();
      const existing = await db.getVictim(String(id));
      if (!existing && (typeof password !== 'string' || password.length < 8)) {
        res.status(400).json({ error: 'A password of at least 8 characters is required when creating a new victim.' });
        return;
      }
      if (password !== undefined && typeof password !== 'string') {
        res.status(400).json({ error: 'Password must be text when supplied.' });
        return;
      }
      if (typeof password === 'string' && password.length > 0 && password.length < 8) {
        res.status(400).json({ error: 'A password must contain at least 8 characters.' });
        return;
      }
      const normalizedDoctorScore = typeof doctor_initial_score === 'number' ? Math.max(0, Math.min(100, doctor_initial_score)) : null;
      if (!existing && normalizedDoctorScore === null) {
        res.status(400).json({ error: 'Doctor initial distress score is required when creating a new victim.' });
        return;
      }
      const record: VictimDbRecord = {
        id: String(id).trim(),
        name: String(name).trim(),
        case_id: String(case_id).trim(),
        risk_level: risk_level || existing?.risk_level || (normalizedDoctorScore! >= 75 ? 'Critical' : normalizedDoctorScore! >= 55 ? 'High' : normalizedDoctorScore! >= 35 ? 'Medium' : 'Low'),
        latest_score: typeof latest_score === 'number' ? latest_score : Number(existing?.latest_score ?? normalizedDoctorScore ?? 0),
        baseline_distress_score: typeof baseline_distress_score === 'number' ? Math.max(0, Math.min(100, baseline_distress_score)) : Number(existing?.baseline_distress_score ?? existing?.doctor_initial_score ?? existing?.latest_score ?? normalizedDoctorScore ?? 0),
        doctor_initial_score: normalizedDoctorScore !== null ? normalizedDoctorScore : (existing?.doctor_initial_score ?? null),
        doctor_name: typeof doctor_name === 'string' ? doctor_name.trim() || null : (existing?.doctor_name ?? null),
        doctor_notes: typeof doctor_notes === 'string' ? doctor_notes.trim() || null : (existing?.doctor_notes ?? null),
        telegram_username: typeof telegram_username === 'string' ? telegram_username.replace(/^@/, '').trim() || null : (existing?.telegram_username ?? null),
        password_hash: password ? hashVictimPassword(password) : existing?.password_hash
      };
      const saved = await db.upsertVictim(record);
      res.json({
        success: true,
        message: 'Victim record saved to database',
        victim: saved
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to save victim to database' });
    }
  });

  // Close a case: closed victims disappear from the active officials triage dashboard.
  app.post('/api/database/victims/:id/close', async (req, res) => {
    const session = requireOfficial(req, res);
    if (!session) return;
    try {
      const id = String(req.params.id || '').trim();
      if (!id) return res.status(400).json({ error: 'Victim ID is required.' });
      const db = getDatabaseAdapter() as any;
      const victim = await db.closeVictim(id, session.username);
      if (!victim) return res.status(404).json({ error: 'Victim not found.' });
      res.json({ success: true, message: 'Case closed. It has been removed from the active officials dashboard.', victim });
    } catch (err: any) {
      console.error('[Case Close]', err);
      res.status(500).json({ error: 'Unable to close case.' });
    }
  });

  // Official authentication and account management
  app.post('/api/official-auth/login', async (req, res) => {
    try {
      const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
      const password = typeof req.body?.password === 'string' ? req.body.password : '';
      if (!username || !password) return res.status(400).json({ error: 'Username and password are required.' });
      const official = await (getDatabaseAdapter() as any).getOfficialByUsername(username);
      if (!official || !official.active || !official.password_hash || !verifyVictimPassword(password, official.password_hash)) {
        return res.status(401).json({ error: 'Invalid official credentials.' });
      }
      const token = createOfficialSession({ username: official.username, role: official.role, displayName: official.display_name, createdAt: Date.now() });
      const { password_hash: _passwordHash, ...safeOfficial } = official;
      res.json({ success: true, token, official: safeOfficial });
    } catch (err) {
      console.error('[Official Auth]', err);
      res.status(500).json({ error: 'Official authentication failed.' });
    }
  });

  app.post('/api/official-auth/logout', (req, res) => {
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) officialSessions.delete(header.slice(7));
    res.json({ success: true });
  });

  app.get('/api/official-auth/me', (req, res) => {
    const session = getOfficialSession(req);
    if (!session) return res.status(401).json({ error: 'Not authenticated.' });
    res.json({ authenticated: true, official: { username: session.username, role: session.role, display_name: session.displayName } });
  });

  app.get('/api/officials', (req, res) => {
    if (!requireAdmin(req, res)) return;
    getDatabaseAdapter().listOfficials().then(officials => res.json({ officials })).catch(() => res.status(500).json({ error: 'Failed to load officials.' }));
  });

  app.post('/api/officials', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
      const displayName = typeof req.body?.display_name === 'string' ? req.body.display_name.trim() : '';
      const password = typeof req.body?.password === 'string' ? req.body.password : '';
      if (!username || !displayName || !password) return res.status(400).json({ error: 'Username, display name, and password are required.' });
      if (username.toLowerCase() === 'admin') return res.status(400).json({ error: 'Admin is reserved for the primary administrator.' });
      if (password.length < 8) return res.status(400).json({ error: 'Password must contain at least 8 characters.' });
      const existing = await (getDatabaseAdapter() as any).getOfficialByUsername(username);
      if (existing) return res.status(409).json({ error: 'That username already exists.' });
      const official: OfficialDbRecord = { id: `OFF-${Date.now()}`, username, display_name: displayName, role: 'sub_official', active: true, created_at: new Date().toISOString() };
      const saved = await (getDatabaseAdapter() as any).createOfficial(official, hashVictimPassword(password));
      res.status(201).json({ success: true, official: saved });
    } catch (err: any) {
      console.error('[Officials]', err);
      res.status(500).json({ error: 'Unable to create sub-official.' });
    }
  });

  app.post('/api/victim-auth/login', async (req, res) => {
    try {
      const { victimId, name, password } = req.body;
      if (!victimId || !name || !password) {
        res.status(400).json({ error: 'Victim ID, name, and password are required.' });
        return;
      }
      const victim = await getDatabaseAdapter().getVictim(String(victimId));
      if (!victim || victim.closed || victim.name.trim().toLowerCase() !== String(name).trim().toLowerCase() || !victim.password_hash || !verifyVictimPassword(String(password), victim.password_hash)) {
        res.status(401).json({ error: 'Victim validation failed.' });
        return;
      }
      const { password_hash: _passwordHash, ...safeVictim } = victim;
      res.json({ success: true, victim: safeVictim });
    } catch {
      res.status(500).json({ error: 'Victim validation failed.' });
    }
  });

  // Victim-specific longitudinal analysis: baseline + every historical check-in.
  app.get('/api/analysis/victim/:victimId', async (req, res) => {
    try {
      const db = getDatabaseAdapter();
      const victim = await db.getVictim(req.params.victimId);
      if (!victim) return res.status(404).json({ error: 'Victim not found.' });
      const checkins = await db.getCheckinsForVictim(victim.id, 200);
      const baseline = Number(victim.doctor_initial_score ?? (Number(victim.baseline_distress_score || 0) > 0 ? victim.baseline_distress_score : victim.latest_score || 0));
      const history = checkins.slice().reverse().map((c, index) => ({
        index: index + 1,
        id: c.id,
        score: Number(c.score),
        risk: c.risk_category,
        createdAt: c.created_at,
        message: c.message,
        triggers: c.trigger_factors || []
      }));
      const scores = history.map(h => h.score);
      const latest = scores.length ? scores[scores.length - 1] : Number(victim.latest_score || baseline);
      const previous = scores.length > 1 ? scores[scores.length - 2] : null;
      const average = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0) / scores.length) : baseline;
      const deltaBaseline = latest - baseline;
      const deltaPrevious = previous === null ? 0 : latest - previous;
      const direction = deltaPrevious >= 5 ? 'Increasing' : deltaPrevious <= -5 ? 'Improving' : 'Stable';
      res.json({ victim: { id: victim.id, name: victim.name, case_id: victim.case_id, risk_level: victim.risk_level, latest_score: Number(victim.latest_score), baseline_distress_score: baseline, doctor_initial_score: victim.doctor_initial_score ?? baseline, doctor_name: victim.doctor_name ?? null, doctor_notes: victim.doctor_notes ?? null }, summary: { baselineScore: baseline, checkinCount: history.length, averageScore: average, latestScore: latest, deltaBaseline, deltaPrevious, direction }, history });
    } catch (err: any) {
      console.error('[Analysis]', err);
      res.status(500).json({ error: 'Unable to build victim longitudinal analysis.' });
    }
  });

  // List check-ins (optionally filtered by victim_id)
  app.get('/api/database/checkins', async (req, res) => {
    try {
      const db = getDatabaseAdapter();
      const victimId = req.query.victim_id as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;

      let checkins: CheckinDbRecord[];
      if (victimId) {
        checkins = await db.getCheckinsForVictim(victimId, limit);
      } else {
        checkins = await db.listCheckins(limit);
      }

      res.json({
        table: 'checkins',
        schema: ['id', 'victim_id', 'message', 'score', 'risk_category', 'trigger_factors', 'created_at'],
        filterVictimId: victimId || null,
        count: checkins.length,
        checkins
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve checkins from database' });
    }
  });

  // Create a check-in manually
  app.post('/api/database/checkins', async (req, res) => {
    try {
      const { id, victim_id, message, score, risk_category, trigger_factors, created_at } = req.body;
      if (!victim_id || !message) {
        res.status(400).json({
          error: 'Missing required checkin fields: victim_id and message are required.'
        });
        return;
      }

      const checkinRecord: CheckinDbRecord = {
        id: id || `CHK-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        victim_id,
        message,
        score: typeof score === 'number' ? score : 50,
        risk_category: risk_category || 'Low',
        trigger_factors: Array.isArray(trigger_factors) ? trigger_factors : ['manual_entry'],
        created_at: created_at || new Date().toISOString()
      };

      const db = getDatabaseAdapter();
      const saved = await db.insertCheckin(checkinRecord);

      // Auto update victim score and risk_level in victims table
      await db.updateVictimScore(victim_id, checkinRecord.risk_category, checkinRecord.score);

      res.json({
        success: true,
        message: 'Check-in recorded and victim status synchronized in database',
        checkin: saved
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to record checkin' });
    }
  });

  // Database Schema Placeholders endpoint (SQL DDL, Mongoose, Prisma)
  app.get('/api/database/schemas', (req, res) => {
    res.json({
      status: 'ready_for_external_database',
      schemas: {
        sql: {
          dialect: 'PostgreSQL / SQLite / MySQL',
          ddl: SQL_SCHEMA_PLACEHOLDER
        },
        mongoose: {
          odm: 'MongoDB / Mongoose',
          schema: MONGOOSE_SCHEMA_PLACEHOLDER
        },
        prisma: {
          orm: 'Prisma ORM',
          schema: PRISMA_SCHEMA_PLACEHOLDER
        }
      },
      neonRestApi: {
        connection: isNeonPostgresConfigured() ? 'Configured server-side' : 'not configured',
        queryExamples: NEON_REST_QUERY_EXAMPLES
      },
      instructions: [
        '1. Configure DATABASE_URL with the Neon PostgreSQL connection string in the server .env file.',
        '2. The server automatically creates/updates the victims and checkins tables on startup.',
        '3. Verify the live adapter with GET /api/database/connection-test.',
        '4. The pipeline writes check-ins and synchronizes the latest victim score through the active adapter.'
      ]
    });
  });
// -------------------------------------------------------------------------
// API 404 HANDLER
// Never allow an unknown /api/* request to fall through to the SPA.
// Otherwise the frontend receives index.html and JSON parsing fails.
// -------------------------------------------------------------------------
app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    method: req.method,
    path: req.path
  });
});

// Vite middleware in dev, static file server in prod
if (!isProduction) {
  // Vite middleware in dev, static file server in prod
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Atrocity Mental Health Distress Prediction Module] Server online at http://localhost:${PORT}`);
    startTelegramBot(PORT);
  });

  const shutdown = () => {
    stopTelegramBot();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

startServer();
