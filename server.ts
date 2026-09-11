import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import net from 'node:net';
import crypto from 'node:crypto';
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
import { isNeonRestConfigured, NeonRestAdapter } from './src/db/neonRestAdapter.ts';
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
  OfficialsDashboardPayload
} from './src/types.ts';

// In-Memory Repository of Processed Atrocity Trauma Records
const recordsStore: ProcessedAtrocityRecord[] = [];

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

  // Prepend to in-memory store
  recordsStore.unshift(processedRecord);
  if (recordsStore.length > 100) recordsStore.pop();

  // Keep every channel on the same durable database path as the backend pipeline.
  const database = getDatabaseAdapter();
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
    created_at: processedRecord.timestamp
  });

  const existingVictim = await database.getVictim(victimId);
  if (existingVictim) {
    await database.updateVictimScore(victimId, databaseRisk, databaseScore);
  } else {
    await database.upsertVictim({
      id: victimId,
      name: `Survivor ${victimId}`,
      case_id: `CASE-${victimId.replace(/[^a-zA-Z0-9]/g, '')}`,
      risk_level: databaseRisk,
      latest_score: databaseScore
    });
  }

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
      ingestionChannel: 'victim_dashboard',
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

  if (isNeonRestConfigured()) {
    setDatabaseAdapter(new NeonRestAdapter());
    console.log('[DatabaseAdapter] Neon REST adapter enabled');
  }

  app.use(express.json({ limit: '10mb' }));

  // 1. Health check & System info
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      module: 'Trauma Ingestion, Filtering & Distress Prediction Module',
      system: 'AI-Powered Dynamic Mental Health Monitoring and Distress Prediction System for Victims of Atrocities',
      activeChannels: ['victim_dashboard', 'whatsapp', 'telegram', 'ivr', 'speech'],
      storedRecordsCount: recordsStore.length,
      hasGeminiApiKey: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY',
      timestamp: new Date().toISOString()
    });
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
      const effectiveVictimId = victimId || `VIC-${Math.floor(1000 + Math.random() * 9000)}`;

      const result = await processDisclosure(input, activeChannel, effectiveVictimId, metadata, settings);
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

      const vId = victimId || `VIC-WEB-${Math.floor(1000 + Math.random() * 9000)}`;
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
      res.status(500).json({ error: 'Victim dashboard ingestion failed' });
    }
  });

  // 4. WhatsApp Chatbot Webhook Ingestion
  app.post('/api/ingest/whatsapp', async (req, res) => {
    try {
      const { from, body, text, messageId } = req.body;
      const content = body || text;
      if (!content) {
        res.status(400).json({ error: 'Missing WhatsApp message body' });
        return;
      }

      const vId = `VIC-WA-${(from || 'anon').replace(/[^a-zA-Z0-9]/g, '').slice(-4) || '9999'}`;
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
      let vId = req.body.victimId as string | undefined;
      if (!vId && req.body.victimName) {
        const victims = await getDatabaseAdapter().listVictims();
        const match = victims.find(victim => victim.name.trim().toLowerCase() === String(req.body.victimName).trim().toLowerCase());
        if (!match) {
          res.status(404).json({ error: 'No victim record matches that name' });
          return;
        }
        vId = match.id;
      }
      vId = vId || `VIC-TG-${senderId.slice(-4)}`;
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
      res.status(500).json({ error: 'Telegram webhook processing failed' });
    }
  });

  // 6. IVR Telephony Call Ingestion
  app.post('/api/ingest/ivr', async (req, res) => {
    try {
      const { callerNumber, audioTranscript, text, dtmfDistressRating, durationSeconds } = req.body;
      const content = audioTranscript || text;
      if (!content) {
        res.status(400).json({ error: 'Missing IVR audio transcript' });
        return;
      }

      const vId = `VIC-IVR-${(callerNumber || 'anon').replace(/[^a-zA-Z0-9]/g, '').slice(-4) || '8888'}`;
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

      const vId = victimId || `VIC-VOICE-${Math.floor(1000 + Math.random() * 9000)}`;
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
      const { input, settings } = req.body;
      const vId = `VIC-${Math.floor(1000 + Math.random() * 9000)}`;
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
  app.get('/api/records', (req, res) => {
    res.json({
      count: recordsStore.length,
      records: recordsStore
    });
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
      const payload: PipelineProcessPayload = req.body;
      if (!payload.input && !payload.eventData) {
        res.status(400).json({ error: 'Missing input text, voice transcript, or event data' });
        return;
      }
      const result = await executeBackendPipeline(payload);
      res.json(result);
    } catch (err: any) {
      console.error('[Pipeline Engine Error]:', err);
      res.status(500).json({ error: err.message || 'Pipeline execution failed' });
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
    try {
      const { id, name, case_id, risk_level, latest_score, password } = req.body;
      if (!id || !name || !case_id) {
        res.status(400).json({
          error: 'Missing required victim fields. Required: id, name, case_id. Optional: risk_level, latest_score'
        });
        return;
      }
      if (typeof password !== 'string' || password.length < 8) {
        res.status(400).json({ error: 'A password of at least 8 characters is required.' });
        return;
      }
      const record: VictimDbRecord = {
        id,
        name,
        case_id,
        risk_level: risk_level || 'Low',
        latest_score: typeof latest_score === 'number' ? latest_score : 0
        ,password_hash: hashVictimPassword(password)
      };
      const db = getDatabaseAdapter();
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

  app.post('/api/victim-auth/login', async (req, res) => {
    try {
      const { victimId, name, password } = req.body;
      if (!victimId || !name || !password) {
        res.status(400).json({ error: 'Victim ID, name, and password are required.' });
        return;
      }
      const victim = await getDatabaseAdapter().getVictim(String(victimId));
      if (!victim || victim.name.trim().toLowerCase() !== String(name).trim().toLowerCase() || !victim.password_hash || !verifyVictimPassword(String(password), victim.password_hash)) {
        res.status(401).json({ error: 'Victim validation failed.' });
        return;
      }
      const { password_hash: _passwordHash, ...safeVictim } = victim;
      res.json({ success: true, victim: safeVictim });
    } catch {
      res.status(500).json({ error: 'Victim validation failed.' });
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
        baseUrl: process.env.NEON_API_URL || process.env.NEON_DATABASE_URL || 'not configured',
        queryExamples: NEON_REST_QUERY_EXAMPLES
      },
      instructions: [
        '1. Configure NEON_API_URL and NEON_API_KEY in the server .env file.',
        '2. Create the victims and checkins tables using the PostgreSQL DDL above.',
        '3. Verify the live adapter with GET /api/database/connection-test.',
        '4. The pipeline writes check-ins and synchronizes the latest victim score through the active adapter.'
      ]
    });
  });

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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Atrocity Mental Health Distress Prediction Module] Server online at http://localhost:${PORT}`);
  });
}

startServer();
