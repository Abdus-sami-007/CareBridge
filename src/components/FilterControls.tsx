import React from 'react';
import { Shield, Lock, Eye, EyeOff, AlertTriangle, UserX, Tag, CheckCircle2 } from 'lucide-react';
import { FilterSettings, FilterResult } from '../types';

interface FilterControlsProps {
  settings: FilterSettings;
  onChangeSettings: (newSettings: FilterSettings) => void;
  liveFilterResult: FilterResult | null;
  hasInput: boolean;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  settings,
  onChangeSettings,
  liveFilterResult,
  hasInput
}) => {
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-emerald-700" />
          <h3 className="text-sm font-semibold text-stone-900">
            Trauma-Informed Filter Guardrails
          </h3>
        </div>
        <span className="text-xs text-stone-500 font-mono">
          Pre-AI Sanitization &amp; Safety Layer
        </span>
      </div>

      {/* Filter Toggle Options */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* PII Redaction */}
        <label className="flex items-start space-x-2.5 p-2.5 rounded-lg bg-white border border-stone-200 cursor-pointer hover:border-stone-300 transition-colors">
          <input
            type="checkbox"
            id="toggle-redact-pii"
            checked={settings.redactPii}
            onChange={(e) =>
              onChangeSettings({ ...settings, redactPii: e.target.checked })
            }
            className="mt-0.5 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
          />
          <div className="text-xs">
            <div className="font-medium text-stone-900 flex items-center gap-1">
              <UserX className="w-3.5 h-3.5 text-stone-500" />
              <span>Redact Personal Identifiers</span>
            </div>
            <p className="text-stone-500 mt-0.5 leading-snug">
              Masks names, contact numbers, and identifying titles before AI ingestion.
            </p>
          </div>
        </label>

        {/* Location & Address Redaction */}
        <label className="flex items-start space-x-2.5 p-2.5 rounded-lg bg-white border border-stone-200 cursor-pointer hover:border-stone-300 transition-colors">
          <input
            type="checkbox"
            id="toggle-redact-locations"
            checked={settings.redactLocations}
            onChange={(e) =>
              onChangeSettings({ ...settings, redactLocations: e.target.checked })
            }
            className="mt-0.5 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
          />
          <div className="text-xs">
            <div className="font-medium text-stone-900 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-stone-500" />
              <span>Mask Specific Locations</span>
            </div>
            <p className="text-stone-500 mt-0.5 leading-snug">
              Removes street addresses, buildings, and specific geo-markers.
            </p>
          </div>
        </label>

        {/* Sensitivity Level */}
        <div className="p-2.5 rounded-lg bg-white border border-stone-200 text-xs">
          <label htmlFor="sensitivity-level-select" className="font-medium text-stone-900 block mb-1">
            Filter Sensitivity Level
          </label>
          <select
            id="sensitivity-level-select"
            value={settings.sensitivityLevel}
            onChange={(e) =>
              onChangeSettings({
                ...settings,
                sensitivityLevel: e.target.value as FilterSettings['sensitivityLevel']
              })
            }
            className="w-full text-xs rounded border border-stone-300 py-1 px-2 bg-stone-50 text-stone-800 focus:border-stone-500 focus:outline-none"
          >
            <option value="standard">Standard (Basic PII &amp; Crisis)</option>
            <option value="high">High (Strict Entity Masking)</option>
            <option value="maximum">Maximum (Full Clinical Sanitization)</option>
          </select>
          <p className="text-stone-600 text-[11px] mt-1">
            {settings.sensitivityLevel === 'maximum'
              ? 'Sanitizes dates, specific institutions, and emotional identifiers.'
              : 'Safely protects identities while preserving clinical context for AI.'}
          </p>
        </div>
      </div>

      {/* Live Filter Telemetry (What the filter detected in real-time) */}
      {hasInput && liveFilterResult && (
        <div className="pt-2 border-t border-stone-200 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-stone-700">Filter Inspection:</span>

          {/* Crisis status tag */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
              liveFilterResult.crisisDetection.severity === 'critical'
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : liveFilterResult.crisisDetection.severity === 'high'
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            {liveFilterResult.crisisDetection.hasCrisisIndicators ? (
              <AlertTriangle className="w-3 h-3" />
            ) : (
              <CheckCircle2 className="w-3 h-3" />
            )}
            Safety Shield: {liveFilterResult.crisisDetection.severity.toUpperCase()}
          </span>

          {/* Redaction count */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-stone-100 text-stone-700 border border-stone-200">
            <Lock className="w-3 h-3 text-stone-500" />
            {liveFilterResult.sanitizedEntities.length} Identifiers To Mask
          </span>

          {/* Detected Domains */}
          {liveFilterResult.traumaTags.map((tag) => (
            <span
              key={tag.category}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-stone-100 text-stone-800 border border-stone-200"
            >
              <Tag className="w-3 h-3 text-indigo-500" />
              {tag.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
