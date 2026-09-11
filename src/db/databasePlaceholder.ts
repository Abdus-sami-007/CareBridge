import { VictimDbRecord, CheckinDbRecord, RiskLevel, OfficialDbRecord } from '../types';

/**
 * ============================================================================
 * DATABASE SCHEMAS: OFFICIALS, VICTIMS AND CHECKINS
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

  // Officials table operations
  getOfficialByUsername(username: string): Promise<OfficialDbRecord | null>;
  listOfficials(): Promise<OfficialDbRecord[]>;
  createOfficial(official: OfficialDbRecord, passwordHash: string): Promise<OfficialDbRecord>;

  // Victims table operations: victims (id, name, case_id, risk_level, latest_score)
  getVictim(id: string): Promise<VictimDbRecord | null>;
  upsertVictim(victim: VictimDbRecord): Promise<VictimDbRecord>;
  listVictims(): Promise<VictimDbRecord[]>;
  updateVictimScore(id: string, risk_level: RiskLevel | string, latest_score: number): Promise<void>;
  closeVictim(id: string, closedBy: string): Promise<VictimDbRecord | null>;
  getVictimByTelegramUsername?(username: string): Promise<VictimDbRecord | null>;

  // Checkins table operations: checkins (id, victim_id, message, score, risk_category, trigger_factors, created_at)
  insertCheckin(checkin: CheckinDbRecord): Promise<CheckinDbRecord>;
  getCheckinsForVictim(victim_id: string, limit?: number): Promise<CheckinDbRecord[]>;
  listCheckins(limit?: number): Promise<CheckinDbRecord[]>;
}

/** SQL operations used by the live Neon PostgreSQL adapter. */
export const NEON_REST_QUERY_EXAMPLES = {
  listVictims: 'SELECT id,name,case_id,risk_level,latest_score FROM victims ORDER BY latest_score DESC',
  getVictim: 'SELECT ... FROM victims WHERE id = $1 LIMIT 1',
  upsertVictim: 'INSERT INTO victims ... ON CONFLICT (id) DO UPDATE ...',
  updateVictimScore: 'UPDATE victims SET risk_level = $2, latest_score = $3 WHERE id = $1',
  listCheckins: 'SELECT ... FROM checkins ORDER BY created_at DESC LIMIT $1',
  listVictimCheckins: 'SELECT ... FROM checkins WHERE victim_id = $1 ORDER BY created_at DESC LIMIT $2',
  insertCheckin: 'INSERT INTO checkins (id,victim_id,message,score,risk_category,trigger_factors,created_at) VALUES (...)'
} as const;

/**
 * SQL DDL Placeholder Scripts for creating the tables in PostgreSQL, MySQL, or SQLite
 */
export const SQL_SCHEMA_PLACEHOLDER = `
-- ============================================================================
-- SQL DDL SCHEMA: victims and checkins
-- Supports PostgreSQL, MySQL, or SQLite
-- ============================================================================

CREATE TABLE IF NOT EXISTS officials (
  id VARCHAR(255) PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'sub_official',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS victims (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  case_id VARCHAR(255) NOT NULL,
  risk_level VARCHAR(50) NOT NULL DEFAULT 'Low',
  latest_score NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
  password_hash TEXT
);

CREATE TABLE IF NOT EXISTS checkins (
  id VARCHAR(255) PRIMARY KEY,
  victim_id VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  score NUMERIC(5, 2) NOT NULL,
  risk_category VARCHAR(50) NOT NULL,
  trigger_factors JSON NOT NULL DEFAULT ('[]'),
  ingestion_channel VARCHAR(50) NOT NULL DEFAULT 'victim_dashboard',
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
  baseline_distress_score Float
  doctor_initial_score Float
  doctor_name String
  doctor_notes String
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
 * Fallback adapter used only to fail closed when no external database is configured.
 * It never stores sample or transient application data.
 */
export class DatabasePlaceholderAdapter implements IDatabaseAdapter {
  public name = 'Database Not Configured';
  private connected = false;

  isConnected(): boolean { return false; }
  async connect(): Promise<void> { throw new Error('No database is configured. Set DATABASE_URL to a Neon PostgreSQL connection string.'); }
  async disconnect(): Promise<void> { this.connected = false; }
  private unavailable(): never { throw new Error('No database is configured. Set DATABASE_URL to a Neon PostgreSQL connection string.'); }
  async getOfficialByUsername(_username: string): Promise<OfficialDbRecord | null> { return this.unavailable(); }
  async listOfficials(): Promise<OfficialDbRecord[]> { return this.unavailable(); }
  async createOfficial(_official: OfficialDbRecord, _passwordHash: string): Promise<OfficialDbRecord> { return this.unavailable(); }
  async getVictim(_id: string): Promise<VictimDbRecord | null> { return this.unavailable(); }
  async upsertVictim(_victim: VictimDbRecord): Promise<VictimDbRecord> { return this.unavailable(); }
  async listVictims(): Promise<VictimDbRecord[]> { return this.unavailable(); }
  async updateVictimScore(_id: string, _risk_level: RiskLevel | string, _latest_score: number): Promise<void> { return this.unavailable(); }
  async insertCheckin(_checkin: CheckinDbRecord): Promise<CheckinDbRecord> { return this.unavailable(); }
  async getCheckinsForVictim(_victim_id: string, _limit = 50): Promise<CheckinDbRecord[]> { return this.unavailable(); }
  async listCheckins(_limit = 100): Promise<CheckinDbRecord[]> { return this.unavailable(); }
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
