'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  AlertTriangle, 
  Bot, 
  Bell, 
  ChevronRight, 
  ChevronLeft, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  Activity,
  CheckCircle2
} from 'lucide-react';

interface OnboardingStep {
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  bgGlow: string;
  preview: React.ReactNode;
}

export default function AppOnboarding() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has already completed onboarding
    const completed = localStorage.getItem('edsa_welcome_onboarding_v1');
    if (!completed) {
      // Delay slightly so it shows after the splash screen finishes
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleFinish = () => {
    localStorage.setItem('edsa_welcome_onboarding_v1', 'true');
    setIsVisible(false);
  };

  const steps: OnboardingStep[] = [
    {
      badge: 'REAL-TIME GRID TRACKING',
      title: 'Track Live Power in Your Community',
      subtitle: 'Know your electricity status before you travel',
      description:
        'Get live crowdsourced power reports across all Freetown communities. Easily see which zones currently have active power, planned maintenance, or load shedding.',
      icon: Zap,
      accentColor: 'text-yellow-400',
      bgGlow: 'from-yellow-500/20 to-transparent',
      preview: (
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-300">Live Grid Status</span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ONLINE
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-left">
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
              <div className="text-[10px] text-gray-400">Western Area</div>
              <div className="text-xs font-bold text-white mt-0.5">86% Power Stability</div>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
              <div className="text-[10px] text-gray-400">Eastern Area</div>
              <div className="text-xs font-bold text-yellow-400 mt-0.5">Load Shedding</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      badge: 'RAPID HAZARD ESCALATION',
      title: 'Report Faults & Electrical Hazards',
      subtitle: 'Fast 1-tap reporting with photo & GPS',
      description:
        'Spotted a fallen power cable, transformer fire, or broken pole? Submit verified reports with your camera and GPS coordinates directly to operational teams.',
      icon: AlertTriangle,
      accentColor: 'text-amber-400',
      bgGlow: 'from-amber-500/20 to-transparent',
      preview: (
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 space-y-2.5 shadow-xl text-left">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Emergency Dispatch</div>
              <div className="text-[10px] text-gray-400">GPS location linked automatically</div>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-[11px] text-amber-300 font-semibold">
            <span>⚡ High-Priority Hazard Reporting</span>
            <span className="text-[10px] bg-amber-400 text-black px-1.5 py-0.5 rounded font-black">ACTIVE</span>
          </div>
        </div>
      ),
    },
    {
      badge: 'INTELLIGENT CITIZEN SUPPORT',
      title: '24/7 AI Assistant & Power Advice',
      subtitle: 'Instant answers on tariffs, safety & schedules',
      description:
        'Have a question about token meters, voltage safety, or outage restoration times? Our built-in AI assistant gives you instant answers tailored for Sierra Leone.',
      icon: Bot,
      accentColor: 'text-blue-400',
      bgGlow: 'from-blue-500/20 to-transparent',
      preview: (
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 space-y-2.5 shadow-xl text-left">
          <div className="flex items-start gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-1">
              <div className="bg-white/5 border border-white/10 rounded-xl rounded-tl-none p-2.5 text-[11px] text-gray-200">
                "Power restored in Aberdeen! Check current voltage before connecting heavy appliances."
              </div>
              <div className="text-[9px] text-gray-500 font-semibold pl-1">EDSA AI Assistant • Just now</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      badge: 'FULL-SCREEN NATIVE EXPERIENCE',
      title: 'You Are All Set to Go!',
      subtitle: 'Real-time power tracking right at your fingertips',
      description:
        'Enjoy offline support, instant notifications, and lightning-fast community grid reporting directly from your home screen.',
      icon: Activity,
      accentColor: 'text-emerald-400',
      bgGlow: 'from-emerald-500/20 to-transparent',
      preview: (
        <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-4 text-center space-y-2 shadow-xl">
          <div className="h-10 w-10 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="text-sm font-bold text-white">Full-Screen Native Ready</div>
          <div className="text-[11px] text-gray-400">Zero lag, offline emergency guidelines, and live updates.</div>
        </div>
      ),
    },
  ];

  if (!isVisible) return null;

  const step = steps[currentStep];
  const StepIcon = step.icon;
  const isLastStep = currentStep === steps.length - 1;

  const nextStep = () => {
    if (isLastStep) {
      handleFinish();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl overflow-hidden"
      >
        {/* Dynamic Background Glow */}
        <div 
          className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-[120px] bg-gradient-to-b ${step.bgGlow} transition-all duration-700 pointer-events-none`} 
        />

        <motion.div
          initial={{ scale: 0.92, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative w-full max-w-md bg-slate-950/95 border border-white/10 rounded-[2.5rem] p-6 md:p-8 shadow-2xl flex flex-col justify-between overflow-hidden text-center min-h-[580px]"
        >
          {/* Top Bar: Skip button and step counter */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </div>
            {!isLastStep && (
              <button
                onClick={handleFinish}
                className="text-xs font-bold text-gray-400 hover:text-white transition-colors px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/5"
              >
                Skip
              </button>
            )}
          </div>

          {/* Animated Slide Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="space-y-4 my-auto"
            >
              {/* Feature Icon with Pulsing Halo */}
              <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-3xl bg-white/5 border border-white/10 shadow-lg" />
                <StepIcon className={`w-10 h-10 ${step.accentColor}`} />
              </div>

              {/* Badge */}
              <div className="inline-block">
                <span className="text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">
                  {step.badge}
                </span>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight leading-snug">
                  {step.title}
                </h2>
                <p className="text-xs text-gray-400 leading-relaxed max-w-sm mx-auto">
                  {step.description}
                </p>
              </div>

              {/* Visual Interactive Preview */}
              <div className="pt-2">
                {step.preview}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Bottom Controls */}
          <div className="space-y-5 pt-6 mt-4 border-t border-white/5">
            {/* Progress Dots / Bars */}
            <div className="flex items-center justify-center gap-1.5">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentStep 
                      ? 'w-8 bg-yellow-400' 
                      : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                  aria-label={`Go to step ${idx + 1}`}
                />
              ))}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <button
                  onClick={prevStep}
                  className="px-4 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all flex items-center justify-center"
                  aria-label="Previous step"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={nextStep}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-sm uppercase tracking-wider transition-all shadow-lg shadow-yellow-400/20 flex items-center justify-center gap-2 group"
              >
                {isLastStep ? (
                  <>
                    <span>Enter EDSA Tracker</span>
                    <Zap className="w-4 h-4 fill-slate-950" />
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
