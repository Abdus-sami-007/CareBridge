import React, { useState, useEffect } from 'react';
import { PipelineFlowchartDiagram } from './components/PipelineFlowchartDiagram';
import { IsolatedVictimInspector } from './components/IsolatedVictimInspector';
import { PipelineExecutionRunner } from './components/PipelineExecutionRunner';
import { PipelineApiDocs } from './components/PipelineApiDocs';
import { OfficialsDashboardView } from './components/OfficialsDashboardView';
import { VictimDashboardView } from './components/VictimDashboardView';
import { VictimAccessGate } from './components/VictimAccessGate';
import { OfficialsVictimManager } from './components/OfficialsVictimManager';
import { OfficialsAccessGate } from './components/OfficialsAccessGate';
import { OfficialsAccountManager } from './components/OfficialsAccountManager';
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
  Sparkles,
  Database as DatabaseIcon
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppSection | 'home'>('victimDashboard');
  const [selectedVictimId, setSelectedVictimId] = useState<string>('');
  const [lastExecutionResult, setLastExecutionResult] = useState<PipelineExecutionResult | null>(null);
  const [serverMeta, setServerMeta] = useState<any>(null);
  const [victimDashboard, setVictimDashboard] = useState<VictimDashboardPayload | null>(null);
  const [officialsRecords, setOfficialsRecords] = useState<OfficialsDashboardPayload[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [victims, setVictims] = useState<VictimDbRecord[]>([]);
  const [authenticatedVictimId, setAuthenticatedVictimId] = useState<string | null>(null);
  const [officialSession, setOfficialSession] = useState<{token:string; username:string; display_name:string; role:'admin'|'sub_official'} | null>(null);

  // Load server status
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setServerMeta(data))
      .catch(err => console.warn('Health check fetch error:', err));
  }, []);
