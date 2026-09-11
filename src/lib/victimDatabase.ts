import {
  VictimProfile,
  IsolatedConversationTurn,
  DynamicDistressRecord,
  InputModality,
  IngestionChannel,
  PipelineCheckType,
  VictimDbRecord,
  CheckinDbRecord,
  RiskLevel
} from '../types';
import { getDatabaseAdapter } from '../db/databasePlaceholder';

export interface DatabaseAdapterMeta {
  name: string;
  type: 'in_memory_transient' | 'external_sql_nosql_ready';
  status: 'active' | 'ready_for_external_injection';
  totalVictimsRegistered: number;
  totalIsolatedTurnsStored: number;
  totalCheckinsStored: number;
  description: string;
}

/**
 * Interface defining the Database Abstraction Layer for Victims and Checkins.
 * Enforces the exact database schema:
 * - victims (id, name, case_id, risk_level, latest_score)
 * - checkins (id, victim_id, message, score, risk_category, trigger_factors, created_at)
 */
export interface IVictimDatabase {
  // 1. Explicit Schema: victims (id, name, case_id, risk_level, latest_score)
  getVictimDbRecord(id: string): Promise<VictimDbRecord | null>;
  saveVictimDbRecord(victim: VictimDbRecord): Promise<void>;
  listVictimDbRecords(): Promise<VictimDbRecord[]>;
  updateVictimScore(id: string, risk_level: RiskLevel | string, latest_score: number): Promise<void>;

  // 2. Explicit Schema: checkins (id, victim_id, message, score, risk_category, trigger_factors, created_at)
  recordCheckin(checkin: CheckinDbRecord): Promise<void>;
  getCheckinsForVictim(victimId: string, limit?: number): Promise<CheckinDbRecord[]>;
  listAllCheckins(limit?: number): Promise<CheckinDbRecord[]>;

  // 3. Isolated Clinical Profiles (High-level metadata)
  getVictimProfile(victimId: string): Promise<VictimProfile | null>;
  saveVictimProfile(profile: VictimProfile): Promise<void>;
  listVictimProfiles(): Promise<VictimProfile[]>;

  // 4. Strict Isolated Conversations (per-victim isolation boundary)
  getIsolatedConversations(victimId: string, limit?: number): Promise<IsolatedConversationTurn[]>;
  appendIsolatedConversationTurn(turn: IsolatedConversationTurn): Promise<void>;
  clearIsolatedConversations?(victimId: string): Promise<void>;

  // 5. Dynamic Distress Score History & Trend Tracking (per-victim)
  getDistressHistory(victimId: string): Promise<DynamicDistressRecord[]>;
  saveDistressRecord(record: DynamicDistressRecord): Promise<void>;

  // 6. Metadata & Health
  getAdapterMeta(): Promise<DatabaseAdapterMeta>;
}

/**
 * Database-backed victim repository.
 * Ensures zero cross-contamination between victims.
 */
export class InMemoryVictimDatabase implements IVictimDatabase {

  // =========================================================================
  // EXPLICIT SCHEMA IMPLEMENTATION: victims (id, name, case_id, risk_level, latest_score)
  // =========================================================================
  async getVictimDbRecord(id: string): Promise<VictimDbRecord | null> {
    return getDatabaseAdapter().getVictim(id);
  }

  async saveVictimDbRecord(victim: VictimDbRecord): Promise<void> {
    await getDatabaseAdapter().upsertVictim(victim);
  }

  async listVictimDbRecords(): Promise<VictimDbRecord[]> {
    return getDatabaseAdapter().listVictims();
  }

  async updateVictimScore(id: string, risk_level: RiskLevel | string, latest_score: number): Promise<void> {
    await getDatabaseAdapter().updateVictimScore(id, risk_level, latest_score);
  }

  // =========================================================================
  // EXPLICIT SCHEMA IMPLEMENTATION: checkins (id, victim_id, message, score, risk_category, trigger_factors, created_at)
  // =========================================================================
  async recordCheckin(checkin: CheckinDbRecord): Promise<void> {
    await getDatabaseAdapter().insertCheckin(checkin);
  }

  async getCheckinsForVictim(victimId: string, limit = 50): Promise<CheckinDbRecord[]> {
    return getDatabaseAdapter().getCheckinsForVictim(victimId, limit);
  }

  async listAllCheckins(limit = 100): Promise<CheckinDbRecord[]> {
    return getDatabaseAdapter().listCheckins(limit);
  }


