import React from 'react';
import {
  Activity,
  ArrowRight,
  Heart,
  LayoutDashboard,
  ShieldCheck,
  BrainCircuit,
  MessageSquare,
  Lock,
  Sparkles,
  CheckCircle2,
  Users,
  LineChart
} from 'lucide-react';
import TranslatedText from './TranslatedText';

export type AppSection = 'victimDashboard' | 'officialsDashboard';

interface HomeViewProps {
  onNavigate: (section: AppSection) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  return (
    <section className="space-y-8">
      {/* Main Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50/40 to-stone-50 p-6 sm:p-10 shadow-sm">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-emerald-100/60 blur-3xl" />
        <div className="absolute -left-12 -bottom-12 h-64 w-64 rounded-full bg-sky-100/60 blur-3xl" />
        
        <div className="relative max-w-4xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-100/80 px-3.5 py-1 text-xs font-semibold text-emerald-800 backdrop-blur-xs">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <TranslatedText>CareBridge Multi-Channel Monitoring & Support</TranslatedText>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-5xl leading-tight">
            <TranslatedText>
              Trauma-informed early intervention, routed securely to those who can help.
            </TranslatedText>
          </h1>

          <p className="text-sm leading-relaxed text-stone-600 sm:text-base max-w-2xl">
            <TranslatedText>
              CareBridge connects victims with private, compassionate check-in support while giving authorized responders sanitized, real-time triage directives and longitudinal progress tracking.
            </TranslatedText>
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate('victimDashboard')}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md active:scale-98"
            >
              <Heart className="h-4 w-4" />
              <TranslatedText>Enter Victim Support Space</TranslatedText>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('officialsDashboard')}
              className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-3 text-xs sm:text-sm font-semibold text-stone-800 shadow-xs transition-all hover:border-stone-400 hover:bg-stone-50 active:scale-98"
            >
              <LayoutDashboard className="h-4 w-4 text-stone-600" />
              <TranslatedText>Enter Officials Triage Console</TranslatedText>
            </button>
          </div>
        </div>
      </div>

      {/* Role Selection Portals Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900">
              <TranslatedText>Select Your Access Portal</TranslatedText>
            </h2>
            <p className="text-xs text-stone-500">
              <TranslatedText>Choose the portal matching your assigned system role.</TranslatedText>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Victim Dashboard Card */}
          <div
            onClick={() => onNavigate('victimDashboard')}
            className="group relative cursor-pointer rounded-2xl border border-emerald-200 bg-white p-6 shadow-xs transition-all hover:border-emerald-400 hover:shadow-md flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700">
                  <Heart className="h-6 w-6" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                  <Lock className="h-3 w-3" />
                  <TranslatedText>Confidential & Private</TranslatedText>
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-stone-900 group-hover:text-emerald-700 transition-colors">
                  <TranslatedText>Victim Support Portal</TranslatedText>
                </h3>
                <p className="mt-1.5 text-xs text-stone-600 leading-relaxed">
                  <TranslatedText>
                    A private, trauma-informed space for victims to complete check-ins, receive instant empathetic grounding AI responses, monitor stress score history, and access support contacts.
                  </TranslatedText>
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-stone-100 text-xs text-stone-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <TranslatedText>Empathetic voice & text AI check-in assistance</TranslatedText>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <TranslatedText>AI-estimated distress score & coping exercises</TranslatedText>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <TranslatedText>Cross-channel Telegram & web check-in history</TranslatedText>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between text-xs font-semibold text-emerald-700 group-hover:text-emerald-800">
              <TranslatedText>Open Victim Dashboard</TranslatedText>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Officials Dashboard Card */}
          <div
            onClick={() => onNavigate('officialsDashboard')}
            className="group relative cursor-pointer rounded-2xl border border-sky-200 bg-white p-6 shadow-xs transition-all hover:border-sky-400 hover:shadow-md flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-sky-100 p-3 text-sky-700">
                  <LayoutDashboard className="h-6 w-6" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-semibold text-sky-700 border border-sky-200">
                  <ShieldCheck className="h-3 w-3" />
                  <TranslatedText>Authorized Responders</TranslatedText>
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-stone-900 group-hover:text-sky-700 transition-colors">
                  <TranslatedText>Officials & Authorities Triage Console</TranslatedText>
                </h3>
                <p className="mt-1.5 text-xs text-stone-600 leading-relaxed">
                  <TranslatedText>
                    Real-time responder workspace presenting sanitized multi-channel disclosures (WhatsApp, Telegram, IVR, Web), priority risk matrix (Red/Amber/Yellow/Green), and official action directives.
                  </TranslatedText>
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-stone-100 text-xs text-stone-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-sky-600 shrink-0" />
                  <TranslatedText>Automated PII redaction & identity protection</TranslatedText>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-sky-600 shrink-0" />
                  <TranslatedText>Longitudinal distress baseline vs check-in trends</TranslatedText>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-sky-600 shrink-0" />
                  <TranslatedText>Role-based sub-official accounts & case management</TranslatedText>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between text-xs font-semibold text-sky-700 group-hover:text-sky-800">
              <TranslatedText>Open Officials Dashboard</TranslatedText>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 font-semibold">
            <TranslatedText>System Architecture</TranslatedText>
          </span>
          <h2 className="text-base sm:text-xl font-bold text-stone-900">
            <TranslatedText>How CareBridge Early Intervention Works</TranslatedText>
          </h2>
          <p className="text-xs text-stone-500">
            <TranslatedText>Three-stage trauma disclosure processing and emergency routing pipeline.</TranslatedText>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-stone-100 bg-stone-50/70 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[11px] text-white">1</span>
              <TranslatedText>Multi-Channel Ingestion</TranslatedText>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              <TranslatedText>
                Disclosures received across Web, Telegram bot, WhatsApp, IVR phone calls, or speech audio are aggregated into protected storage.
              </TranslatedText>
            </p>
          </div>

