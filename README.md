# CareBridge

> **AI-Powered Dynamic Mental Health Monitoring and Distress Prediction Engine for Victims of Atrocities**

CareBridge is an end-to-end multi-channel trauma-informed ingestion, sanitization, and distress prediction engine designed to support survivors and provide synchronized clinical intelligence to humanitarian aid officials.

---

## Architecture Overview

CareBridge operates with dual data feeds and a strict per-victim isolated vault:
1. **Victim Dashboard**: Confidential, trauma-safe interface for survivor check-ins, grounding exercises, and support requests.
2. **Officials & Clinicians Dashboard**: High-level triage overview, dynamic distress velocity metrics, early warning indicators, and caseworker alerts.
3. **Multi-Channel Ingestion**: Integrates text and audio check-ins across Web, WhatsApp, Telegram, IVR hotlines, and field trigger events.
4. **Trauma-Informed NLP & Emotion Pipeline**: Automatically categorizes trauma contexts, scrubs sensitive PII/tokens, and computes dynamic distress scores (0–100).
5. **Strict Per-Victim Isolation**: Zero cross-victim conversation bleed; isolated history vaults protect survivor confidentiality.

---

## Database Schema

CareBridge abstracts data persistence into explicit, normalized schemas:

### 1. `victims` Table
Represents registered survivors under active monitoring.
```sql
CREATE TABLE IF NOT EXISTS victims (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  case_id VARCHAR(255) NOT NULL,
  risk_level VARCHAR(50) NOT NULL DEFAULT 'Low', -- 'Low' | 'Medium' | 'High' | 'Critical'
  latest_score NUMERIC(5, 2) NOT NULL DEFAULT 0.0 -- 0.0 to 100.0
);
```

### 2. `checkins` Table
Stores chronological check-in interactions and distress evaluations.
```sql
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
```

---

## Standalone Module Export (`src/module.ts`)

CareBridge can be integrated directly as a TypeScript/Node.js library:

```typescript
import {
  processVictimCheckin,
  getVictimWithCheckins,
  registerOrUpdateVictim,
  recordVictimCheckin,
  setDatabaseAdapter,
  type IDatabaseAdapter
} from './src/module';

// Run check-in through NLP + Distress Prediction Engine
const result = await processVictimCheckin({
  victimId: 'VIC-CONFLICT-701',
  modality: 'text',
  checkType: 'periodic_check',
  input: 'Artillery shelling resumed nearby. Severe anxiety.',
  channel: 'whatsapp'
});

console.log(result.pipelineStageResults.dynamicDistressScore);
```

---

## API Endpoints

### Pipeline & Ingestion
- `POST /api/pipeline/process` — Ingests a trauma disclosure from any channel and computes dynamic distress score.
- `GET /api/pipeline/victims` — Lists monitored victims.
- `GET /api/pipeline/victims/:id` — Fetches victim profile and baseline data.
- `GET /api/pipeline/victims/:id/conversations` — Retrieves isolated conversation turns.
- `GET /api/pipeline/victims/:id/trend` — Retrieves longitudinal distress trajectory.

### Database Operations
- `GET /api/database/victims` — Fetches all victims in the database.
- `POST /api/database/victims` — Creates/updates a victim record (`id, name, case_id, risk_level, latest_score`).
- `GET /api/database/checkins` — Queries check-ins (filter with `?victim_id=...`).
- `POST /api/database/checkins` — Logs a check-in and auto-syncs the victim's latest score.
- `GET /api/database/schemas` — Returns SQL DDL, Mongoose, and Prisma schema definitions.

---

## Getting Started

### 1. Installation
```bash
npm install
```

### 2. Development Mode
```bash
npm run dev
```
The application will start on `http://localhost:3000`.

### 3. Production Build
```bash
npm run build
npm start
```

---

## Updating the Database

### Neon REST API

The app can connect to the supplied Neon PostgREST endpoint through the server-side `NeonRestAdapter`.

1. Copy `.env.example` to `.env`.
2. Set `NEON_API_URL` to your Neon REST endpoint and `NEON_API_KEY` to the Neon Data API key. `NEON_DATABASE_URL` remains supported as a legacy alias.
3. Ensure the `victims` and `checkins` tables use the schemas above.
4. Start the app with `npm run dev`.

When either Neon environment variable is configured, the server uses Neon for the `victims` and `checkins` tables. Without them, it keeps the local in-memory adapter so the demo still runs. The API key is never sent to the browser.

To connect another external database (PostgreSQL, MongoDB, or Firestore), implement `IDatabaseAdapter` and register it with `setDatabaseAdapter`.
