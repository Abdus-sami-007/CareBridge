import React, { useEffect, useState } from 'react';
import {
  OfficialsDashboardPayload,
  IngestionChannel
} from '../types';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Shield,
  PhoneCall,
  MessageCircle,
  Send,
  Mic,
  LayoutDashboard,
  Copy,
  Check,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface OfficialsDashboardViewProps {
  records: OfficialsDashboardPayload[];
  onRefresh: () => void;
  isLoading: boolean;
}

export const OfficialsDashboardView: React.FC<OfficialsDashboardViewProps> = ({
  records,
  onRefresh,
  isLoading
}) => {
  const [selectedRecord, setSelectedRecord] = useState<OfficialsDashboardPayload | null>(records[0] || null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSelectedRecord(records[0] || null);
  }, [records]);

  // Computed metrics
  const criticalCount = records.filter(r => r.triagePriority === 'CRITICAL_RED').length;
  const amberCount = records.filter(r => r.triagePriority === 'ELEVATED_AMBER').length;
  const yellowCount = records.filter(r => r.triagePriority === 'MONITOR_YELLOW').length;
  const greenCount = records.filter(r => r.triagePriority === 'STABLE_GREEN').length;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(records, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPriorityBadge = (priority: OfficialsDashboardPayload['triagePriority']) => {
    switch (priority) {
      case 'CRITICAL_RED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
            <AlertOctagon className="w-3 h-3 text-rose-600" />
            <span>CRITICAL RED</span>
          </span>
        );
      case 'ELEVATED_AMBER':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-700" />
            <span>ELEVATED AMBER</span>
          </span>
        );
      case 'MONITOR_YELLOW':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-yellow-100 text-yellow-900 border border-yellow-200">
            <Clock className="w-3 h-3 text-yellow-700" />
            <span>MONITOR YELLOW</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>STABLE GREEN</span>
          </span>
        );
    }
  };

  const getChannelIcon = (ch: IngestionChannel) => {
    switch (ch) {
      case 'whatsapp':
        return <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />;
      case 'telegram':
        return <Send className="w-3.5 h-3.5 text-sky-600" />;
      case 'ivr':
        return <PhoneCall className="w-3.5 h-3.5 text-amber-600" />;
      case 'speech':
        return <Mic className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <LayoutDashboard className="w-3.5 h-3.5 text-indigo-600" />;
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner with Triage Summary & Endpoint Details */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-semibold">
                REST Endpoint: GET /api/dashboards/officials
              </span>
              <span className="text-xs text-stone-500 font-mono">Live Clinician &amp; Responders Feed</span>
            </div>
            <h3 className="text-base font-semibold text-stone-900 mt-1">
              Officials &amp; Authorities Triage Dashboard
            </h3>
            <p className="text-xs text-stone-500">
              Real-time sanitized triage cases from multi-channel inputs (WhatsApp, Telegram, IVR, Speech, Web)
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyJson}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Officials JSON' : 'Export Officials Feed (JSON)'}</span>
            </button>
          </div>
        </div>

        {/* Triage Priority Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
            <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">Critical Red</div>
            <div className="text-2xl font-bold text-rose-900 mt-0.5">{criticalCount}</div>
            <div className="text-[11px] text-rose-600 mt-1">Immediate Crisis Dispatch</div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
            <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">Elevated Amber</div>
            <div className="text-2xl font-bold text-amber-900 mt-0.5">{amberCount}</div>
            <div className="text-[11px] text-amber-700 mt-1">Caseworker 2h Outreach</div>
          </div>

          <div className="p-3.5 rounded-xl bg-yellow-50 border border-yellow-200">
            <div className="text-[11px] font-semibold text-yellow-800 uppercase tracking-wider">Monitor Yellow</div>
            <div className="text-2xl font-bold text-yellow-900 mt-0.5">{yellowCount}</div>
            <div className="text-[11px] text-yellow-700 mt-1">Scheduled Trauma Care</div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Stable Green</div>
            <div className="text-2xl font-bold text-emerald-900 mt-0.5">{greenCount}</div>
            <div className="text-[11px] text-emerald-700 mt-1">Self-Care &amp; Community</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Triage Queue Table & Selected Case Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Triage Case List (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider">
              Ingested Atrocity Cases ({records.length})
            </h4>
            <span className="text-[11px] text-stone-500 font-mono">Sorted by Priority &amp; Time</span>
          </div>

          <div className="divide-y divide-stone-200 max-h-[600px] overflow-y-auto">
            {records.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500">
                No processed cases are available yet. Submit a real check-in through the pipeline to populate this queue.
              </div>
            ) : records.map((rec) => {
              const isSelected = selectedRecord?.recordId === rec.recordId;
              return (
                <div
                  key={rec.recordId}
                  onClick={() => setSelectedRecord(rec)}
                  className={`p-4 cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                    isSelected ? 'bg-stone-100/90 border-l-4 border-stone-900' : 'hover:bg-stone-50'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {getPriorityBadge(rec.triagePriority)}
                      <span className="inline-flex items-center space-x-1 text-[11px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
                        {getChannelIcon(rec.ingestionChannel)}
                        <span className="uppercase">{rec.ingestionChannel}</span>
                      </span>
                      <span className="text-xs font-mono font-semibold text-stone-800 truncate">
                        {rec.victimId}
                      </span>
                    </div>

                    <div className="text-xs font-medium text-stone-900">
                      {rec.atrocityType}
                    </div>

                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      "{rec.sanitizedNarrative}"
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-stone-500">
                      <span>Severity: <strong>{rec.traumaSeverityScore}/100</strong></span>
                      <span>Distress: <strong>{rec.distressPredictionScore}/100</strong></span>
                      <span>Redacted: <strong>{rec.redactedTokensCount} PII</strong></span>
                      <span>{new Date(rec.ingestedAt).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <ChevronRight className={`w-4 h-4 mt-2 shrink-0 ${isSelected ? 'text-stone-900' : 'text-stone-400'}`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Detailed Case Inspection & Action Protocol (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
          {selectedRecord ? (
            <>
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">
                    Detailed Case Protocol
                  </span>
                  <h4 className="text-sm font-bold text-stone-900 mt-0.5 flex items-center gap-2">
                    <span>{selectedRecord.victimId}</span>
                    {getPriorityBadge(selectedRecord.triagePriority)}
                  </h4>
                </div>
                <span className="text-xs font-mono text-stone-500">{selectedRecord.recordId}</span>
              </div>

              {/* Recommended Official Protocol */}
              <div className="p-3.5 rounded-xl bg-stone-900 text-white space-y-1.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                  Official Action Directive
                </div>
                <div className="text-xs leading-relaxed font-medium">
                  {selectedRecord.recommendedOfficialProtocol}
                </div>
                <div className="text-[11px] text-stone-400 pt-1 flex items-center justify-between">
                  <span>Assigned: {selectedRecord.assignedAgency}</span>
                  <span className="text-emerald-400">Escalation: {selectedRecord.escalationRisk}</span>
                </div>
              </div>

              {/* Scores Grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="text-[10px] uppercase tracking-wider text-stone-500">Trauma Severity</div>
                  <div className="text-lg font-bold text-stone-900 mt-0.5">
                    {selectedRecord.traumaSeverityScore}
                    <span className="text-xs font-normal text-stone-400">/100</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="text-[10px] uppercase tracking-wider text-stone-500">Distress Predict</div>
                  <div className="text-lg font-bold text-stone-900 mt-0.5">
                    {selectedRecord.distressPredictionScore}
                    <span className="text-xs font-normal text-stone-400">/100</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="text-[10px] uppercase tracking-wider text-stone-500">Resilience Index</div>
                  <div className="text-lg font-bold text-emerald-700 mt-0.5">
                    {selectedRecord.resilienceScore}
                    <span className="text-xs font-normal text-stone-400">/100</span>
                  </div>
                </div>
              </div>

              {/* Sanitized Narrative */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
                  <span>Sanitized Evidence Narrative</span>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {selectedRecord.redactedTokensCount} Identifiers Protected
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 leading-relaxed font-sans max-h-40 overflow-y-auto">
                  {selectedRecord.sanitizedNarrative}
                </div>
              </div>

              {/* Audit Timeline */}
              <div className="space-y-2 pt-1 border-t border-stone-100">
                <div className="text-xs font-semibold text-stone-700">Audit &amp; Processing Trail</div>
                <div className="space-y-1.5 text-xs">
                  {selectedRecord.timeline.map((item, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-[11px] text-stone-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-stone-400 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <span className="font-medium text-stone-800">{item.action}</span>
                        <div className="text-stone-400 font-mono text-[10px]">
                          {item.actor} &bull; {new Date(item.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-stone-400">
              Select a triage record to inspect action protocols
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
