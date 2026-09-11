export type CrisisSeverity = 'none' | 'low' | 'moderate' | 'high' | 'critical';

export interface CrisisDetection {
  hasCrisisIndicators: boolean;
  severity: CrisisSeverity;
  matchedCategories: string[];
  reasons: string[];
  requiresImmediateHelp: boolean;
}

export interface SanitizedEntity {
  original: string;
  replacement: string;
  type: 'NAME' | 'PHONE' | 'EMAIL' | 'LOCATION' | 'DATE' | 'IDENTIFIER';
  index: number;
}

export interface TraumaTag {
  category: string;
  label: string;
  detectedWords: string[];
  severity: 'mild' | 'moderate' | 'acute';
}

export interface FilterResult {
  originalText: string;
  filteredText: string;
  crisisDetection: CrisisDetection;
  sanitizedEntities: SanitizedEntity[];
  traumaTags: TraumaTag[];
  redactedCount: number;
  wordCount: number;
  characterCount: number;
  filterAppliedAt: string;
}

export interface TraumaScores {
  overallImpactScore: number; // 0 - 100
  acuteDistressScore: number; // 0 - 100
  resilienceScore: number;    // 0 - 100
  urgencyLevel: 'Mild' | 'Moderate' | 'High' | 'Severe / Crisis';
  
  // Trauma symptom clusters (aligned with clinical trauma dimensions / PCL-5)
  clusters: {
    intrusion: {
      score: number; // 0 - 100
      level: 'Minimal' | 'Mild' | 'Moderate' | 'Severe';
      indicators: string[];
    };
    avoidance: {
      score: number; // 0 - 100
      level: 'Minimal' | 'Mild' | 'Moderate' | 'Severe';
      indicators: string[];
    };
    negativeCognitionMood: {
      score: number; // 0 - 100
      level: 'Minimal' | 'Mild' | 'Moderate' | 'Severe';
      indicators: string[];
    };
    hyperarousal: {
      score: number; // 0 - 100
      level: 'Minimal' | 'Mild' | 'Moderate' | 'Severe';
      indicators: string[];
    };
  };
  
  clinicalObservations: string[];
  empatheticSummary: string;
  traumaInformedRecommendations: {
    immediateGrounding: string[];
    carePathway: string;
    facilitatorGuidance: string[];
  };
}

export interface FilterSettings {
  redactPii: boolean;
  redactLocations: boolean;
  redactIdentifiers: boolean;
  sensitivityLevel: 'standard' | 'high' | 'maximum';
  includeCrisisSafetyShield: boolean;
}

// Multi-Channel Ingestion & Dual Dashboard Interfaces
export type IngestionChannel = 'victim_dashboard' | 'whatsapp' | 'telegram' | 'ivr' | 'speech';

export interface ChannelMetadata {
  channel: IngestionChannel;
  senderIdentifier?: string; // e.g., masked phone or user hash
  sessionId?: string;
  durationSeconds?: number;
  ivrDtmfTone?: string;
  audioQuality?: string;
  language?: string;
}

export interface VictimDashboardPayload {
  victimId: string;
  status: 'Safe' | 'Supported' | 'Needs Attention';
  compassionateGreeting: string;
  plainTextDistressLevel: 'Balanced' | 'Mild Stress' | 'High Distress' | 'Intense Overwhelm';
  supportiveInsights: string[];
  dailyGroundingExercises: string[];
  privacyConfirmation: string;
  crisisContacts: { name: string; contact: string; description: string }[];
  allocatedSupportWorker: string;
  lastUpdated: string;
}

export interface OfficialsDashboardPayload {
  recordId: string;
  victimId: string;
  ingestionChannel: IngestionChannel;
  triagePriority: 'CRITICAL_RED' | 'ELEVATED_AMBER' | 'MONITOR_YELLOW' | 'STABLE_GREEN';
  atrocityType: string;
  traumaSeverityScore: number; // 0 - 100
  distressPredictionScore: number; // 0 - 100
  resilienceScore: number; // 0 - 100
  escalationRisk: 'Low' | 'Moderate' | 'High' | 'Immediate Crisis';
  sanitizedNarrative: string;
  redactedTokensCount: number;
  crisisFlags: string[];
  recommendedOfficialProtocol: string;
  assignedAgency: string;
  timeline: { timestamp: string; action: string; actor: string }[];
  ingestedAt: string;
}

export interface ProcessedAtrocityRecord {
  recordId: string;
  victimId: string;
  channel: IngestionChannel;
  channelMetadata: ChannelMetadata;
  rawInput: string;
  filter: FilterResult;
  scores: TraumaScores;
  victimDashboardData: VictimDashboardPayload;
  officialsDashboardData: OfficialsDashboardPayload;
  evalSource: 'gemini-3.8-flash' | 'clinical-rule-engine-fallback';
  timestamp: string;
}

export interface FullEvaluationResponse {
  filter: FilterResult;
  scores: TraumaScores;
  record: ProcessedAtrocityRecord;
  victimDashboard: VictimDashboardPayload;
  officialsDashboard: OfficialsDashboardPayload;
  evalSource: 'gemini-3.8-flash' | 'clinical-rule-engine-fallback';
  timestamp: string;
}

// ==========================================
// BACKEND PIPELINE ENGINE & ISOLATION TYPES
// (Matching System Flowchart Architecture)
// ==========================================

export type InputModality = 'text' | 'voice' | 'events';
export type PipelineCheckType = 'periodic_check' | 'direct_input' | 'event_trigger';

