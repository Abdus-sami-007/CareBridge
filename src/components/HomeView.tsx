import React from 'react';
import { Activity, ArrowRight, Heart, LayoutDashboard } from 'lucide-react';

export type AppSection = 'victimDashboard' | 'officialsDashboard';

interface HomeViewProps {
  onNavigate: (section: AppSection) => void;
}

const destinations: Array<{
  section: AppSection;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}> = [
  {
    section: 'victimDashboard',
    title: 'Victim Dashboard',
    description: 'Open a private, trauma-informed space for check-ins, grounding support, wellbeing status, and assigned care.',
    icon: Heart,
    accent: 'border-emerald-800 bg-emerald-950/50 text-emerald-300'
  },
  {
    section: 'officialsDashboard',
    title: 'Officials Dashboard',
    description: 'Review sanitized triage records, risk levels, escalation signals, and recommended intervention protocols.',
    icon: LayoutDashboard,
    accent: 'border-sky-800 bg-sky-950/50 text-sky-300'
  },
];

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  return (
    <section className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white px-6 py-8 sm:px-10 sm:py-12">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-emerald-50 to-transparent" />
        <div className="relative max-w-3xl">
          <div className="mb-4 flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em] text-emerald-700">
            <Activity className="h-4 w-4" />
            CareBridge
          </div>
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
            Trauma-informed signals, routed to the people who can help.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-500 sm:text-base">
            Choose the protected CareBridge dashboard that matches your role.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate('victimDashboard')}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-stone-950 transition-colors hover:bg-emerald-400"
            >
              Enter Victim Dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('officialsDashboard')}
              className="inline-flex items-center gap-2 rounded-lg border border-stone-700 px-4 py-2.5 text-sm font-semibold text-stone-200 transition-colors hover:border-stone-500 hover:bg-stone-50"
            >
              Enter Officials Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {destinations.map(({ section, title, description, icon: Icon, accent }) => (
          <button
            key={section}
            type="button"
            onClick={() => onNavigate(section)}
            className="group rounded-xl border border-stone-200 bg-white/80 p-5 text-left transition-colors hover:border-stone-600 hover:bg-stone-50"
          >
            <div className="flex items-start justify-between gap-4">
              <span className={`rounded-lg border p-2 ${accent}`}>
                <Icon className="h-5 w-5" />
              </span>
              <ArrowRight className="h-4 w-4 text-stone-400 transition-transform group-hover:translate-x-1 group-hover:text-stone-300" />
            </div>
            <h3 className="mt-5 text-sm font-semibold text-stone-900">{title}</h3>
            <p className="mt-2 text-xs leading-6 text-stone-500">{description}</p>
          </button>
        ))}
      </div>

    </section>
  );
};