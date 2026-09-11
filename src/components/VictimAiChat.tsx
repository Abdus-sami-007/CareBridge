import React, { useEffect, useState } from 'react';
import { Bot, Send, ShieldCheck, User, Mic, MicOff, Volume2 } from 'lucide-react';
import { PipelineExecutionResult } from '../types';

interface VictimAiChatProps {
  victimId: string;
  onCompleted: (result: PipelineExecutionResult) => void;
}

interface ChatMessage {
  role: 'victim' | 'ai';
  text: string;
  score?: number;
}

export const VictimAiChat: React.FC<VictimAiChatProps> = ({ victimId, onCompleted }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [pipelineStatus, setPipelineStatus] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [inputModality, setInputModality] = useState<'text' | 'voice'>('text');

  useEffect(() => {
    let cancelled = false;
    setHistoryLoading(true);
    fetch(`/api/database/checkins?victim_id=${encodeURIComponent(victimId)}&limit=20`)
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load check-in history.');
        if (cancelled) return;
        const persisted = Array.isArray(data.checkins) ? data.checkins : [];
        const restored: ChatMessage[] = persisted.slice().reverse().flatMap((checkin: any) => [
          { role: 'victim' as const, text: checkin.message },
          {
            role: 'ai' as const,
            text: 'Your check-in has been securely recorded and processed through the CareBridge support pipeline.',
            score: Number(checkin.score)
          }
        ]);
        setMessages(restored);
      })
      .catch(loadError => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load check-in history.');
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => { cancelled = true; };
  }, [victimId]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setVoiceSupported(Boolean(SpeechRecognition));
  }, []);

  const startVoiceChat = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Voice input is not supported by this browser. Try Chrome or Edge.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = false;
    setIsListening(true);
    setError(null);
    let finalText = '';
    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += transcript + ' ';
        else interim += transcript;
      }
      setInput((finalText + interim).trim());
    };
    recognition.onerror = (event: any) => setError(`Voice input failed: ${event.error || 'unknown error'}.`);
    recognition.onend = () => {
      setIsListening(false);
      if (finalText.trim()) setInput(finalText.trim());
    };
    recognition.start();
  };

  const speakReply = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || isSending) return;

    const modality = inputModality;
    setInput('');
    setError(null);
    setMessages(current => [...current, { role: 'victim', text }]);
    setIsSending(true);
    setPipelineStatus('Screening → AI analysis → distress score → trend → risk classification…');

    try {
      const response = await fetch('/api/pipeline/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          victimId,
          modality,
          checkType: 'direct_input',
          input: text,
          channel: 'victim_dashboard'
        })
      });
      const result: PipelineExecutionResult = await response.json();
      if (!response.ok) throw new Error(result && 'error' in result ? String((result as unknown as { error: string }).error) : 'Unable to process your check-in.');

      const score = result.pipelineStageResults.dynamicDistressScore.score;
      const isCritical = result.pipelineStageResults.riskClassification.branch === 'High/Critical';
      const reply = isCritical
        ? 'Thank you for telling us. Your check-in has been marked for immediate human follow-up. Please move to a safer place if you can and contact a trusted person or emergency service now.'
        : score >= 55
          ? 'Thank you for sharing this. Your check-in has been recorded and your support team can follow up with you. Take one slow breath and stay connected to someone you trust.'
          : 'Thank you for checking in. Your message has been securely recorded. You are allowed to take this one moment at a time.';

      setMessages(current => [...current, { role: 'ai', text: reply, score }]);
      if (modality === 'voice') speakReply(reply);
      setPipelineStatus(isCritical ? 'Alert → human intervention → follow-up & recovery' : 'Monitoring → next periodic check-in');
      onCompleted(result);
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Unable to send your check-in.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-600 p-2 text-white"><Bot className="h-5 w-5" /></div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900">CareBridge AI Check-in</h3>
            <p className="text-[11px] text-stone-500">Private conversation for {victimId}</p>
          </div>
        </div>
        <ShieldCheck className="h-5 w-5 text-emerald-600" />
      </div>

      <div className="max-h-72 space-y-3 overflow-y-auto bg-stone-50 p-4">
        {messages.length === 0 && (
          <div className="rounded-xl border border-dashed border-stone-300 bg-white p-5 text-center text-xs leading-5 text-stone-500">
            {historyLoading ? 'Loading your saved check-ins…' : 'Tell CareBridge how you are feeling. Your message will be screened, scored, and saved to your database record.'}
          </div>
        )}
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex gap-2 ${message.role === 'victim' ? 'justify-end' : 'justify-start'}`}>
            {message.role === 'ai' && <Bot className="mt-2 h-4 w-4 shrink-0 text-emerald-600" />}
            <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-5 ${message.role === 'victim' ? 'bg-stone-900 text-white' : 'border border-emerald-100 bg-white text-stone-700'}`}>
              {message.text}
              {message.score !== undefined && <div className="mt-2 border-t border-stone-200 pt-1 text-[10px] font-mono text-emerald-700">Recorded distress score: {message.score}/100</div>}
            </div>
            {message.role === 'victim' && <User className="mt-2 h-4 w-4 shrink-0 text-stone-500" />}
          </div>
        ))}
      </div>

      {pipelineStatus && <div className="border-t border-stone-200 bg-stone-50 px-4 py-2 text-[10px] font-medium text-stone-600">Pipeline: {pipelineStatus}</div>}
      {error && <div className="border-t border-rose-100 bg-rose-50 px-4 py-2 text-xs text-rose-700">{error}</div>}
      <form onSubmit={sendMessage} className="flex gap-2 border-t border-stone-200 bg-white p-4">
        <input
          value={input}
          onChange={event => { setInput(event.target.value); setInputModality('text'); }}
          placeholder={isListening ? 'Listening… speak naturally' : 'Write a private check-in…'}
          className="min-w-0 flex-1 rounded-xl border border-stone-200 px-3 py-2.5 text-xs text-stone-800 outline-none focus:border-emerald-500"
          disabled={isSending}
        />
        <button type="button" onClick={() => { if (isListening) return; setInputModality('voice'); startVoiceChat(); }} disabled={isSending || !voiceSupported} title={voiceSupported ? 'Speak your check-in' : 'Voice input unavailable'} className={`inline-flex items-center justify-center rounded-xl px-3 py-2.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${isListening ? 'bg-rose-600 text-white' : 'bg-sky-100 text-sky-800 hover:bg-sky-200'}`}>
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
        <button type="submit" disabled={isSending || !input.trim()} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
          <Send className="h-3.5 w-3.5" />
          {isSending ? 'Sending' : 'Send'}
        </button>
        {messages.some(m => m.role === 'ai') && (
          <button type="button" onClick={() => { const last = [...messages].reverse().find(m => m.role === 'ai'); if (last) speakReply(last.text); }} disabled={isSpeaking} title="Read latest response aloud" className="inline-flex items-center justify-center rounded-xl border border-stone-200 px-3 py-2.5 text-stone-600 hover:bg-stone-50 disabled:opacity-50">
            <Volume2 className="h-4 w-4" />
          </button>
        )}
      </form>
    </section>
  );
};
