import { VictimDbRecord, CheckinDbRecord, RiskLevel } from '../types';

/**
 * ============================================================================
 * DATABASE PLACEHOLDER FOR VICTIMS AND CHECKINS
 * ============================================================================
 * 
 * Victims Schema:
 *   - id: string
 *   - name: string
 *   - case_id: string
 *   - risk_level: 'Low' | 'Medium' | 'High' | 'Critical'
 *   - latest_score: number (0 - 100)
 * 
 * Checkins Schema:
 *   - id: string
 *   - victim_id: string (foreign key -> victims.id)
 *   - message: string
 *   - score: number (0 - 100)
 *   - risk_category: 'Low' | 'Medium' | 'High' | 'Critical'
 *   - trigger_factors: string[] (e.g. ['artillery_shelling', 'hyperarousal'])
 *   - created_at: string (ISO 8601 timestamp)
 * ============================================================================
 */

export interface IDatabaseAdapter {
  name: string;
  isConnected(): boolean;
  connect?(): Promise<void>;
  disconnect?(): Promise<void>;

  // Victims table operations: victims (id, name, case_id, risk_level, latest_score)
  getVictim(id: string): Promise<VictimDbRecord | null>;
  upsertVictim(victim: VictimDbRecord): Promise<VictimDbRecord>;
  listVictims(): Promise<VictimDbRecord[]>;
  updateVictimScore(id: string, risk_level: RiskLevel | string, latest_score: number): Promise<void>;

  // Checkins table operations: checkins (id, victim_id, message, score, risk_category, trigger_factors, created_at)
  insertCheckin(checkin: CheckinDbRecord): Promise<CheckinDbRecord>;
  getCheckinsForVictim(victim_id: string, limit?: number): Promise<CheckinDbRecord[]>;
  listCheckins(limit?: number): Promise<CheckinDbRecord[]>;
}

/** Exact PostgREST query formats used by NeonRestAdapter. */
export const NEON_REST_QUERY_EXAMPLES = {
  listVictims: 'GET /victims?select=id,name,case_id,risk_level,latest_score&order=latest_score.desc',
  getVictim: 'GET /victims?id=eq.{victimId}&select=id,name,case_id,risk_level,latest_score&limit=1',
  upsertVictim: 'POST /victims?on_conflict=id (Prefer: resolution=merge-duplicates,return=representation)',
  updateVictimScore: 'PATCH /victims?id=eq.{victimId} (body: { risk_level, latest_score })',
  listCheckins: 'GET /checkins?select=id,victim_id,message,score,risk_category,trigger_factors,created_at&order=created_at.desc&limit={limit}',
  listVictimCheckins: 'GET /checkins?victim_id=eq.{victimId}&select=id,victim_id,message,score,risk_category,trigger_factors,created_at&order=created_at.desc&limit={limit}',
  insertCheckin: 'POST /checkins (body: { id, victim_id, message, score, risk_category, trigger_factors, created_at })'
} as const;

/**
 * SQL DDL Placeholder Scripts for creating the tables in PostgreSQL, MySQL, or SQLite
 */
export const SQL_SCHEMA_PLACEHOLDER = `
-- ============================================================================
-- SQL DDL SCHEMA: victims and checkins
-- Supports PostgreSQL, MySQL, or SQLite
-- ============================================================================

CREATE TABLE IF NOT EXISTS victims (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  case_id VARCHAR(255) NOT NULL,
  risk_level VARCHAR(50) NOT NULL DEFAULT 'Low',
  latest_score NUMERIC(5, 2) NOT NULL DEFAULT 0.0
);

CREATE TABLE IF NOT EXISTS checkins (
  id VARCHAR(255) PRIMARY KEY,
  victim_id VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  score NUMERIC(5, 2) NOT NULL,
  risk_category VARCHAR(50) NOT NULL,
  trigger_factors JSON NOT NULL DEFAULT ('[]'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_victim FOREIGN KEY (victim_id) REFERENCES victims(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_checkins_victim_id ON checkins(victim_id);
CREATE INDEX IF NOT EXISTS idx_checkins_created_at ON checkins(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_victims_risk_level ON victims(risk_level);
`;

/**
 * MongoDB / Mongoose Schema Placeholder Definition
 */
