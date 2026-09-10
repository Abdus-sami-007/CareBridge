import React, { useState } from 'react';
import RiskBadge from './RiskBadge';
import { Search, Eye, Phone, ChevronRight, Filter } from 'lucide-react';

export default function VictimTable({ 
  victims = [], 
  selectedVictimId, 
  onSelectVictim, 
  onTriggerAlert,
  activeFilter = 'ALL'
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter victims based on search and selected stat card filter
  const filteredVictims = victims.filter(victim => {
    const matchesSearch = 
      victim.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      victim.case_id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'CRITICAL') return victim.risk_level === 'CRITICAL' || victim.latest_score >= 80;
    if (activeFilter === 'HIGH') return victim.risk_level === 'HIGH' || (victim.latest_score >= 60 && victim.latest_score < 80);
    if (activeFilter === 'SAFE') return victim.latest_score < 60;
    return true;
  });

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl overflow-hidden backdrop-blur-md">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/50">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-wide uppercase">
              Victim Triage
            </h2>
            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-800 text-slate-300 font-mono">
              {filteredVictims.length} cases
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Select a victim row to inspect distress score timeline
          </p>
        </div>

        {/* Search Input Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Case ID or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
          />
        </div>
      </div>

      {/* Table Structure */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4">Case ID</th>
              <th className="py-3 px-4">Victim</th>
              <th className="py-3 px-4">Risk Level</th>
              <th className="py-3 px-4">Distress Score</th>
              <th className="py-3 px-4">Last Check-in</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {filteredVictims.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-500 text-xs">
                  No matching victim cases found.
                </td>
              </tr>
            ) : (
              filteredVictims.map((victim) => {
                const isSelected = victim.id === selectedVictimId;

                return (
                  <tr
                    key={victim.id}
                    onClick={() => onSelectVictim(victim.id)}
                    className={`cursor-pointer transition-all duration-150 group ${
                      isSelected 
                        ? 'bg-sky-500/10 border-l-4 border-l-sky-500 text-white' 
                        : 'hover:bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    {/* Case ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-400 group-hover:text-sky-300">
                      {victim.case_id}
                    </td>

                    {/* Victim Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-100">{victim.name}</div>
                      <div className="text-[10px] text-slate-400">{victim.location || 'Zone 1'}</div>
                    </td>

                    {/* Risk Badge */}
                    <td className="py-3.5 px-4">
                      <RiskBadge 
                        score={victim.latest_score} 
                        category={victim.risk_level} 
                      />
                    </td>

                    {/* Score Bar */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-black ${
                          victim.latest_score >= 80 ? 'text-red-400' :
                          victim.latest_score >= 60 ? 'text-amber-400' :
                          victim.latest_score >= 30 ? 'text-yellow-400' : 'text-emerald-400'
                        }`}>
                          {victim.latest_score}
                        </span>
                        <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              victim.latest_score >= 80 ? 'bg-red-500' :
                              victim.latest_score >= 60 ? 'bg-amber-500' :
                              victim.latest_score >= 30 ? 'bg-yellow-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${victim.latest_score}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Last Check-in */}
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {victim.last_checkin || 'Recently'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectVictim(victim.id);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-sky-400" />
                          <span>Timeline</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
