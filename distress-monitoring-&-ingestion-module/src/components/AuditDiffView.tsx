import React, { useState } from 'react';
import { FilterResult, TraumaScores } from '../types';
import { Copy, Check, ShieldCheck, ArrowRight, FileText, Download } from 'lucide-react';

interface AuditDiffViewProps {
  filter: FilterResult;
  scores: TraumaScores;
  evalSource: string;
}

export const AuditDiffView: React.FC<AuditDiffViewProps> = ({ filter, scores, evalSource }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const generateFullReport = () => {
    return `=== TRAUMA INPUT FILTER & CLINICAL ASSESSMENT REPORT ===
Generated: ${new Date().toLocaleString()}
Engine: ${evalSource}

[1] RAW INPUT METRICS:
- Word Count: ${filter.wordCount}
- Characters: ${filter.characterCount}
- Pre-Filter Crisis Status: ${filter.crisisDetection.severity.toUpperCase()}
- Sensitive Identifiers Redacted: ${filter.sanitizedEntities.length}

[2] DETECTED TRAUMA CATEGORIES:
${filter.traumaTags.map(t => `- ${t.label} (Severity: ${t.severity})`).join('\n') || '- None isolated'}

[3] FILTERED INPUT DELIVERED TO AI:
"""
${filter.filteredText}
"""

[4] CLINICAL TRAUMA & DISTRESS SCORES:
- Overall Trauma Impact Score: ${scores.overallImpactScore} / 100
- Acute Distress Index: ${scores.acuteDistressScore} / 100
- Resilience & Agency Score: ${scores.resilienceScore} / 100
- Urgency Tier: ${scores.urgencyLevel}

[5] PCL-5 CLUSTER DIMENSIONS:
- Intrusion / Re-experiencing: ${scores.clusters.intrusion.score}/100 (${scores.clusters.intrusion.level})
- Avoidance: ${scores.clusters.avoidance.score}/100 (${scores.clusters.avoidance.level})
- Negative Cognition & Mood: ${scores.clusters.negativeCognitionMood.score}/100 (${scores.clusters.negativeCognitionMood.level})
- Hyperarousal & Reactivity: ${scores.clusters.hyperarousal.score}/100 (${scores.clusters.hyperarousal.level})

[6] EMPATHETIC SUMMARY:
"${scores.empatheticSummary}"

[7] RECOMMENDED CARE PATHWAY:
${scores.traumaInformedRecommendations.carePathway}

=======================================================`;
  };

  const downloadReport = () => {
    const report = generateFullReport();
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trauma-filter-assessment-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Filter Pipeline Audit &amp; Data Provenance
          </h3>
          <p className="text-xs text-stone-500">
            Transparent comparison of original individual disclosure vs. filtered payload passed to AI
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => copyToClipboard(generateFullReport(), 'report')}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-medium text-stone-700 transition-colors"
          >
            {copied === 'report' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
            <span>{copied === 'report' ? 'Report Copied' : 'Copy Full Report'}</span>
          </button>

          <button
            onClick={downloadReport}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-xs font-medium text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export (.txt)</span>
          </button>
        </div>
      </div>

      {/* Side-by-side Diff View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Original Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              Original Traumatized Individual Disclosure
            </span>
            <button
              onClick={() => copyToClipboard(filter.originalText, 'orig')}
              className="text-[11px] text-stone-500 hover:text-stone-800 flex items-center gap-1"
            >
              {copied === 'orig' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              Copy
            </button>
          </div>
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 font-mono text-xs text-stone-800 h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
            {filter.originalText}
          </div>
          <p className="text-[11px] text-stone-600">
            Contains raw personal statements, direct names, and unmasked identifiers.
          </p>
        </div>

        {/* Filtered Input Delivered to AI */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Filtered &amp; Sanitized Payload Passed to AI
            </span>
            <button
              onClick={() => copyToClipboard(filter.filteredText, 'filt')}
              className="text-[11px] text-stone-500 hover:text-stone-800 flex items-center gap-1"
            >
              {copied === 'filt' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              Copy
            </button>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-200 font-mono text-xs text-emerald-950 h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
            {filter.filteredText}
          </div>
          <p className="text-[11px] text-stone-600">
            Protected with {filter.sanitizedEntities.length} PII tokens redacted to preserve safety &amp; dignity.
          </p>
        </div>
      </div>

      {/* Redaction Registry Table */}
      {filter.sanitizedEntities.length > 0 && (
        <div className="pt-2 border-t border-stone-100">
          <h4 className="text-xs font-semibold text-stone-700 mb-2">
            Redacted Token Registry ({filter.sanitizedEntities.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {filter.sanitizedEntities.map((entity, i) => (
              <span
                key={i}
                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-mono bg-stone-100 border border-stone-200 text-stone-800"
              >
                <span className="text-stone-400 line-through truncate max-w-[120px]">{entity.original}</span>
                <ArrowRight className="w-3 h-3 text-stone-400" />
                <span className="text-emerald-700 font-semibold">{entity.replacement}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
