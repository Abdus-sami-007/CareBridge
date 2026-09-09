import React from 'react';
import {
  Layers,
  MessageCircle,
  PhoneCall,
  Mic,
  LayoutDashboard,
  ShieldCheck,
  Send,
  Sparkles,
  Radio
} from 'lucide-react';

interface ModuleArchitectureBarProps {
  activeRecordsCount: number;
  criticalCount: number;
  evalSource?: string;
  onRefresh: () => void;
  isLoading: boolean;
}

export const ModuleArchitectureBar: React.FC<ModuleArchitectureBarProps> = ({
  activeRecordsCount,
  criticalCount,
  evalSource,
  onRefresh,
  isLoading
}) => {
  return (
    <div className="bg-stone-900 text-stone-100 rounded-2xl p-5 border border-stone-800 shadow-md space-y-4">
      {/* Module Title & System Lineage */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-3.5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                Core Module Active
              </span>
              <span className="text-xs text-stone-400 font-mono">
                System: Victims of Atrocities Mental Health Distress Prediction
              </span>
            </div>
            <h2 className="text-base font-semibold text-white tracking-tight mt-0.5">
              Trauma Ingestion, Sanitization &amp; Dual Dashboard Distribution Engine
            </h2>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {criticalCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
              {criticalCount} Critical Priority Cases
            </span>
          )}

          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs bg-stone-800 text-stone-300 border border-stone-700">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>{activeRecordsCount} Ingested Records</span>
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-colors text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Refresh Ingestion Feeds"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Pipeline Diagram: Ingestion Channels -> Filter & AI Engine -> Dual Dashboard Delivery */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center text-xs">
        {/* Left: 5 Multi-Channel Ingestion Sources (4 cols) */}
        <div className="lg:col-span-4 bg-stone-950/70 p-3 rounded-xl border border-stone-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
            <span>Input Ingestion Channels</span>
            <span className="text-emerald-400 font-mono">5 Active</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
            <div className="flex items-center space-x-1.5 p-1.5 rounded bg-stone-900 border border-stone-800 text-stone-300">
              <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">Victim Web Portal</span>
            </div>
            <div className="flex items-center space-x-1.5 p-1.5 rounded bg-stone-900 border border-stone-800 text-stone-300">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">WhatsApp Bot</span>
            </div>
            <div className="flex items-center space-x-1.5 p-1.5 rounded bg-stone-900 border border-stone-800 text-stone-300">
              <Send className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="truncate">Telegram Bot</span>
            </div>
            <div className="flex items-center space-x-1.5 p-1.5 rounded bg-stone-900 border border-stone-800 text-stone-300">
              <PhoneCall className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">IVR Telephony</span>
            </div>
            <div className="col-span-2 flex items-center space-x-1.5 p-1.5 rounded bg-stone-900 border border-stone-800 text-stone-300">
              <Mic className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span className="truncate">Speech-to-Text / Voice Recording</span>
            </div>
          </div>
        </div>

        {/* Center: Processing Module (4 cols) */}
        <div className="lg:col-span-4 bg-stone-950/70 p-3 rounded-xl border border-stone-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
            <span>Trauma Ingestion &amp; AI Filter</span>
            <span className="text-amber-400 font-mono">SAMHSA Guarded</span>
          </div>
          <div className="p-2 rounded bg-stone-900 border border-stone-800 text-stone-300 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-stone-400">1. PII Redaction:</span>
              <span className="text-emerald-400 font-medium">Auto-Mask Identifiers</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-stone-400">2. Crisis Pre-Screen:</span>
              <span className="text-rose-400 font-medium">Imminent Harm Shield</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-stone-400">3. AI Evaluation:</span>
              <span className="text-sky-400 font-medium">Gemini 3.8 Flash (PCL-5)</span>
            </div>
          </div>
        </div>

        {/* Right: Dual Dashboard Feeds (4 cols) */}
        <div className="lg:col-span-4 bg-stone-950/70 p-3 rounded-xl border border-stone-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
            <span>Dual Destination Payloads</span>
            <span className="text-sky-400 font-mono">REST JSON</span>
          </div>
          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="p-1.5 rounded bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 flex items-center justify-between">
              <span className="font-semibold">1. Victim Dashboard Feed</span>
              <span className="text-[10px] text-emerald-400/80">Supportive &amp; Grounding</span>
            </div>
            <div className="p-1.5 rounded bg-sky-950/40 border border-sky-800/60 text-sky-300 flex items-center justify-between">
              <span className="font-semibold">2. Officials Dashboard Feed</span>
              <span className="text-[10px] text-sky-400/80">Triage &amp; Clinical Action</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
