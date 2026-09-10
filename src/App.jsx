import React, { useState } from 'react';
import Header from './components/Header';
import OfficerDashboard from './pages/OfficerDashboard';
import VictimPortal from './pages/VictimPortal';
import { Smartphone, LayoutDashboard } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'portal'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-sky-500 selection:text-white flex flex-col font-sans">
      
      {/* Top Header Bar */}
      <Header 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'dashboard' ? (
          <OfficerDashboard />
        ) : (
          <VictimPortal />
        )}
      </main>

      {/* Quick View Switcher Floating Action Pill */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setCurrentView(currentView === 'dashboard' ? 'portal' : 'dashboard')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs shadow-2xl shadow-sky-600/50 border border-white/20 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          {currentView === 'dashboard' ? (
            <>
              <Smartphone className="w-4 h-4" />
              <span>Switch to Victim Portal</span>
            </>
          ) : (
            <>
              <LayoutDashboard className="w-4 h-4" />
              <span>Switch to Officer Dashboard</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
