import React, { useState } from 'react';
import { Code2, Copy, Check, Terminal, ExternalLink, Database, Shield } from 'lucide-react';

export const PipelineApiDocs: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const endpoints = [
    {
      title: '1. Execute Backend Pipeline (Core Engine Flow)',
      method: 'POST',
      path: '/api/pipeline/process',
      description: 'Executes the complete pipeline: Ingestion -> AI Engine (NLP+Emotion+Voice) -> Dynamic Distress Score -> Trend & Prediction -> Risk Classification (Low/Med Monitoring vs High/Critical Alert & Human Intervention). Enforces strict victim isolation.',
      curl: `curl -X POST http://localhost:3000/api/pipeline/process \\
  -H "Content-Type: application/json" \\
  -d '{
    "victimId": "YOUR_VICTIM_ID",
    "modality": "text",
    "checkType": "periodic_check",
    "input": "Artillery shelling restarted near our temporary shelter. My hands won'\''t stop shaking and I feel terrified they will target our warehouse.",
    "channel": "victim_dashboard"
  }'`,
      response: `{
  "executionId": "EXEC-M7K2...",
  "victimId": "YOUR_VICTIM_ID",
  "pipelineStageResults": {
    "aiEngineAnalysis": {
      "emotionAnalysis": { "primaryEmotion": "Terror / Acute Panic", "arousalLevel": 88 },
      "evalSource": "gemini-3.8-flash"
    },
    "dynamicDistressScore": { "score": 82, "level": "Acute / Critical" },
    "trendAndPrediction": {
      "deltaPrevious": 18,
      "trendDirection": "accelerating_distress",
      "predictedTrajectory": "acute_spike_expected"
    },
    "riskClassification": {
      "branch": "High/Critical",
      "pathway": "Alert",
      "alertDetails": {
        "humanIntervention": {
          "urgency": "Immediate (within 15 mins)",
          "assignedUnit": "Mobile Crisis Response & Protection Unit"
        }
      }
    }
  }
}`
    },
    {
      title: '2. Automated Periodic Check Ingestion',
      method: 'POST',
      path: '/api/pipeline/periodic-check',
      description: 'Triggers the scheduled or automated periodic check node in the flowchart for a specific isolated victim.',
      curl: `curl -X POST http://localhost:3000/api/pipeline/periodic-check \\
  -H "Content-Type: application/json" \\
  -d '{
    "victimId": "YOUR_VICTIM_ID",
    "checkPrompt": "Scheduled 48h wellness check: Please share how you are managing stress today.",
    "simulatedResponse": "Doing slightly better today after meeting the legal advisor. Slept 6 hours.",
    "modality": "text"
  }'`
    },
    {
      title: '3. Fetch Isolated Conversations (Zero Bleed)',
      method: 'GET',
      path: '/api/pipeline/victims/:victimId/conversations',
      description: 'Fetches strictly isolated historical conversation turns for the specified victim from the database vault.',
      curl: `curl -s http://localhost:3000/api/pipeline/victims/{victimId}/conversations`
    },
    {
      title: '4. Fetch Victim Profile from Database',
      method: 'GET',
      path: '/api/pipeline/victims/:victimId',
      description: 'Fetches the isolated victim profile, trauma background, caseworker allocation, and baseline metrics from the database.',
      curl: `curl -s http://localhost:3000/api/pipeline/victims/{victimId}`
    },
    {
      title: '5. Dynamic Distress Score History & Trend',
      method: 'GET',
      path: '/api/pipeline/victims/:victimId/trend',
      description: 'Retrieves the historical distress score data points exclusively for this victim to evaluate trend trajectory.',
      curl: `curl -s http://localhost:3000/api/pipeline/victims/{victimId}/trend`
    },
    {
      title: '6. Register New Victim in Database',
      method: 'POST',
      path: '/api/pipeline/victims',
      description: 'Registers a new isolated victim record in the database.',
      curl: `curl -X POST http://localhost:3000/api/pipeline/victims \\
  -H "Content-Type: application/json" \\
  -d '{
    "victimId": "<VICTIM_ID_FROM_DATABASE>",
    "pseudonym": "<VICTIM_NAME_FROM_DATABASE>",
    "traumaContext": "Civilian displacement from flood and conflict zone",
    "baselineDistressScore": 48,
    "assignedAgency": "Humanitarian Protection Casework"
  }'`
    },
    {
      title: '7. Database Adapter Health & Extension Hook',
      method: 'GET',
      path: '/api/pipeline/database-status',
      description: 'Inspects current database adapter status and extension readiness for external database integration in the next iteration.',
      curl: `curl -s http://localhost:3000/api/pipeline/database-status`
    },
    {
      title: '8. Query Victims Database: (id, name, case_id, risk_level, latest_score)',
      method: 'GET',
      path: '/api/database/victims',
      description: 'Fetches all registered victims with their latest dynamic distress score and risk level from the database.',
      curl: `curl -s http://localhost:3000/api/database/victims`
    },
    {
      title: '9. Create / Update Victim in Database',
      method: 'POST',
      path: '/api/database/victims',
      description: 'Creates or updates a victim in the database matching schema: (id, name, case_id, risk_level, latest_score).',
      curl: `curl -X POST http://localhost:3000/api/database/victims \\
  -H "Content-Type: application/json" \\
  -d '{
    "id": "YOUR_VICTIM_ID",
    "name": "Database victim name",
    "case_id": "CASE-UA-2026-044",
    "risk_level": "High",
    "latest_score": 78
  }'`
    },
    {
      title: '10. Query Checkins: (id, victim_id, message, score, risk_category, trigger_factors, created_at)',
      method: 'GET',
      path: '/api/database/checkins?victim_id=:victimId',
      description: 'Retrieves all persisted check-ins for a victim, ordered chronologically by created_at.',
      curl: `curl -s "http://localhost:3000/api/database/checkins?victim_id={victimId}"`
    },
    {
      title: '11. Record Manual Check-in to Database',
      method: 'POST',
      path: '/api/database/checkins',
      description: 'Records a new check-in and automatically updates the victim latest_score and risk_level.',
      curl: `curl -X POST http://localhost:3000/api/database/checkins \\
  -H "Content-Type: application/json" \\
  -d '{
    "victim_id": "{victimId}",
    "message": "Heavy artillery barrage started again. Need immediate grounding support.",
    "score": 85,
    "risk_category": "Critical",
    "trigger_factors": ["artillery_shelling", "panic_attack"]
  }'`
    },
    {
      title: '12. Fetch SQL DDL & NoSQL Schemas',
      method: 'GET',
      path: '/api/database/schemas',
      description: 'Returns ready-to-run SQL DDL for PostgreSQL/MySQL/SQLite and Mongoose/Prisma schemas.',
      curl: `curl -s http://localhost:3000/api/database/schemas`
    }
  ];

  return (
    <div className="space-y-4 font-sans text-stone-200">
      <div className="rounded-xl border border-stone-800 bg-stone-900/90 p-4 text-xs space-y-2">
        <div className="flex items-center space-x-2 font-semibold text-stone-100 text-sm">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>Backend Pipeline REST &amp; Webhook Integration Endpoints</span>
        </div>
        <p className="text-stone-400 text-xs leading-relaxed">
          As a headless backend pipeline module, external bots (WhatsApp, Telegram, Web portals, IVR hotlines) and microservices can communicate directly with these endpoints. All victim conversations are strictly isolated per victim ID, and victim details are pulled from the database abstraction layer.
        </p>
      </div>

      <div className="space-y-3">
        {endpoints.map((ep, idx) => (
          <div key={idx} className="rounded-xl border border-stone-800 bg-stone-950 p-4 space-y-2.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                  ep.method === 'POST' ? 'bg-emerald-950 border border-emerald-700 text-emerald-300' : 'bg-sky-950 border border-sky-700 text-sky-300'
                }`}>
                  {ep.method}
                </span>
                <code className="font-mono text-stone-100 font-semibold">{ep.path}</code>
              </div>
              <span className="text-[11px] text-stone-400 font-medium">{ep.title}</span>
            </div>

            <p className="text-[11px] text-stone-400 leading-relaxed">
              {ep.description}
            </p>

            {/* cURL Command */}
            <div className="relative rounded-lg bg-stone-900 border border-stone-800 p-2.5 font-mono text-[11px] text-emerald-300/90 overflow-x-auto">
              <button
                onClick={() => copyToClipboard(ep.curl, idx)}
                className="absolute top-2 right-2 p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-all cursor-pointer"
                title="Copy cURL"
              >
                {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <pre className="pr-8">{ep.curl}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
