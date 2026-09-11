import React, { useState, useEffect } from 'react';
import {
  VictimProfile,
  IsolatedConversationTurn,
  DynamicDistressRecord,
  VictimDbRecord,
  CheckinDbRecord,
  RiskLevel
} from '../types';
import {
  Database,
  Lock,
  User,
  ShieldCheck,
  History,
  TrendingUp,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Table,
  Code2,
  Copy,
  Check,
  FileText
} from 'lucide-react';

interface IsolatedVictimInspectorProps {
  selectedVictimId: string;
  onSelectVictim: (victimId: string) => void;
  onRefresh: () => void;
  pipelineRunning: boolean;
}

export const IsolatedVictimInspector: React.FC<IsolatedVictimInspectorProps> = ({
  selectedVictimId,
  onSelectVictim,
  onRefresh,
  pipelineRunning
}) => {
  const [activeTab, setActiveTab] = useState<'conversations' | 'tables' | 'schemas'>('conversations');
  const [victims, setVictims] = useState<VictimProfile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<VictimProfile | null>(null);
  const [conversations, setConversations] = useState<IsolatedConversationTurn[]>([]);
  const [distressHistory, setDistressHistory] = useState<DynamicDistressRecord[]>([]);
  const [dbStatus, setDbStatus] = useState<any>(null);

  // Explicit database tables state:
  const [dbVictims, setDbVictims] = useState<VictimDbRecord[]>([]);
  const [dbCheckins, setDbCheckins] = useState<CheckinDbRecord[]>([]);
  const [dbSchemas, setDbSchemas] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // New victim form state matching exact schema: (id, name, case_id, risk_level, latest_score)
  const [newVictimId, setNewVictimId] = useState('');
  const [newName, setNewName] = useState('');
  const [newCaseId, setNewCaseId] = useState('');
  const [newRiskLevel, setNewRiskLevel] = useState<RiskLevel>('Low');
  const [newLatestScore, setNewLatestScore] = useState<number>(35);
  const [newPassword, setNewPassword] = useState('');

  const fetchVictimData = async (vId: string) => {
    setIsLoading(true);
    try {
      // 1. Fetch victim list
      const listRes = await fetch('/api/pipeline/victims');
      if (listRes.ok) {
        const data = await listRes.json();
        setVictims(data.victims || []);
      }

      // 2. Fetch specific profile from database
      const profileRes = await fetch(`/api/pipeline/victims/${vId}`);
      if (profileRes.ok) {
        const pData = await profileRes.json();
        setCurrentProfile(pData);
      }

      // 3. Fetch isolated conversations (strict isolation test)
      const convRes = await fetch(`/api/pipeline/victims/${vId}/conversations`);
      if (convRes.ok) {
        const cData = await convRes.json();
        setConversations(cData.conversations || []);
      }

      // 4. Fetch distress history
      const trendRes = await fetch(`/api/pipeline/victims/${vId}/trend`);
      if (trendRes.ok) {
        const tData = await trendRes.json();
        setDistressHistory(tData.distressHistory || []);
      }

      // 5. Fetch DB adapter status
      const statusRes = await fetch('/api/pipeline/database-status');
      if (statusRes.ok) {
        const sData = await statusRes.json();
        setDbStatus(sData);
      }

      // 6. Fetch explicit DB victims: victims (id, name, case_id, risk_level, latest_score)
      const dbVictimsRes = await fetch('/api/database/victims');
      if (dbVictimsRes.ok) {
        const dbVData = await dbVictimsRes.json();
        setDbVictims(dbVData.victims || []);
      }

      // 7. Fetch explicit DB checkins: checkins (id, victim_id, message, score, risk_category, trigger_factors, created_at)
      const dbCheckinsRes = await fetch(`/api/database/checkins?victim_id=${encodeURIComponent(vId)}`);
      if (dbCheckinsRes.ok) {
        const dbCData = await dbCheckinsRes.json();
        setDbCheckins(dbCData.checkins || []);
      }

      // 8. Fetch database schema placeholders
      const schemaRes = await fetch('/api/database/schemas');
      if (schemaRes.ok) {
        const schemaData = await schemaRes.json();
        setDbSchemas(schemaData);
      }
    } catch (err) {
      console.warn('Failed to fetch victim database records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVictimData(selectedVictimId);
  }, [selectedVictimId]);

  const handleCreateVictim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVictimId.trim() || !newName.trim()) return;

    try {
      // 1. Save to explicit database table: victims (id, name, case_id, risk_level, latest_score)
      await fetch('/api/database/victims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newVictimId.trim(),
          name: newName.trim(),
          case_id: newCaseId.trim() || `CASE-${newVictimId.trim().replace(/[^a-zA-Z0-9]/g, '')}`,
          risk_level: newRiskLevel,
          latest_score: newLatestScore,
          password: newPassword
        })
      });

      // 2. Also register clinical profile
      await fetch('/api/pipeline/victims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          victimId: newVictimId.trim(),
          pseudonym: newName.trim(),
          baselineDistressScore: newLatestScore,
          traumaContext: `Registered case ${newCaseId || 'intake'}. Monitored under atrocity victim protection protocol.`
        })
      });

      setIsRegisterModalOpen(false);
      onSelectVictim(newVictimId.trim());
      fetchVictimData(newVictimId.trim());
      setNewVictimId('');
      setNewName('');
      setNewCaseId('');
      setNewPassword('');
    } catch (err) {
      console.error('Failed to register victim:', err);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-900/90 p-5 space-y-4 shadow-xl">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800/80 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-stone-100 text-sm">
                Victim Database Layer &amp; Conversation Vault
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Isolated Adapter Active
              </span>
            </div>
            <p className="text-stone-400 text-xs mt-0.5">
              Strict per-victim memory boundary • Database placeholders for <code className="text-emerald-300">victims</code> and <code className="text-emerald-300">checkins</code> schemas.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Refresh button */}
          <button
            onClick={() => fetchVictimData(selectedVictimId)}
            disabled={isLoading || pipelineRunning}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-800 text-stone-300 hover:bg-stone-700 disabled:opacity-50 transition-colors border border-stone-700/60"
            title="Reload from Database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync DB</span>
          </button>

          {/* New Victim button */}
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Add Victim</span>
          </button>
        </div>
      </div>

      {/* Database Adapter Meta Banner */}
      {dbStatus && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800/80">
            <span className="text-stone-500 text-[10px] block">Database Status</span>
            <div className="font-mono text-emerald-400 font-semibold flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {dbStatus.status === 'active' ? 'CONNECTED' : 'DISCONNECTED'}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800/80">
            <span className="text-stone-500 text-[10px] block">Registered Victims</span>
            <div className="font-mono text-stone-200 font-semibold mt-0.5">
              {dbStatus.totalVictimsRegistered} records in vault
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800/80">
            <span className="text-stone-500 text-[10px] block">Check-ins Stored</span>
            <div className="font-mono text-amber-300 font-semibold mt-0.5">
              {dbStatus.totalCheckinsStored ?? dbCheckins.length} check-in entries
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-stone-950 border border-stone-800/80">
            <span className="text-stone-500 text-[10px] block">Adapter Implementation</span>
            <div className="font-mono text-stone-300 text-[11px] truncate mt-0.5" title={dbStatus.name}>
              {dbStatus.type === 'in_memory_transient' ? 'InMemory / DB Ready' : 'External SQL/NoSQL'}
            </div>
          </div>
        </div>
      )}

      {/* Victim Selector Pill Bar */}
      <div className="space-y-1.5">
        <label className="text-stone-400 text-xs flex items-center justify-between">
          <span>Active Monitored Victim Selection:</span>
          <span className="text-stone-500 text-[11px]">Click to switch isolated context</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {victims.map(v => {
            const isSelected = v.victimId === selectedVictimId;
            return (
              <button
                key={v.victimId}
                onClick={() => onSelectVictim(v.victimId)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center space-x-2 border transition-all ${
                  isSelected
                    ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                    : 'bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-700 hover:text-stone-200'
                }`}
              >
                <Lock className={`w-3 h-3 ${isSelected ? 'text-emerald-400' : 'text-stone-600'}`} />
                <span className="font-mono font-semibold">{v.victimId}</span>
                <span className="text-stone-500 text-[11px]">({v.pseudonym.slice(0, 14)})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-Tabs: Isolated Vault vs Database Tables vs Schemas */}
      <div className="flex border-b border-stone-800 text-xs">
        <button
          onClick={() => setActiveTab('conversations')}
          className={`px-3 py-2 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === 'conversations'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Isolated Conversation Vault ({conversations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tables')}
          className={`px-3 py-2 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === 'tables'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          <span>Database Tables: victims &amp; checkins</span>
        </button>

        <button
          onClick={() => setActiveTab('schemas')}
          className={`px-3 py-2 border-b-2 font-medium transition-colors flex items-center gap-1.5 ${
            activeTab === 'schemas'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>DB Placeholder Code &amp; DDL</span>
        </button>
      </div>

      {/* TAB 1: Isolated Conversation Vault & Profile */}
      {activeTab === 'conversations' && currentProfile && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
          {/* Column 1: Profile & Trauma Baseline */}
          <div className="rounded-xl border border-stone-800 bg-stone-950 p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <div className="flex items-center space-x-2 font-semibold text-stone-200">
                <User className="w-4 h-4 text-emerald-400" />
                <span>Victim Profile</span>
              </div>
              <span className="font-mono text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                {currentProfile.victimId}
              </span>
            </div>

            <div className="space-y-2 text-stone-300">
              <div>
                <span className="text-stone-500 text-[11px]">Pseudonym:</span>
                <p className="font-medium text-stone-200">{currentProfile.pseudonym}</p>
              </div>

              <div>
                <span className="text-stone-500 text-[11px]">Baseline Distress Score:</span>
                <p className="font-mono font-bold text-amber-400">{currentProfile.baselineDistressScore} / 100</p>
              </div>

              <div>
                <span className="text-stone-500 text-[11px]">Trauma Background / Context:</span>
                <p className="text-[11px] leading-relaxed text-stone-400 bg-stone-900/60 p-2 rounded-lg border border-stone-800">
                  {currentProfile.traumaContext}
                </p>
              </div>

              <div>
                <span className="text-stone-500 text-[11px]">Assigned Caseworker &amp; Agency:</span>
                <p className="text-[11px] text-stone-300 font-medium">{currentProfile.assignedCaseworker}</p>
                <p className="text-[10px] text-stone-500">{currentProfile.assignedAgency}</p>
              </div>

              {currentProfile.safetyNotes && (
                <div>
                  <span className="text-stone-500 text-[11px]">Safety Notes:</span>
                  <p className="text-[11px] text-rose-300/90 italic">{currentProfile.safetyNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Isolated Conversation History */}
          <div className="rounded-xl border border-stone-800 bg-stone-950 p-4 space-y-3 lg:col-span-2 flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <div className="flex items-center space-x-2 font-semibold text-stone-200 text-xs">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Strict Isolated Conversation History ({conversations.length} turns)</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Zero cross-victim bleed
              </span>
            </div>

            <div className="flex-1 max-h-64 overflow-y-auto space-y-2 pr-1">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-stone-500 text-[11px]">
                  No conversation turns recorded yet for {currentProfile.victimId}. Run a check-in or test disclosure to record an isolated turn.
                </div>
              ) : (
                conversations.map((turn, idx) => (
                  <div
                    key={turn.turnId || idx}
                    className="p-2.5 rounded-lg bg-stone-900/70 border border-stone-800 text-[11px] space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] text-stone-400 font-mono">
                      <span className="text-emerald-400 font-semibold uppercase">
                        [{turn.channel}] Turn #{idx + 1}
                      </span>
                      <span>{new Date(turn.timestamp).toLocaleTimeString()}</span>
                    </div>

                    <p className="text-stone-200 leading-relaxed">
                      "{turn.sanitizedMessage}"
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[10px] border-t border-stone-800/80 text-stone-500">
                      <span>Emotion: <strong className="text-stone-300">{turn.detectedEmotion}</strong> ({turn.emotionalValence})</span>
                      <span className="font-mono">Distress: <strong className="text-amber-400">{turn.distressScore}</strong>/100</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Historical Trend Snapshot */}
            <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
              <span className="flex items-center gap-1">
                <History className="w-3.5 h-3.5 text-stone-500" />
                Distress Score Data Points: <strong className="text-stone-200">{distressHistory.length}</strong>
              </span>
              <span className="font-mono text-[10px]">
                Isolated vault: {currentProfile.victimId}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Database Tables (victims & checkins) */}
      {activeTab === 'tables' && (
        <div className="space-y-4 pt-1 text-xs">
          {/* Table 1: victims (id, name, case_id, risk_level, latest_score) */}
          <div className="rounded-xl border border-stone-800 bg-stone-950 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <div className="flex items-center space-x-2 font-semibold text-stone-200">
                <Table className="w-4 h-4 text-emerald-400" />
                <span>Table: <code className="text-emerald-300 font-mono">victims</code></span>
                <span className="text-stone-500 text-[11px] font-normal">
                  (id, name, case_id, risk_level, latest_score)
                </span>
              </div>
              <span className="font-mono text-[10px] text-stone-400">
                {dbVictims.length} records
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-stone-900/80 text-stone-400 font-mono border-b border-stone-800">
                  <tr>
                    <th className="p-2">id</th>
                    <th className="p-2">name</th>
                    <th className="p-2">case_id</th>
                    <th className="p-2">risk_level</th>
                    <th className="p-2">latest_score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 font-mono">
                  {dbVictims.map(v => (
                    <tr
                      key={v.id}
                      onClick={() => onSelectVictim(v.id)}
                      className={`hover:bg-stone-900/50 cursor-pointer ${
                        v.id === selectedVictimId ? 'bg-emerald-950/30' : ''
                      }`}
                    >
                      <td className="p-2 text-emerald-400 font-semibold">{v.id}</td>
                      <td className="p-2 text-stone-200">{v.name}</td>
                      <td className="p-2 text-stone-400">{v.case_id}</td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-medium ${
                          v.risk_level === 'Critical' ? 'bg-red-950 text-red-300 border border-red-800' :
                          v.risk_level === 'High' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          v.risk_level === 'Medium' ? 'bg-yellow-950 text-yellow-300 border border-yellow-800' :
                          'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {v.risk_level}
                        </span>
                      </td>
                      <td className="p-2 text-amber-400 font-bold">{v.latest_score} / 100</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: checkins (id, victim_id, message, score, risk_category, trigger_factors, created_at) */}
          <div className="rounded-xl border border-stone-800 bg-stone-950 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <div className="flex items-center space-x-2 font-semibold text-stone-200">
                <Table className="w-4 h-4 text-emerald-400" />
                <span>Table: <code className="text-emerald-300 font-mono">checkins</code></span>
                <span className="text-stone-500 text-[11px] font-normal">
                  (id, victim_id, message, score, risk_category, trigger_factors, created_at)
                </span>
              </div>
              <span className="font-mono text-[10px] text-stone-400">
                {dbCheckins.length} check-ins for {selectedVictimId}
              </span>
            </div>

            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-stone-900/80 text-stone-400 font-mono border-b border-stone-800 sticky top-0">
                  <tr>
                    <th className="p-2">id</th>
                    <th className="p-2">victim_id</th>
                    <th className="p-2">message</th>
                    <th className="p-2">score</th>
                    <th className="p-2">risk_category</th>
                    <th className="p-2">trigger_factors</th>
                    <th className="p-2">created_at</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 font-mono">
                  {dbCheckins.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-stone-500 font-sans">
                        No check-ins recorded yet for {selectedVictimId}. Run the pipeline runner to record a check-in.
                      </td>
                    </tr>
                  ) : (
                    dbCheckins.map(c => (
                      <tr key={c.id} className="hover:bg-stone-900/50">
                        <td className="p-2 text-stone-400 font-mono text-[10px]">{c.id}</td>
                        <td className="p-2 text-emerald-400">{c.victim_id}</td>
                        <td className="p-2 text-stone-200 font-sans max-w-xs truncate" title={c.message}>
                          {c.message}
                        </td>
                        <td className="p-2 text-amber-400 font-bold">{c.score}</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-medium ${
                            c.risk_category === 'Critical' ? 'bg-red-950 text-red-300 border border-red-800' :
                            c.risk_category === 'High' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                            c.risk_category === 'Medium' ? 'bg-yellow-950 text-yellow-300 border border-yellow-800' :
                            'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}>
                            {c.risk_category}
                          </span>
                        </td>
                        <td className="p-2 text-stone-400 text-[10px]">
                          {Array.isArray(c.trigger_factors) ? c.trigger_factors.join(', ') : String(c.trigger_factors)}
                        </td>
                        <td className="p-2 text-stone-500 text-[10px]">
                          {new Date(c.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Database Schemas & Placeholder Code */}
      {activeTab === 'schemas' && (
        <div className="space-y-4 pt-1 text-xs">
          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 text-emerald-300">
            <h4 className="font-semibold text-emerald-200 flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Database Placeholder Ready for Your Next Iteration
            </h4>
            <p className="text-emerald-300/90 text-[11px] leading-relaxed">
              The module defines explicit schemas for <strong>victims</strong> (id, name, case_id, risk_level, latest_score) and <strong>checkins</strong> (id, victim_id, message, score, risk_category, trigger_factors, created_at).
              Below are the ready-to-use SQL DDL and ORM definitions you can copy directly into your PostgreSQL, MySQL, SQLite, or MongoDB instance.
            </p>
          </div>

          {/* SQL DDL Schema */}
          <div className="rounded-xl border border-stone-800 bg-stone-950 p-4 space-y-2">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <div className="flex items-center space-x-2 font-semibold text-stone-200">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>SQL DDL Schema (PostgreSQL / MySQL / SQLite)</span>
              </div>
              <button
                onClick={() => copyToClipboard(dbSchemas?.schemas?.sql?.ddl || '', 'sql')}
                className="flex items-center gap-1 px-2 py-1 rounded bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 text-[10px]"
              >
                {copiedKey === 'sql' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'sql' ? 'Copied' : 'Copy DDL'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-stone-900 border border-stone-800 font-mono text-[10.5px] text-emerald-300 overflow-x-auto leading-relaxed">
              {dbSchemas?.schemas?.sql?.ddl || 'Loading SQL schema...'}
            </pre>
          </div>

          {/* MongoDB Mongoose Schema */}
          <div className="rounded-xl border border-stone-800 bg-stone-950 p-4 space-y-2">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <div className="flex items-center space-x-2 font-semibold text-stone-200">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Mongoose / MongoDB Schema Placeholder</span>
              </div>
              <button
                onClick={() => copyToClipboard(dbSchemas?.schemas?.mongoose?.schema || '', 'mongoose')}
                className="flex items-center gap-1 px-2 py-1 rounded bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-200 text-[10px]"
              >
                {copiedKey === 'mongoose' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'mongoose' ? 'Copied' : 'Copy Mongoose'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-stone-900 border border-stone-800 font-mono text-[10.5px] text-emerald-300 overflow-x-auto leading-relaxed">
              {dbSchemas?.schemas?.mongoose?.schema || 'Loading Mongoose schema...'}
            </pre>
          </div>

          {/* Module Integration Code */}
          <div className="rounded-xl border border-stone-800 bg-stone-950 p-4 space-y-2">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <div className="flex items-center space-x-2 font-semibold text-stone-200">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span>How to Plug In Your Database in Code (src/module.ts)</span>
              </div>
            </div>
            <pre className="p-3 rounded-lg bg-stone-900 border border-stone-800 font-mono text-[10.5px] text-amber-300/90 overflow-x-auto leading-relaxed">
{`import { setDatabaseAdapter, type IDatabaseAdapter, type VictimDbRecord, type CheckinDbRecord } from './src/module';

// In your external DB initialization file:
export class PostgresDatabaseAdapter implements IDatabaseAdapter {
  name = 'PostgreSQL Production Vault';
  isConnected() { return true; }

  async getVictim(id: string): Promise<VictimDbRecord | null> {
    const res = await pool.query('SELECT * FROM victims WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async upsertVictim(victim: VictimDbRecord): Promise<VictimDbRecord> {
    await pool.query('INSERT INTO victims (id, name, case_id, risk_level, latest_score) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE ...', [...]);
    return victim;
  }

  async updateVictimScore(id: string, risk_level: string, latest_score: number): Promise<void> {
    await pool.query('UPDATE victims SET risk_level = $1, latest_score = $2 WHERE id = $3', [risk_level, latest_score, id]);
  }

  async insertCheckin(checkin: CheckinDbRecord): Promise<CheckinDbRecord> {
    await pool.query('INSERT INTO checkins (id, victim_id, message, score, risk_category, trigger_factors, created_at) VALUES (...)', [...]);
    return checkin;
  }

  async getCheckinsForVictim(victim_id: string, limit = 50): Promise<CheckinDbRecord[]> {
    const res = await pool.query('SELECT * FROM checkins WHERE victim_id = $1 ORDER BY created_at DESC LIMIT $2', [victim_id, limit]);
    return res.rows;
  }

  async listCheckins(limit = 100): Promise<CheckinDbRecord[]> {
    const res = await pool.query('SELECT * FROM checkins ORDER BY created_at DESC LIMIT $1', [limit]);
    return res.rows;
  }
}

// Register your adapter:
setDatabaseAdapter(new PostgresDatabaseAdapter());`}
            </pre>
          </div>
        </div>
      )}

      {/* Register Victim Modal (Exact Schema) */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-stone-950 border border-stone-800 rounded-2xl max-w-md w-full p-5 text-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-2">
              <h4 className="font-semibold text-sm text-stone-100 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                Add Victim (Schema: id, name, case_id, risk_level, latest_score)
              </h4>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-stone-500 hover:text-stone-300 text-xs"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateVictim} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-400 mb-1">id (Primary Key):</label>
                <input
                  type="text"
                  value={newVictimId}
                  onChange={e => setNewVictimId(e.target.value)}
                  placeholder="e.g. VICTIM-ID-FROM-DATABASE"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-700 text-stone-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-stone-400 mb-1">name:</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  required
                  className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-700 text-stone-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-stone-400 mb-1">case_id:</label>
                <input
                  type="text"
                  value={newCaseId}
                  onChange={e => setNewCaseId(e.target.value)}
                  placeholder="e.g. CASE-UA-2026-904"
                  className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-700 text-stone-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-stone-400 mb-1">victim access password:</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  required
                  className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-700 text-stone-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-400 mb-1">risk_level:</label>
                  <select
                    value={newRiskLevel}
                    onChange={e => setNewRiskLevel(e.target.value as RiskLevel)}
                    className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-700 text-stone-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-400 mb-1">latest_score (0-100): {newLatestScore}</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newLatestScore}
                    onChange={e => setNewLatestScore(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-stone-900 border border-stone-700 text-stone-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500"
                >
                  Save to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
