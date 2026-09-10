import React, { useState } from 'react';
import { Shield, Mic, MicOff, Send, Lock, Globe, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import { analyzeMessage } from '../services/aiService';
import { recordCheckin } from '../services/checkinService';

export default function VictimPortal() {
  const [language, setLanguage] = useState('en'); // 'en' | 'hi'
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkinResult, setCheckinResult] = useState(null);

  // Localization Text Strings
  const texts = {
    en: {
      title: "Daily Wellbeing Check",
      subtitle: "CareBridge Protection Portal",
      langLabel: "Language",
      question: "How are you feeling today?",
      placeholder: "Type your message or share any concerns here...",
      voiceBtn: isRecording ? "Listening... Speak now" : "🎙️ Voice Input",
      sendBtn: "Send Check-in",
      submitting: "Analyzing with AI Engine...",
      privacyNote: "Your information is encrypted & private.",
      successTitle: "Check-in Submitted",
      statusLabel: "Risk Assessment:",
      triggersLabel: "Triggers Identified:",
      interventionLabel: "System Response:",
      resetBtn: "Submit Another Check-in"
    },
    hi: {
      title: "दैनिक कल्याण जांच",
      subtitle: "केयरब्रिज सुरक्षा पोर्टल",
      langLabel: "भाषा चुनें",
      question: "आज आप कैसा महसूस कर रहे हैं?",
      placeholder: "अपना संदेश यहाँ लिखें या अपनी चिंता व्यक्त करें...",
      voiceBtn: isRecording ? "सुन रहा है... अब बोलें" : "🎙️ आवाज रिकॉर्ड करें",
      sendBtn: "चेक-इन भेजें",
      submitting: "एआई इंजन विश्लेषण कर रहा है...",
      privacyNote: "आपकी जानकारी पूरी तरह सुरक्षित और गोपनीय है।",
      successTitle: "चेक-इन सफलतापूर्वक भेजा गया",
      statusLabel: "जोखिम मूल्यांकन:",
      triggersLabel: "पहचाने गए कारक:",
      interventionLabel: "प्रणाली प्रतिक्रिया:",
      resetBtn: "दूसरा चेक-इन भेजें"
    }
  };

  const t = texts[language];

  // Speech Recognition (Web Speech API) Integration
  const handleToggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(language === 'hi' 
        ? "आपका ब्राउज़र वॉयस इनपुट का समर्थन नहीं करता है। कृपया संदेश लिखें।" 
        : "Web Speech API is not supported in this browser. Please type your message.");
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsRecording(false);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsRecording(false);
    }
  };

  // Check-in Submit Handler (Implements Section 6 & 7)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    setCheckinResult(null);

    try {
      // 1. Post to Member 3 AI Engine (/analyze)
      const aiResponse = await analyzeMessage(message, "V001");

      // 2. Format record payload
      const checkinPayload = {
        victim_id: "V001",
        message: message,
        score: aiResponse.distress_score,
        risk_category: aiResponse.risk_category,
        triggers: aiResponse.triggers || [],
        intervention: aiResponse.intervention || "Counselor Dispatch"
      };

      // 3. Save to database / state service
      const savedRecord = await recordCheckin(checkinPayload);

      setCheckinResult({
        ...aiResponse,
        savedRecord
      });
      setMessage('');
    } catch (err) {
      console.error("Checkin submission failed:", err);
      alert("Failed to submit check-in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4 flex flex-col items-center justify-center">
      
      {/* Mobile Device Container Frame */}
      <div className="w-full max-w-sm sm:max-w-md bg-slate-900 border-4 border-slate-800 rounded-[3rem] p-6 shadow-2xl ring-1 ring-white/10 relative overflow-hidden backdrop-blur-xl">
        
        {/* Top Speaker Notch Bar */}
        <div className="w-32 h-4 bg-slate-950 rounded-b-xl mx-auto -mt-6 mb-6 flex items-center justify-center">
          <div className="w-12 h-1 bg-slate-800 rounded-full" />
        </div>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 shadow-xl shadow-sky-600/30 ring-1 ring-white/20 mb-3">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
            CareBridge
          </h1>
          <p className="text-xs text-sky-400 font-medium">{t.subtitle}</p>
        </div>

        {/* Language Switcher Bar */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 mb-6">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
            <Globe className="w-4 h-4 text-sky-400" />
            <span>{t.langLabel}</span>
          </div>
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                language === 'en' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hi')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                language === 'hi' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>

        {/* Form / Result Card Toggle */}
        {!checkinResult ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-200">
                {t.title}
              </label>
              <p className="text-xs text-slate-400 font-medium">
                {t.question}
              </p>
              
              <div className="relative">
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t.placeholder}
                  className="w-full p-4 text-xs rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all resize-none shadow-inner leading-relaxed"
                  required
                />
                <span className="absolute bottom-3 right-3 text-[10px] text-slate-500 font-mono">
                  {message.length} chars
                </span>
              </div>
            </div>

            {/* Voice Input Button */}
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`w-full py-3 px-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
                isRecording
                  ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4 text-red-400 animate-bounce" /> : <Mic className="w-4 h-4 text-sky-400" />}
              <span>{t.voiceBtn}</span>
            </button>

            {/* Submit Check-in Button */}
            <button
              type="submit"
              disabled={isSubmitting || !message.trim()}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-extrabold text-sm tracking-wide shadow-xl shadow-sky-600/30 flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span>{t.submitting}</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{t.sendBtn}</span>
                </>
              )}
            </button>

          </form>
        ) : (
          /* Instant Response & Feedback Card */
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <div className="font-bold text-sm text-emerald-400">{t.successTitle}</div>
              <p className="text-slate-300 text-[11px]">
                Your message has been evaluated by the CareBridge AI Engine and relayed to officer command.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">{t.statusLabel}</span>
                <RiskBadge 
                  score={checkinResult.distress_score} 
                  category={checkinResult.risk_category} 
                  showScore={true} 
                />
              </div>

              {checkinResult.triggers && checkinResult.triggers.length > 0 && (
                <div>
                  <span className="text-slate-400 font-medium">{t.triggersLabel}</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {checkinResult.triggers.map((trig, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                        {trig}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {checkinResult.intervention && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-400 font-medium">{t.interventionLabel}</span>
                  <div className="font-bold text-sky-400 mt-0.5">{checkinResult.intervention}</div>
                </div>
              )}
            </div>

            <button
              onClick={() => setCheckinResult(null)}
              className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors"
            >
              {t.resetBtn}
            </button>
          </div>
        )}

        {/* Privacy Note Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <Lock className="w-3.5 h-3.5 text-emerald-500" />
          <span>{t.privacyNote}</span>
        </div>

      </div>
    </div>
  );
}
