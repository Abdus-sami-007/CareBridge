import React from 'react';
import { Activity, ShieldAlert, Heart, Compass, Flame } from 'lucide-react';
import { TraumaScores } from '../types';

interface ScoreGaugesProps {
  scores: TraumaScores;
}

export const ScoreGauges: React.FC<ScoreGaugesProps> = ({ scores }) => {
  const getScoreColor = (val: number, inverse = false) => {
    if (inverse) {
      // For resilience: high is good (emerald), low is amber/rose
      if (val >= 70) return 'text-emerald-600';
      if (val >= 45) return 'text-amber-600';
      return 'text-rose-600';
    }
    // For trauma / distress: high is severe (rose), low is mild (emerald)
    if (val >= 75) return 'text-rose-600';
    if (val >= 50) return 'text-amber-600';
    if (val >= 25) return 'text-sky-600';
    return 'text-emerald-600';
  };

  const getScoreBg = (val: number, inverse = false) => {
    if (inverse) {
      if (val >= 70) return 'bg-emerald-500';
      if (val >= 45) return 'bg-amber-500';
      return 'bg-rose-500';
    }
    if (val >= 75) return 'bg-rose-500';
    if (val >= 50) return 'bg-amber-500';
    if (val >= 25) return 'bg-sky-500';
    return 'bg-emerald-500';
  };

  const getUrgencyBadge = (level: string) => {
    switch (level) {
      case 'Severe / Crisis':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'High':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Moderate':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Alert for High or Crisis Scores */}
      {scores.urgencyLevel === 'Severe / Crisis' && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-semibold text-rose-900 text-sm">
              Critical Urgency Level: Immediate Supportive Intervention Indicated
            </h4>
            <p className="text-rose-700 mt-1 leading-relaxed">
              The AI scoring indicates acute psychological overwhelm or high vulnerability. Ensure the individual is offered immediate grounding and connected with qualified support (988 Lifeline or on-site facilitator).
            </p>
          </div>
        </div>
      )}

      {/* Grid of Key Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Trauma Impact */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Trauma Impact
            </span>
            <Activity className="w-4 h-4 text-stone-400" />
          </div>

          <div className="mt-3 flex items-baseline space-x-2">
            <span className={`text-3xl font-bold tracking-tight ${getScoreColor(scores.overallImpactScore)}`}>
              {scores.overallImpactScore}
            </span>
            <span className="text-xs text-stone-400 font-mono">/ 100</span>
          </div>

          <div className="mt-3 w-full bg-stone-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${getScoreBg(scores.overallImpactScore)}`}
              style={{ width: `${scores.overallImpactScore}%` }}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-stone-500">
            <span>Clinical Severity</span>
            <span className="font-medium text-stone-700">
              {scores.overallImpactScore >= 75
                ? 'Severe Functional Impact'
                : scores.overallImpactScore >= 50
                ? 'Moderate Disruption'
                : scores.overallImpactScore >= 25
                ? 'Mild Impact'
                : 'Minimal Disturbance'}
            </span>
          </div>
        </div>

        {/* Acute Distress Index */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Acute Distress
            </span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>

          <div className="mt-3 flex items-baseline space-x-2">
            <span className={`text-3xl font-bold tracking-tight ${getScoreColor(scores.acuteDistressScore)}`}>
              {scores.acuteDistressScore}
            </span>
            <span className="text-xs text-stone-400 font-mono">/ 100</span>
          </div>

          <div className="mt-3 w-full bg-stone-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${getScoreBg(scores.acuteDistressScore)}`}
              style={{ width: `${scores.acuteDistressScore}%` }}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-stone-500">
            <span>Somatic / Emotional Arousal</span>
            <span className="font-medium text-stone-700">
              {scores.acuteDistressScore >= 70 ? 'High Agitation' : scores.acuteDistressScore >= 40 ? 'Moderate Stress' : 'Regulated'}
            </span>
          </div>
        </div>

        {/* Resilience & Coping Capacity */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Resilience &amp; Agency
            </span>
            <Heart className="w-4 h-4 text-emerald-500" />
          </div>

          <div className="mt-3 flex items-baseline space-x-2">
            <span className={`text-3xl font-bold tracking-tight ${getScoreColor(scores.resilienceScore, true)}`}>
              {scores.resilienceScore}
            </span>
            <span className="text-xs text-stone-400 font-mono">/ 100</span>
          </div>

          <div className="mt-3 w-full bg-stone-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${getScoreBg(scores.resilienceScore, true)}`}
              style={{ width: `${scores.resilienceScore}%` }}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-stone-500">
            <span>Protective Factors</span>
            <span className="font-medium text-stone-700">
              {scores.resilienceScore >= 60 ? 'Strong Potential' : 'Needs Support'}
            </span>
          </div>
        </div>

        {/* Support Urgency Tier */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Urgency Tier
            </span>
            <Compass className="w-4 h-4 text-stone-400" />
          </div>

          <div className="my-2">
            <span
              className={`inline-block px-3 py-1 rounded-lg text-sm font-semibold border ${getUrgencyBadge(
                scores.urgencyLevel
              )}`}
            >
              {scores.urgencyLevel}
            </span>
          </div>

          <p className="text-[11px] text-stone-500 leading-snug">
            {scores.urgencyLevel === 'Severe / Crisis'
              ? 'Urgent safety plan and crisis specialist recommended.'
              : scores.urgencyLevel === 'High'
              ? 'Specialized trauma counseling and active somatic pacing.'
              : scores.urgencyLevel === 'Moderate'
              ? 'Trauma-informed therapeutic support and self-regulation.'
              : 'Supportive check-in and standard wellness resources.'}
          </p>
        </div>
      </div>
    </div>
  );
};