  async getVictimProfile(victimId: string): Promise<VictimProfile | null> {
    const record = await getDatabaseAdapter().getVictim(victimId);
    if (!record) return null;
    return {
      victimId: record.id,
      pseudonym: record.name,
      demographics: {},
      traumaContext: 'Protected case record; detailed context is supplied only through the current check-in pipeline.',
      baselineDistressScore: Number(record.doctor_initial_score ?? (Number(record.baseline_distress_score || 0) > 0 ? record.baseline_distress_score : record.latest_score)),
      assignedAgency: 'Humanitarian Trauma & Casework Services',
      assignedCaseworker: 'Assigned Protection Caseworker',
      safetyNotes: '',
      status: record.risk_level === 'Critical' || record.risk_level === 'High' ? 'escalated' : 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async saveVictimProfile(profile: VictimProfile): Promise<void> {
    const existing = await getDatabaseAdapter().getVictim(profile.victimId);
    await getDatabaseAdapter().upsertVictim({
      id: profile.victimId,
      name: existing?.name || profile.pseudonym,
      case_id: existing?.case_id || `CASE-${profile.victimId.replace(/[^a-zA-Z0-9]/g, '')}`,
      risk_level: existing?.risk_level || 'Low',
      latest_score: existing?.latest_score ?? profile.baselineDistressScore,
      baseline_distress_score: existing?.baseline_distress_score ?? profile.baselineDistressScore,
      doctor_initial_score: existing?.doctor_initial_score ?? profile.baselineDistressScore,
      doctor_name: existing?.doctor_name ?? null,
      doctor_notes: existing?.doctor_notes ?? null,
      closed: existing?.closed ?? false,
      closed_at: existing?.closed_at ?? null,
      closed_by: existing?.closed_by ?? null,
      password_hash: existing?.password_hash
    });
  }

  async listVictimProfiles(): Promise<VictimProfile[]> {
    const records = await getDatabaseAdapter().listVictims();
    return records.map(record => ({
      victimId: record.id,
      pseudonym: record.name,
      demographics: {},
      traumaContext: 'Protected case record; detailed context is supplied only through the current check-in pipeline.',
      baselineDistressScore: Number(record.doctor_initial_score ?? (Number(record.baseline_distress_score || 0) > 0 ? record.baseline_distress_score : record.latest_score)),
      assignedAgency: 'Humanitarian Trauma & Casework Services',
      assignedCaseworker: 'Assigned Protection Caseworker',
      safetyNotes: '',
      status: record.risk_level === 'Critical' || record.risk_level === 'High' ? 'escalated' : 'active',
      createdAt: '',
      updatedAt: ''
    }));
  }

  async getIsolatedConversations(victimId: string, limit = 50): Promise<IsolatedConversationTurn[]> {
    const checkins = await getDatabaseAdapter().getCheckinsForVictim(victimId, limit);
    return checkins.reverse().map(checkin => ({
      turnId: checkin.id,
      victimId: checkin.victim_id,
      role: 'victim' as const,
      channel: (checkin.ingestion_channel || 'victim_dashboard') as IngestionChannel,
      rawMessage: checkin.message,
      sanitizedMessage: checkin.message,
      detectedEmotion: 'Distress',
      emotionalValence: 'distressed' as const,
      distressScore: checkin.score,
      timestamp: checkin.created_at
    }));
  }

  async appendIsolatedConversationTurn(_turn: IsolatedConversationTurn): Promise<void> {
    // Durable conversation persistence is performed by recordCheckin() in the pipeline.
    // Keeping this method side-effect free prevents a second copy of the same turn.
  }

  async clearIsolatedConversations(_victimId: string): Promise<void> {
    throw new Error('Conversation deletion is intentionally disabled; use the database retention policy.');
  }

  async getDistressHistory(victimId: string): Promise<DynamicDistressRecord[]> {
    const checkins = await getDatabaseAdapter().getCheckinsForVictim(victimId, 100);
    return checkins.reverse().map(checkin => ({
      recordId: checkin.id,
      victimId: checkin.victim_id,
      timestamp: checkin.created_at,
      dynamicDistressScore: checkin.score,
      acuteArousalScore: checkin.score,
      traumaSeverityScore: checkin.score,
      resilienceScore: Math.max(0, 100 - checkin.score),
      modality: 'text' as InputModality,
      source: 'periodic_check' as PipelineCheckType
    }));
  }

  async saveDistressRecord(_record: DynamicDistressRecord): Promise<void> {
    // Distress history is derived from durable check-in rows, avoiding a second transient store.
  }

  async getAdapterMeta(): Promise<DatabaseAdapterMeta> {
    const adapter = getDatabaseAdapter();
    const [victims, checkins] = await Promise.all([
      adapter.listVictims(),
      adapter.listCheckins(1000)
    ]);
    return {
      name: adapter.name,
      type: 'external_sql_nosql_ready',
      status: adapter.isConnected() ? 'active' : 'ready_for_external_injection',
      totalVictimsRegistered: victims.length,
      totalIsolatedTurnsStored: checkins.length,
      totalCheckinsStored: checkins.length,
      description: 'All victim records, check-ins, conversation history and distress history are read from the configured database. No seed or in-memory sample data is used.'
    };
  }
}

// Singleton database adapter instance
let activeVictimDatabase: IVictimDatabase = new InMemoryVictimDatabase();

/**
 * Accessor for the active victim database.
 */
export function getVictimDatabase(): IVictimDatabase {
  return activeVictimDatabase;
}

/**
 * Extension point for subsequent iterations:
 * Once the user provides their external database (Postgres, MongoDB, Firestore, etc.),
 * call this function to register the external implementation.
 */
export function setVictimDatabaseAdapter(adapter: IVictimDatabase) {
  activeVictimDatabase = adapter;
  console.log('[VictimDatabase] Switched to external database adapter:', adapter);
}
