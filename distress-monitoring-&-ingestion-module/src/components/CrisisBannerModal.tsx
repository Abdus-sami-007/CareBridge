import React from 'react';
import { ShieldAlert, Phone, MessageSquare, Globe, X, HeartHandshake, ExternalLink } from 'lucide-react';
import { CrisisDetection } from '../types';

interface CrisisModalProps {
  isOpen: boolean;
  onClose: () => void;
  crisisDetection?: CrisisDetection;
}

export const CrisisModal: React.FC<CrisisModalProps> = ({
  isOpen,
  onClose,
  crisisDetection
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-stone-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 bg-rose-50 border-b border-rose-100 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-600 text-white rounded-xl shadow-xs">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-rose-950">
                Immediate Crisis &amp; Safety Resources
              </h3>
              <p className="text-xs text-rose-700 mt-0.5">
                Compassionate, confidential, free support available 24 hours a day, 7 days a week.
              </p>
            </div>
          </div>
          <button
            id="close-crisis-modal-btn"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-rose-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {crisisDetection?.hasCrisisIndicators && (
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-xs font-semibold text-amber-900">
                Filter Alert: Acute Distress Markers Detected
              </p>
              <ul className="mt-1 space-y-0.5 text-xs text-amber-800 list-disc list-inside">
                {crisisDetection.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 988 Lifeline */}
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 transition-colors">
              <div className="flex items-center space-x-2 text-stone-900 font-semibold text-sm">
                <Phone className="w-4 h-4 text-rose-600" />
                <span>988 Suicide &amp; Crisis Lifeline</span>
              </div>
              <p className="text-xs text-stone-600 mt-1">
                Call or text <strong>988</strong> (US &amp; Canada). Toll-free, confidential 24/7 crisis counselors.
              </p>
              <a
                href="tel:988"
                className="mt-3 inline-flex items-center text-xs font-semibold text-rose-700 hover:text-rose-800 underline gap-1"
              >
                Call 988 Now <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Crisis Text Line */}
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 transition-colors">
              <div className="flex items-center space-x-2 text-stone-900 font-semibold text-sm">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <span>Crisis Text Line</span>
              </div>
              <p className="text-xs text-stone-600 mt-1">
                Text <strong>HOME</strong> to <strong>741741</strong> to connect with a live crisis counselor anywhere in the US.
              </p>
              <a
                href="sms:741741"
                className="mt-3 inline-flex items-center text-xs font-semibold text-indigo-700 hover:text-indigo-800 underline gap-1"
              >
                Text 741741 <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* The Trevor Project */}
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 transition-colors">
              <div className="flex items-center space-x-2 text-stone-900 font-semibold text-sm">
                <HeartHandshake className="w-4 h-4 text-emerald-600" />
                <span>The Trevor Project (LGBTQ+)</span>
              </div>
              <p className="text-xs text-stone-600 mt-1">
                Call <strong>1-866-488-7386</strong> or text <strong>START</strong> to <strong>678-678</strong>.
              </p>
            </div>

            {/* International Resources */}
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 transition-colors">
              <div className="flex items-center space-x-2 text-stone-900 font-semibold text-sm">
                <Globe className="w-4 h-4 text-sky-600" />
                <span>International Support</span>
              </div>
              <p className="text-xs text-stone-600 mt-1">
                Befrienders Worldwide &amp; IASP crisis lines across 120+ countries worldwide.
              </p>
              <a
                href="https://findahelpline.com"
                target="_blank"
                rel="noreferrer noopener"
                className="mt-3 inline-flex items-center text-xs font-semibold text-sky-700 hover:text-sky-800 underline gap-1"
              >
                Find A Helpline <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="p-3 bg-stone-100 rounded-xl text-xs text-stone-600 leading-relaxed">
            <span className="font-semibold text-stone-800">Important Trauma-Informed Notice:</span> This AI tool provides screening, filtering, and educational trauma distress metrics. It is not an emergency dispatch or medical diagnosis service. If you or someone you know is in immediate life-threatening danger, please contact local emergency authorities (e.g., 911) or visit the nearest emergency room.
          </div>
        </div>

        <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            id="dismiss-crisis-modal-btn"
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-lg text-xs font-medium transition-colors"
          >
            I Understand / Close
          </button>
        </div>
      </div>
    </div>
  );
};
