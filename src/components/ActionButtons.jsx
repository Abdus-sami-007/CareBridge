import React, { useState } from 'react';
import { UserCheck, ShieldAlert, CheckCircle2, PhoneCall } from 'lucide-react';

export default function ActionButtons({ 
  caseId = 'AT-001', 
  victimName = 'Ravi Kumar',
  onActionComplete 
}) {
  const [actionStatus, setActionStatus] = useState(null);

  const handleDispatchCounselor = () => {
    setActionStatus({
      type: 'counselor',
      message: `Counselor dispatch requested for ${victimName} (${caseId}). Emergency dispatch team notified.`
    });
    alert(`Counselor dispatch request created for Case ${caseId}`);
    if (onActionComplete) onActionComplete('counselor');
  };

  const handleRequestProtection = () => {
    setActionStatus({
      type: 'protection',
      message: `Police Protection requested for Case ${caseId}. Patrol unit dispatched to ${victimName}'s location.`
    });
    alert(`Protection request created for Case ${caseId}`);
    if (onActionComplete) onActionComplete('protection');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Dispatch Counselor Button */}
        <button
          onClick={handleDispatchCounselor}
          className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
        >
          <UserCheck className="w-4 h-4" />
          <span>Dispatch Counselor</span>
        </button>

        {/* Request Protection Button */}
        <button
          onClick={handleRequestProtection}
          className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition-all duration-200 active:scale-95"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Request Protection</span>
        </button>
      </div>

      {/* Confirmation Banner */}
      {actionStatus && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionStatus.message}</span>
        </div>
      )}
    </div>
  );
}
