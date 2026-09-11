import { Pool } from 'pg';
import { CheckinDbRecord, RiskLevel, VictimDbRecord, OfficialDbRecord } from '../types';
import type { IDatabaseAdapter } from './databasePlaceholder';

/**
 * Real PostgreSQL adapter for Neon using the DATABASE_URL connection string.
 * All application records are persisted in Neon; there is no in-memory data store.
 */
export class NeonPostgresAdapter implements IDatabaseAdapter {
  public readonly name = 'Neon PostgreSQL';
  private readonly pool: Pool;
  private connected = false;

  constructor(private readonly connectionString: string) {
    if (!connectionString) throw new Error('DATABASE_URL is required.');
    this.pool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl: { rejectUnauthorized: false }
    });
  }

  isConnected(): boolean {
    return this.connected;
  }

  async connect(): Promise<void> {
    await this.pool.query('SELECT 1');
    await this.ensureSchema();
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    await this.pool.end();
  }


  async getOfficialByUsername(username: string): Promise<(OfficialDbRecord & { password_hash: string }) | null> {
    const result = await this.pool.query<any>(
      `SELECT id, username, display_name, role, active, created_at, password_hash
       FROM officials WHERE LOWER(username) = LOWER($1) LIMIT 1`,
      [username]
    );
    return result.rows[0] || null;
  }

  async listOfficials(): Promise<OfficialDbRecord[]> {
    const result = await this.pool.query<any>(
      `SELECT id, username, display_name, role, active, created_at
       FROM officials ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END, username ASC`
    );
    return result.rows;
  }

  async createOfficial(official: OfficialDbRecord, passwordHash: string): Promise<OfficialDbRecord> {
    const result = await this.pool.query<any>(
      `INSERT INTO officials (id, username, display_name, role, active, password_hash, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, username, display_name, role, active, created_at`,
      [official.id, official.username, official.display_name, official.role, official.active, passwordHash, official.created_at]
    );
    return result.rows[0];
  }

  async setOfficialPassword(username: string, passwordHash: string): Promise<void> {
    await this.pool.query(
      `UPDATE officials SET password_hash = $2, active = TRUE WHERE LOWER(username) = LOWER($1)`,
      [username, passwordHash]
    );
  }

  async getVictim(id: string): Promise<VictimDbRecord | null> {
    const result = await this.pool.query<any>(
      `SELECT id, name, case_id, risk_level, latest_score, password_hash, baseline_distress_score, doctor_initial_score, doctor_name, doctor_notes, telegram_username, closed, closed_at, closed_by
       FROM victims WHERE id = $1 LIMIT 1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async getVictimByTelegramUsername(username: string): Promise<VictimDbRecord | null> {
    const normalized = username.replace(/^@/, '').trim().toLowerCase();
    if (!normalized) return null;
    const result = await this.pool.query<any>(
      `SELECT id, name, case_id, risk_level, latest_score, password_hash, baseline_distress_score, doctor_initial_score, doctor_name, doctor_notes, telegram_username, closed, closed_at, closed_by
       FROM victims WHERE LOWER(REPLACE(COALESCE(telegram_username, ''), '@', '')) = $1 AND COALESCE(closed, FALSE) = FALSE LIMIT 1`,
      [normalized]
    );
    return result.rows[0] || null;
  }

  async upsertVictim(victim: VictimDbRecord): Promise<VictimDbRecord> {
    const result = await this.pool.query<any>(
      `INSERT INTO victims (id, name, case_id, risk_level, latest_score, password_hash, baseline_distress_score, doctor_initial_score, doctor_name, doctor_notes, telegram_username, closed, closed_at, closed_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         case_id = EXCLUDED.case_id,
         risk_level = EXCLUDED.risk_level,
         latest_score = EXCLUDED.latest_score,
         password_hash = COALESCE(EXCLUDED.password_hash, victims.password_hash),
         baseline_distress_score = COALESCE(EXCLUDED.baseline_distress_score, victims.baseline_distress_score),
         doctor_initial_score = COALESCE(EXCLUDED.doctor_initial_score, victims.doctor_initial_score),
         doctor_name = COALESCE(EXCLUDED.doctor_name, victims.doctor_name),
         doctor_notes = COALESCE(EXCLUDED.doctor_notes, victims.doctor_notes),
         telegram_username = COALESCE(EXCLUDED.telegram_username, victims.telegram_username),
         closed = COALESCE(EXCLUDED.closed, victims.closed),
         closed_at = COALESCE(EXCLUDED.closed_at, victims.closed_at),
         closed_by = COALESCE(EXCLUDED.closed_by, victims.closed_by)
       RETURNING id, name, case_id, risk_level, latest_score, password_hash, baseline_distress_score, doctor_initial_score, doctor_name, doctor_notes, telegram_username, closed, closed_at, closed_by`,
      [victim.id, victim.name, victim.case_id, victim.risk_level, victim.latest_score, victim.password_hash || null, victim.baseline_distress_score ?? victim.latest_score, victim.doctor_initial_score ?? null, victim.doctor_name ?? null, victim.doctor_notes ?? null, victim.telegram_username ?? null, victim.closed ?? false, victim.closed_at ?? null, victim.closed_by ?? null]
    );
    return result.rows[0] || victim;
  }

  async listVictims(): Promise<VictimDbRecord[]> {
    const result = await this.pool.query<any>(
      `SELECT id, name, case_id, risk_level, latest_score, baseline_distress_score, doctor_initial_score, doctor_name, doctor_notes, telegram_username, closed, closed_at, closed_by
       FROM victims ORDER BY latest_score DESC, id ASC`
    );
    return result.rows;
  }

  async closeVictim(id: string, closedBy: string): Promise<VictimDbRecord | null> {
    const result = await this.pool.query<any>(
      `UPDATE victims SET closed = TRUE, closed_at = CURRENT_TIMESTAMP, closed_by = $2 WHERE id = $1 RETURNING id, name, case_id, risk_level, latest_score, baseline_distress_score, doctor_initial_score, doctor_name, doctor_notes, closed, closed_at, closed_by`,
      [id, closedBy]
    );
    return result.rows[0] || null;
  }

  async updateVictimScore(id: string, risk_level: RiskLevel | string, latest_score: number): Promise<void> {
    await this.pool.query(
      `UPDATE victims SET risk_level = $2, latest_score = $3 WHERE id = $1`,
      [id, risk_level, latest_score]
    );
  }

  async insertCheckin(checkin: CheckinDbRecord): Promise<CheckinDbRecord> {
    const result = await this.pool.query<any>(
      `INSERT INTO checkins
         (id, victim_id, message, score, risk_category, trigger_factors, created_at, ingestion_channel)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::timestamptz, $8)
       RETURNING id, victim_id, message, score, risk_category, trigger_factors, created_at`,
      [
        checkin.id,
        checkin.victim_id,
        checkin.message,
        checkin.score,
        checkin.risk_category,
        JSON.stringify(checkin.trigger_factors || []),
        checkin.created_at,
        checkin.ingestion_channel || 'victim_dashboard'
      ]
    );
    return result.rows[0] || checkin;
  }

  async getCheckinsForVictim(victimId: string, limit = 50): Promise<CheckinDbRecord[]> {
    const result = await this.pool.query<any>(
      `SELECT id, victim_id, message, score, risk_category, trigger_factors, created_at, ingestion_channel
       FROM checkins WHERE victim_id = $1
       ORDER BY created_at DESC LIMIT $2`,
      [victimId, Math.max(1, Math.min(limit, 500))]
    );
    return result.rows;
  }

  async listCheckins(limit = 100): Promise<CheckinDbRecord[]> {
    const result = await this.pool.query<any>(
      `SELECT c.id, c.victim_id, c.message, c.score, c.risk_category, c.trigger_factors, c.created_at, c.ingestion_channel
       FROM checkins c JOIN victims v ON v.id = c.victim_id
       WHERE COALESCE(v.closed, FALSE) = FALSE
       ORDER BY c.created_at DESC LIMIT $1`,
      [Math.max(1, Math.min(limit, 1000))]
    );
    return result.rows;
  }

  private async ensureSchema(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS officials (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        display_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'sub_official',
        active BOOLEAN NOT NULL DEFAULT TRUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_officials_role ON officials(role);

      CREATE TABLE IF NOT EXISTS victims (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        case_id VARCHAR(255) NOT NULL,
        risk_level VARCHAR(50) NOT NULL DEFAULT 'Low',
        latest_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
        baseline_distress_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
        doctor_initial_score NUMERIC(5, 2),
        doctor_name VARCHAR(255),
        doctor_notes TEXT,
        telegram_username VARCHAR(255),
        closed BOOLEAN NOT NULL DEFAULT FALSE,
        closed_at TIMESTAMPTZ,
        closed_by VARCHAR(255),
        password_hash TEXT
      );

      CREATE TABLE IF NOT EXISTS checkins (
        id VARCHAR(255) PRIMARY KEY,
        victim_id VARCHAR(255) NOT NULL REFERENCES victims(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        score NUMERIC(5, 2) NOT NULL,
        risk_category VARCHAR(50) NOT NULL,
        trigger_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ingestion_channel VARCHAR(50) NOT NULL DEFAULT 'victim_dashboard'
      );

      -- Normalize legacy schemas before recreating the victim/check-in foreign key.
      -- Older CareBridge databases used INTEGER ids; the application uses string ids
      -- (for example V001 and CHK-*), so the two sides must be migrated together.
      ALTER TABLE checkins DROP CONSTRAINT IF EXISTS checkins_victim_id_fkey;
      ALTER TABLE checkins DROP CONSTRAINT IF EXISTS fk_victim;
      ALTER TABLE victims ALTER COLUMN id TYPE VARCHAR(255) USING id::text;
      ALTER TABLE checkins ALTER COLUMN victim_id TYPE VARCHAR(255) USING victim_id::text;
      ALTER TABLE checkins ALTER COLUMN id DROP DEFAULT;
      ALTER TABLE checkins ALTER COLUMN id TYPE VARCHAR(255) USING id::text;

      ALTER TABLE victims ADD COLUMN IF NOT EXISTS password_hash TEXT;
      ALTER TABLE victims ADD COLUMN IF NOT EXISTS baseline_distress_score NUMERIC(5,2) NOT NULL DEFAULT 0;
      ALTER TABLE victims ADD COLUMN IF NOT EXISTS doctor_initial_score NUMERIC(5,2);
      ALTER TABLE victims ADD COLUMN IF NOT EXISTS doctor_name VARCHAR(255);
      ALTER TABLE victims ADD COLUMN IF NOT EXISTS doctor_notes TEXT;
      ALTER TABLE victims ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(255);
      ALTER TABLE victims ADD COLUMN IF NOT EXISTS closed BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE victims ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
      ALTER TABLE victims ADD COLUMN IF NOT EXISTS closed_by VARCHAR(255);
      ALTER TABLE checkins ALTER COLUMN trigger_factors TYPE JSONB USING trigger_factors::jsonb;
      ALTER TABLE checkins ADD CONSTRAINT checkins_victim_id_fkey
        FOREIGN KEY (victim_id) REFERENCES victims(id) ON DELETE CASCADE;
      ALTER TABLE checkins ADD COLUMN IF NOT EXISTS ingestion_channel VARCHAR(50) NOT NULL DEFAULT 'victim_dashboard';

      CREATE UNIQUE INDEX IF NOT EXISTS idx_victims_telegram_username ON victims ((LOWER(REPLACE(telegram_username, '@', ''))) ) WHERE telegram_username IS NOT NULL;
      CREATE INDEX IF NOT EXISTS idx_checkins_victim_id ON checkins(victim_id);
      CREATE INDEX IF NOT EXISTS idx_checkins_created_at ON checkins(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_victims_risk_level ON victims(risk_level);
    `);
  }
}

export function getDatabaseUrl(): string {
  return process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || '';
}

export function isNeonPostgresConfigured(): boolean {
  const url = getDatabaseUrl();
  return Boolean(url && /^postgres(?:ql)?:\/\//i.test(url));
}
