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
  latest_score NUMERIC(5, 2) NOT NULL DEFAULT 0.0, -- 0.0 to 100.0
  password_hash TEXT
);
```

For an existing Neon database, run this migration once:
```sql
ALTER TABLE victims ADD COLUMN IF NOT EXISTS password_hash TEXT;
```

CareBridge never stores victim passwords in plaintext. Officials assign a password when creating a victim record; the server stores a scrypt hash and validates the victim's ID, name, and password before opening the Victim Dashboard.

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
  victimId: process.env.VICTIM_ID!,
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
- `GET /api/database/connection-test` — Verifies the active adapter can read the `victims` table.
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

### Neon PostgreSQL

CareBridge uses the Neon PostgreSQL connection string directly through the server-side `DATABASE_URL`. The connection is never exposed to the browser.

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to your Neon PostgreSQL connection string.
3. Start the app with `npm run dev`.
4. On startup, CareBridge connects to Neon and creates/updates the required `victims` and `checkins` tables automatically.
5. Verify the connection from the Officials Dashboard or `GET /api/database/connection-test`.

The pipeline only accepts a `victimId` that already exists in `victims`. It never invents a victim, creates an anonymous record, or stores runtime records in memory.

### Telegram Check-in Bot

The Telegram worker starts **automatically when the CareBridge server starts**. You no longer need a second terminal or separate process.

1. Install Node and Python 3.
2. Install dependencies with `npm install` and `pip install -r requirements.txt`.
3. Set `BOT_TOKEN` in `.env`.
4. Start CareBridge with `npm run dev` (development) or `npm run build && npm start` (production).
5. The server starts `checkin_bot.py` automatically after the HTTP server is listening.

The bot uses `CAREBRIDGE_API_URL` to send text and voice check-ins back to the same CareBridge API. By default this is `http://127.0.0.1:<PORT>`. `BOT_ENABLED=false` disables automatic startup. `PYTHON_BIN` can be set when the deployment environment uses a custom Python executable.

For voice notes, also set `OPENAI_API_KEY`; text Telegram check-ins do not require it.

### Deployment with Docker

The included `Dockerfile` packages Node.js, Python 3, the Telegram dependencies, and the web application into one deployable service. The Telegram bot runs as a child process of the web server.

```bash
docker build -t carebridge .
docker run --env-file .env -p 3000:3000 carebridge
```

Or with Docker Compose:

```bash
docker compose up -d --build
```

Set `DATABASE_URL`, `GEMINI_API_KEY`, and `BOT_TOKEN` as deployment secrets/environment variables. Do not commit `.env`.

## Real database setup

CareBridge intentionally does not seed demo victims, generate anonymous pipeline victims, or fall back to an in-memory runtime store. The Victim Dashboard opens directly to the database-backed check-in assistant on startup; a real registered victim must authenticate before submitting a check-in.

1. Set `DATABASE_URL` to your Neon PostgreSQL connection string.
2. Set `GEMINI_API_KEY` if you want Gemini scoring; the deterministic trauma rule engine remains available when Gemini is not configured.
3. Start the app. The server connects to Neon and provisions the required tables automatically.
4. Register a real victim through the Officials Dashboard.
5. Authenticate as that victim. The chatbot loads persisted check-ins from Neon, and every new message follows the pipeline: **Victim → Periodic/Direct Check → Text/Voice/Events → AI Engine → Dynamic Distress Score → Trend + Prediction → Risk Classification → Monitoring OR Alert → Human Intervention → Follow-up & Recovery**.

There are no pre-populated victim names, IDs, scores, or check-ins in the application runtime.

## Longitudinal analysis and clinical baseline

CareBridge now keeps a clinician-provided baseline separate from the latest dynamic distress score. The `victims` table contains `baseline_distress_score`, `doctor_initial_score`, `doctor_name`, and `doctor_notes`; check-in scores remain in `checkins` and are never used to overwrite the clinician baseline.

The victim analysis endpoint is `GET /api/analysis/victim/:victimId`. It compares the clinician baseline with the victim's historical check-ins, computes average/latest score and direction, and is displayed in the victim dashboard and the selected case view for officials.

Only Admin can view the official-account list or create sub-official accounts. Sub-officials do not receive the account-management UI and the API also rejects their requests.

## Production deployment

CareBridge is designed to run as a single long-lived service so the HTTP API and Telegram polling worker share the same deployment. Use a platform that supports persistent Node/Python processes (for example a container service or VM). Do not deploy the Telegram polling worker as a serverless function.

Required production environment variables:
- `DATABASE_URL`
- `GEMINI_API_KEY` (recommended)
- `BOT_TOKEN`
- `BOT_ENABLED=true`

The server exposes the normal application on port `PORT` (default `3000`).


### Existing Neon database migration
If the existing `checkins.id` column was created as an integer, run `database/003_checkin_id_telegram_identity.sql` once. New CareBridge installs perform the compatibility migration automatically on startup.

For Telegram, add the victim's Telegram username (without `@`) to the victim record. The bot verifies the actual Telegram account username against this database mapping before accepting `/start`, text, or voice check-ins.
