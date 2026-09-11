import { GoogleGenAI, Type } from '@google/genai';
import { runTraumaFilter } from './traumaFilter';
import { getVictimDatabase } from './victimDatabase';
import {
  PipelineProcessPayload,
  PipelineExecutionResult,
  VictimProfile,
  IsolatedConversationTurn,
  DynamicDistressRecord,
  DistressTrendPrediction,
  RiskClassificationResult,
  InputModality,
  PipelineCheckType,
  CheckinDbRecord,
  VictimDbRecord
} from '../types';

/**
 * AI ENGINE & PIPELINE PROCESSOR
 * Strictly executes the pipeline architecture:
 * VICTIM -> Periodic Check -> [Text | Voice | Events] ->
 * [AI Engine | NLP + Emotion | Voice + ML] -> Dynamic Distress Score ->
 * Trend + Prediction -> Risk Classification ->
 * Low/Medium (Monitoring) vs High/Critical (Alert -> Human Intervention -> Follow-up & Recovery)
 */
export async function executeBackendPipeline(
  payload: PipelineProcessPayload
): Promise<PipelineExecutionResult> {
  const db = getVictimDatabase();
  const victimId = payload.victimId || `VIC-${Math.floor(1000 + Math.random() * 9000)}`;
  const modality: InputModality = payload.modality || 'text';
  const checkType: PipelineCheckType = payload.checkType || 'direct_input';

  // =========================================================================
  // 1. ISOLATION CHECK: Fetch victim details & isolated history from Database
  // =========================================================================
  let victimProfile = await db.getVictimProfile(victimId);
  if (!victimProfile) {
    // Register initial profile in database for new victim
    victimProfile = {
      victimId,
      pseudonym: `Survivor-${victimId.slice(-4)}`,
      demographics: { ageRange: 'Unknown', region: 'Field Intake' },
      traumaContext: 'Intake disclosure pending full clinical interview.',
      baselineDistressScore: 50,
      assignedAgency: 'Rapid Trauma & Humanitarian Casework Network',
      assignedCaseworker: 'Duty Caseworker',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await db.saveVictimProfile(victimProfile);
  }

  // Fetch only this victim's isolated history (strict per-victim isolation)
  const isolatedHistory = await db.getIsolatedConversations(victimId, 10);
  const distressHistory = await db.getDistressHistory(victimId);

  // =========================================================================
  // 2. Pre-filter & Sanitize Input
  // =========================================================================
  const filterResult = runTraumaFilter(payload.input, {
    redactPii: true,
    redactLocations: true,
    redactIdentifiers: true,
    sensitivityLevel: 'standard',
    includeCrisisSafetyShield: true
  });

  // =========================================================================
  // 3. AI Engine: NLP + Emotion + Voice + ML (via Gemini 3.8 Flash)
  // =========================================================================
  const apiKey = process.env.GEMINI_API_KEY;
  let evalSource: 'gemini-3.8-flash' | 'rule-engine-fallback' = 'rule-engine-fallback';

  let nlpCategories: string[] = filterResult.traumaTags.map(t => t.label);
  let primaryEmotion = 'Distress';
  let arousalLevel = 60;
  let emotionalValence: 'positive' | 'neutral' | 'distressed' | 'extreme_agony' = 'distressed';
  let traumaSeverity = 55;
  let resilience = 40;
  let clinicalSummary = 'Standard monitoring evaluation.';

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });

      // Prepare strictly isolated conversation turns for this victim
      const priorTurnsSnippet = isolatedHistory.length > 0
        ? isolatedHistory.map((t, idx) => `Turn ${idx + 1} (${t.timestamp}): [${t.role.toUpperCase()}] ${t.sanitizedMessage} (Distress: ${t.distressScore})`).join('\n')
        : 'No prior recorded turns for this isolated victim.';

      const systemPrompt = `You are the AI Engine of an Atrocity Victim Mental Health Monitoring and Distress Prediction pipeline.
You analyze incoming periodic checks, text disclosures, voice transcripts, or external trauma events.

CRITICAL ISOLATION MANDATE:
You are strictly evaluating ONLY victim ${victimId} (${victimProfile.pseudonym}).
Do NOT blend or reference any other victim context.

DATABASE BACKGROUND OF THIS VICTIM:
- Trauma context: ${victimProfile.traumaContext}
- Baseline distress: ${victimProfile.baselineDistressScore}
- Assigned Caseworker: ${victimProfile.assignedCaseworker}
- Safety Notes: ${victimProfile.safetyNotes || 'None'}

ISOLATED PRIOR CONVERSATION TURNS:
${priorTurnsSnippet}

Evaluate the incoming input according to:
1. NLP linguistic trauma markers & categories
2. Emotion Analysis (primary emotion, arousal level 0-100, emotional valence)
3. Modality Analysis (${modality.toUpperCase()} signals)
4. Dynamic Trauma Severity (0-100) & Resilience Score (0-100)`;

      const prompt = `MODALITY: ${modality.toUpperCase()}
CHECK TYPE: ${checkType.toUpperCase()}
SANITIZED INPUT:
"""
${filterResult.filteredText}
"""
CRISIS FLAGS: ${filterResult.crisisDetection.reasons.join('; ') || 'None'}`;

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI Engine timeout (7s)')), 7000)
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
              traumaCategories: { type: Type.ARRAY, items: { type: Type.STRING } },
              primaryEmotion: { type: Type.STRING },
              arousalLevel: { type: Type.INTEGER },
              emotionalValence: {
                type: Type.STRING,
                enum: ['positive', 'neutral', 'distressed', 'extreme_agony']
              },
              traumaSeverityScore: { type: Type.INTEGER },
              resilienceScore: { type: Type.INTEGER },
              clinicalSummary: { type: Type.STRING }
            },
            required: [
              'traumaCategories',
              'primaryEmotion',
              'arousalLevel',
              'emotionalValence',
              'traumaSeverityScore',
              'resilienceScore',
              'clinicalSummary'
            ]
          }
        }
      });

      const response: any = await Promise.race([aiPromise, timeoutPromise]);
      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        nlpCategories = parsed.traumaCategories || nlpCategories;
        primaryEmotion = parsed.primaryEmotion || primaryEmotion;
        arousalLevel = Math.min(100, Math.max(0, parsed.arousalLevel || 60));
        emotionalValence = parsed.emotionalValence || 'distressed';
        traumaSeverity = Math.min(100, Math.max(0, parsed.traumaSeverityScore || 55));
        resilience = Math.min(100, Math.max(0, parsed.resilienceScore || 40));
        clinicalSummary = parsed.clinicalSummary || clinicalSummary;
        evalSource = 'gemini-3.8-flash';
      }
    } catch (err) {
      console.warn('[Pipeline AI Engine] Fallback to clinical heuristics:', err);
    }
  }

  // Handle Voice / Event Modality heuristics if provided
  if (modality === 'voice' && payload.voiceMetrics) {
    if (payload.voiceMetrics.acousticDistressRating) {
      arousalLevel = Math.round((arousalLevel + payload.voiceMetrics.acousticDistressRating * 10) / 2);
    }
  }

  if (filterResult.crisisDetection.requiresImmediateHelp) {
    arousalLevel = Math.max(arousalLevel, 90);
    traumaSeverity = Math.max(traumaSeverity, 85);
    emotionalValence = 'extreme_agony';
  }

  // =========================================================================
  // 4. Dynamic Distress Score (0 to 100)
  // =========================================================================
  // Formula: Weighted synthesis of acute arousal (50%), trauma severity (35%), moderated by resilience (15%)
  const rawDistress = (arousalLevel * 0.5) + (traumaSeverity * 0.35) - ((resilience - 50) * 0.3);
  const dynamicDistressScore = Math.min(100, Math.max(5, Math.round(rawDistress)));

  let distressLevelLabel: 'Minimal' | 'Mild' | 'Elevated' | 'Acute / Critical' = 'Mild';
  if (dynamicDistressScore >= 75 || filterResult.crisisDetection.requiresImmediateHelp) {
    distressLevelLabel = 'Acute / Critical';
  } else if (dynamicDistressScore >= 55) {
    distressLevelLabel = 'Elevated';
  } else if (dynamicDistressScore >= 35) {
    distressLevelLabel = 'Mild';
  } else {
    distressLevelLabel = 'Minimal';
  }

  // =========================================================================
  // 5. Trend + Prediction (Exclusively using this victim's historical record)
  // =========================================================================
  const previousRecord = distressHistory.length > 0
    ? distressHistory[distressHistory.length - 1]
    : null;

  const previousScore = previousRecord ? previousRecord.dynamicDistressScore : null;
  const baselineScore = victimProfile.baselineDistressScore || 50;
  const deltaPrevious = previousScore !== null ? dynamicDistressScore - previousScore : 0;
  const deltaBaseline = dynamicDistressScore - baselineScore;

  let trendDirection: DistressTrendPrediction['trendDirection'] = 'stable';
  let predictedTrajectory: DistressTrendPrediction['predictedTrajectory'] = 'plateau';
  let trendSummary = 'Distress is tracking closely with established baseline.';

  if (deltaPrevious >= 15 || deltaBaseline >= 25) {
    trendDirection = 'accelerating_distress';
    predictedTrajectory = 'acute_spike_expected';
    trendSummary = `Severe acute escalation detected (+${deltaPrevious} pts from prior turn, +${deltaBaseline} pts from baseline). High vulnerability window.`;
  } else if (deltaPrevious >= 5 || deltaBaseline >= 10) {
    trendDirection = 'gradual_increase';
    predictedTrajectory = 'gradual_rise';
    trendSummary = `Gradual elevation in psychological distress (+${deltaPrevious} pts from prior turn). Needs proactive monitoring.`;
  } else if (deltaPrevious <= -15) {
    trendDirection = 'recovering';
    predictedTrajectory = 'steady_improvement';
    trendSummary = `Substantial symptom de-escalation (-${Math.abs(deltaPrevious)} pts). Grounding and coping mechanisms are functioning effectively.`;
  } else if (deltaPrevious <= -5) {
    trendDirection = 'de_escalating';
    predictedTrajectory = 'steady_improvement';
    trendSummary = `Mild de-escalation observed (-${Math.abs(deltaPrevious)} pts). Trajectory remains positive.`;
  }

  const trendAndPrediction: DistressTrendPrediction = {
    currentScore: dynamicDistressScore,
    previousScore,
    baselineScore,
    deltaPrevious,
    deltaBaseline,
    trendDirection,
    distressVelocity: deltaPrevious,
    predictedTrajectory,
    trendSummary
  };

  // =========================================================================
  // 6. Risk Classification & Flowchart Branching
  //    Low/Medium -> Monitoring
  //    High/Critical -> Alert -> Human Intervention -> Follow-up & Recovery
  // =========================================================================
  const isCriticalRisk =
    dynamicDistressScore >= 75 ||
    filterResult.crisisDetection.requiresImmediateHelp ||
    (dynamicDistressScore >= 65 && trendDirection === 'accelerating_distress');

  const isHighRisk =
    dynamicDistressScore >= 55 ||
    trendDirection === 'accelerating_distress';

  let riskClassification: RiskClassificationResult;

  if (isCriticalRisk || isHighRisk) {
    // Branch: High / Critical
    const isCritical = isCriticalRisk;
    const classification = isCritical ? 'Critical' : 'High';
    const alertLevel = isCritical ? 'CRITICAL_EMERGENCY' : 'HIGH_ALERT';

    riskClassification = {
      classification,
      score: dynamicDistressScore,
      reasoning: [
        `Dynamic Distress Score at ${dynamicDistressScore}/100 exceeds safety threshold`,
        `Trajectory: ${trendDirection.replace('_', ' ').toUpperCase()}`,
        ...(filterResult.crisisDetection.reasons.length > 0 ? filterResult.crisisDetection.reasons : ['Elevated autonomic distress arousal detected'])
      ],
      branch: 'High/Critical',
      pathway: 'Alert',
      alertDetails: {
        alertLevel,
        triggeredAt: new Date().toISOString(),
        humanIntervention: {
          urgency: isCritical ? 'Immediate (within 15 mins)' : 'Urgent (within 2 hours)',
          assignedUnit: isCritical
            ? 'Mobile Crisis Response & Protection Unit'
            : `${victimProfile.assignedAgency} Casework Division`,
          interventionProtocol: isCritical
            ? `RAPID ESCALATION PROTOCOL 1: Contact ${victimProfile.assignedCaseworker} immediately. Conduct emergency suicide/harm safety assessment and coordinate secure protective transport if in conflict environment.`
            : `TARGETED TRAUMA INTERVENTION PROTOCOL 2: Schedule priority trauma debriefing with ${victimProfile.assignedCaseworker} within 2 hours. Deliver stabilization guidance.`,
          responderChecklist: [
            `Verify victim physical safety and shelter security status`,
            `Conduct structured trauma grounding (PMR / Box breathing)`,
            `Assess acute suicidality or ongoing violence threat`,
            `Provide direct caseworker phone connection`,
            `Document event in secure case ledger`
          ]
        },
        followUpAndRecovery: {
          followUpScheduled: isCritical ? 'In 6 hours' : 'In 24 hours',
          recoveryPlan: `Structured post-crisis stabilization regimen focusing on trauma symptom reduction and relational safety anchoring.`,
          stabilizationGoals: [
            'Attain autonomic nervous system stabilization (Arousal < 40)',
            'Ensure safe night shelter without noise triggers',
            'Connect with trusted family or community support advocate'
          ],
          crisisContactProvided: '988 Suicide & Crisis Lifeline / +1-800-656-4673 Humanitarian Protection Desk'
        }
      }
    };
  } else {
    // Branch: Low / Medium -> Monitoring
    const classification = dynamicDistressScore >= 35 ? 'Medium' : 'Low';
    riskClassification = {
      classification,
      score: dynamicDistressScore,
      reasoning: [
        `Dynamic Distress Score at ${dynamicDistressScore}/100 is within tolerable adaptive range`,
        `Trajectory: ${trendDirection.replace('_', ' ').toUpperCase()}`,
        'No acute crisis or violence escalation flags identified'
      ],
      branch: 'Low/Medium',
      pathway: 'Monitoring',
      monitoringDetails: {
        status: classification === 'Medium' ? 'Active Vigilance Monitoring' : 'Stable Routine Monitoring',
        nextPeriodicCheckDue: classification === 'Medium' ? 'In 12 hours' : 'In 24 hours',
        guidance: `Maintain periodic check-in cadence via ${payload.channel || 'victim_dashboard'}. Provide restorative grounding affirmations.`
      }
    };
  }

  // =========================================================================
  // 7. PERSIST TO ISOLATED DATABASE VAULT
  // =========================================================================
  const executionId = `EXEC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const conversationTurn: IsolatedConversationTurn = {
    turnId: `TURN-${Date.now()}`,
    victimId,
    role: 'victim',
    channel: payload.channel || 'victim_dashboard',
    rawMessage: payload.input,
    sanitizedMessage: filterResult.filteredText,
    detectedEmotion: primaryEmotion,
    emotionalValence,
    distressScore: dynamicDistressScore,
    timestamp: new Date().toISOString()
  };

  // Strict append to this victim's isolated history
  await db.appendIsolatedConversationTurn(conversationTurn);

  // Save new dynamic distress score point
  const distressRecord: DynamicDistressRecord = {
    recordId: `DDS-${Date.now()}`,
    victimId,
    timestamp: new Date().toISOString(),
    dynamicDistressScore,
    acuteArousalScore: arousalLevel,
    traumaSeverityScore: traumaSeverity,
    resilienceScore: resilience,
    modality,
    source: checkType
  };
  await db.saveDistressRecord(distressRecord);

  // =========================================================================
  // PERSIST TO EXPLICIT DATABASE SCHEMAS (victims & checkins)
  // victims (id, name, case_id, risk_level, latest_score)
  // checkins (id, victim_id, message, score, risk_category, trigger_factors, created_at)
  // =========================================================================
  const checkinRecord: CheckinDbRecord = {
    id: `CHK-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    victim_id: victimId,
    message: filterResult.filteredText,
    score: dynamicDistressScore,
    risk_category: riskClassification.classification,
    trigger_factors: nlpCategories.length > 0 ? nlpCategories : ['trauma_exposure', 'wellness_check'],
    created_at: new Date().toISOString()
  };
  await db.recordCheckin(checkinRecord);

  // Update victims table (id, name, case_id, risk_level, latest_score)
  let victimDbRec = await db.getVictimDbRecord(victimId);
  if (!victimDbRec) {
    victimDbRec = {
      id: victimId,
      name: victimProfile.pseudonym || `Survivor ${victimId}`,
      case_id: `CASE-${victimId.replace(/[^a-zA-Z0-9]/g, '')}`,
      risk_level: riskClassification.classification,
      latest_score: dynamicDistressScore
    };
    await db.saveVictimDbRecord(victimDbRec);
  } else {
    await db.updateVictimScore(victimId, riskClassification.classification, dynamicDistressScore);
    victimDbRec.risk_level = riskClassification.classification;
    victimDbRec.latest_score = dynamicDistressScore;
  }

  // Update victim status in DB if escalated
  if (riskClassification.branch === 'High/Critical') {
    victimProfile.status = 'escalated';
    await db.saveVictimProfile(victimProfile);
  }

  return {
    executionId,
    victimId,
    victimProfile,
    pipelineStageResults: {
      inputIngested: {
        modality,
        checkType,
        rawSnippet: payload.input.slice(0, 120) + (payload.input.length > 120 ? '...' : ''),
        timestamp: new Date().toISOString()
      },
      aiEngineAnalysis: {
        nlpAnalysis: {
          traumaCategories: nlpCategories.length > 0 ? nlpCategories : ['Civilian Conflict Exposure'],
          sanitizedText: filterResult.filteredText,
          redactedTokensCount: filterResult.redactedCount
        },
        emotionAnalysis: {
          primaryEmotion,
          arousalLevel,
          emotionalValence
        },
        modalityAnalysis: {
          modality,
          details: modality === 'voice'
            ? 'Acoustic prosody analysis & speech transcript processing'
            : modality === 'events'
              ? 'Trauma trigger event evaluation'
              : 'Direct text NLP & sentiment processing'
        },
        isolatedContextTurnsUsed: isolatedHistory.length,
        evalSource
      },
      dynamicDistressScore: {
        score: dynamicDistressScore,
        level: distressLevelLabel,
        breakdown: {
          acuteArousal: arousalLevel,
          traumaSeverity,
          resilience
        }
      },
      trendAndPrediction,
      riskClassification
    },
    persistedTurn: conversationTurn,
    persistedCheckin: checkinRecord,
    victimDbRecord: victimDbRec,
    timestamp: new Date().toISOString()
  };
}
