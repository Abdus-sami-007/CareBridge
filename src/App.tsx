import React, { useState, useEffect } from 'react';
import { PipelineFlowchartDiagram } from './components/PipelineFlowchartDiagram';
import { IsolatedVictimInspector } from './components/IsolatedVictimInspector';
import { PipelineExecutionRunner } from './components/PipelineExecutionRunner';
import { PipelineApiDocs } from './components/PipelineApiDocs';
import { OfficialsDashboardView } from './components/OfficialsDashboardView';
import { VictimDashboardView } from './components/VictimDashboardView';
import { VictimAccessGate } from './components/VictimAccessGate';
import { OfficialsVictimManager } from './components/OfficialsVictimManager';
import { AppSection, HomeView } from './components/HomeView';
import {
  PipelineExecutionResult,
  OfficialsDashboardPayload,
  VictimDashboardPayload,
  VictimDbRecord
} from './types';
import {
  BrainCircuit,
  Lock,
  LayoutDashboard,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppSection | 'home'>('home');
  const [selectedVictimId, setSelectedVictimId] = useState<string>('VIC-CONFLICT-701');
  const [lastExecutionResult, setLastExecutionResult] = useState<PipelineExecutionResult | null>(null);
  const [pipelineRunning, setPipelineRunning] = useState<boolean>(false);
  const [serverMeta, setServerMeta] = useState<any>(null);
  const [victimDashboard, setVictimDashboard] = useState<VictimDashboardPayload | null>(null);
  const [officialsRecords, setOfficialsRecords] = useState<OfficialsDashboardPayload[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [victims, setVictims] = useState<VictimDbRecord[]>([]);
  const [authenticatedVictimId, setAuthenticatedVictimId] = useState<string | null>(null);

  // Load server status
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setServerMeta(data))
      .catch(err => console.warn('Health check fetch error:', err));
  }, []);

  const loadVictims = async () => {
    try {
      const response = await fetch('/api/database/victims');
      if (!response.ok) throw new Error('Failed to load victim records.');
      const data = await response.json();
      setVictims(data.victims || []);
      if (data.victims?.length && !data.victims.some((victim: VictimDbRecord) => victim.id === selectedVictimId)) {
        setSelectedVictimId(data.victims[0].id);
      }
    } catch (error) {
      setDashboardError(error instanceof Error ? error.message : 'Failed to load victim records.');
    }
  };

  useEffect(() => {
    loadVictims();
  }, []);

  const loadDashboardData = async () => {
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      const [victimResponse, officialsResponse] = await Promise.all([
        fetch(`/api/dashboards/victim/${encodeURIComponent(selectedVictimId)}`),
        fetch('/api/dashboards/officials')
      ]);

      const victimData = victimResponse.ok ? await victimResponse.json() : null;
      const officialsData = officialsResponse.ok ? await officialsResponse.json() : { records: [] };

      setVictimDashboard(victimData);
      setOfficialsRecords(officialsData.records || []);

      if (!victimResponse.ok && !officialsResponse.ok) {
        throw new Error('No dashboard data is available for this victim yet.');
      }
    } catch (err) {
      setDashboardError(err instanceof Error ? err.message : 'Failed to load dashboard data.');
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'victimDashboard' || activeTab === 'officialsDashboard') {
      loadDashboardData();
    }
  }, [activeTab, selectedVictimId]);

  const handleExecutionComplete = (result: PipelineExecutionResult) => {
    setLastExecutionResult(result);
    loadDashboardData();
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-emerald-900 selection:text-emerald-100">
      {/* Top Telemetry & Status Banner */}
      <header className="border-b border-stone-800 bg-stone-900/90 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              aria-label="Open dashboards"
              className="p-2 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400 transition-colors hover:bg-emerald-900"
            >
              <BrainCircuit className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm sm:text-base font-bold text-stone-100 tracking-tight">
                  CareBridge
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono bg-stone-800 text-stone-300 border border-stone-700">
                  Mental Health Monitoring
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                AI-powered early intervention and victim support platform
              </p>
            </div>
          </div>

          {/* Engine & Isolation Status Pills */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-stone-800 border border-stone-700 text-stone-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Service: Online</span>
            </div>

            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Isolation: Enforced</span>
            </div>

            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-sky-950/80 border border-sky-800 text-sky-300">
              <Sparkles className="w-3 h-3 text-sky-400" />
              <span>Gemini 3.8 Flash</span>
            </div>
          </div>
        </div>

        {/* Dashboard navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 border-t border-stone-800/80 pt-1 text-xs">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className={`border-b-2 px-3.5 py-2 font-semibold ${activeTab === 'home' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-stone-400 hover:text-stone-200'}`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('victimDashboard')}
              className={`border-b-2 px-3.5 py-2 font-semibold ${activeTab === 'victimDashboard' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-stone-400 hover:text-stone-200'}`}
            >
              Victim Dashboard
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('officialsDashboard')}
              className={`border-b-2 px-3.5 py-2 font-semibold ${activeTab === 'officialsDashboard' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-stone-400 hover:text-stone-200'}`}
            >
              Officials Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-5 sm:px-6 space-y-6">
        {activeTab === 'home' && (
          <HomeView
            onNavigate={setActiveTab}
          />
        )}

        {/* Notice for Backend Pipeline Purpose */}
        {activeTab !== 'home' && (
          <div className="rounded-xl border border-stone-800 bg-stone-900/60 p-3.5 text-xs text-stone-300">
            Live data from the CareBridge AI pipeline and isolated database for <strong>{selectedVictimId}</strong>.
          </div>
        )}

        {/* Victim Dashboard page */}
        {activeTab === 'victimDashboard' && (
          <div className="space-y-4">
            {dashboardError && (
              <div className="rounded-xl border border-amber-800 bg-amber-950/40 p-3 text-xs text-amber-200">
                {dashboardError}
              </div>
            )}

            {authenticatedVictimId === selectedVictimId ? (
              <VictimDashboardView
                payload={victimDashboard}
                victims={victims}
                selectedVictimId={selectedVictimId}
                onVictimChange={victimId => { setSelectedVictimId(victimId); setAuthenticatedVictimId(null); }}
                onChatCompleted={handleExecutionComplete}
                onRefresh={loadDashboardData}
                isLoading={dashboardLoading}
              />
            ) : (
              <VictimAccessGate victimId={selectedVictimId} onAuthenticated={setAuthenticatedVictimId} />
            )}
          </div>
        )}

        {/* Officials Dashboard page */}
        {activeTab === 'officialsDashboard' && (
          <div className="space-y-4">
            {dashboardError && (
              <div className="rounded-xl border border-amber-800 bg-amber-950/40 p-3 text-xs text-amber-200">
                {dashboardError}
              </div>
            )}
            <OfficialsVictimManager victims={victims} onSaved={() => { loadVictims(); loadDashboardData(); }} />
            <OfficialsDashboardView records={officialsRecords} onRefresh={loadDashboardData} isLoading={dashboardLoading} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-800 bg-stone-900/50 py-3 text-center text-[11px] text-stone-500 font-mono">
        CareBridge &bull; AI-powered early intervention &bull; Protected victim support
      </footer>
    </div>
  );
}
