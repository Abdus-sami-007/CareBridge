import React, { useEffect, useState } from 'react';
import { TranslatedText } from './TranslatedText';
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
  ChevronRight,
  BarChart3,
  Users,
  Activity,
  ShieldAlert,
  TrendingUp,
  XCircle
} from 'lucide-react';

interface OfficialsDashboardViewProps {
  records: OfficialsDashboardPayload[];
  onRefresh: () => void;
  isLoading: boolean;
  authToken?: string;
}

export const OfficialsDashboardView: React.FC<OfficialsDashboardViewProps> = ({
  records,
  onRefresh,
  isLoading,
  authToken
}) => {
  const [selectedRecord, setSelectedRecord] = useState<OfficialsDashboardPayload | null>(records[0] || null);
  const [copied, setCopied] = useState(false);
  const [caseAnalysis, setCaseAnalysis] = useState<any>(null);

  useEffect(() => {
    setSelectedRecord(records[0] || null);
  }, [records]);

  useEffect(() => {
    let cancelled = false;
    if (!selectedRecord?.victimId) { setCaseAnalysis(null); return; }
    fetch(`/api/analysis/victim/${encodeURIComponent(selectedRecord.victimId)}`)
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Unable to load case analysis'); return d; })
      .then(d => { if (!cancelled) setCaseAnalysis(d); })
      .catch(() => { if (!cancelled) setCaseAnalysis(null); });
    return () => { cancelled = true; };
  }, [selectedRecord?.victimId, selectedRecord?.recordId]);

  // Computed metrics
  const criticalCount = records.filter(r => r.triagePriority === 'CRITICAL_RED').length;
  const amberCount = records.filter(r => r.triagePriority === 'ELEVATED_AMBER').length;
  const yellowCount = records.filter(r => r.triagePriority === 'MONITOR_YELLOW').length;
  const greenCount = records.filter(r => r.triagePriority === 'STABLE_GREEN').length;
  const monitoredVictims = new Set(records.map(r => r.victimId)).size;
  const averageDistress = records.length ? Math.round(records.reduce((sum, r) => sum + Number(r.distressPredictionScore || 0), 0) / records.length) : 0;
  const highRiskShare = records.length ? Math.round(((criticalCount + amberCount) / records.length) * 100) : 0;
  const sortedRecent = [...records].sort((a, b) => new Date(b.ingestedAt).getTime() - new Date(a.ingestedAt).getTime()).slice(0, 8).reverse();

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
            <span><TranslatedText>CRITICAL RED</TranslatedText></span>
          </span>
        );
      case 'ELEVATED_AMBER':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-700" />
            <span><TranslatedText>ELEVATED AMBER</TranslatedText></span>
          </span>
        );
      case 'MONITOR_YELLOW':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-yellow-100 text-yellow-900 border border-yellow-200">
            <Clock className="w-3 h-3 text-yellow-700" />
            <span><TranslatedText>MONITOR YELLOW</TranslatedText></span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span><TranslatedText>STABLE GREEN</TranslatedText></span>
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
              <span className="text-xs text-stone-500 font-mono"><TranslatedText>Live Clinician & Responders Feed</TranslatedText></span>
            </div>
            <h3 className="text-base font-semibold text-stone-900 mt-1">
              <TranslatedText>Officials & Authorities Triage Dashboard</TranslatedText>
            </h3>
            <p className="text-xs text-stone-500">
              <TranslatedText>Real-time sanitized triage cases from multi-channel inputs (WhatsApp, Telegram, IVR, Speech, Web)</TranslatedText>
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyJson}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span><TranslatedText>{copied ? 'Copied Officials JSON' : 'Export Officials Feed (JSON)'}</TranslatedText></span>
            </button>
          </div>
        </div>

        {/* Analysis & operational statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-3.5">
            <div className="flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-wider text-sky-700"><TranslatedText>Monitored victims</TranslatedText></span><Users className="h-4 w-4 text-sky-600" /></div>
            <div className="mt-1 text-2xl font-bold text-sky-950">{monitoredVictims}</div>
            <div className="text-[10px] text-sky-700"><TranslatedText>Unique database cases</TranslatedText></div>
          </div>
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3.5">
            <div className="flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-700"><TranslatedText>Avg distress</TranslatedText></span><Activity className="h-4 w-4 text-indigo-600" /></div>
            <div className="mt-1 text-2xl font-bold text-indigo-950">{averageDistress}<span className="text-xs font-normal">/100</span></div>
            <div className="text-[10px] text-indigo-700"><TranslatedText>Across stored check-ins</TranslatedText></div>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5">
            <div className="flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-wider text-rose-700"><TranslatedText>Priority cases</TranslatedText></span><ShieldAlert className="h-4 w-4 text-rose-600" /></div>
            <div className="mt-1 text-2xl font-bold text-rose-950">{highRiskShare}%</div>
            <div className="text-[10px] text-rose-700"><TranslatedText>High + critical check-ins</TranslatedText></div>
          </div>
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-3.5">
            <div className="flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-wider text-stone-600"><TranslatedText>Stored assessments</TranslatedText></span><BarChart3 className="h-4 w-4 text-stone-600" /></div>
            <div className="mt-1 text-2xl font-bold text-stone-900">{records.length}</div>
            <div className="text-[10px] text-stone-600"><TranslatedText>Real PostgreSQL check-ins</TranslatedText></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
            <div className="mb-3 flex items-center justify-between"><div><h4 className="text-xs font-semibold text-stone-900"><TranslatedText>Risk distribution</TranslatedText></h4><p className="text-[10px] text-stone-500"><TranslatedText>Current database check-in classification</TranslatedText></p></div><BarChart3 className="h-4 w-4 text-stone-500" /></div>
            {[['Critical', criticalCount, records.length ? criticalCount / records.length : 0, 'bg-rose-500'], ['High', amberCount, records.length ? amberCount / records.length : 0, 'bg-amber-500'], ['Medium', yellowCount, records.length ? yellowCount / records.length : 0, 'bg-yellow-500'], ['Low', greenCount, records.length ? greenCount / records.length : 0, 'bg-emerald-500']].map(([label, count, ratio, bar]) => (
              <div key={String(label)} className="mb-2 last:mb-0">
                <div className="mb-1 flex justify-between text-[10px] text-stone-600"><span><TranslatedText>{String(label)}</TranslatedText></span><span className="font-mono font-semibold">{count}</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-stone-200"><div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.max(Number(ratio) * 100, count ? 3 : 0)}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
            <div className="mb-3 flex items-center justify-between"><div><h4 className="text-xs font-semibold text-stone-900"><TranslatedText>Recent distress analysis</TranslatedText></h4><p className="text-[10px] text-stone-500"><TranslatedText>Latest stored assessments, oldest → newest</TranslatedText></p></div><TrendingUp className="h-4 w-4 text-stone-500" /></div>
            {sortedRecent.length ? (
              <div className="flex h-28 items-end gap-2">
                {sortedRecent.map((record, index) => { const value = Math.max(0, Math.min(100, Number(record.distressPredictionScore || 0))); return <div key={`${record.recordId}-${index}`} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1" title={`${record.victimId}: ${value}/100`}>
                  <span className="text-[9px] font-mono text-stone-500">{value}</span>
                  <div className="w-full max-w-7 rounded-t-md bg-emerald-500" style={{ height: `${Math.max(value, 5)}%` }} />
                  <span className="max-w-full truncate text-[9px] font-mono text-stone-500">{record.victimId}</span>
                </div> })}
              </div>
            ) : <div className="flex h-28 items-center justify-center text-xs text-stone-400"><TranslatedText>No database assessments yet.</TranslatedText></div>}
          </div>
        </div>

        {/* Triage Priority Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200">
            <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider"><TranslatedText>Critical Red</TranslatedText></div>
            <div className="text-2xl font-bold text-rose-900 mt-0.5">{criticalCount}</div>
            <div className="text-[11px] text-rose-600 mt-1"><TranslatedText>Immediate Crisis Dispatch</TranslatedText></div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
            <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider"><TranslatedText>Elevated Amber</TranslatedText></div>
            <div className="text-2xl font-bold text-amber-900 mt-0.5">{amberCount}</div>
            <div className="text-[11px] text-amber-700 mt-1"><TranslatedText>Caseworker 2h Outreach</TranslatedText></div>
          </div>

          <div className="p-3.5 rounded-xl bg-yellow-50 border border-yellow-200">
            <div className="text-[11px] font-semibold text-yellow-800 uppercase tracking-wider"><TranslatedText>Monitor Yellow</TranslatedText></div>
            <div className="text-2xl font-bold text-yellow-900 mt-0.5">{yellowCount}</div>
            <div className="text-[11px] text-yellow-700 mt-1"><TranslatedText>Scheduled Trauma Care</TranslatedText></div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider"><TranslatedText>Stable Green</TranslatedText></div>
            <div className="text-2xl font-bold text-emerald-900 mt-0.5">{greenCount}</div>
            <div className="text-[11px] text-emerald-700 mt-1"><TranslatedText>Self-Care & Community</TranslatedText></div>
          </div>
        </div>
      </div>

      {/* Main Grid: Triage Queue Table & Selected Case Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Triage Case List (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider">
              <TranslatedText>Ingested Atrocity Cases</TranslatedText> ({records.length})
            </h4>
            <span className="text-[11px] text-stone-500 font-mono"><TranslatedText>Sorted by Priority & Time</TranslatedText></span>
          </div>

          <div className="divide-y divide-stone-200 max-h-[600px] overflow-y-auto">
            {records.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500">
                <TranslatedText>No processed cases are available yet. Submit a real check-in through the pipeline to populate this queue.</TranslatedText>
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
                      <TranslatedText>{rec.atrocityType}</TranslatedText>
                    </div>

                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      "<TranslatedText>{rec.sanitizedNarrative}</TranslatedText>"
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-stone-500">
                      <span><TranslatedText>Severity</TranslatedText>: <strong>{rec.traumaSeverityScore}/100</strong></span>
                      <span><TranslatedText>Distress</TranslatedText>: <strong>{rec.distressPredictionScore}/100</strong></span>
                      <span><TranslatedText>Redacted</TranslatedText>: <strong>{rec.redactedTokensCount} <TranslatedText>PII</TranslatedText></strong></span>
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
                    <TranslatedText>Detailed Case Protocol</TranslatedText>
                  </span>
                  <h4 className="text-sm font-bold text-stone-900 mt-0.5 flex items-center gap-2">
                    <span>{selectedRecord.victimId}</span>
                    {getPriorityBadge(selectedRecord.triagePriority)}
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-stone-500">{selectedRecord.recordId}</span>
                  <button
                    type="button"
                    disabled={!authToken}
                    onClick={async () => {
                      if (!authToken) return;
                      if (!window.confirm(`Close case ${selectedRecord.victimId}? It will be removed from the active officials dashboard.`)) return;
                      const response = await fetch(`/api/database/victims/${encodeURIComponent(selectedRecord.victimId)}/close`, { method: 'POST', headers: { Authorization: `Bearer ${authToken}` } });
                      const data = await response.json();
                      if (!response.ok) { window.alert(data.error || 'Unable to close case.'); return; }
                      setSelectedRecord(null);
                      setCaseAnalysis(null);
                      onRefresh();
                    }}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                    title="Close case"
                  >
                    <XCircle className="h-3.5 w-3.5" /> <TranslatedText>Close case</TranslatedText>
                  </button>
                </div>
              </div>

              {caseAnalysis && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3.5 space-y-3">
                  <div className="flex items-center justify-between"><div><div className="text-[10px] font-semibold uppercase tracking-wider text-indigo-700"><TranslatedText>Longitudinal case analysis</TranslatedText></div><div className="text-[10px] text-stone-500"><TranslatedText>Doctor baseline compared with this victim's saved check-ins</TranslatedText></div></div><span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-indigo-700"><TranslatedText>{caseAnalysis.summary.direction}</TranslatedText></span></div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="rounded-lg bg-white p-2"><div className="text-[9px] text-stone-500"><TranslatedText>Baseline</TranslatedText></div><div className="text-sm font-bold">{caseAnalysis.summary.baselineScore ?? caseAnalysis.victim.baseline_distress_score}</div></div>
                    <div className="rounded-lg bg-white p-2"><div className="text-[9px] text-stone-500"><TranslatedText>Latest</TranslatedText></div><div className="text-sm font-bold">{caseAnalysis.summary.latestScore}</div></div>
                    <div className="rounded-lg bg-white p-2"><div className="text-[9px] text-stone-500"><TranslatedText>Average</TranslatedText></div><div className="text-sm font-bold">{caseAnalysis.summary.averageScore}</div></div>
                    <div className="rounded-lg bg-white p-2"><div className="text-[9px] text-stone-500"><TranslatedText>Check-ins</TranslatedText></div><div className="text-sm font-bold">{caseAnalysis.summary.checkinCount}</div></div>
                  </div>
                  <div className="flex h-20 items-end gap-1">{caseAnalysis.history.slice(-10).map((h:any)=><div key={h.id} className="flex-1 h-full flex items-end" title={`${h.score}/100`}><div className="w-full rounded-t bg-indigo-500" style={{height:`${Math.max(5, Number(h.score))}%`}} /></div>)}</div>
                </div>
              )}

              {/* Recommended Official Protocol */}
              <div className="p-3.5 rounded-xl bg-stone-900 text-white space-y-1.5">
                <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                  <TranslatedText>Official Action Directive</TranslatedText>
                </div>
                <div className="text-xs leading-relaxed font-medium">
                  <TranslatedText>{selectedRecord.recommendedOfficialProtocol}</TranslatedText>
                </div>
                <div className="text-[11px] text-stone-400 pt-1 flex items-center justify-between">
                  <span><TranslatedText>Assigned</TranslatedText>: <TranslatedText>{selectedRecord.assignedAgency}</TranslatedText></span>
                  <span className="text-emerald-400"><TranslatedText>Escalation</TranslatedText>: <TranslatedText>{selectedRecord.escalationRisk}</TranslatedText></span>
                </div>
              </div>

              {/* Scores Grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="text-[10px] uppercase tracking-wider text-stone-500"><TranslatedText>Trauma Severity</TranslatedText></div>
                  <div className="text-lg font-bold text-stone-900 mt-0.5">
                    {selectedRecord.traumaSeverityScore}
                    <span className="text-xs font-normal text-stone-400">/100</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="text-[10px] uppercase tracking-wider text-stone-500"><TranslatedText>Distress Predict</TranslatedText></div>
                  <div className="text-lg font-bold text-stone-900 mt-0.5">
                    {selectedRecord.distressPredictionScore}
                    <span className="text-xs font-normal text-stone-400">/100</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                  <div className="text-[10px] uppercase tracking-wider text-stone-500"><TranslatedText>Resilience Index</TranslatedText></div>
                  <div className="text-lg font-bold text-emerald-700 mt-0.5">
                    {selectedRecord.resilienceScore}
                    <span className="text-xs font-normal text-stone-400">/100</span>
                  </div>
                </div>
              </div>

              {/* Sanitized Narrative */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
                  <span><TranslatedText>Sanitized Evidence Narrative</TranslatedText></span>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {selectedRecord.redactedTokensCount} <TranslatedText>Identifiers Protected</TranslatedText>
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 leading-relaxed font-sans max-h-40 overflow-y-auto">
                  <TranslatedText>{selectedRecord.sanitizedNarrative}</TranslatedText>
                </div>
              </div>

              {/* Audit Timeline */}
              <div className="space-y-2 pt-1 border-t border-stone-100">
                <div className="text-xs font-semibold text-stone-700"><TranslatedText>Audit & Processing Trail</TranslatedText></div>
                <div className="space-y-1.5 text-xs">
                  {selectedRecord.timeline.map((item, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-[11px] text-stone-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-stone-400 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <span className="font-medium text-stone-800"><TranslatedText>{item.action}</TranslatedText></span>
                        <div className="text-stone-400 font-mono text-[10px]">
                          <TranslatedText>{item.actor}</TranslatedText> &bull; {new Date(item.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-stone-400">
              <TranslatedText>Select a triage record to inspect action protocols</TranslatedText>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