export interface VictimProfile {
  victimId: string;
  pseudonym: string;
  demographics?: {
    ageRange?: string;
    region?: string;
    language?: string;
  };
  traumaContext: string;
  baselineDistressScore: number; // 0 - 100
  assignedAgency: string;
  assignedCaseworker: string;
  safetyNotes?: string;
  status: 'active' | 'escalated' | 'resolved';
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface IsolatedConversationTurn {
  turnId: string;
  victimId: string;
  role: 'victim' | 'ai_engine' | 'system';
  channel: IngestionChannel;
  rawMessage: string;
  sanitizedMessage: string;
  detectedEmotion: string;
  emotionalValence: 'positive' | 'neutral' | 'distressed' | 'extreme_agony';
  distressScore: number;
  timestamp: string;
}

export interface DynamicDistressRecord {
  recordId: string;
  victimId: string;
  timestamp: string;
  dynamicDistressScore: number; // 0 - 100
  acuteArousalScore: number; // 0 - 100
  traumaSeverityScore: number; // 0 - 100
  resilienceScore: number; // 0 - 100
  modality: InputModality;
  source: PipelineCheckType;
}

// ==========================================
// EXPLICIT DATABASE SCHEMAS (VICTIMS & CHECKINS)
// ==========================================

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

/**
 * Explicit schema for Victims table/collection in database:
 * (id, name, case_id, risk_level, latest_score)
 */
export type OfficialRole = 'admin' | 'sub_official';

export interface OfficialDbRecord {
  id: string;
  username: string;
  display_name: string;
  role: OfficialRole;
  active: boolean;
  created_at: string;
}

export interface VictimDbRecord {
  id: string;
  name: string;
  case_id: string;
  risk_level: RiskLevel | string;
  latest_score: number; // 0 - 100
  password_hash?: string;
  baseline_distress_score?: number;
  doctor_initial_score?: number | null;
  doctor_name?: string | null;
  doctor_notes?: string | null;
  telegram_username?: string | null;
  closed?: boolean;
  closed_at?: string | null;
  closed_by?: string | null;
}

/**
 * Explicit schema for Checkins table/collection in database:
 * (id, victim_id, message, score, risk_category, trigger_factors, created_at)
 */
export interface CheckinDbRecord {
  id: string;
  victim_id: string;
  message: string;
  score: number; // 0 - 100
  risk_category: RiskLevel | string;
  trigger_factors: string[];
  created_at: string; // ISO 8601 string
  ingestion_channel?: IngestionChannel;
}

export interface DistressTrendPrediction {
  currentScore: number;
  previousScore: number | null;
  baselineScore: number;
  deltaPrevious: number;
  deltaBaseline: number;
  trendDirection: 'accelerating_distress' | 'gradual_increase' | 'stable' | 'de_escalating' | 'recovering';
  distressVelocity: number;
  predictedTrajectory: 'acute_spike_expected' | 'gradual_rise' | 'plateau' | 'steady_improvement';
  trendSummary: string;
}

export interface HumanInterventionPlan {
  urgency: 'Immediate (within 15 mins)' | 'Urgent (within 2 hours)' | 'High (within 6 hours)';
  assignedUnit: string;
  interventionProtocol: string;
  responderChecklist: string[];
}

export interface FollowUpAndRecoveryPlan {
  followUpScheduled: string;
  recoveryPlan: string;
  stabilizationGoals: string[];
  crisisContactProvided: string;
}

export interface RiskClassificationResult {
  classification: 'Low' | 'Medium' | 'High' | 'Critical';
  score: number;
  reasoning: string[];
  branch: 'Low/Medium' | 'High/Critical';
  pathway: 'Monitoring' | 'Alert';
  monitoringDetails?: {
    status: string;
    nextPeriodicCheckDue: string;
    guidance: string;
  };
  alertDetails?: {
    alertLevel: 'HIGH_ALERT' | 'CRITICAL_EMERGENCY';
    triggeredAt: string;
    humanIntervention: HumanInterventionPlan;
    followUpAndRecovery: FollowUpAndRecoveryPlan;
  };
}

export interface PipelineProcessPayload {
  victimId: string;
  modality: InputModality;
  checkType: PipelineCheckType;
  input: string;
  voiceMetrics?: {
    speechRateWpm?: number;
    pitchVolatility?: number;
    pauseDurationMs?: number;
    acousticDistressRating?: number;
  };
  eventData?: {
    eventType?: string;
    severity?: string;
    impactSummary?: string;
  };
  channel?: IngestionChannel;
}

export interface PipelineExecutionResult {
  executionId: string;
  victimId: string;
  victimProfile: VictimProfile;
  pipelineStageResults: {
    inputIngested: {
      modality: InputModality;
      checkType: PipelineCheckType;
      rawSnippet: string;
      timestamp: string;
    };
    aiEngineAnalysis: {
      nlpAnalysis: {
        traumaCategories: string[];
        sanitizedText: string;
        redactedTokensCount: number;
      };
      emotionAnalysis: {
        primaryEmotion: string;
        arousalLevel: number;
        emotionalValence: string;
      };
      modalityAnalysis: {
        modality: InputModality;
        details: string;
      };
      isolatedContextTurnsUsed: number;
      evalSource: 'gemini-3.8-flash' | 'rule-engine-fallback';
    };
    dynamicDistressScore: {
      score: number;
      level: 'Minimal' | 'Mild' | 'Elevated' | 'Acute / Critical';
      breakdown: {
        acuteArousal: number;
        traumaSeverity: number;
        resilience: number;
      };
    };
    trendAndPrediction: DistressTrendPrediction;
    riskClassification: RiskClassificationResult;
  };
  persistedTurn: IsolatedConversationTurn;
  persistedCheckin?: CheckinDbRecord;
  victimDbRecord?: VictimDbRecord;
  timestamp: string;
}

