import React, { useState } from 'react';
import { Play, Sparkles, AlertOctagon, Send } from 'lucide-react';

export default function DemoSimulator({ onSimulateCheckin }) {
  const [selectedCase, setSelectedCase] = useState('AT-001');
  const [customMsg, setCustomMsg] = useState('I am scared because they threatened me again and I don\'t feel safe.');

  const handleSimulate = (scoreLevel) => {
    let score = 91;
    let category = 'CRITICAL';
    let msg = customMsg;
    let triggers = ['intimidation', 'fear'];

    if (scoreLevel === 'HIGH') {
      score = 75;
      category = 'HIGH';
      msg = 'Someone followed me near my apartment complex.';
      triggers = ['stalking'];
    } else if (scoreLevel === 'MEDIUM') {
      score = 48;
      category = 'MEDIUM';
      msg = 'Got unwanted calls asking for details.';
      triggers = ['unwanted_contact'];
    }

    const payload = {
      id: `sim_${Date.now()}`,
      case_id: selectedCase,
      victim_id: selectedCase === 'AT-001' ? 'V001' : 'V002',
      victim_name: selectedCase === 'AT-001' ? 'Ravi Kumar' : 'Sita Devi',
      score: score,
      latest_score: score,
      risk_category: category,
      risk_level: category,
      message: msg,
      triggers: triggers,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    onSimulateCheckin(payload);
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 rounded-2xl border border-sky-500/30 p-4 mb-6 shadow-xl text-xs backdrop-blur-md">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Title Info */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 font-bold shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-wide text-sm">
                Realtime Simulator
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Simulate an incoming check-in from Telegram / Mobile Portal to test live dashboard alerts!
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-end">
          <button
            onClick={() => handleSimulate('CRITICAL')}
            className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-600/30 flex items-center gap-1.5 transition-all duration-150 active:scale-95 animate-pulse"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>Simulate 🔴 CRITICAL Alert (Score: 91)</span>
          </button>

          <button
            onClick={() => handleSimulate('HIGH')}
            className="px-3 py-2 rounded-xl bg-amber-600/80 hover:bg-amber-500 text-white font-semibold text-xs border border-amber-500/40 flex items-center gap-1.5 transition-all duration-150 active:scale-95"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Simulate 🟠 HIGH Check-in</span>
          </button>
        </div>

      </div>
    </div>
  );
}
