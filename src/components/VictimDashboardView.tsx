import React, { useState, useEffect } from 'react';
import {
  VictimDashboardPayload,
  VictimDbRecord,
  PipelineExecutionResult
} from '../types';
import {
  Heart,
  ShieldCheck,
  Phone,
  Sparkles,
  Smile,
  Copy,
  Check,
  UserCheck,
  Wind
} from 'lucide-react';
import { VictimAiChat } from './VictimAiChat';

interface VictimDashboardViewProps {
  payload: VictimDashboardPayload | null;
  victims: VictimDbRecord[];
  selectedVictimId: string;
  onVictimChange: (victimId: string) => void;
  onChatCompleted: (result: PipelineExecutionResult) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const VictimDashboardView: React.FC<VictimDashboardViewProps> = ({
  payload,
  victims,
  selectedVictimId,
  onVictimChange,
  onChatCompleted,
  onRefresh,
  isLoading
}) => {
  const [copied, setCopied] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Pause'>('Inhale');
  const [breathingSeconds, setBreathingSeconds] = useState(4);
  const [isBreathingActive, setIsBreathingActive] = useState(false);

  // Box breathing interval
  useEffect(() => {
    if (!isBreathingActive) return;

    const timer = setInterval(() => {
      setBreathingSeconds((prev) => {
        if (prev > 1) return prev - 1;

        setBreathingPhase((current) => {
          switch (current) {
            case 'Inhale': return 'Hold';
            case 'Hold': return 'Exhale';
            case 'Exhale': return 'Pause';
            default: return 'Inhale';
          }
        });
        return 4;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isBreathingActive]);

  const handleCopyJson = () => {
    if (!payload) return;
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!payload) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center text-xs text-stone-500">
        No victim dashboard feed generated yet. Ingest a disclosure above to produce the victim dashboard view.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <VictimAiChat victimId={selectedVictimId} onCompleted={onChatCompleted} />
      {/* Header & Endpoint Tag */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
              REST Endpoint: GET /api/dashboards/victim/:victimId
            </span>
            <span className="text-xs text-stone-500 font-mono">Victim Recovery Portal Feed</span>
          </div>
          <h3 className="text-base font-semibold text-stone-900 mt-1 flex items-center gap-2">
            <span>Victim Sanctuary Dashboard Feed</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-700">
              ID: {payload.victimId}
            </span>
          </h3>
          <label className="mt-3 flex items-center gap-2 text-xs text-stone-500">
            Victim record
            <select value={selectedVictimId} onChange={event => onVictimChange(event.target.value)} className="rounded-lg border border-stone-200 bg-white px-2 py-1 font-mono text-[11px] text-stone-700">
              {victims.map(victim => <option key={victim.id} value={victim.id}>{victim.name} ({victim.id})</option>)}
            </select>
          </label>
          <p className="text-xs text-stone-500">
            Dignifying, calm, and protective interface presented directly to the affected individual
          </p>
        </div>

        <button
          onClick={handleCopyJson}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied Victim JSON' : 'Export Victim Feed (JSON)'}</span>
        </button>
      </div>

      {/* Main Sanctuary Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Emotional State & Grounding Support (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Compassionate Greeting */}
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-stone-50 p-5 space-y-3">
            <div className="flex items-center space-x-2 text-emerald-800">
              <Heart className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold uppercase tracking-wider">Sanctuary Message</span>
            </div>
            <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-serif italic">
              "{payload.compassionateGreeting}"
            </p>
            <div className="flex items-center space-x-2 pt-1 text-xs">
              <span className="text-stone-500">Current Wellness Status:</span>
              <span className="font-semibold px-2.5 py-0.5 rounded-full bg-white border border-emerald-300 text-emerald-900">
                {payload.plainTextDistressLevel}
              </span>
            </div>
          </div>

          {/* Supportive Insights */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3 shadow-xs">
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-amber-500" />
              Supportive Reflections &amp; Understanding
            </h4>
            <div className="space-y-2">
              {payload.supportiveInsights.map((insight, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-stone-50 text-xs text-stone-700 leading-relaxed border border-stone-100 flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Grounding Exercises */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3 shadow-xs">
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Personal Somatic Grounding Exercises
            </h4>
            <div className="space-y-2">
              {payload.dailyGroundingExercises.map((ex, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-indigo-50/40 border border-indigo-100 text-xs text-stone-800 leading-relaxed">
                  {ex}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Interactive Breathing & Care Contacts (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Somatic Breathing Pacer */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-3.5 text-center">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-sky-500" />
                Real-Time Box Breathing Pacer
              </span>
              <button
                type="button"
                onClick={() => setIsBreathingActive(!isBreathingActive)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  isBreathingActive
                    ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                    : 'bg-sky-100 text-sky-800 hover:bg-sky-200'
                }`}
              >
                {isBreathingActive ? 'Pause Exercise' : 'Start Pacing'}
              </button>
            </div>

            <div className="py-4">
              <div className="w-28 h-28 mx-auto rounded-full border-4 border-sky-300 bg-sky-50 flex flex-col items-center justify-center transition-all duration-700 shadow-inner">
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-900">
                  {isBreathingActive ? breathingPhase : 'Relax'}
                </span>
                <span className="text-2xl font-bold text-sky-800 font-mono mt-0.5">
                  {isBreathingActive ? breathingSeconds : '4s'}
                </span>
              </div>
              <p className="text-[11px] text-stone-500 mt-2">
                4s Inhale &bull; 4s Hold &bull; 4s Exhale &bull; 4s Pause
              </p>
            </div>
          </div>

          {/* Assigned Support Worker */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-stone-500 uppercase tracking-wider">Your Assigned Advocate</div>
              <div className="text-xs font-semibold text-stone-900">{payload.allocatedSupportWorker}</div>
              <div className="text-[10px] text-emerald-600">Confidential &bull; Free Support</div>
            </div>
          </div>

          {/* 24/7 Crisis Support Contacts */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-2.5">
            <div className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-rose-500" />
              Verified Safe Lifelines (24/7)
            </div>
            <div className="space-y-2">
              {payload.crisisContacts.map((contact, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-stone-800">{contact.name}</div>
                    <div className="text-[10px] text-stone-500">{contact.description}</div>
                  </div>
                  <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded border border-rose-200">
                    {contact.contact}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy Guarantee */}
          <div className="p-3.5 rounded-xl bg-stone-900 text-stone-200 text-xs space-y-1">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Cryptographic Privacy Guarantee</span>
            </div>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              {payload.privacyConfirmation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