          <div className="rounded-xl border border-stone-100 bg-stone-50/70 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[11px] text-white">2</span>
              <TranslatedText>AI Sanitization & Scoring</TranslatedText>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              <TranslatedText>
                PII elements are automatically redacted. Gemini 3.8 Flash estimates trauma severity (0–100) and computes distress predictions against stored baselines.
              </TranslatedText>
            </p>
          </div>

          <div className="rounded-xl border border-stone-100 bg-stone-50/70 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[11px] text-white">3</span>
              <TranslatedText>Responders Protocol Triage</TranslatedText>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              <TranslatedText>
                Cases are assigned a triage priority badge (Critical Red, Elevated Amber, Monitor Yellow, Stable Green) with recommended action directives.
              </TranslatedText>
            </p>
          </div>
        </div>
      </div>

      {/* Safety & Multi-Lingual Footer Feature Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-1">
          <ShieldCheck className="h-5 w-5 mx-auto text-emerald-600" />
          <div className="text-xs font-semibold text-stone-800"><TranslatedText>PII Protection</TranslatedText></div>
          <div className="text-[10px] text-stone-500"><TranslatedText>Sanitized narratives</TranslatedText></div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-1">
          <LineChart className="h-5 w-5 mx-auto text-sky-600" />
          <div className="text-xs font-semibold text-stone-800"><TranslatedText>Longitudinal Trends</TranslatedText></div>
          <div className="text-[10px] text-stone-500"><TranslatedText>Doctor baseline comparison</TranslatedText></div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-1">
          <MessageSquare className="h-5 w-5 mx-auto text-indigo-600" />
          <div className="text-xs font-semibold text-stone-800"><TranslatedText>Telegram Sync</TranslatedText></div>
          <div className="text-[10px] text-stone-500"><TranslatedText>Bot & Web check-in integration</TranslatedText></div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-1">
          <Activity className="h-5 w-5 mx-auto text-rose-600" />
          <div className="text-xs font-semibold text-stone-800"><TranslatedText>23 Languages</TranslatedText></div>
          <div className="text-[10px] text-stone-500"><TranslatedText>Real-time UI translation</TranslatedText></div>
        </div>
      </div>
    </section>
  );
};