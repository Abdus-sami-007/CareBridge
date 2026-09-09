import React from 'react';
import {
  User,
  Clock,
  MessageSquare,
  Mic,
  Activity,
  BrainCircuit,
  Gauge,
  TrendingUp,
  GitBranch,
  ShieldCheck,
  AlertTriangle,
  HeartHandshake,
  CheckCircle2,
  ArrowDown,
  Sparkles
} from 'lucide-react';
import { RiskClassificationResult } from '../types';

interface PipelineFlowchartDiagramProps {
  activeStage?: 'idle' | 'victim' | 'periodic' | 'input' | 'ai_engine' | 'score' | 'trend' | 'classification';
  lastRiskResult?: RiskClassificationResult | null;
  selectedModality?: 'text' | 'voice' | 'events';
}

export const PipelineFlowchartDiagram: React.FC<PipelineFlowchartDiagramProps> = ({
  activeStage = 'idle',
  lastRiskResult,
  selectedModality = 'text'
}) => {
  const isHighCritical = lastRiskResult?.branch === 'High/Critical';
  const isLowMedium = lastRiskResult?.branch === 'Low/Medium';

  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950 p-5 sm:p-6 text-stone-200 font-sans shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6 border-b border-stone-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-400">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-100 tracking-wide">
              Pipeline Architecture &amp; Execution Topology
            </h3>
            <p className="text-[11px] text-stone-400">
              Direct implementation of System Flowchart: Ingestion &rarr; AI Engine &rarr; Dynamic Scoring &rarr; Trend &rarr; Risk Classification
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="px-2 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-300">
            Engine: Gemini 3.8 Flash
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-700 text-emerald-300 font-medium">
            DB: Isolated Vault
          </span>
        </div>
      </div>

      {/* Main Flowchart Tree */}
      <div className="flex flex-col items-center space-y-3 max-w-2xl mx-auto text-xs">
        {/* Step 1: VICTIM */}
        <div
          className={`w-full max-w-sm p-3 rounded-xl border transition-all text-center flex items-center justify-center space-x-2 ${
            activeStage === 'victim'
              ? 'bg-emerald-950/90 border-emerald-500 shadow-lg shadow-emerald-950/50 scale-102 text-white'
              : 'bg-stone-900/90 border-stone-700 text-stone-200'
          }`}
        >
          <User className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-bold tracking-wider uppercase">VICTIM</span>
          <span className="text-[10px] text-stone-400 font-mono">
            (Isolated DB Record)
          </span>
        </div>

        <ArrowDown className="w-3.5 h-3.5 text-stone-600" />

        {/* Step 2: Periodic Check */}
        <div
          className={`w-full max-w-sm p-2.5 rounded-xl border transition-all text-center flex items-center justify-center space-x-2 ${
            activeStage === 'periodic'
              ? 'bg-sky-950/90 border-sky-500 scale-102 text-white'
              : 'bg-stone-900/70 border-stone-800 text-stone-300'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="font-semibold">Periodic Check / Scheduled Ingestion</span>
        </div>

        <ArrowDown className="w-3.5 h-3.5 text-stone-600" />

        {/* Step 3: [ Text | Voice | Events ] */}
        <div className="w-full max-w-md grid grid-cols-3 gap-2">
          <div
            className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center space-y-1 transition-all ${
              selectedModality === 'text'
                ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200 font-medium'
                : 'bg-stone-900/50 border-stone-800 text-stone-400'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-[11px]">Text</span>
            <span className="text-[9px] text-stone-500">Disclosures</span>
          </div>

          <div
            className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center space-y-1 transition-all ${
              selectedModality === 'voice'
                ? 'bg-sky-950/80 border-sky-600 text-sky-200 font-medium'
                : 'bg-stone-900/50 border-stone-800 text-stone-400'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-semibold text-[11px]">Voice</span>
            <span className="text-[9px] text-stone-500">Audio / Transcripts</span>
          </div>

          <div
            className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center space-y-1 transition-all ${
              selectedModality === 'events'
                ? 'bg-amber-950/80 border-amber-600 text-amber-200 font-medium'
                : 'bg-stone-900/50 border-stone-800 text-stone-400'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-[11px]">Events</span>
            <span className="text-[9px] text-stone-500">Trauma Triggers</span>
          </div>
        </div>

        <ArrowDown className="w-3.5 h-3.5 text-stone-600" />

        {/* Step 4: AI Engine [NLP + Emotion | Voice + ML] */}
        <div
          className={`w-full max-w-md p-3.5 rounded-xl border transition-all text-center space-y-1.5 ${
            activeStage === 'ai_engine'
              ? 'bg-indigo-950/90 border-indigo-500 scale-102 text-white'
              : 'bg-stone-900/90 border-stone-700 text-stone-200'
          }`}
        >
          <div className="flex items-center justify-center space-x-2 font-bold tracking-wide text-indigo-300">
            <BrainCircuit className="w-4 h-4 text-indigo-400" />
            <span>AI Engine</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="flex items-center justify-center gap-2 text-[10px] text-stone-400 font-mono">
            <span className="px-1.5 py-0.5 rounded bg-stone-800 text-stone-300">NLP + Emotion</span>
            <span>&bull;</span>
            <span className="px-1.5 py-0.5 rounded bg-stone-800 text-stone-300">Voice + ML</span>
          </div>
          <div className="text-[10px] text-stone-400">
            Evaluates isolated historical context &amp; clinical trauma indicators
          </div>
        </div>

        <ArrowDown className="w-3.5 h-3.5 text-stone-600" />

        {/* Step 5: Dynamic Distress Score */}
        <div
          className={`w-full max-w-sm p-2.5 rounded-xl border transition-all text-center flex items-center justify-center space-x-2 ${
            activeStage === 'score'
              ? 'bg-amber-950/90 border-amber-500 scale-102 text-white'
              : 'bg-stone-900/80 border-stone-800 text-stone-300'
          }`}
        >
          <Gauge className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-semibold">Dynamic Distress Score (0&ndash;100)</span>
        </div>

        <ArrowDown className="w-3.5 h-3.5 text-stone-600" />

        {/* Step 6: Trend + Prediction */}
        <div
          className={`w-full max-w-sm p-2.5 rounded-xl border transition-all text-center flex items-center justify-center space-x-2 ${
            activeStage === 'trend'
              ? 'bg-purple-950/90 border-purple-500 scale-102 text-white'
              : 'bg-stone-900/80 border-stone-800 text-stone-300'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span className="font-semibold">Trend + Prediction</span>
          <span className="text-[10px] text-stone-400 font-mono">
            (&Delta; Baseline &amp; Velocity)
          </span>
        </div>

        <ArrowDown className="w-3.5 h-3.5 text-stone-600" />

        {/* Step 7: Risk Classification */}
        <div
          className={`w-full max-w-sm p-2.5 rounded-xl border transition-all text-center flex items-center justify-center space-x-2 ${
            activeStage === 'classification'
              ? 'bg-stone-800 border-stone-500 scale-102 text-white font-bold'
              : 'bg-stone-900/90 border-stone-700 text-stone-200'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <span className="font-semibold">Risk Classification</span>
        </div>

        {/* Forked Branches: Low/Medium vs High/Critical */}
        <div className="w-full max-w-2xl grid grid-cols-2 gap-4 pt-2">
          {/* Left Branch: Low/Medium -> Monitoring */}
          <div
            className={`p-3.5 rounded-xl border flex flex-col items-center text-center space-y-2.5 transition-all ${
              isLowMedium
                ? 'bg-emerald-950/90 border-emerald-500 shadow-md ring-1 ring-emerald-500 text-emerald-100'
                : 'bg-stone-900/40 border-stone-800 text-stone-400'
            }`}
          >
            <div className="font-semibold text-xs text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Low / Medium</span>
            </div>
            <ArrowDown className="w-3 h-3 text-stone-600" />
            <div className="px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-semibold w-full">
              Monitoring
            </div>
            <p className="text-[10px] text-stone-400 leading-tight">
              Continues periodic health cadence; restorative grounding cues delivered.
            </p>
          </div>

          {/* Right Branch: High/Critical -> Alert -> Human Intervention -> Follow-up & Recovery */}
          <div
            className={`p-3.5 rounded-xl border flex flex-col items-center text-center space-y-2 transition-all ${
              isHighCritical
                ? 'bg-rose-950/90 border-rose-500 shadow-md ring-1 ring-rose-500 text-rose-100'
                : 'bg-stone-900/40 border-stone-800 text-stone-400'
            }`}
          >
            <div className="font-semibold text-xs text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>High / Critical</span>
            </div>
            <ArrowDown className="w-3 h-3 text-stone-600" />
            <div className="px-3 py-1 rounded bg-rose-950/90 border border-rose-800 text-rose-300 text-xs font-bold w-full">
              Alert Triggered
            </div>
            <ArrowDown className="w-3 h-3 text-stone-600" />
            <div className="px-3 py-1 rounded bg-amber-950/80 border border-amber-800 text-amber-300 text-xs font-semibold w-full flex items-center justify-center gap-1">
              <HeartHandshake className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Human Intervention</span>
            </div>
            <ArrowDown className="w-3 h-3 text-stone-600" />
            <div className="px-3 py-1 rounded bg-stone-800 border border-stone-700 text-stone-200 text-xs font-medium w-full flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Follow-up &amp; Recovery</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
