import React from 'react';
import RiskBadge from './RiskBadge';
import ActionButtons from './ActionButtons';
import { AlertOctagon, X, Zap, ShieldAlert, FileText } from 'lucide-react';

export default function AlertModal({ alertData, onClose }) {
  if (!alertData) return null;

  const caseId = alertData.case_id || alertData.victim_case_id || 'AT-001';
  const victimName = alertData.victim_name || alertData.name || 'Ravi Kumar';
  const score = alertData.score || alertData.distress_score || 85;
  const riskCategory = alertData.risk_category || alertData.risk_level || 'CRITICAL';
  const message = alertData.message || 'I am scared because they threatened me again and I don\'t feel safe.';
  const triggers = alertData.triggers || alertData.trigger_factors || ['intimidation', 'fear'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-red-500/80 rounded-3xl p-6 shadow-2xl shadow-red-950/80 ring-4 ring-red-500/20 overflow-hidden transform transition-all scale-100">
        
        {/* Animated Emergency Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 via-rose-500 to-red-600 animate-pulse" />

        {/* Close Icon Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="h-12 w-12 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-500 animate-bounce">
            <AlertOctagon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-red-500 text-white font-extrabold text-[10px] tracking-wider uppercase animate-pulse">
                LIVE REALTIME ALERT
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2 mt-0.5">
              🚨 CRITICAL DISTRESS ALERT
            </h2>
          </div>
        </div>

        {/* Case Info Grid */}
        <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 mb-4 text-xs">
          <div>
            <span className="text-slate-400 font-medium">Case ID:</span>
            <div className="text-sm font-bold font-mono text-sky-400">{caseId}</div>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Victim Name:</span>
            <div className="text-sm font-bold text-slate-100">{victimName}</div>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Distress Score:</span>
            <div className="text-base font-black font-mono text-red-400">{score} / 100</div>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Risk Status:</span>
            <div className="mt-0.5">
              <RiskBadge score={score} category={riskCategory} size="small" />
            </div>
          </div>
        </div>

        {/* Triggers Section */}
        {triggers && triggers.length > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-xs">
            <div className="font-bold text-red-400 flex items-center gap-1.5 mb-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Detected Risk Triggers:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-300 capitalize font-medium">
              {triggers.map((trig, idx) => (
                <li key={idx}>• {trig.replace('_', ' ')}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Message Snippet */}
        <div className="mb-6 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
          <div className="font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span>Check-in Message:</span>
          </div>
          <p className="text-slate-200 italic leading-relaxed font-medium">
            "{message}"
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <ActionButtons 
            caseId={caseId} 
            victimName={victimName}
            onActionComplete={onClose} 
          />

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors"
          >
            Close Alert Window
          </button>
        </div>

      </div>
    </div>
  );
}
