import React from 'react';
import { Shield, Bell, Activity, Smartphone, LayoutDashboard, UserCheck, Wifi } from 'lucide-react';

export default function Header({ currentView, setCurrentView, alertCount = 3, isLive = true }) {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-bold ring-1 ring-white/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                CareBridge
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Victim Distress & Safety Monitoring System
            </p>
          </div>
        </div>

        {/* View Switching Navigation */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800/80 shadow-inner">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              currentView === 'dashboard'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Officer Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentView('portal')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              currentView === 'portal'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Victim Portal</span>
          </button>
        </div>

        {/* Status & Alerts Right Bar */}
        <div className="flex items-center gap-3">
          {/* Realtime Socket Status Indicator */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Wifi className="w-3.5 h-3.5" />
            <span>Realtime Listening</span>
          </div>

          {/* Alert Notification Bell */}
          <div className="relative">
            <button 
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 transition-colors relative"
              title="Realtime Alerts"
            >
              <Bell className="w-4 h-4 text-slate-200" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-md shadow-red-600/50 animate-bounce">
                  {alertCount}
                </span>
              )}
            </button>
          </div>

          {/* Officer Avatar */}
          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold">
              <UserCheck className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-left text-xs">
              <div className="font-semibold text-slate-200">Officer Portal</div>
              <div className="text-[10px] text-slate-400">Zone-1 Monitoring</div>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}
