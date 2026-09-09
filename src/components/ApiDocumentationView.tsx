import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Server,
  Terminal,
  Layers,
  Send,
  MessageCircle,
  PhoneCall,
  Mic,
  LayoutDashboard
} from 'lucide-react';

interface EndpointSpec {
  method: 'POST' | 'GET';
  path: string;
  title: string;
  category: 'Ingestion Channel' | 'Dashboard Feed' | 'System';
  description: string;
  icon: React.ReactNode;
  requestBody?: string;
  responsePayload: string;
  curlExample: string;
}

const ENDPOINTS: EndpointSpec[] = [
  {
    method: 'GET',
    path: '/api/dashboards/officials',
    title: 'Officials & Authorities Triage Feed',
    category: 'Dashboard Feed',
    description: 'Supplies real-time triage queue, clinical severity metrics (0-100), escalation risks, and recommended official protocols to the Officials Dashboard.',
    icon: <Server className="w-4 h-4 text-sky-600" />,
    responsePayload: `{
  "totalMonitoredVictims": 4,
  "criticalRedCount": 1,
  "elevatedAmberCount": 2,
  "monitorYellowCount": 1,
  "stableGreenCount": 0,
  "byChannel": {
    "victim_dashboard": 1,
    "whatsapp": 1,
    "telegram": 1,
    "ivr": 1,
    "speech": 0
  },
  "records": [
    {
      "recordId": "REC-M58Z9L-8A2K",
      "victimId": "VIC-WA-1029",
      "ingestionChannel": "whatsapp",
      "triagePriority": "CRITICAL_RED",
      "atrocityType": "Armed Conflict, Shelling & Aerial Bombardment",
      "traumaSeverityScore": 88,
      "distressPredictionScore": 92,
      "resilienceScore": 34,
      "escalationRisk": "Immediate Crisis",
      "sanitizedNarrative": "Heavy artillery hit our apartment block at [LOCATION REDACTED]. My mother Mrs. [NAME REDACTED] is bleeding...",
      "redactedTokensCount": 4,
      "recommendedOfficialProtocol": "IMMEDIATE ESCALATION: Dispatch Mobile Crisis Response Unit...",
      "assignedAgency": "Emergency Crisis Team & Protective Services"
    }
  ]
}`,
    curlExample: `curl -X GET https://your-domain.com/api/dashboards/officials`
  },
  {
    method: 'GET',
    path: '/api/dashboards/victim/:victimId',
    title: 'Victim Sanctuary Dashboard Feed',
    category: 'Dashboard Feed',
    description: 'Supplies reassuring, non-pathologizing emotional status, grounding exercises, caseworker contacts, and privacy validation to the Victim Dashboard.',
    icon: <LayoutDashboard className="w-4 h-4 text-emerald-600" />,
    responsePayload: `{
  "victimId": "VIC-WA-1029",
  "status": "Needs Attention",
  "compassionateGreeting": "Welcome back. You are in a safe, secure space. Your well-being and privacy are completely protected.",
  "plainTextDistressLevel": "Intense Overwhelm",
  "supportiveInsights": [
    "Your emotional reactions are natural adaptations to profound adversity.",
    "Privacy Protection: 4 personal identifiers were masked before any processing."
  ],
  "dailyGroundingExercises": [
    "5-4-3-2-1 Sensory Grounding: Acknowledge 5 things you can see, 4 you can touch...",
    "Box Breathing: Inhale slowly for 4 counts, hold for 4 counts..."
  ],
  "privacyConfirmation": "All personal identifiers and location markers have been cryptographically sanitized.",
  "allocatedSupportWorker": "Assigned Caseworker: Sarah T. (Trauma Care Coordinator)",
  "crisisContacts": [
    { "name": "Emergency Lifeline (24/7)", "contact": "988" }
  ]
}`,
    curlExample: `curl -X GET https://your-domain.com/api/dashboards/victim/VIC-WA-1029`
  },
  {
    method: 'POST',
    path: '/api/ingest/whatsapp',
    title: 'WhatsApp Chatbot Webhook',
    category: 'Ingestion Channel',
    description: 'Ingests disclosures from WhatsApp Business messaging bots, sanitizes PII, runs AI distress prediction, and queues for dashboard distribution.',
    icon: <MessageCircle className="w-4 h-4 text-emerald-600" />,
    requestBody: `{
  "from": "+380675541029",
  "body": "Heavy artillery hit our apartment block at 34 Riverfront Way. My mother Mrs. Irina Romanova is bleeding...",
  "messageId": "wamid_99410"
}`,
    responsePayload: `{
  "success": true,
  "replyToVictim": "Welcome back. You are in a safe space... Help is on the way.",
  "officialsTriagePriority": "CRITICAL_RED",
  "recordId": "REC-M58Z9L-8A2K"
}`,
    curlExample: `curl -X POST https://your-domain.com/api/ingest/whatsapp \\
  -H "Content-Type: application/json" \\
  -d '{"from": "+380675541029", "body": "Shelling hit our shelter..."}'`
  },
  {
    method: 'POST',
    path: '/api/ingest/telegram',
    title: 'Telegram Bot Webhook',
    category: 'Ingestion Channel',
    description: 'Ingests encrypted Telegram bot SOS updates from conflict survivors or detention witnesses.',
    icon: <Send className="w-4 h-4 text-sky-600" />,
    requestBody: `{
  "message": {
    "from": { "id": 84920194, "username": "freedom_seeker" },
    "text": "I was released yesterday after 3 weeks in solitary confinement..."
  }
}`,
    responsePayload: `{
  "success": true,
  "replyToVictim": "Your message was securely received. Your location and identity are anonymized.",
  "officialsTriagePriority": "ELEVATED_AMBER",
  "recordId": "REC-X91KA-772L"
}`,
    curlExample: `curl -X POST https://your-domain.com/api/ingest/telegram \\
  -H "Content-Type: application/json" \\
  -d '{"text": "Telegram bot distress update...", "from": {"id": 12345}}'`
  },
  {
    method: 'POST',
    path: '/api/ingest/ivr',
    title: 'IVR Telephony Audio Transcript Ingestion',
    category: 'Ingestion Channel',
    description: 'Ingests automated voice response transcripts, DTMF keypad distress inputs, and caller metadata from telephone hotlines.',
    icon: <PhoneCall className="w-4 h-4 text-amber-600" />,
    requestBody: `{
  "callerNumber": "+491519988221",
  "audioTranscript": "Automated Call Transcript: I am stranded at border post 4 near the river crossing...",
  "dtmfDistressRating": 9,
  "durationSeconds": 215
}`,
    responsePayload: `{
  "success": true,
  "audioGuidanceSummary": "Calming breathing and instructions played to caller.",
  "officialsTriagePriority": "CRITICAL_RED",
  "recordId": "REC-L74KP-091N"
}`,
    curlExample: `curl -X POST https://your-domain.com/api/ingest/ivr \\
  -H "Content-Type: application/json" \\
  -d '{"callerNumber": "+18005550199", "audioTranscript": "Border checkpoint distress..."}'`
  },
  {
    method: 'POST',
    path: '/api/ingest/speech',
    title: 'Speech Audio & Voice Recording Ingestion',
    category: 'Ingestion Channel',
    description: 'Ingests transcribed field audio notes and mobile medical unit voice recordings from survivors of atrocities.',
    icon: <Mic className="w-4 h-4 text-rose-600" />,
    requestBody: `{
  "victimId": "VIC-VOICE-8812",
  "transcript": "During the raid on our village, extremists set fire to our center...",
  "audioQuality": "16kHz Single-channel",
  "durationSeconds": 88
}`,
    responsePayload: `{
  "success": true,
  "victimDashboardData": { ... },
  "officialsDashboardData": { ... },
  "recordId": "REC-K99PQ-118B"
}`,
    curlExample: `curl -X POST https://your-domain.com/api/ingest/speech \\
  -H "Content-Type: application/json" \\
  -d '{"victimId": "VIC-VOICE-01", "transcript": "Field audio recording..."}'`
  }
];

