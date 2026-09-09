import React from 'react';
import { Eye, ShieldX, Brain, Zap, AlertCircle } from 'lucide-react';
import { TraumaScores } from '../types';

interface ClusterBreakdownProps {
  clusters: TraumaScores['clusters'];
}

export const ClusterBreakdown: React.FC<ClusterBreakdownProps> = ({ clusters }) => {
  const clusterData = [
    {
      key: 'intrusion',
      title: 'Intrusion / Re-experiencing',
      subtitle: 'Flashbacks, intrusive thoughts, nightmares, somatic triggers',
      icon: Eye,
      data: clusters.intrusion,
      color: 'indigo'
    },
    {
      key: 'avoidance',
      title: 'Avoidance Cues',
      subtitle: 'Avoiding trauma memories, external reminders, emotional isolation',
      icon: ShieldX,
      data: clusters.avoidance,
      color: 'amber'
    },
    {
      key: 'negativeCognitionMood',
      title: 'Negative Cognition & Mood',
      subtitle: 'Distorted self-blame, detachment, persistent negative emotions',
      icon: Brain,
      data: clusters.negativeCognitionMood,
      color: 'rose'
    },
    {
      key: 'hyperarousal',
      title: 'Hyperarousal & Reactivity',
      subtitle: 'Hypervigilance, exaggerated startle, insomnia, irritability',
      icon: Zap,
      data: clusters.hyperarousal,
      color: 'emerald'
    }
  ];

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'Severe':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Moderate':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Mild':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">
            Trauma Symptom Clusters (PCL-5 Aligned Dimensions)
          </h3>
          <p className="text-xs text-stone-500">
            AI dimensional analysis evaluating distinct psychological trauma manifestations
          </p>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-600">
          DSM-5 / ICD-11 Trauma Criteria
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {clusterData.map(({ key, title, subtitle, icon: Icon, data }) => (
          <div
            key={key}
            className="p-4 rounded-xl border border-stone-100 bg-stone-50/70 space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-white border border-stone-200 text-stone-700 shadow-2xs">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-stone-900">{title}</h4>
                  <p className="text-[11px] text-stone-600 line-clamp-1">{subtitle}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getLevelBadge(
                    data.level
                  )}`}
                >
                  {data.level}
                </span>
                <span className="text-xs font-mono font-bold text-stone-800">
                  {data.score}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  data.score >= 70
                    ? 'bg-rose-500'
                    : data.score >= 40
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.max(5, data.score)}%` }}
              />
            </div>

            {/* Identified indicators */}
            {data.indicators && data.indicators.length > 0 && (
              <div className="pt-1">
                <ul className="space-y-1">
                  {data.indicators.map((ind, i) => (
                    <li
                      key={i}
                      className="text-[11px] text-stone-600 flex items-start space-x-1.5 leading-snug"
                    >
                      <AlertCircle className="w-3 h-3 text-stone-400 shrink-0 mt-0.5" />
                      <span>{ind}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
