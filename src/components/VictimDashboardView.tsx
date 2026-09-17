import React, { useState, useEffect } from 'react';
import TranslatedText from './TranslatedText';
import {
  VictimDashboardPayload,
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
  selectedVictimId: string;
  onLogout: () => void;
  onChatCompleted: (result: PipelineExecutionResult) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const VictimDashboardView: React.FC<VictimDashboardViewProps> = ({
  payload,
  selectedVictimId,
  onLogout,
  onChatCompleted,
  onRefresh,
  isLoading
}) => {
  const [copied, setCopied] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Pause'>('Inhale');
  const [breathingSeconds, setBreathingSeconds] = useState(4);
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

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

  useEffect(() => {
    let cancelled = false;
    if (!selectedVictimId) return;
    setAnalysisError(null);
    fetch(`/api/analysis/victim/${encodeURIComponent(selectedVictimId)}`)
      .then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Unable to load analysis.'); return d; })
      .then(d => { if (!cancelled) setAnalysis(d); })
      .catch(e => { if (!cancelled) setAnalysisError(e instanceof Error ? e.message : 'Unable to load analysis.'); });
    return () => { cancelled = true; };
  }, [selectedVictimId, payload?.lastUpdated]);

  const handleCopyJson = () => {
    if (!payload) return;
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
        <div>
          <div className="text-xs font-semibold text-stone-900"><TranslatedText>Your protected case</TranslatedText></div>
          <div className="text-[10px] text-stone-500"><TranslatedText>Case ID:</TranslatedText> <span className="font-mono">{selectedVictimId}</span>. <TranslatedText>Your case cannot be changed while signed in.</TranslatedText></div>
        </div>
        <button type="button" onClick={onLogout} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"><TranslatedText>Log out</TranslatedText></button>
      </div>

      {/* The check-in assistant starts with the dashboard. It never submits synthetic data. */}
      <VictimAiChat victimId={selectedVictimId} onCompleted={onChatCompleted} />

      {analysis && (
        <section className="rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div><h3 className="text-sm font-semibold text-stone-900"><TranslatedText>Your progress over time</TranslatedText></h3><p className="text-[11px] text-stone-500"><TranslatedText>Based only on your saved check-ins and the clinician's initial score.</TranslatedText></p></div>
            <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-700"><TranslatedText>{analysis.summary.direction}</TranslatedText></span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-stone-50 p-3"><div className="text-[10px] text-stone-500"><TranslatedText>Initial score</TranslatedText></div><div className="text-xl font-bold">{analysis.summary.checkinCount ? analysis.victim.baseline_distress_score : analysis.victim.baseline_distress_score}/100</div></div>
            <div className="rounded-xl bg-stone-50 p-3"><div className="text-[10px] text-stone-500"><TranslatedText>Latest score</TranslatedText></div><div className="text-xl font-bold">{analysis.summary.latestScore}/100</div></div>
            <div className="rounded-xl bg-stone-50 p-3"><div className="text-[10px] text-stone-500"><TranslatedText>Average</TranslatedText></div><div className="text-xl font-bold">{analysis.summary.averageScore}/100</div></div>
            <div className="rounded-xl bg-stone-50 p-3"><div className="text-[10px] text-stone-500"><TranslatedText>Check-ins</TranslatedText></div><div className="text-xl font-bold">{analysis.summary.checkinCount}</div></div>
          </div>
          <div className="mt-4 flex h-32 items-end gap-2 rounded-xl border border-stone-100 bg-stone-50 p-3">
            <div className="h-full flex w-12 flex-col justify-end items-center"><span className="text-[9px] text-stone-500">{analysis.victim.baseline_distress_score}</span><div className="w-full rounded-t bg-indigo-300" style={{height:`${Math.max(5, Number(analysis.victim.baseline_distress_score))}%`}} /><span className="mt-1 text-[9px] text-stone-500"><TranslatedText>Doctor</TranslatedText></span></div>
            {analysis.history.slice(-8).map((h:any) => <div key={h.id} className="h-full flex-1 min-w-0 flex flex-col justify-end items-center" title={new Date(h.createdAt).toLocaleString()}><span className="text-[9px] text-stone-500">{h.score}</span><div className="w-full max-w-8 rounded-t bg-emerald-400" style={{height:`${Math.max(5, Number(h.score))}%`}} /><span className="mt-1 max-w-full truncate text-[8px] text-stone-400">{new Date(h.createdAt).toLocaleDateString(undefined,{month:'short',day:'numeric'})}</span></div>)}
          </div>
          {analysis.victim.doctor_name && <p className="mt-2 text-[10px] text-stone-500"><TranslatedText>Initial assessment by</TranslatedText> {analysis.victim.doctor_name}. {analysis.victim.doctor_notes ? <TranslatedText>{analysis.victim.doctor_notes}</TranslatedText> : ''}</p>}
        </section>
      )}
      {analysisError && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{analysisError}</div>}

      {!payload && (
        <div className="rounded-2xl border border-emerald-100 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto max-w-lg">
            <h3 className="text-sm font-semibold text-stone-900"><TranslatedText>Your check-in space is ready</TranslatedText></h3>
            <p className="mt-2 text-xs leading-6 text-stone-500">
              <TranslatedText>
                There is no previous assessment for this case yet. Send a real check-in above to start the pipeline. Your message is screened, scored, classified, and saved to the database.
              </TranslatedText>
            </p>
          </div>
        </div>
      )}

      {payload && (
        <>
      {/* Header & Endpoint Tag */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
              REST Endpoint: GET /api/dashboards/victim/:victimId
            </span>
            <span className="text-xs text-stone-500 font-mono"><TranslatedText>Victim Recovery Portal Feed</TranslatedText></span>
          </div>
          <h3 className="text-base font-semibold text-stone-900 mt-1 flex items-center gap-2">
            <span><TranslatedText>Victim Sanctuary Dashboard Feed</TranslatedText></span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-700">
              ID: {payload.victimId}
            </span>
          </h3>
          <p className="text-xs text-stone-500">
            <TranslatedText>Dignifying, calm, and protective interface presented directly to the affected individual</TranslatedText>
          </p>
        </div>

        <button
          onClick={handleCopyJson}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? <TranslatedText>Copied Victim JSON</TranslatedText> : <TranslatedText>Export Victim Feed (JSON)</TranslatedText>}</span>
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
              <span className="text-xs font-semibold uppercase tracking-wider"><TranslatedText>Sanctuary Message</TranslatedText></span>
            </div>
            <p className="text-xs sm:text-sm text-stone-800 leading-relaxed font-serif italic">
              "<TranslatedText>{payload.compassionateGreeting}</TranslatedText>"
            </p>
            <div className="flex items-center space-x-2 pt-1 text-xs">
              <span className="text-stone-500"><TranslatedText>Current Wellness Status:</TranslatedText></span>
              <span className="font-semibold px-2.5 py-0.5 rounded-full bg-white border border-emerald-300 text-emerald-900">
                <TranslatedText>{payload.plainTextDistressLevel}</TranslatedText>
              </span>
            </div>
          </div>

          {/* Supportive Insights */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3 shadow-xs">
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-amber-500" />
              <TranslatedText>Supportive Reflections &amp; Understanding</TranslatedText>
            </h4>
            <div className="space-y-2">
              {payload.supportiveInsights.map((insight, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-stone-50 text-xs text-stone-700 leading-relaxed border border-stone-100 flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span><TranslatedText>{insight}</TranslatedText></span>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Grounding Exercises */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-3 shadow-xs">
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              <TranslatedText>Personal Somatic Grounding Exercises</TranslatedText>
            </h4>
            <div className="space-y-2">
              {payload.dailyGroundingExercises.map((ex, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-indigo-50/40 border border-indigo-100 text-xs text-stone-800 leading-relaxed">
                  <TranslatedText>{ex}</TranslatedText>
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
                <TranslatedText>Real-Time Box Breathing Pacer</TranslatedText>
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
                {isBreathingActive ? <TranslatedText>Pause Exercise</TranslatedText> : <TranslatedText>Start Pacing</TranslatedText>}
              </button>
            </div>

            <div className="py-4">
              <div className="w-28 h-28 mx-auto rounded-full border-4 border-sky-300 bg-sky-50 flex flex-col items-center justify-center transition-all duration-700 shadow-inner">
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-900">
                  {isBreathingActive ? <TranslatedText>{breathingPhase}</TranslatedText> : <TranslatedText>Relax</TranslatedText>}
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
              <div className="text-[11px] text-stone-500 uppercase tracking-wider"><TranslatedText>Your Assigned Advocate</TranslatedText></div>
              <div className="text-xs font-semibold text-stone-900"><TranslatedText>{payload.allocatedSupportWorker}</TranslatedText></div>
              <div className="text-[10px] text-emerald-600"><TranslatedText>Confidential</TranslatedText> &bull; <TranslatedText>Free Support</TranslatedText></div>
            </div>
          </div>

          {/* 24/7 Crisis Support Contacts */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-2.5">
            <div className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-rose-500" />
              <TranslatedText>Verified Safe Lifelines (24/7)</TranslatedText>
            </div>
            <div className="space-y-2">
              {payload.crisisContacts.map((contact, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-stone-50 border border-stone-100 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-stone-800"><TranslatedText>{contact.name}</TranslatedText></div>
                    <div className="text-[10px] text-stone-500"><TranslatedText>{contact.description}</TranslatedText></div>
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
              <span><TranslatedText>Cryptographic Privacy Guarantee</TranslatedText></span>
            </div>
            <p className="text-[11px] text-stone-400 leading-relaxed">
              <TranslatedText>{payload.privacyConfirmation}</TranslatedText>
            </p>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