export const ApiDocumentationView: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointSpec>(ENDPOINTS[0]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-stone-900 text-stone-100 font-semibold">
              REST &amp; Webhook API Specification
            </span>
            <span className="text-xs text-stone-500 font-mono">Module Integration Contracts</span>
          </div>
          <h3 className="text-base font-semibold text-stone-900 mt-1">
            System Integration Endpoints (Ingest &amp; Dashboard Feeds)
          </h3>
          <p className="text-xs text-stone-500">
            Use these live endpoints to connect WhatsApp/Telegram chatbots, IVR telephony, Speech engines, and the Victim &amp; Officials Dashboards
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Endpoint List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 shadow-xs divide-y divide-stone-100 overflow-hidden">
          <div className="p-3.5 bg-stone-50/70 text-xs font-semibold text-stone-700 uppercase tracking-wider">
            Available Endpoints ({ENDPOINTS.length})
          </div>
          <div className="divide-y divide-stone-100 max-h-[600px] overflow-y-auto">
            {ENDPOINTS.map((ep) => {
              const isSelected = selectedEndpoint.path === ep.path;
              return (
                <div
                  key={ep.path}
                  onClick={() => setSelectedEndpoint(ep)}
                  className={`p-3.5 cursor-pointer transition-colors ${
                    isSelected ? 'bg-stone-100 border-l-4 border-stone-900' : 'hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-stone-900 flex items-center gap-1.5 truncate">
                      {ep.icon}
                      <span>{ep.title}</span>
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      ep.method === 'GET' ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {ep.method}
                    </span>
                  </div>

                  <div className="font-mono text-[11px] text-stone-600 mt-1 truncate">
                    {ep.path}
                  </div>

                  <div className="text-[10px] text-stone-400 mt-1">
                    {ep.category}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Endpoint Deep Dive & Sample Code (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
          <div className="border-b border-stone-100 pb-3">
            <div className="flex items-center space-x-2">
              <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded ${
                selectedEndpoint.method === 'GET' ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {selectedEndpoint.method}
              </span>
              <span className="font-mono text-sm font-semibold text-stone-900">
                {selectedEndpoint.path}
              </span>
            </div>
            <h4 className="text-xs text-stone-600 mt-1">
              {selectedEndpoint.description}
            </h4>
          </div>

          {/* cURL Example */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-stone-600" />
                cURL Integration Command
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(selectedEndpoint.curlExample, 'curl')}
                className="text-[11px] text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
              >
                {copiedCode === 'curl' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode === 'curl' ? 'Copied' : 'Copy cURL'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-stone-900 text-stone-200 text-xs font-mono overflow-x-auto leading-relaxed">
              {selectedEndpoint.curlExample}
            </pre>
          </div>

          {/* Request Body (if POST) */}
          {selectedEndpoint.requestBody && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
                <span>Request Payload (JSON)</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(selectedEndpoint.requestBody!, 'req')}
                  className="text-[11px] text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
                >
                  {copiedCode === 'req' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode === 'req' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-stone-900 text-emerald-400 text-xs font-mono overflow-x-auto leading-relaxed max-h-48">
                {selectedEndpoint.requestBody}
              </pre>
            </div>
          )}

          {/* Response Payload */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
              <span>Response Payload Delivered to Dashboard (JSON)</span>
              <button
                type="button"
                onClick={() => copyToClipboard(selectedEndpoint.responsePayload, 'res')}
                className="text-[11px] text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer"
              >
                {copiedCode === 'res' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCode === 'res' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-stone-900 text-sky-300 text-xs font-mono overflow-x-auto leading-relaxed max-h-56">
              {selectedEndpoint.responsePayload}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
