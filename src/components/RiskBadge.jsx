import React from 'react';
import { getRiskMeta } from '../utils/riskUtils';

export default function RiskBadge({ score, category, showScore = false, size = 'normal' }) {
  const meta = getRiskMeta(category !== undefined ? category : score);
  
  const sizeClasses = size === 'small' 
    ? 'px-2 py-0.5 text-xs' 
    : size === 'large' 
      ? 'px-3.5 py-1.5 text-sm font-bold' 
      : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm backdrop-blur-sm transition-all ${meta.badgeStyle} ${sizeClasses}`}>
      <span className="text-xs leading-none">{meta.emoji}</span>
      <span className="tracking-wide uppercase">{meta.category}</span>
      {showScore && score !== undefined && (
        <span className="ml-1 pl-1 border-l border-current/30 text-[11px] opacity-90 font-mono">
          {score}
        </span>
      )}
    </span>
  );
}
