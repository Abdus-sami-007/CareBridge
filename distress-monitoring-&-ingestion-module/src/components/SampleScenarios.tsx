import React from 'react';
import { Sparkles, Car, Home, HeartCrack, Flame, Stethoscope } from 'lucide-react';

export interface SampleScenario {
  id: string;
  title: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  text: string;
}

export const SAMPLE_SCENARIOS: SampleScenario[] = [
  {
    id: 'mva-flashbacks',
    title: 'Motor Vehicle Crash & Intrusion',
    category: 'Accident / PTSD',
    icon: Car,
    description: 'Acute re-experiencing, panic triggers when driving, insomnia.',
    text: `Ever since the head-on collision on Route 9 near 450 Oak Avenue with Mr. Robert Sterling's truck on March 12th, 2024, I cannot close my eyes without hearing the screeching metal and shattering glass. Every time I get into a car my chest tightens, my hands shake uncontrollably, and my heart pounds like it's going to burst. I haven't been able to drive on highways or sleep through the night without waking up gasping for air. My wife Sarah Miller told me I should call Dr. Peterson at 555-234-8901, but I just feel frozen and keep avoiding the intersection where it happened.`
  },
  {
    id: 'domestic-coercive',
    title: 'Relational Abuse & Hypervigilance',
    category: 'Interpersonal Trauma',
    icon: Home,
    description: 'Coercive control, physical threats, walking on eggshells.',
    text: `For three years my partner threatened me whenever I tried to speak up. He broke things, punched holes in our apartment walls at 12 Elm Street, and monitored my phone every single hour. Even now that I have moved out, I jump at every unexpected footstep outside my front door. I constantly check the door locks three or four times before bed. I feel dirty, guilty, and constantly wonder if somehow it was my fault that he got so angry. I want to feel safe again but I feel on guard 24/7.`
  },
  {
    id: 'childhood-neglect',
    title: 'Developmental Trauma & Alienation',
    category: 'Complex Trauma',
    icon: HeartCrack,
    description: 'Childhood emotional neglect, distrust, detachment.',
    text: `Growing up with an alcoholic parent who would disappear for days left me feeling like I was completely invisible. Whenever I try to form close friendships now as an adult, a wave of numbness hits me and I pull away before they can abandon me. I struggle with feeling that I am fundamentally broken or defective. Yet, I've started attending a peer support circle and I really want to learn how to trust people and rebuild my self-worth.`
  },
  {
    id: 'medical-icu',
    title: 'Medical ICU & Sudden Vulnerability',
    category: 'Medical Trauma',
    icon: Stethoscope,
    description: 'Complications in hospital, loss of bodily control, panic.',
    text: `After a sudden cardiac complication, I was placed on a ventilator in the Intensive Care Unit for eleven days. Waking up restrained and unable to speak was the most terrifying sensation of my life. Now, whenever I smell antiseptic or hear beeping machines, I start trembling and feel like I am suffocating again. I avoid going to medical clinics and cancel routine appointments out of pure dread.`
  },
  {
    id: 'acute-crisis-distress',
    title: 'Acute Despair & Overwhelm',
    category: 'Acute Crisis',
    icon: Flame,
    description: 'Severe emotional exhaustion, despair, need for immediate grounding.',
    text: `I can't take this anymore. The flashbacks won't stop and the unbearable pain is suffocating me. Everything I've tried has fallen apart, nobody cares if I disappear, and I feel like I'm completely drowning in fear with nowhere to turn. Please help me make the noise stop.`
  }
];

interface SampleScenariosProps {
  onSelect: (text: string) => void;
  selectedText: string;
}

export const SampleScenarios: React.FC<SampleScenariosProps> = ({ onSelect, selectedText }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          Load Representative Clinical Scenarios
        </label>
        <span className="text-xs text-stone-600">Select to populate input</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {SAMPLE_SCENARIOS.map((scenario) => {
          const Icon = scenario.icon;
          const isSelected = selectedText.trim() === scenario.text.trim();

          return (
            <button
              key={scenario.id}
              type="button"
              id={`scenario-btn-${scenario.id}`}
              onClick={() => onSelect(scenario.text)}
              className={`text-left p-2.5 rounded-xl border text-xs transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-stone-800 bg-stone-900 text-stone-50 shadow-xs'
                  : 'border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50 text-stone-800'
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5 font-medium mb-1">
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-stone-500'}`} />
                  <span className="truncate">{scenario.title}</span>
                </div>
                <p className={`line-clamp-2 leading-relaxed ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                  {scenario.description}
                </p>
              </div>
              <span className={`mt-2 font-mono text-[10px] uppercase tracking-wider ${isSelected ? 'text-stone-400' : 'text-stone-600'}`}>
                {scenario.category}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