async function fetchJson<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options?.headers || {}),
    },
    cache: 'no-store',
  });

  const contentType = response.headers.get('content-type') || '';

  if (!contentType.toLowerCase().includes('application/json')) {
    const text = await response.text();

    console.error(
      `[API] ${url} returned non-JSON response:`,
      response.status,
      text.substring(0, 300)
    );

    throw new Error(
      response.status === 404
        ? `API endpoint not found: ${url}`
        : `Server returned an invalid response for ${url}`
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof data?.error === 'string'
        ? data.error
        : `Request failed: ${response.status}`
    );
  }

  return data as T;
}
  const loadVictims = async () => {
  try {
    setDashboardError(null);

    const response = await fetch('/api/database/victims', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    const contentType = response.headers.get('content-type') || '';

    // Never attempt response.json() on an HTML response.
    if (!contentType.toLowerCase().includes('application/json')) {
      const text = await response.text();

      console.error(
        '[Victims API] Expected JSON but received:',
        response.status,
        contentType,
        text.substring(0, 300)
      );

      throw new Error(
        response.status === 404
          ? 'Victim API endpoint was not found. Make sure the CareBridge server is running.'
          : 'Victim API returned an invalid response. Make sure the backend is running.'
      );
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        typeof data?.error === 'string'
          ? data.error
          : 'Failed to load victim records.'
      );
    }

    if (!Array.isArray(data?.victims)) {
      throw new Error('Victim API returned an invalid data format.');
    }

    setVictims(data.victims);
  } catch (error) {
    console.error('[Victims API]', error);

    setVictims([]);

    setDashboardError(
      error instanceof Error
        ? error.message
        : 'Failed to load victim records.'
    );
  }
};

  useEffect(() => {
    loadVictims();
  }, []);

  const loadDashboardData = async () => {
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      if (activeTab === 'victimDashboard' && authenticatedVictimId) {
        const r = await fetch(`/api/dashboards/victim/${encodeURIComponent(authenticatedVictimId)}`);
        if (!r.ok) throw new Error('Unable to load your protected case.');
        setVictimDashboard(await r.json());
      }
      if (activeTab === 'officialsDashboard' && officialSession) {
        const r = await fetch('/api/dashboards/officials', { headers: { Authorization: `Bearer ${officialSession.token}` } });
        if (!r.ok) throw new Error('Unable to load the officials dashboard.');
        const d = await r.json();
        setOfficialsRecords(d.records || []);
      }
    } catch (err) {
      setDashboardError(err instanceof Error ? err.message : 'Failed to load dashboard data.');
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'victimDashboard' && authenticatedVictimId) loadDashboardData();
    if (activeTab === 'officialsDashboard' && officialSession) loadDashboardData();
  }, [activeTab, selectedVictimId, authenticatedVictimId, officialSession]);

  const handleExecutionComplete = (result: PipelineExecutionResult) => {
    setLastExecutionResult(result);
    loadDashboardData();
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans selection:bg-emerald-900 selection:text-emerald-100">
      {/* Top Telemetry & Status Banner */}
      <header className="border-b border-stone-200 bg-white/95 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              aria-label="Open dashboards"
              className="p-2 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 transition-colors hover:bg-emerald-200"
            >
              <BrainCircuit className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm sm:text-base font-bold text-stone-900 tracking-tight">
                  CareBridge
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono bg-stone-100 text-stone-600 border border-stone-200">
                  Mental Health Monitoring
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                AI-powered early intervention and victim support platform
              </p>
            </div>
          </div>

          {/* Engine & Isolation Status Pills */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-200 text-stone-600">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Service: {serverMeta?.status === 'ok' ? 'Online' : 'Checking'}</span>
            </div>

            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800">
              <Lock className="w-3 h-3 text-emerald-700" />
              <span>Isolation: Enforced</span>
            </div>

            <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border ${serverMeta?.database?.connected ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
              <DatabaseIcon className="w-3 h-3" />
              <span>DB: {serverMeta?.database?.connected ? 'Connected' : serverMeta?.database?.configured ? 'Connection error' : 'Not configured'}</span>
            </div>

            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-800">
              <Sparkles className="w-3 h-3 text-sky-400" />
              <span>Gemini 3.8 Flash</span>
            </div>
          </div>
        </div>

        {/* Dashboard navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 border-t border-stone-200 pt-1 text-xs">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className={`border-b-2 px-3.5 py-2 font-semibold ${activeTab === 'home' ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('victimDashboard')}
              className={`border-b-2 px-3.5 py-2 font-semibold ${activeTab === 'victimDashboard' ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
            >
              Victim Dashboard
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('officialsDashboard')}
              className={`border-b-2 px-3.5 py-2 font-semibold ${activeTab === 'officialsDashboard' ? 'border-emerald-500 text-emerald-700' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
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
          <div className="rounded-xl border border-stone-200 bg-white p-3.5 text-xs text-stone-600">
            {authenticatedVictimId
              ? <>Live records for <strong>{authenticatedVictimId}</strong> are read from the configured database. New check-ins are persisted by the pipeline.</>
              : <>Victim ID is intentionally blank until the victim signs in. No case is selected automatically.</>}
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

            {authenticatedVictimId ? (
              <VictimDashboardView
                payload={victimDashboard}
                selectedVictimId={selectedVictimId}
                onLogout={() => { setAuthenticatedVictimId(null); setSelectedVictimId(''); setVictimDashboard(null); }}
                onChatCompleted={handleExecutionComplete}
                onRefresh={loadDashboardData}
                isLoading={dashboardLoading}
              />
            ) : (
              <VictimAccessGate onAuthenticated={(id) => { setSelectedVictimId(id); setAuthenticatedVictimId(id); }} />
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
            {!officialSession ? <OfficialsAccessGate onAuthenticated={setOfficialSession} /> : <>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-white px-4 py-3 shadow-sm">
                <div><div className="text-xs font-semibold">Signed in as {officialSession.display_name}</div><div className="text-[10px] text-stone-500">@{officialSession.username} · {officialSession.role === 'admin' ? 'Administrator' : 'Sub-official'}</div></div>
                <button onClick={async()=>{await fetch('/api/official-auth/logout',{method:'POST',headers:{Authorization:`Bearer ${officialSession.token}`}});setOfficialSession(null);setOfficialsRecords([])}} className="rounded-xl border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700">Log out</button>
              </div>
              {officialSession.role === 'admin' && <OfficialsAccountManager token={officialSession.token} isAdmin={true} />}
              <OfficialsVictimManager victims={victims} isAdmin={true} authToken={officialSession.token} onSaved={() => { loadVictims(); loadDashboardData(); }} />
              <OfficialsDashboardView records={officialsRecords} onRefresh={loadDashboardData} isLoading={dashboardLoading} authToken={officialSession.token} />
            </>}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-3 text-center text-[11px] text-stone-400 font-mono">
        CareBridge &bull; AI-powered early intervention &bull; Protected victim support
      </footer>
    </div>
  );
}
