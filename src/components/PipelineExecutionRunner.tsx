import React, { useState } from 'react';
import {
  PipelineProcessPayload,
  PipelineExecutionResult,
  InputModality,
  PipelineCheckType
} from '../types';
import {
  Play,
  Clock,
  MessageSquare,
  Mic,
  Activity,
  BrainCircuit,
  Gauge,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';

interface PipelineExecutionRunnerProps {
  selectedVictimId: string;
  onExecutionComplete: (result: PipelineExecutionResult) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const PipelineExecutionRunner: React.FC<PipelineExecutionRunnerProps> = ({
  selectedVictimId,
  onExecutionComplete,
  isLoading,
  setIsLoading
}) => {
  const [modality, setModality] = useState<InputModality>('text');
  const [checkType, setCheckType] = useState<PipelineCheckType>('periodic_check');
  const [inputText, setInputText] = useState('');
  const [voiceDistressRating, setVoiceDistressRating] = useState(7);
  const [copied, setCopied] = useState(false);
  const [lastResult, setLastResult] = useState<PipelineExecutionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRunPipeline = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const payload: PipelineProcessPayload = {
        victimId: selectedVictimId,
        modality,
        checkType,
        input: inputText.trim(),
        voiceMetrics: modality === 'voice' ? { acousticDistressRating: voiceDistressRating } : undefined,
        channel: 'victim_dashboard'
      };

      const res = await fetch('/api/pipeline/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Pipeline execution failed: ${res.status}`);
      }

      const result: PipelineExecutionResult = await res.json();
      setLastResult(result);
      onExecutionComplete(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Pipeline execution failed.';
      setErrorMessage(message);
      console.error('Execution error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyJson = () => {
    if (!lastResult) return;
    navigator.clipboard.writeText(JSON.stringify(lastResult, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950 p-5 space-y-4 font-sans text-stone-200">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-400">
            <Play className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-stone-100">
              Pipeline Execution Harness
            </h3>
            <p className="text-[11px] text-stone-400">
              Trigger an isolated pipeline run for <strong className="text-emerald-400">{selectedVictimId}</strong>
            </p>
          </div>
        </div>

      </div>

      <form onSubmit={handleRunPipeline} className="space-y-3.5 text-xs">
        {/* Modality & Check Type Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-stone-400 mb-1 font-medium">1. Select Input Modality:</label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setModality('text')}
                className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                  modality === 'text'
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-200 font-bold'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Text</span>
              </button>

              <button
                type="button"
                onClick={() => setModality('voice')}
                className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                  modality === 'voice'
                    ? 'bg-sky-950 border-sky-500 text-sky-200 font-bold'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <Mic className="w-3.5 h-3.5 text-sky-400" />
                <span>Voice</span>
              </button>

              <button
                type="button"
                onClick={() => setModality('events')}
                className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                  modality === 'events'
                    ? 'bg-amber-950 border-amber-500 text-amber-200 font-bold'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                <span>Events</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-stone-400 mb-1 font-medium">2. Trigger Check Type:</label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setCheckType('periodic_check')}
                className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                  checkType === 'periodic_check'
                    ? 'bg-purple-950 border-purple-500 text-purple-200 font-bold'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>Periodic Check</span>
              </button>

              <button
                type="button"
                onClick={() => setCheckType('direct_input')}
                className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                  checkType === 'direct_input'
                    ? 'bg-indigo-950 border-indigo-500 text-indigo-200 font-bold'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <span>Direct Input</span>
              </button>

              <button
                type="button"
                onClick={() => setCheckType('event_trigger')}
                className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                  checkType === 'event_trigger'
                    ? 'bg-rose-950 border-rose-500 text-rose-200 font-bold'
                    : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                <span>Event Trigger</span>
              </button>
            </div>
          </div>
        </div>

        {/* Voice parameter if voice selected */}
        {modality === 'voice' && (
          <div className="p-2.5 rounded-lg bg-stone-900/80 border border-stone-800 flex items-center justify-between text-xs">
            <span className="text-stone-300">Simulated Voice Acoustic Distress Rating:</span>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min={1}
                max={10}
                value={voiceDistressRating}
                onChange={e => setVoiceDistressRating(Number(e.target.value))}
                className="w-32 accent-sky-500"
              />
              <span className="font-mono font-bold text-sky-400">{voiceDistressRating} / 10</span>
            </div>
          </div>
        )}

        {/* Input Narrative */}
        <div>
          <label className="block text-stone-400 mb-1 font-medium">
            3. Incoming Narrative / Transcript / Event Payload:
          </label>
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-emerald-500 text-xs leading-relaxed"
            placeholder="Enter victim narrative, voice transcript, or trauma event..."
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Target: <strong className="text-stone-300 font-mono">{selectedVictimId}</strong> (Isolated DB Vault)</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Executing Pipeline...' : 'Execute Pipeline Engine'}</span>
          </button>
        </div>
      </form>

      {errorMessage && (
        <div className="rounded-xl border border-rose-800 bg-rose-950/50 p-3 text-xs text-rose-200" role="alert">
          {errorMessage}
        </div>
      )}

      {/* Live Pipeline Output Display */}
      {lastResult && (
        <div className="mt-4 pt-4 border-t border-stone-800 space-y-3 text-xs animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-stone-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Pipeline Execution Output: {lastResult.executionId}
            </h4>
            <button
              onClick={handleCopyJson}
              className="flex items-center space-x-1 text-[11px] text-stone-400 hover:text-stone-200 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'JSON Copied' : 'Copy Full JSON'}</span>
            </button>
          </div>

          {/* Stage 1 to 4 Output Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
            {/* AI Engine Box */}
            <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-1">
              <div className="text-[10px] text-indigo-400 uppercase font-bold flex items-center gap-1">
                <BrainCircuit className="w-3.5 h-3.5" />
                AI Engine (NLP+Emotion)
              </div>
              <div className="text-stone-200 font-semibold">
                {lastResult.pipelineStageResults.aiEngineAnalysis.emotionAnalysis.primaryEmotion}
              </div>
              <div className="text-[10px] text-stone-400">
                Arousal: {lastResult.pipelineStageResults.aiEngineAnalysis.emotionAnalysis.arousalLevel}/100
              </div>
              <div className="text-[9px] text-stone-500 font-mono">
                Source: {lastResult.pipelineStageResults.aiEngineAnalysis.evalSource}
              </div>
            </div>

            {/* Dynamic Distress Score Box */}
            <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-1">
              <div className="text-[10px] text-amber-400 uppercase font-bold flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5" />
                Dynamic Distress Score
              </div>
              <div className="text-xl font-mono font-black text-amber-400">
                {lastResult.pipelineStageResults.dynamicDistressScore.score}
                <span className="text-xs font-normal text-stone-500"> / 100</span>
              </div>
              <div className="text-[10px] text-stone-300">
                Level: <strong>{lastResult.pipelineStageResults.dynamicDistressScore.level}</strong>
              </div>
            </div>

            {/* Trend + Prediction Box */}
            <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-1">
              <div className="text-[10px] text-purple-400 uppercase font-bold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Trend + Prediction
              </div>
              <div className="text-stone-200 font-medium capitalize">
                {lastResult.pipelineStageResults.trendAndPrediction.trendDirection.replace('_', ' ')}
              </div>
              <div className="text-[10px] text-stone-400 font-mono">
                &Delta; Previous: {lastResult.pipelineStageResults.trendAndPrediction.deltaPrevious >= 0 ? '+' : ''}
                {lastResult.pipelineStageResults.trendAndPrediction.deltaPrevious}
              </div>
              <div className="text-[9px] text-stone-500 truncate">
                {lastResult.pipelineStageResults.trendAndPrediction.predictedTrajectory}
              </div>
            </div>

            {/* Risk Classification Branch Box */}
            <div
              className={`p-3 rounded-xl border space-y-1 ${
                lastResult.pipelineStageResults.riskClassification.branch === 'High/Critical'
                  ? 'bg-rose-950/70 border-rose-700 text-rose-200'
                  : 'bg-emerald-950/70 border-emerald-700 text-emerald-200'
              }`}
            >
              <div className="text-[10px] uppercase font-bold flex items-center gap-1">
                {lastResult.pipelineStageResults.riskClassification.branch === 'High/Critical' ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                )}
                Branch: {lastResult.pipelineStageResults.riskClassification.branch}
              </div>
              <div className="font-bold text-sm">
                Pathway: {lastResult.pipelineStageResults.riskClassification.pathway}
              </div>
              <div className="text-[10px] leading-tight">
                {lastResult.pipelineStageResults.riskClassification.branch === 'High/Critical'
                  ? lastResult.pipelineStageResults.riskClassification.alertDetails?.humanIntervention.urgency
                  : lastResult.pipelineStageResults.riskClassification.monitoringDetails?.status}
              </div>
            </div>
          </div>

          {/* Intervention or Monitoring Directive */}
          {lastResult.pipelineStageResults.riskClassification.alertDetails && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-200 text-xs space-y-1.5">
              <div className="font-semibold text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Human Intervention Triggered: {lastResult.pipelineStageResults.riskClassification.alertDetails.humanIntervention.assignedUnit}
              </div>
              <p className="text-[11px] leading-relaxed text-rose-100">
                {lastResult.pipelineStageResults.riskClassification.alertDetails.humanIntervention.interventionProtocol}
              </p>
              <div className="pt-1 text-[10px] text-rose-300 font-mono">
                Follow-up &amp; Recovery: {lastResult.pipelineStageResults.riskClassification.alertDetails.followUpAndRecovery.followUpScheduled} &bull; Crisis Contact: {lastResult.pipelineStageResults.riskClassification.alertDetails.followUpAndRecovery.crisisContactProvided}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
