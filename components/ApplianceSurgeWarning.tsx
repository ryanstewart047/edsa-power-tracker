/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  Refrigerator,
  Tv,
  AirVent
} from 'lucide-react';

interface ApplianceSurgeWarningProps {
  onDismiss?: () => void;
  initialActive?: boolean;
}

export default function ApplianceSurgeWarning({
  onDismiss,
  initialActive = false
}: ApplianceSurgeWarningProps) {
  const TOTAL_SECONDS = 180; // 3 minutes standard voltage stabilization period
  const [secondsRemaining, setSecondsRemaining] = useState<number>(TOTAL_SECONDS);
  const [isRunning, setIsRunning] = useState<boolean>(initialActive);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  const audioContextRef = useRef<AudioContext | null>(null);

  // Play synthetic pleasant chime on completion
  const playCompletionChime = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = audioContextRef.current || new AudioCtx();
      audioContextRef.current = ctx;

      const now = ctx.currentTime;
      // 3 ascending harmonic notes
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.15);
        gain.gain.setValueAtTime(0.2, now + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 0.45);
      });
    } catch {
      // Audio autoplay policy fallback
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRunning && secondsRemaining > 0) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            playCompletionChime();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, secondsRemaining]);

  const handleStart = () => {
    setIsRunning(true);
    setIsCompleted(false);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsCompleted(false);
    setSecondsRemaining(TOTAL_SECONDS);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = ((TOTAL_SECONDS - secondsRemaining) / TOTAL_SECONDS) * 100;

  // Determine current phase
  const getPhase = () => {
    if (isCompleted || secondsRemaining === 0) {
      return {
        level: 3,
        title: 'Voltage Stabilized (Safe to Turn On)',
        description: 'Normal operating voltage restored. Turn on heavy appliances one at a time.',
        theme: 'emerald'
      };
    }
    if (secondsRemaining > 120) {
      return {
        level: 0,
        title: 'Phase 1: Extreme Surge Window (0-60s)',
        description: 'Keep fridge, freezer, TV, AC, and water pump unplugged! High risk of 280V+ spike.',
        theme: 'rose'
      };
    }
    if (secondsRemaining > 60) {
      return {
        level: 1,
        title: 'Phase 2: Grid Settling (60-120s)',
        description: 'Frequency synchronizing. Safe to power LED light bulbs and low-draw phone chargers.',
        theme: 'amber'
      };
    }
    return {
      level: 2,
      title: 'Phase 3: Final Stabilization (120-180s)',
      description: 'Compressors and inverters are preparing safely. Final countdown in progress.',
      theme: 'blue'
    };
  };

  const currentPhase = getPhase();

  return (
    <div className="rounded-3xl border border-amber-200/90 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 p-5 sm:p-6 shadow-sm overflow-hidden transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md transition-colors ${
              isCompleted
                ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                : isRunning
                ? 'bg-amber-600 text-white shadow-amber-500/20 animate-pulse'
                : 'bg-amber-500 text-white shadow-amber-500/20'
            }`}
          >
            {isCompleted ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                Appliance Surge Guard
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                3-Min Delay
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Prevent high-voltage blowouts when EDSA grid power returns
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl text-xs transition-colors ${
              soundEnabled
                ? 'text-amber-800 hover:bg-amber-100'
                : 'text-slate-400 hover:bg-slate-100'
            }`}
            title={soundEnabled ? 'Mute alert sound' : 'Enable alert sound'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Close card"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main interactive timer and status */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Left Timer Ring / Number */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-amber-100 shadow-xs">
          <div className="relative flex items-center justify-center">
            {/* SVG circle progress */}
            <svg className="w-28 h-28 transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="46"
                className="stroke-amber-100"
                strokeWidth="7"
                fill="transparent"
              />
              <circle
                cx="56"
                cy="56"
                r="46"
                className={`transition-all duration-1000 ${
                  isCompleted ? 'stroke-emerald-500' : 'stroke-amber-500'
                }`}
                strokeWidth="7"
                strokeDasharray={289}
                strokeDashoffset={289 - (289 * progressPercent) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
                {formatTime(secondsRemaining)}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {isCompleted ? 'Stabilized' : isRunning ? 'Hold on' : 'Standby'}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-3 w-full">
            {!isRunning && !isCompleted ? (
              <button
                onClick={handleStart}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-amber-600/30 active:scale-95 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Power Just Restored? Start
              </button>
            ) : isRunning ? (
              <button
                onClick={handlePause}
                className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                Pause Timer
              </button>
            ) : (
              <button
                onClick={handleReset}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                All Clear! Reset
              </button>
            )}

            {(isRunning || secondsRemaining < TOTAL_SECONDS) && (
              <button
                onClick={handleReset}
                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
                title="Restart 3-minute timer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Stage and Advice */}
        <div className="md:col-span-7 space-y-3">
          <div
            className={`p-3.5 rounded-2xl border transition-colors ${
              currentPhase.theme === 'emerald'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : currentPhase.theme === 'rose'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : currentPhase.theme === 'amber'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
              {currentPhase.theme === 'emerald' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span>{currentPhase.title}</span>
            </div>
            <p className="text-xs mt-1 text-slate-700 leading-relaxed">
              {currentPhase.description}
            </p>
          </div>

          {/* Quick appliance checklist */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div
              className={`p-2 rounded-xl border transition-all ${
                secondsRemaining > 120
                  ? 'border-rose-200 bg-rose-50/70 text-rose-800'
                  : 'border-emerald-200 bg-emerald-50/70 text-emerald-800'
              }`}
            >
              <div className="text-sm font-black flex items-center justify-center gap-1">
                <Refrigerator className="w-3.5 h-3.5" />
                <span>Fridge</span>
              </div>
              <p className="text-[10px] font-semibold mt-0.5">
                {secondsRemaining > 0 ? 'Wait 3m' : 'Turn ON'}
              </p>
            </div>

            <div
              className={`p-2 rounded-xl border transition-all ${
                secondsRemaining > 60
                  ? 'border-amber-200 bg-amber-50/70 text-amber-800'
                  : 'border-emerald-200 bg-emerald-50/70 text-emerald-800'
              }`}
            >
              <div className="text-sm font-black flex items-center justify-center gap-1">
                <Tv className="w-3.5 h-3.5" />
                <span>TV & PC</span>
              </div>
              <p className="text-[10px] font-semibold mt-0.5">
                {secondsRemaining > 60 ? 'Unplug' : 'Safe now'}
              </p>
            </div>

            <div
              className={`p-2 rounded-xl border transition-all ${
                secondsRemaining > 0
                  ? 'border-rose-200 bg-rose-50/70 text-rose-800'
                  : 'border-emerald-200 bg-emerald-50/70 text-emerald-800'
              }`}
            >
              <div className="text-sm font-black flex items-center justify-center gap-1">
                <AirVent className="w-3.5 h-3.5" />
                <span>AC / Pump</span>
              </div>
              <p className="text-[10px] font-semibold mt-0.5">
                {secondsRemaining > 0 ? 'Last 3m+' : 'Safe now'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="text-xs text-amber-800 hover:text-amber-900 font-semibold underline decoration-dotted flex items-center gap-1"
            >
              <Info className="w-3.5 h-3.5" />
              {showGuide ? 'Hide Sierra Leone surge guide' : 'Why wait 3 minutes after EDSA power returns?'}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable educational guide */}
      {showGuide && (
        <div className="mt-4 pt-4 border-t border-amber-200 text-xs text-slate-700 space-y-2.5 bg-white/70 p-4 rounded-2xl">
          <p className="font-bold text-slate-900">
            Why 70% of appliance breakdowns happen within 180 seconds of power restoration:
          </p>
          <ul className="list-disc pl-4 space-y-1.5 text-slate-600">
            <li>
              <strong>Initial Inrush Spike:</strong> When EDSA substation breakers close, line voltage can spike up to 270V–300V before settling at 220V–230V.
            </li>
            <li>
              <strong>Compressor Backpressure:</strong> Refrigerator and AC compressors need 3 minutes for internal coolant pressure to equalize. Starting immediately can stall and burn the motor coils.
            </li>
            <li>
              <strong>Staggered Startup:</strong> Always turn appliances on one by one with 30 seconds gap rather than switching all breakers at once.
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
