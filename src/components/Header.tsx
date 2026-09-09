import React from 'react';
import { Shield, ShieldAlert, PhoneCall, Sparkles, HeartPulse } from 'lucide-react';

interface HeaderProps {
  onOpenCrisisModal: () => void;
  hasCrisis: boolean;
  evalSource?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCrisisModal,
  hasCrisis,
  evalSource
}) => {
  return (
    <header className="border-b border-stone-200 bg-white/90 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-stone-900 text-stone-50 flex items-center justify-center shadow-sm">
            <HeartPulse className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-semibold text-stone-900 tracking-tight">
                Trauma Input Filter &amp; Scoring Engine
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200">
                SAMHSA Aligned
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Sanitizing sensitive disclosures, detecting acute distress, and generating AI trauma scores
            </p>
          </div>
        </div>

        {/* Status badges & Crisis Action */}
        <div className="flex items-center space-x-3">
          {evalSource && (
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs bg-stone-100 text-stone-700 border border-stone-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>
                {evalSource === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash' : 'Clinical Rule Engine'}
              </span>
            </div>
          )}

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-medium">Filter Active</span>
          </div>

          <button
            id="crisis-hotline-btn"
            onClick={onOpenCrisisModal}
            className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              hasCrisis
                ? 'bg-rose-600 text-white hover:bg-rose-700 animate-pulse'
                : 'bg-stone-100 text-stone-800 hover:bg-stone-200 border border-stone-300'
            }`}
          >
            {hasCrisis ? (
              <ShieldAlert className="w-4 h-4 text-white" />
            ) : (
              <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
            )}
            <span>Crisis Lifelines (988)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
