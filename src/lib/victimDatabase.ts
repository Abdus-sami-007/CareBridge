import {
  VictimProfile,
  IsolatedConversationTurn,
  DynamicDistressRecord,
  InputModality,
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
 * In-Memory Isolated Database implementation.
 * Ensures zero cross-contamination between victims.
 */
export class InMemoryVictimDatabase implements IVictimDatabase {
  private profiles = new Map<string, VictimProfile>();
  private conversationVaults = new Map<string, IsolatedConversationTurn[]>();
  private distressHistories = new Map<string, DynamicDistressRecord[]>();

  constructor() {
    this.seedInitialVictims();
  }

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

  private seedInitialVictims() {
    const seedProfiles: VictimProfile[] = [
      {
        victimId: 'VIC-CONFLICT-701',
        pseudonym: 'Survivor-Kharkiv-01',
        demographics: { ageRange: '35-45', region: 'Sector North', language: 'Ukrainian' },
        traumaContext: 'Severe artillery shelling of residential district; lost home; displaced with child.',
        baselineDistressScore: 42,
        assignedAgency: 'International Medical Corps & Humanitarian Trauma Hub',
        assignedCaseworker: 'Dr. Anna M. (Trauma Clinician)',
        safetyNotes: 'High hyperarousal near loud percussive sounds. Relatives safe.',
        status: 'active',
        createdAt: '2026-09-01T08:00:00.000Z',
        updatedAt: '2026-09-08T14:30:00.000Z'
      },
      {
        victimId: 'VIC-DETENTION-802',
        pseudonym: 'Survivor-Cell-14',
        demographics: { ageRange: '25-34', region: 'Sector East', language: 'English / Arabic' },
        traumaContext: 'Detained arbitrarily for 21 days; sensory deprivation and sleep deprivation.',
        baselineDistressScore: 58,
        assignedAgency: 'Torture Rehabilitation & Legal Defense Center',
        assignedCaseworker: 'Tariq K. (Protection Officer)',
        safetyNotes: 'Experiences severe dissociative episodes upon sudden light changes.',
        status: 'active',
        createdAt: '2026-09-02T10:15:00.000Z',
        updatedAt: '2026-09-08T18:00:00.000Z'
      },
      {
        victimId: 'VIC-BORDER-903',
        pseudonym: 'Survivor-Transit-88',
        demographics: { ageRange: '45-55', region: 'Border Transit Camp 4', language: 'French' },
        traumaContext: 'Border crossing interdiction; documents confiscated by armed militia.',
        baselineDistressScore: 61,
        assignedAgency: 'UNHCR Rapid Protection Casework',
        assignedCaseworker: 'Claire B. (Field Social Worker)',
        safetyNotes: 'At risk of severe anxiety and despair regarding separated minor children.',
        status: 'active',
        createdAt: '2026-09-03T12:00:00.000Z',
        updatedAt: '2026-09-09T06:00:00.000Z'
      }
    ];

    for (const p of seedProfiles) {
      this.profiles.set(p.victimId, p);
      this.conversationVaults.set(p.victimId, []);
      this.distressHistories.set(p.victimId, [
        {
          recordId: `INIT-SCORE-${p.victimId}`,
          victimId: p.victimId,
          timestamp: p.createdAt,
          dynamicDistressScore: p.baselineDistressScore,
          acuteArousalScore: Math.max(20, p.baselineDistressScore - 10),
          traumaSeverityScore: p.baselineDistressScore + 5,
          resilienceScore: 40,
          modality: 'text',
          source: 'periodic_check'
        }
      ]);
    }
  }

  async getVictimProfile(victimId: string): Promise<VictimProfile | null> {
    const profile = this.profiles.get(victimId);
    if (!profile) return null;
    return { ...profile };
  }

  async saveVictimProfile(profile: VictimProfile): Promise<void> {
    const now = new Date().toISOString();
    this.profiles.set(profile.victimId, {
      ...profile,
      updatedAt: now
    });
    if (!this.conversationVaults.has(profile.victimId)) {
      this.conversationVaults.set(profile.victimId, []);
    }
    if (!this.distressHistories.has(profile.victimId)) {
      this.distressHistories.set(profile.victimId, []);
    }
  }

  async listVictimProfiles(): Promise<VictimProfile[]> {
    return Array.from(this.profiles.values());
  }

  async getIsolatedConversations(victimId: string, limit = 50): Promise<IsolatedConversationTurn[]> {
    const vault = this.conversationVaults.get(victimId) || [];
    // Strict isolation: only returns records matching this victimId
    return vault.slice(-limit).map(t => ({ ...t }));
  }

  async appendIsolatedConversationTurn(turn: IsolatedConversationTurn): Promise<void> {
    let vault = this.conversationVaults.get(turn.victimId);
    if (!vault) {
      vault = [];
      this.conversationVaults.set(turn.victimId, vault);
    }
    vault.push({ ...turn });
    if (vault.length > 200) {
      vault.shift();
    }
  }

  async clearIsolatedConversations(victimId: string): Promise<void> {
    this.conversationVaults.set(victimId, []);
  }

  async getDistressHistory(victimId: string): Promise<DynamicDistressRecord[]> {
    const history = this.distressHistories.get(victimId) || [];
    return history.map(h => ({ ...h }));
  }

  async saveDistressRecord(record: DynamicDistressRecord): Promise<void> {
    let history = this.distressHistories.get(record.victimId);
    if (!history) {
      history = [];
      this.distressHistories.set(record.victimId, history);
    }
    history.push({ ...record });
    if (history.length > 100) {
      history.shift();
    }
  }

  async getAdapterMeta(): Promise<DatabaseAdapterMeta> {
    let totalTurns = 0;
    for (const v of this.conversationVaults.values()) {
      totalTurns += v.length;
    }
    const checkins = await getDatabaseAdapter().listCheckins(1000);

    return {
      name: 'Isolated In-Memory Victim Vault (Adapter Ready for External DB)',
      type: 'in_memory_transient',
      status: 'active',
      totalVictimsRegistered: this.profiles.size,
      totalIsolatedTurnsStored: totalTurns,
      totalCheckinsStored: checkins.length,
      description: 'Strict per-victim conversation vault and telemetry store. Ready to be replaced by your external database adapter.'
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
