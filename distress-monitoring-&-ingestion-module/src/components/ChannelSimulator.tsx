import React, { useState } from 'react';
import {
  IngestionChannel,
  FilterSettings
} from '../types';
import {
  MessageCircle,
  PhoneCall,
  Send,
  Mic,
  LayoutDashboard,
  Sparkles,
  ArrowRight,
  Shield,
  Clock,
  Radio
} from 'lucide-react';

interface ChannelSimulatorProps {
  onIngest: (channel: IngestionChannel, input: string, metadata?: any) => Promise<void>;
  isLoading: boolean;
}

interface ChannelPreset {
  id: string;
  channel: IngestionChannel;
  title: string;
  description: string;
  senderLabel: string;
  senderPlaceholder: string;
  defaultSender: string;
  defaultText: string;
  extraMeta?: Record<string, any>;
}

const CHANNEL_PRESETS: ChannelPreset[] = [
  {
    id: 'whatsapp-bombing',
    channel: 'whatsapp',
    title: 'WhatsApp Chatbot SOS (Armed Conflict)',
    description: 'Direct message sent by a civilian during active artillery shelling.',
    senderLabel: 'WhatsApp Number',
    senderPlaceholder: '+1-555-0192',
    defaultSender: '+380-67-554-1029',
    defaultText: 'Heavy artillery hit our apartment block at 34 Riverfront Way. My mother Mrs. Irina Romanova is bleeding from debris and the roof has collapsed. We cannot leave the basement because drones are flying overhead. My heart is racing, I cannot catch my breath and we have no clean water.',
    extraMeta: { messageId: 'wamid_HBgL' }
  },
  {
    id: 'ivr-border-checkpoint',
    channel: 'ivr',
    title: 'IVR Telephony Call Transcript (Border Crisis)',
    description: 'Interactive voice response hotline call from a refugee transit checkpoint.',
    senderLabel: 'Hotline Caller ID',
    senderPlaceholder: '+1-800-HOTLINE',
    defaultSender: '+49-151-9988221',
    defaultText: 'Automated Call Transcript: I am stranded at border post 4 near the river crossing with my two daughters. Armed soldiers detained my husband Mr. David Vance three days ago and will not tell me where he was taken. Every time I see military uniforms I start shaking and hyperventilating. I have nowhere safe to sleep tonight.',
    extraMeta: { durationSeconds: 215, ivrDtmfTone: '9 (High Urgent Crisis)' }
  },
  {
    id: 'telegram-detention-survivor',
    channel: 'telegram',
    title: 'Telegram Bot Message (Detention & Torture)',
    description: 'Encrypted bot message from a survivor released from arbitrary detention.',
    senderLabel: 'Telegram Username / User ID',
    senderPlaceholder: '@anonymous_user',
    defaultSender: '@freedom_seeker_92',
    defaultText: 'I was released yesterday after 3 weeks in solitary confinement at Detention Center 6 on North Industrial Road. They beat us with batons and kept blindfolds on us for days. Now that I am out, I cannot look at the daylight without panic attacks. I feel hollow inside, like I died in that room.',
    extraMeta: { message_id: 8492 }
  },
  {
    id: 'speech-field-interview',
    channel: 'speech',
    title: 'Speech Audio Transcript (Field Interview)',
    description: 'Voice note transcribed from an NGO mobile medical unit.',
    senderLabel: 'Voice Session ID',
    senderPlaceholder: 'VOICE_REC_01',
    defaultSender: 'AUDIO_FIELD_MOBILE_04',
    defaultText: 'Voice Recording Transcript: During the raid on our village, extremists set fire to our community center and shot into the crowd. I managed to hide in the maize field with my infant, but I watched my neighbor get dragged away. I still hear the gunshots ringing in my ears and I cannot stop checking every corner.',
    extraMeta: { audioQuality: '16kHz Audio Stream', durationSeconds: 88 }
  },
  {
    id: 'victim-portal-intake',
    channel: 'victim_dashboard',
    title: 'Victim Web Portal (Self Check-in)',
    description: 'Direct self-report form submitted through the victim recovery web app.',
    senderLabel: 'Victim Profile ID',
    senderPlaceholder: 'VIC-WEB-USER',
    defaultSender: 'VIC-PORTAL-8821',
    defaultText: 'I am writing this because my anxiety is completely unmanageable today. I keep having vivid flashbacks of the detention raid and I couldn’t leave my bedroom all morning. Even though I moved to a new apartment at 180 Maple Street, I feel terrified that they will track me down. I need help calming down.',
    extraMeta: { emotionalState: 'Severely Anxious' }
  }
];

