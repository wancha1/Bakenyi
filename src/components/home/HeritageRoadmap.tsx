import React from 'react';
import { Check } from 'lucide-react';
import { journeySteps, getJourneyIcon } from '../../data/heritageJourney';

interface HeritageRoadmapProps {
  activeJourneyStep: number;
  setActiveJourneyStep: (index: number) => void;
}

export default function HeritageRoadmap({ activeJourneyStep, setActiveJourneyStep }: HeritageRoadmapProps) {
  const currentStep = journeySteps[activeJourneyStep] || journeySteps[0];
  const StepIcon = getJourneyIcon(currentStep.iconName);

  return (
    <section id="heritage-timeline-voyage" className="py-24 bg-stone-900 text-white relative overflow-hidden text-left">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="mb-16">
          <span className="text-amber-400 font-black text-[10px] uppercase tracking-[0.25em] block mb-2">
            Historical Chronicles
          </span>
          <h2 className="text-3xl sm:text-5xl font-serif font-black mb-6 leading-tight text-white">
            The Ancestral Heritage Voyage
          </h2>
          <p className="text-stone-300 text-sm max-w-xl">
            Trace the riverine migrations, settlements, and resilience milestones of the Bakenyi people across regional African waterways from the 14th century to today.
          </p>
        </div>

        {/* Desktop/Tablet Horizontal Steps Selector */}
        <div className="hidden md:flex items-center justify-between border-b border-stone-800 pb-8 mb-12 overflow-x-auto gap-4">
          {journeySteps.map((step, idx) => {
            const Icon = getJourneyIcon(step.iconName);
            const isActive = idx === activeJourneyStep;
            const isCompleted = idx < activeJourneyStep;

            return (
              <button
                key={step.stepNumber}
                onClick={() => setActiveJourneyStep(idx)}
                className={`flex flex-col items-center gap-3 focus:outline-none transition-all group shrink-0 py-2 cursor-pointer ${isActive ? 'scale-103' : 'hover:scale-[1.01]'}`}
                id={`journey-step-btn-${step.stepNumber}`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border ${
                  isActive 
                    ? 'bg-amber-500 border-amber-500 text-stone-950 shadow-[0_0_15px_rgba(245,158,11,0.25)]' 
                    : isCompleted
                      ? 'bg-stone-800 border-amber-500/40 text-amber-400'
                      : 'bg-stone-950 border-stone-800 text-stone-500 group-hover:border-stone-700'
                }`}>
                  {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <div className="text-center">
                  <span className={`block font-mono text-[9px] font-black uppercase tracking-wider ${isActive ? 'text-amber-400' : 'text-stone-500'}`}>
                    Milestone 0{step.stepNumber}
                  </span>
                  <span className={`block text-xs font-bold mt-0.5 truncate max-w-[120px] ${isActive ? 'text-white' : 'text-stone-400 group-hover:text-stone-300'}`}>
                    {step.title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Mobile Vertical Steps Selector */}
        <div className="md:hidden flex gap-2 overflow-x-auto pb-6 mb-8 scrollbar-none">
          {journeySteps.map((step, idx) => {
            const isActive = idx === activeJourneyStep;
            return (
              <button
                key={step.stepNumber}
                onClick={() => setActiveJourneyStep(idx)}
                className={`px-4 py-2.5 rounded-xl border font-bold shrink-0 text-xs transition-colors cursor-pointer ${
                  isActive 
                    ? 'bg-amber-500 border-amber-500 text-stone-950' 
                    : 'bg-stone-950 border-stone-800 text-stone-400'
                }`}
                id={`journey-step-mobile-${step.stepNumber}`}
              >
                Milestone 0{step.stepNumber} • {step.title}
              </button>
            );
          })}
        </div>

        {/* Details Stage */}
        <div className="bg-stone-950 border border-stone-800 rounded-[32px] p-8 md:p-12 min-h-[380px] flex flex-col md:flex-row gap-12 items-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-500/[0.02] to-transparent pointer-events-none" />
          
          {/* Left stage details (Text Content) */}
          <div className="md:w-1/2 space-y-6">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg text-amber-400 font-mono text-[10px] font-bold uppercase tracking-wider">
              <span>Milestone: 0{currentStep.stepNumber}</span>
            </div>

            <h3 className="font-serif font-black text-3xl md:text-4xl text-stone-100 leading-tight">
              {currentStep.title}
            </h3>

            <div className="flex items-center gap-2 text-stone-400 font-mono text-xs">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
              <span>{currentStep.stat}</span>
            </div>

            <p className="text-stone-300 text-xs sm:text-sm leading-relaxed text-left">
              {currentStep.desc}
            </p>

            <div className="pt-6 border-t border-stone-900 flex flex-wrap gap-4 items-center">
              <div>
                <span className="block text-[9px] text-stone-500 font-black uppercase tracking-wider">Historical Significance</span>
                <span className="text-xs text-stone-300 font-bold mt-1 block">Preserved in tribal oral libraries.</span>
              </div>
            </div>
          </div>

          {/* Right stage details (Image / Graphic Showcase) */}
          <div className="md:w-1/2 w-full h-[250px] md:h-[400px] rounded-2xl overflow-hidden relative border border-stone-800 shadow-2xl group">
            <img 
              src={currentStep.image || "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&q=80&w=1000"} 
              alt={currentStep.title} 
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700 brightness-95"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <span className="text-[10px] text-amber-400 font-mono uppercase tracking-wider">Visual Heritage Landmark</span>
              <p className="text-white text-xs font-serif italic mt-1 leading-relaxed">
                "Oral memories transcribed in modern digital ledger accounts."
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