export const MONGOOSE_SCHEMA_PLACEHOLDER = `
// ============================================================================
// MONGOOSE SCHEMA DEFINITION (MongoDB)
// ============================================================================

import mongoose, { Schema } from 'mongoose';

const VictimSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  case_id: { type: String, required: true, index: true },
  risk_level: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Low' },
  latest_score: { type: Number, required: true, default: 0 }
}, { timestamps: true });

const CheckinSchema = new Schema({
  id: { type: String, required: true, unique: true },
  victim_id: { type: String, required: true, ref: 'Victim', index: true },
  message: { type: String, required: true },
  score: { type: Number, required: true },
  risk_category: { type: String, required: true },
  trigger_factors: [{ type: String }],
  created_at: { type: Date, default: Date.now, index: true }
});

export const VictimModel = mongoose.model('Victim', VictimSchema);
export const CheckinModel = mongoose.model('Checkin', CheckinSchema);
`;

/**
 * Prisma Schema Placeholder Definition
 */
export const PRISMA_SCHEMA_PLACEHOLDER = `
// ============================================================================
// PRISMA SCHEMA DEFINITION (schema.prisma)
// ============================================================================

model Victim {
  id           String    @id
  name         String
  case_id      String
  risk_level   String
  latest_score Float
  checkins     Checkin[]

  @@map("victims")
}

model Checkin {
  id              String   @id
  victim_id       String
  message         String
  score           Float
  risk_category   String
  trigger_factors String[] // or Json in PostgreSQL
  created_at      DateTime @default(now())

  victim          Victim   @relation(fields: [victim_id], references: [id], onDelete: Cascade)

  @@index([victim_id])
  @@map("checkins")
}
`;

/**
 * Concrete Database Placeholder Adapter.
 * 
 * Provides an in-memory simulation for immediate development and testing,
 * while containing explicit placeholders and TODO comments for wiring up
 * PostgreSQL (pg / Knex / Drizzle), MongoDB, Firestore, or any SQL database.
 */
export class DatabasePlaceholderAdapter implements IDatabaseAdapter {
  public name = 'Placeholder Database Adapter (Ready for PostgreSQL/MongoDB/Firestore)';
  private connected = true;

  // In-memory backing stores for local execution until external database is connected
  private victimsStore = new Map<string, VictimDbRecord>();
  private checkinsStore = new Map<string, CheckinDbRecord[]>();

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    // Seed initial victims with the exact required schema:
    // (id, name, case_id, risk_level, latest_score)
    const initialVictims: VictimDbRecord[] = [
      {
        id: 'VIC-CONFLICT-701',
        name: 'Olena Shevchenko',
        case_id: 'CASE-UA-2026-044',
        risk_level: 'Medium',
        latest_score: 42
      },
      {
        id: 'VIC-DETENTION-802',
        name: 'Farid Al-Mansoor',
        case_id: 'CASE-SY-2026-118',
        risk_level: 'High',
        latest_score: 58
      },
      {
        id: 'VIC-BORDER-903',
        name: 'Marie Claire Diallo',
        case_id: 'CASE-CG-2026-892',
        risk_level: 'High',
        latest_score: 61
      }
    ];

