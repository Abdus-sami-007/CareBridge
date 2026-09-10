import React from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';
import { TrendingUp, UserCheck, AlertCircle } from 'lucide-react';
import RiskBadge from './RiskBadge';

export default function DistressChart({ 
  victims = [], 
  selectedVictimId, 
  onSelectVictim, 
  checkins = [] 
}) {
  const currentVictim = victims.find(v => v.id === selectedVictimId) || victims[0] || {};

  // Formatter for chart data timeline
  const chartData = (checkins && checkins.length > 0) 
    ? checkins.map((item, idx) => ({
        time: item.created_at ? item.created_at.split(' ').pop() : `T-${idx}`,
        score: item.score || 0,
        risk: item.risk_category || 'LOW',
        message: item.message || ''
      }))
    : [
        { time: '08:00', score: 20 },
        { time: '12:00', score: 35 },
        { time: '16:00', score: 48 },
        { time: '18:00', score: 72 },
        { time: '19:30', score: currentVictim.latest_score || 85 }
      ];

  const latestScore = currentVictim.latest_score || 0;

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur-md">
      {/* Header with Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            <h2 className="text-base font-bold text-white tracking-wide uppercase">
              Distress Trend Timeline
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time score progression over recent check-ins
          </p>
        </div>

        {/* Victim Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-400 hidden sm:inline">Victim:</label>
          <select
            value={selectedVictimId || ''}
            onChange={(e) => onSelectVictim(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-100 text-xs font-bold py-2 px-3 rounded-xl focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 cursor-pointer transition-all shadow-inner"
          >
            {victims.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} — {v.case_id} ({v.risk_level})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Victim Summary Ribbon */}
      <div className="flex items-center justify-between p-3 mb-5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-slate-200 text-sm">
              {currentVictim.name} <span className="text-sky-400 font-mono">({currentVictim.case_id})</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Assigned: {currentVictim.assigned_officer || 'Officer Sharma'} • {currentVictim.contact_phone || 'Zone 1'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 hidden md:inline">Current Status:</span>
          <RiskBadge score={latestScore} category={currentVictim.risk_level} showScore={true} size="normal" />
        </div>
      </div>

      {/* Recharts Distress Timeline Line Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
            <XAxis 
              dataKey="time" 
              stroke="#94a3b8" 
              fontSize={11} 
              tickLine={false} 
            />
            <YAxis 
              domain={[0, 100]} 
              stroke="#94a3b8" 
              fontSize={11} 
              tickLine={false}
              ticks={[0, 20, 40, 60, 80, 100]}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs max-w-xs z-50">
                      <div className="font-bold text-slate-200 mb-1 flex items-center justify-between gap-2">
                        <span>Check-in at {data.time}</span>
                        <span className="text-sky-400 font-mono">Score: {data.score}</span>
                      </div>
                      {data.message && (
                        <p className="text-slate-400 italic text-[11px] border-t border-slate-800 pt-1.5 mt-1">
                          "{data.message}"
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            
            {/* Risk Threshold Reference Lines */}
            <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'CRITICAL (80)', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }} />
            <ReferenceLine y={60} stroke="#f97316" strokeDasharray="4 4" label={{ value: 'HIGH (60)', fill: '#f97316', fontSize: 10, position: 'insideTopRight' }} />

            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#0284c7" 
              strokeWidth={3} 
              dot={{ r: 5, fill: '#38bdf8', stroke: '#0284c7', strokeWidth: 2 }}
              activeDot={{ r: 8, fill: '#ef4444', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