export const ChannelSimulator: React.FC<ChannelSimulatorProps> = ({ onIngest, isLoading }) => {
  const [selectedPreset, setSelectedPreset] = useState<ChannelPreset>(CHANNEL_PRESETS[0]);
  const [inputText, setInputText] = useState<string>(CHANNEL_PRESETS[0].defaultText);
  const [senderId, setSenderId] = useState<string>(CHANNEL_PRESETS[0].defaultSender);

  const handleSelectPreset = (preset: ChannelPreset) => {
    setSelectedPreset(preset);
    setInputText(preset.defaultText);
    setSenderId(preset.defaultSender);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    await onIngest(selectedPreset.channel, inputText, {
      senderIdentifier: senderId,
      ...selectedPreset.extraMeta
    });
  };

  const getChannelIcon = (ch: IngestionChannel) => {
    switch (ch) {
      case 'whatsapp':
        return <MessageCircle className="w-4 h-4 text-emerald-600" />;
      case 'telegram':
        return <Send className="w-4 h-4 text-sky-600" />;
      case 'ivr':
        return <PhoneCall className="w-4 h-4 text-amber-600" />;
      case 'speech':
        return <Mic className="w-4 h-4 text-rose-600" />;
      default:
        return <LayoutDashboard className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
        <div>
          <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-600" />
            Multi-Channel Ingestion Dispatcher (Test &amp; Transmit)
          </h3>
          <p className="text-xs text-stone-500">
            Simulate incoming data from any channel to trigger automated sanitization, AI scoring, and dashboard delivery
          </p>
        </div>
        <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-stone-100 text-stone-700">
          Module Ingest Gateway
        </span>
      </div>

      {/* Channel Presets Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {CHANNEL_PRESETS.map((preset) => {
          const isSelected = selectedPreset.id === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              id={`preset-btn-${preset.id}`}
              onClick={() => handleSelectPreset(preset)}
              className={`text-left p-3 rounded-xl border text-xs transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                  : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800'
              }`}
            >
              <div>
                <div className="flex items-center space-x-1.5 font-semibold mb-1">
                  {getChannelIcon(preset.channel)}
                  <span className="truncate">{preset.channel.toUpperCase()}</span>
                </div>
                <p className={`line-clamp-2 text-[11px] leading-snug ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                  {preset.description}
                </p>
              </div>
              <span className={`mt-2.5 text-[10px] font-mono ${isSelected ? 'text-emerald-400' : 'text-stone-600'}`}>
                {preset.title.split('(')[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-stone-700 mb-1">
              {selectedPreset.senderLabel}
            </label>
            <input
              type="text"
              value={senderId}
              onChange={(e) => setSenderId(e.target.value)}
              className="w-full text-xs font-mono rounded-lg border border-stone-300 px-3 py-2 bg-stone-50 text-stone-900 focus:border-stone-900 focus:outline-none"
              placeholder={selectedPreset.senderPlaceholder}
            />
          </div>

          <div className="sm:col-span-2 flex items-end">
            <div className="text-[11px] text-stone-500 leading-relaxed bg-stone-50 p-2 rounded-lg border border-stone-200 w-full flex items-center justify-between">
              <span>
                Simulates real-world webhook/telephony payload from: <strong>{selectedPreset.title}</strong>
              </span>
              <span className="font-mono text-emerald-700 font-medium">Auto-Redaction Active</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">
            Victim Trauma Disclosure / Narrative Input
          </label>
          <textarea
            rows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full rounded-xl border border-stone-300 p-3 text-xs sm:text-sm text-stone-900 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 focus:outline-none leading-relaxed"
            placeholder="Type or paste incoming disclosure text..."
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-2 text-xs text-stone-500">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Passes through PII redactor &rarr; Gemini 3.8 Flash &rarr; Dual Dashboard Feeds</span>
          </div>

          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="inline-flex items-center space-x-2 px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing Ingestion...</span>
              </>
            ) : (
              <>
                <span>Ingest &amp; Dispatch to Dashboards</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