    for (const v of initialVictims) {
      this.victimsStore.set(v.id, v);
      this.checkinsStore.set(v.id, [
        {
          id: `CHK-INIT-${v.id}`,
          victim_id: v.id,
          message: 'Intake wellness check-in completed during field registration.',
          score: v.latest_score,
          risk_category: v.risk_level,
          trigger_factors: ['displacement', 'intake_assessment'],
          created_at: new Date(Date.now() - 86400000).toISOString()
        }
      ]);
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  async connect(): Promise<void> {
    // ========================================================================
    // TODO: PLACEHOLDER FOR EXTERNAL DATABASE CONNECTION
    // Example (PostgreSQL):
    //   this.pgPool = new Pool({ connectionString: process.env.DATABASE_URL });
    //   await this.pgPool.query('SELECT 1');
    // Example (MongoDB):
    //   await mongoose.connect(process.env.MONGODB_URI);
    // ========================================================================
    this.connected = true;
    console.log('[DatabaseAdapter] Connected to Database Placeholder Adapter');
  }

  async disconnect(): Promise<void> {
    // TODO: Disconnect pool or client
    this.connected = false;
  }

  // ==========================================================================
  // VICTIMS TABLE: (id, name, case_id, risk_level, latest_score)
  // ==========================================================================

  async getVictim(id: string): Promise<VictimDbRecord | null> {
    // ========================================================================
    // TODO: SQL IMPLEMENTATION PLACEHOLDER:
    // const res = await pool.query('SELECT id, name, case_id, risk_level, latest_score FROM victims WHERE id = $1', [id]);
    // return res.rows[0] || null;
    // ========================================================================
    const victim = this.victimsStore.get(id);
    return victim ? { ...victim } : null;
  }

  async upsertVictim(victim: VictimDbRecord): Promise<VictimDbRecord> {
    // ========================================================================
    // TODO: SQL IMPLEMENTATION PLACEHOLDER:
    // const query = `
    //   INSERT INTO victims (id, name, case_id, risk_level, latest_score)
    //   VALUES ($1, $2, $3, $4, $5)
    //   ON CONFLICT (id) DO UPDATE SET
    //     name = EXCLUDED.name,
    //     case_id = EXCLUDED.case_id,
    //     risk_level = EXCLUDED.risk_level,
    //     latest_score = EXCLUDED.latest_score
    //   RETURNING *;
    // `;
    // const res = await pool.query(query, [victim.id, victim.name, victim.case_id, victim.risk_level, victim.latest_score]);
    // return res.rows[0];
    // ========================================================================
    this.victimsStore.set(victim.id, { ...victim });
    if (!this.checkinsStore.has(victim.id)) {
      this.checkinsStore.set(victim.id, []);
    }
    return { ...victim };
  }

  async listVictims(): Promise<VictimDbRecord[]> {
    // ========================================================================
    // TODO: SQL IMPLEMENTATION PLACEHOLDER:
    // const res = await pool.query('SELECT id, name, case_id, risk_level, latest_score FROM victims ORDER BY latest_score DESC');
    // return res.rows;
    // ========================================================================
    return Array.from(this.victimsStore.values()).map(v => ({ ...v }));
  }

  async updateVictimScore(id: string, risk_level: RiskLevel | string, latest_score: number): Promise<void> {
    // ========================================================================
    // TODO: SQL IMPLEMENTATION PLACEHOLDER:
    // await pool.query('UPDATE victims SET risk_level = $1, latest_score = $2 WHERE id = $3', [risk_level, latest_score, id]);
    // ========================================================================
    const victim = this.victimsStore.get(id);
    if (victim) {
      victim.risk_level = risk_level;
      victim.latest_score = latest_score;
      this.victimsStore.set(id, victim);
    }
  }

  // ==========================================================================
  // CHECKINS TABLE: (id, victim_id, message, score, risk_category, trigger_factors, created_at)
  // ==========================================================================

  async insertCheckin(checkin: CheckinDbRecord): Promise<CheckinDbRecord> {
    // ========================================================================
    // TODO: SQL IMPLEMENTATION PLACEHOLDER:
    // const query = `
    //   INSERT INTO checkins (id, victim_id, message, score, risk_category, trigger_factors, created_at)
    //   VALUES ($1, $2, $3, $4, $5, $6, $7)
    //   RETURNING *;
    // `;
    // const res = await pool.query(query, [
    //   checkin.id, checkin.victim_id, checkin.message, checkin.score,
    //   checkin.risk_category, JSON.stringify(checkin.trigger_factors), checkin.created_at
    // ]);
    // return res.rows[0];
    // ========================================================================
    let list = this.checkinsStore.get(checkin.victim_id);
    if (!list) {
      list = [];
      this.checkinsStore.set(checkin.victim_id, list);
    }
    list.unshift({ ...checkin });
    return { ...checkin };
  }

  async getCheckinsForVictim(victim_id: string, limit = 50): Promise<CheckinDbRecord[]> {
    // ========================================================================
    // TODO: SQL IMPLEMENTATION PLACEHOLDER:
    // const res = await pool.query(
    //   'SELECT id, victim_id, message, score, risk_category, trigger_factors, created_at FROM checkins WHERE victim_id = $1 ORDER BY created_at DESC LIMIT $2',
    //   [victim_id, limit]
    // );
    // return res.rows;
    // ========================================================================
    const list = this.checkinsStore.get(victim_id) || [];
    return list.slice(0, limit).map(c => ({ ...c }));
  }

  async listCheckins(limit = 100): Promise<CheckinDbRecord[]> {
    // ========================================================================
    // TODO: SQL IMPLEMENTATION PLACEHOLDER:
    // const res = await pool.query(
    //   'SELECT id, victim_id, message, score, risk_category, trigger_factors, created_at FROM checkins ORDER BY created_at DESC LIMIT $1',
    //   [limit]
    // );
    // return res.rows;
    // ========================================================================
    const all: CheckinDbRecord[] = [];
    for (const list of this.checkinsStore.values()) {
      all.push(...list);
    }
    all.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return all.slice(0, limit);
  }
}

// Global placeholder singleton
let activeDatabaseAdapter: IDatabaseAdapter = new DatabasePlaceholderAdapter();

export function getDatabaseAdapter(): IDatabaseAdapter {
  return activeDatabaseAdapter;
}

export function setDatabaseAdapter(adapter: IDatabaseAdapter): void {
  activeDatabaseAdapter = adapter;
  console.log('[DatabaseAdapter] Active adapter updated to:', adapter.name);
}
