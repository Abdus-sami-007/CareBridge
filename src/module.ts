/**
 * ============================================================================
 * AI-POWERED DYNAMIC MENTAL HEALTH MONITORING AND DISTRESS PREDICTION MODULE
 * FOR VICTIMS OF ATROCITIES
 * ============================================================================
 * 
 * Standalone Backend Pipeline Module
 * Provides dual data feeds for Victim Dashboard and Officials Dashboard.
 * Ingests from Victim Dashboard, Chatbots (Telegram/WhatsApp), Speech/IVR, and Events.
 * Keeps conversation vaults strictly isolated per victim.
 * 
 * Database Schemas Supported & Abstracted:
 *   1. victims (id, name, case_id, risk_level, latest_score)
 *   2. checkins (id, victim_id, message, score, risk_category, trigger_factors, created_at)
 * 
 * Ready for external database integration (PostgreSQL, MongoDB, SQLite, Firestore, etc.).
 * ============================================================================
 */

// 1. Export all domain types and schemas
export * from './types';

// 2. Export Core Pipeline Engine
export { executeBackendPipeline } from './lib/pipelineEngine';

// 3. Export Trauma Sanitization and NLP Filter
export { runTraumaFilter } from './lib/traumaFilter';

// 4. Export Isolated Victim Database Vault and Adapter Interfaces
export {
  getVictimDatabase,
  setVictimDatabaseAdapter,
  InMemoryVictimDatabase,
  type IVictimDatabase,
  type DatabaseAdapterMeta
} from './lib/victimDatabase';

// 5. Export Explicit Database Placeholders, Schemas, and Adapters
export {
  getDatabaseAdapter,
  setDatabaseAdapter,
  DatabasePlaceholderAdapter,
  SQL_SCHEMA_PLACEHOLDER,
  MONGOOSE_SCHEMA_PLACEHOLDER,
  PRISMA_SCHEMA_PLACEHOLDER,
  NEON_REST_QUERY_EXAMPLES,
  type IDatabaseAdapter
} from './db/databasePlaceholder';

// ============================================================================
// CONVENIENCE MODULE APIS
// ============================================================================

import { executeBackendPipeline } from './lib/pipelineEngine';
import { getVictimDatabase } from './lib/victimDatabase';
import { getDatabaseAdapter } from './db/databasePlaceholder';
import {
  PipelineProcessPayload,
  PipelineExecutionResult,
  VictimDbRecord,
  CheckinDbRecord,
  RiskLevel
} from './types';

/**
 * Convenience helper: Processes a check-in input from any channel
 * (Victim Dashboard, Telegram, WhatsApp, IVR audio transcript, or trigger event)
 * and persists the updated score and check-in to the database.
 */
export async function processVictimCheckin(
  payload: PipelineProcessPayload
): Promise<PipelineExecutionResult> {
  return executeBackendPipeline(payload);
}

/**
 * Convenience helper: Retrieve a victim along with their complete check-in history.
 */
export async function getVictimWithCheckins(victimId: string): Promise<{
  victim: VictimDbRecord | null;
  checkins: CheckinDbRecord[];
}> {
  const db = getDatabaseAdapter();
  const victim = await db.getVictim(victimId);
  const checkins = await db.getCheckinsForVictim(victimId, 100);
  return { victim, checkins };
}

/**
 * Convenience helper: Manually register or update a victim record:
 * victims (id, name, case_id, risk_level, latest_score)
 */
export async function registerOrUpdateVictim(
  record: VictimDbRecord
): Promise<VictimDbRecord> {
  const db = getDatabaseAdapter();
  return db.upsertVictim(record);
}

/**
 * Convenience helper: Manually record a check-in:
 * checkins (id, victim_id, message, score, risk_category, trigger_factors, created_at)
 */
export async function recordVictimCheckin(
  checkin: CheckinDbRecord
): Promise<CheckinDbRecord> {
  const db = getDatabaseAdapter();
  return db.insertCheckin(checkin);
}
