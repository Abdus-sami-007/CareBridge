import React, { useState, useEffect } from 'react';
import { PipelineFlowchartDiagram } from './components/PipelineFlowchartDiagram';
import { IsolatedVictimInspector } from './components/IsolatedVictimInspector';
import { PipelineExecutionRunner } from './components/PipelineExecutionRunner';
import { PipelineApiDocs } from './components/PipelineApiDocs';
import { OfficialsDashboardView } from './components/OfficialsDashboardView';
import { VictimDashboardView } from './components/VictimDashboardView';
import {
  PipelineExecutionResult,
  OfficialsDashboardPayload,
  VictimDashboardPayload
} from './types';
import {
  Terminal,
  BrainCircuit,
  Database,
  Lock,
  GitBranch,
  Radio,
  FileCode,
  LayoutDashboard,
  Sparkles,
  Server,
  Activity,
  CheckCircle2
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'database' | 'api' | 'dashboards'>('pipeline');
  const [selectedVictimId, setSelectedVictimId] = useState<string>('VIC-CONFLICT-701');
  const [lastExecutionResult, setLastExecutionResult] = useState<PipelineExecutionResult | null>(null);
  const [pipelineRunning, setPipelineRunning] = useState<boolean>(false);
  const [serverMeta, setServerMeta] = useState<any>(null);

  // Load server status
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setServerMeta(data))
      .catch(err => console.warn('Health check fetch error:', err));
  }, []);

  const handleExecutionComplete = (result: PipelineExecutionResult) => {
    setLastExecutionResult(result);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-emerald-900 selection:text-emerald-100">
      {/* Top Telemetry & Status Banner */}
      <header className="border-b border-stone-800 bg-stone-900/90 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm sm:text-base font-bold text-stone-100 tracking-tight">
                  Trauma Distress Ingestion &amp; Prediction Pipeline
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono bg-stone-800 text-stone-300 border border-stone-700">
                  Backend Module
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                AI-Powered Dynamic Mental Health Monitoring &bull; Multi-Modal (Text / Voice / Events) &bull; Isolated Database Vault
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

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center space-x-1 border-t border-stone-800/80 pt-1 text-xs">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-3.5 py-2 font-medium border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'pipeline'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Pipeline Architecture &amp; Execution</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`px-3.5 py-2 font-medium border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'database'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Isolated Victim Database</span>
          </button>

          <button
            onClick={() => setActiveTab('api')}
            className={`px-3.5 py-2 font-medium border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'api'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>REST API &amp; Bot Endpoints</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboards')}
            className={`px-3.5 py-2 font-medium border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'dashboards'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Downstream Dashboard Feeds</span>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-5 sm:px-6 space-y-6">
        {/* Notice for Backend Pipeline Purpose */}
        <div className="rounded-xl border border-stone-800 bg-stone-900/60 p-3.5 text-xs text-stone-300 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Headless Pipeline Module:</strong> Ingests periodic checks, WhatsApp, Telegram, and IVR speech dispatches; evaluates via Gemini AI Engine; isolates victim conversation histories; and prepares database adapters for external database injection in the next iteration.
            </span>
          </div>
          <span className="font-mono text-[10px] text-stone-400 bg-stone-800 px-2 py-0.5 rounded">
            Target Victim: {selectedVictimId}
          </span>
        </div>

        {/* VIEW 1: Pipeline Architecture & Execution */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            {/* Visual Flowchart Component */}
            <PipelineFlowchartDiagram
              activeStage={
                pipelineRunning
                  ? 'ai_engine'
                  : lastExecutionResult
                  ? 'classification'
                  : 'idle'
              }
              lastRiskResult={lastExecutionResult?.pipelineStageResults.riskClassification}
              selectedModality={lastExecutionResult?.pipelineStageResults.inputIngested.modality || 'text'}
            />

            {/* Execution Runner Harness */}
            <PipelineExecutionRunner
              selectedVictimId={selectedVictimId}
              onExecutionComplete={handleExecutionComplete}
              isLoading={pipelineRunning}
              setIsLoading={setPipelineRunning}
            />
          </div>
        )}

        {/* VIEW 2: Isolated Victim Database */}
        {activeTab === 'database' && (
          <IsolatedVictimInspector
            selectedVictimId={selectedVictimId}
            onSelectVictim={setSelectedVictimId}
            onRefresh={() => {}}
            pipelineRunning={pipelineRunning}
          />
        )}

        {/* VIEW 3: REST API & Bot Endpoints */}
        {activeTab === 'api' && <PipelineApiDocs />}

        {/* VIEW 4: Downstream Dashboard Data Feeds */}
        {activeTab === 'dashboards' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-stone-800 bg-stone-900/80 p-3 text-xs text-stone-300">
              The pipeline module supplies structured, sanitized data directly to downstream dashboards:
              <strong> Victim Self-Care View</strong> (trauma-informed guidance) and
              <strong> Officials &amp; Clinicians Triage View</strong> (audit logs, clinical priority, alert triggers).
            </div>

            <div className="grid grid-cols-1 gap-6">
              <OfficialsDashboardView
                records={[]}
                onRefresh={() => {}}
                isLoading={false}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-800 bg-stone-900/50 py-3 text-center text-[11px] text-stone-500 font-mono">
        AI-Powered Dynamic Mental Health Monitoring &bull; Isolated Database Adapter &bull; Gemini 3.8 Flash &bull; Ready for External DB Injection
      </footer>
    </div>
  );
}
