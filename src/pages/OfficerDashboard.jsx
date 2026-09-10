import React, { useState, useEffect } from 'react';
import SummaryCards from '../components/SummaryCards';
import VictimTable from '../components/VictimTable';
import DistressChart from '../components/DistressChart';
import AlertModal from '../components/AlertModal';
import DemoSimulator from '../components/DemoSimulator';

import { getVictims } from '../services/victimService';
import { getCheckins } from '../services/checkinService';
import { supabase, isSupabaseConfigured } from '../services/supabase';

export default function OfficerDashboard() {
  const [victims, setVictims] = useState([]);
  const [selectedVictimId, setSelectedVictimId] = useState('V001');
  const [checkins, setCheckins] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  
  // Realtime Alert Modal State
  const [alertData, setAlertData] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load victims list from service
  const loadVictimsData = async () => {
    try {
      const data = await getVictims();
      setVictims(data);
      if (data.length > 0 && !selectedVictimId) {
        setSelectedVictimId(data[0].id);
      }
    } catch (err) {
      console.error("Error loading victims:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load check-in history for selected victim
  const loadCheckinsData = async (victimId) => {
    if (!victimId) return;
    try {
      const data = await getCheckins(victimId);
      setCheckins(data);
    } catch (err) {
      console.error("Error loading checkins:", err);
    }
  };

  useEffect(() => {
    loadVictimsData();
  }, []);

  useEffect(() => {
    if (selectedVictimId) {
      loadCheckinsData(selectedVictimId);
    }
  }, [selectedVictimId]);

  // Section 12 — Supabase Realtime Listener Setup
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    console.log("Setting up Supabase Realtime listener on 'checkins' table...");
    const channel = supabase
      .channel("checkins-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "checkins"
        },
        (payload) => {
          console.log("New check-in received via Supabase Realtime:", payload.new);
          
          // Refresh victims data
          loadVictimsData();

          // Trigger live CRITICAL alert pop-up if risk is CRITICAL
          if (
            payload.new.risk_category === "CRITICAL" || 
            payload.new.score >= 80
          ) {
            setAlertData(payload.new);
            setShowAlert(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Demo simulator trigger handler
  const handleSimulateCheckin = (simulatedRecord) => {
    // Update local victim score
    setVictims(prevVictims => {
      return prevVictims.map(v => {
        if (v.id === simulatedRecord.victim_id || v.case_id === simulatedRecord.case_id) {
          return {
            ...v,
            latest_score: simulatedRecord.score,
            risk_level: simulatedRecord.risk_category,
            last_checkin: 'Just now'
          };
        }
        return v;
      });
    });

    // If selected victim matches, push to checkins history chart
    if (selectedVictimId === simulatedRecord.victim_id) {
      setCheckins(prev => [...prev, simulatedRecord]);
    }

    // Trigger alert modal if critical
    if (simulatedRecord.risk_category === 'CRITICAL' || simulatedRecord.score >= 80) {
      setAlertData(simulatedRecord);
      setShowAlert(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* SIH Evaluation Interactive Simulator Toolbar */}
      <DemoSimulator onSimulateCheckin={handleSimulateCheckin} />

      {/* Summary Cards Row */}
      <SummaryCards 
        victims={victims} 
        activeFilter={activeFilter} 
        setActiveFilter={setActiveFilter} 
      />

      {/* Main Grid: Victim Triage & Distress Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Victim Triage Table (Left / Top) */}
        <div className="lg:col-span-7">
          <VictimTable 
            victims={victims}
            selectedVictimId={selectedVictimId}
            onSelectVictim={(id) => setSelectedVictimId(id)}
            activeFilter={activeFilter}
          />
        </div>

        {/* Distress Trend Chart (Right / Bottom) */}
        <div className="lg:col-span-5">
          <DistressChart 
            victims={victims}
            selectedVictimId={selectedVictimId}
            onSelectVictim={(id) => setSelectedVictimId(id)}
            checkins={checkins}
          />
        </div>

      </div>

      {/* Realtime Critical Alert Modal */}
      {showAlert && alertData && (
        <AlertModal 
          alertData={alertData} 
          onClose={() => setShowAlert(false)} 
        />
      )}

    </div>
  );
}
