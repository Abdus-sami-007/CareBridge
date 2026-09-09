import React, { useState } from 'react';
import { Heart, Stethoscope, Sparkles, Wind, CheckCircle2, ChevronRight } from 'lucide-react';
import { TraumaScores } from '../types';

interface RecommendationsViewProps {
  scores: TraumaScores;
}

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({ scores }) => {
  const [activeGroundingTab, setActiveGroundingTab] = useState<'techniques' | 'breathing'>('techniques');
  const [breathingStep, setBreathingStep] = useState<string>('Ready');
  const [isBreathingActive, setIsBreathingActive] = useState<boolean>(false);

  const startBreathingCycle = () => {
    if (isBreathingActive) {
      setIsBreathingActive(false);
      setBreathingStep('Ready');
      return;
    }
    setIsBreathingActive(true);
    const steps = ['Inhale (4s)', 'Hold (4s)', 'Exhale (4s)', 'Rest (4s)'];
    let idx = 0;
    setBreathingStep(steps[idx]);

    const interval = setInterval(() => {
      idx = (idx + 1) % steps.length;
      setBreathingStep(steps[idx]);
    }, 4000);

    return () => clearInterval(interval);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Left 2 Cols: Empathetic Summary, Clinical Observations & Recommendations */}
      <div className="lg:col-span-2 space-y-4">
        {/* Empathetic Summary Card */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-3">
          <div className="flex items-center space-x-2 text-stone-900">
            <Heart className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-semibold">
              Empathetic Feedback (Dignity &amp; Validation)
            </h3>
          </div>
          <blockquote className="p-4 rounded-xl bg-stone-50 border-l-3 border-stone-800 text-stone-700 text-xs sm:text-sm leading-relaxed italic">
            "{scores.empatheticSummary}"
          </blockquote>
        </div>

        {/* Clinical Observations */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-3">
          <div className="flex items-center space-x-2 text-stone-900">
            <Stethoscope className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold">Clinical Observations &amp; Trauma Markers</h3>
          </div>
          <ul className="space-y-2">
            {scores.clinicalObservations.map((obs, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-xs text-stone-700 leading-relaxed">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{obs}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommended Care Pathway & Facilitator Guidance */}
        <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              Recommended Care Pathway
            </span>
            <p className="mt-1 text-xs text-stone-800 font-medium bg-emerald-50 text-emerald-900 p-3 rounded-xl border border-emerald-200">
              {scores.traumaInformedRecommendations.carePathway}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 block mb-2">
              Facilitator / Clinician Interaction Protocols
            </span>
            <div className="space-y-1.5">
              {scores.traumaInformedRecommendations.facilitatorGuidance.map((guide, idx) => (
                <div
                  key={idx}
                  className="text-xs text-stone-700 flex items-start space-x-2 p-2 rounded-lg bg-stone-50"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                  <span>{guide}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right 1 Col: Interactive Grounding Tool */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wind className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-semibold text-stone-900">
                Somatic Stabilization
              </h3>
            </div>
            <span className="text-[11px] font-mono text-stone-400">Grounding</span>
          </div>

          <div className="flex border-b border-stone-100 text-xs font-medium">
            <button
              onClick={() => setActiveGroundingTab('techniques')}
              className={`pb-2 px-3 border-b-2 transition-colors ${
                activeGroundingTab === 'techniques'
                  ? 'border-stone-900 text-stone-900'
                  : 'border-transparent text-stone-400 hover:text-stone-700'
              }`}
            >
              Sensory Anchors
            </button>
            <button
              onClick={() => setActiveGroundingTab('breathing')}
              className={`pb-2 px-3 border-b-2 transition-colors ${
                activeGroundingTab === 'breathing'
                  ? 'border-stone-900 text-stone-900'
                  : 'border-transparent text-stone-400 hover:text-stone-700'
              }`}
            >
              Box Breathing
            </button>
          </div>

          {activeGroundingTab === 'techniques' ? (
            <div className="space-y-2.5">
              <p className="text-xs text-stone-500 leading-relaxed">
                Recommended by AI to de-escalate acute sympathetic arousal:
              </p>
              {scores.traumaInformedRecommendations.immediateGrounding.map((grounding, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700 leading-relaxed"
                >
                  <span className="font-semibold text-stone-900 block mb-0.5">
                    Exercise {i + 1}
                  </span>
                  {grounding}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-center space-y-4">
              <p className="text-xs text-stone-600 leading-relaxed">
                Slow regulated breathing stimulates the vagus nerve and activates the parasympathetic relaxation response.
              </p>

              <div className="w-28 h-28 mx-auto rounded-full border-4 border-sky-400 flex items-center justify-center bg-white shadow-inner transition-all">
                <span className="text-xs font-bold text-sky-900 animate-pulse">
                  {breathingStep}
                </span>
              </div>

              <button
                type="button"
                onClick={startBreathingCycle}
                className={`w-full py-2 px-4 rounded-xl text-xs font-medium transition-colors ${
                  isBreathingActive
                    ? 'bg-rose-600 text-white hover:bg-rose-700'
                    : 'bg-stone-900 text-white hover:bg-stone-800'
                }`}
              >
                {isBreathingActive ? 'Stop Breathing Pacer' : 'Start 4-4-4-4 Box Breathing'}
              </button>
            </div>
          )}
        </div>

        {/* SAMHSA Core Principles reminder */}
        <div className="p-4 rounded-2xl border border-stone-200 bg-stone-50/70 text-xs text-stone-600 space-y-2">
          <div className="font-semibold text-stone-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Trauma-Informed Principles</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Ensure physical &amp; psychological safety, transparent trust, peer collaboration, patient voice/choice, and cultural humility throughout every stage of assessment.
          </p>
        </div>
      </div>
    </div>
  );
};
