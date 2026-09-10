import React from 'react';
import { Users, AlertTriangle, AlertOctagon, ShieldCheck } from 'lucide-react';

export default function SummaryCards({ victims = [], activeFilter = 'ALL', setActiveFilter }) {
  // Calculate summary counts from victims list
  const totalVictims = victims.length || 20;
  const criticalCount = victims.filter(v => v.risk_level === 'CRITICAL' || v.latest_score >= 80).length;
  const highCount = victims.filter(v => v.risk_level === 'HIGH' || (v.latest_score >= 60 && v.latest_score < 80)).length;
  const mediumCount = victims.filter(v => v.risk_level === 'MEDIUM' || (v.latest_score >= 30 && v.latest_score < 60)).length;
  const lowCount = victims.filter(v => v.risk_level === 'LOW' || v.latest_score < 30).length;
  
  // Safe cases count (MEDIUM + LOW)
  const safeCount = mediumCount + lowCount;

  const cards = [
    {
      id: 'ALL',
      title: 'Total Victims',
      count: totalVictims,
      subtitle: 'Registered cases',
      icon: Users,
      color: 'from-blue-600/20 to-sky-600/10 border-blue-500/30 text-sky-400',
      badgeBg: 'bg-sky-500/10 text-sky-400',
      activeRing: 'ring-2 ring-sky-500 shadow-lg shadow-sky-500/20'
    },
    {
      id: 'CRITICAL',
      title: 'Critical',
      count: criticalCount,
      subtitle: 'Immediate action needed',
      icon: AlertOctagon,
      color: 'from-red-950/40 to-red-900/20 border-red-500/40 text-red-400',
      badgeBg: 'bg-red-500/20 text-red-400 animate-pulse',
      activeRing: 'ring-2 ring-red-500 shadow-lg shadow-red-500/20'
    },
    {
      id: 'HIGH',
      title: 'High Risk',
      count: highCount,
      subtitle: 'Elevated distress level',
      icon: AlertTriangle,
      color: 'from-amber-950/40 to-amber-900/20 border-amber-500/40 text-amber-400',
      badgeBg: 'bg-amber-500/20 text-amber-400',
      activeRing: 'ring-2 ring-amber-500 shadow-lg shadow-amber-500/20'
    },
    {
      id: 'SAFE',
      title: 'Safe / Low Risk',
      count: safeCount,
      subtitle: 'Medium (30-59) & Low (0-29)',
      icon: ShieldCheck,
      color: 'from-emerald-950/40 to-emerald-900/20 border-emerald-500/40 text-emerald-400',
      badgeBg: 'bg-emerald-500/20 text-emerald-400',
      activeRing: 'ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/20'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-6">
      {cards.map((card) => {
        const IconComponent = card.icon;
        const isActive = activeFilter === card.id;

        return (
          <button
            key={card.id}
            onClick={() => setActiveFilter && setActiveFilter(card.id)}
            className={`text-left p-4 rounded-2xl bg-slate-900/90 border bg-gradient-to-br transition-all duration-200 hover:scale-[1.02] cursor-pointer group backdrop-blur-md ${card.color} ${
              isActive ? card.activeRing : 'hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-slate-200">
                {card.title}
              </span>
              <div className={`p-2 rounded-xl border border-current/20 ${card.badgeBg}`}>
                <IconComponent className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl lg:text-4xl font-black tracking-tight text-white font-mono">
                {card.count}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {Math.round((card.count / Math.max(totalVictims, 1)) * 100)}% of total
              </span>
            </div>

            <p className="text-[11px] text-slate-400 mt-2 truncate">
              {card.subtitle}
            </p>
          </button>
        );
      })}
    </div>
  );
}
