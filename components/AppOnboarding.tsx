'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  AlertTriangle, 
  Bot, 
  ChevronRight, 
  ChevronLeft, 
  ShieldCheck, 
  Sparkles,
  Activity,
  CheckCircle2,
  FileText,
  ExternalLink,
  MapPin,
  Navigation,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { GEOLOCATION_TIMEOUT_MS, MAX_REPORTING_ACCURACY_METERS } from '@/lib/reporting';

const LOCATION_ONBOARDING_COMPLETE_EVENT = 'edsa-location-onboarding-complete';

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
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [locationIssue, setLocationIssue] = useState<'denied' | 'unavailable' | 'accuracy' | null>(null);
  const [showLocationHelp, setShowLocationHelp] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const hasRequestedLocationRef = useRef(false);

  useEffect(() => {
    // Check if user has already completed onboarding and accepted terms
    const completed = localStorage.getItem('edsa_welcome_onboarding_v1');
    const termsAcceptedStorage = localStorage.getItem('edsa_terms_accepted_v1');
    
    if (termsAcceptedStorage === 'true') {
      setTermsAccepted(true);
    }

    if (!completed || !termsAcceptedStorage) {
      // The splash screen remains visible for 2.5 seconds, so do not leave a gap
      // where location-dependent features can be used before onboarding appears.
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleLocationSuccess = useCallback((pos: GeolocationPosition) => {
    const accuracy = pos.coords.accuracy;
    if (!Number.isFinite(accuracy) || accuracy > MAX_REPORTING_ACCURACY_METERS) {
      const roundedAccuracy = Number.isFinite(accuracy) ? Math.round(accuracy) : null;
      setLocationAccuracy(roundedAccuracy);
      setLocationGranted(false);
      setLocationIssue('accuracy');
      setLocationError(
        roundedAccuracy === null
          ? 'Your device did not provide a GPS accuracy radius. Turn on Precise Location to continue.'
          : `GPS accuracy is currently about ${roundedAccuracy}m. Move outdoors or enable Precise Location to continue.`,
      );
      return;
    }

    setLocationAccuracy(Math.round(accuracy));
    setLocationGranted(true);
    setLocationIssue(null);
    setLocationError(null);
    setShowLocationHelp(false);
  }, []);

  const handleLocationFailure = useCallback((err: GeolocationPositionError) => {
    setLocationLoading(false);
    setLocationGranted(false);
    if (err.code === err.PERMISSION_DENIED) {
      setLocationIssue('denied');
      setLocationError('Permission was denied. Allow location access in browser or app settings to continue.');
    } else if (err.code === err.POSITION_UNAVAILABLE) {
      setLocationIssue('unavailable');
      setLocationError('Location services are unavailable. Turn on device Location, then try again.');
    } else {
      setLocationIssue('accuracy');
      setLocationError('Unable to get an accurate GPS fix. Move to an open area, then try again.');
    }
  }, []);

  const checkExistingLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return;
    }

    if (navigator.permissions?.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((permission) => {
        if (permission.state === 'granted') {
          navigator.geolocation.getCurrentPosition(
            handleLocationSuccess,
            handleLocationFailure,
            { enableHighAccuracy: true, timeout: GEOLOCATION_TIMEOUT_MS, maximumAge: 0 },
          );
        } else if (permission.state === 'denied') {
          setLocationGranted(false);
          setLocationIssue('denied');
          setLocationError('Permission was denied. Allow location access in browser or app settings to continue.');
        }
      }).catch(() => {});
      return;
    }

    if (hasRequestedLocationRef.current) {
      navigator.geolocation.getCurrentPosition(
        handleLocationSuccess,
        handleLocationFailure,
        { enableHighAccuracy: true, timeout: GEOLOCATION_TIMEOUT_MS, maximumAge: 0 },
      );
    }
  }, [handleLocationFailure, handleLocationSuccess]);

  // Re-check an existing grant when the app returns from system or browser settings.
  useEffect(() => {
    checkExistingLocation();
    const recheckWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        checkExistingLocation();
      }
    };
    window.addEventListener('visibilitychange', recheckWhenVisible);
    window.addEventListener('focus', recheckWhenVisible);
    return () => {
      window.removeEventListener('visibilitychange', recheckWhenVisible);
      window.removeEventListener('focus', recheckWhenVisible);
    };
  }, [checkExistingLocation]);

  useEffect(() => {
    setIsAndroid(/android/i.test(navigator.userAgent));
  }, []);

  const requestLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError('Geolocation is not supported on this browser or device.');
      return;
    }
    hasRequestedLocationRef.current = true;
    setLocationLoading(true);
    setLocationError(null);
    setLocationIssue(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationLoading(false);
        handleLocationSuccess(pos);
      },
      handleLocationFailure,
      { enableHighAccuracy: true, timeout: GEOLOCATION_TIMEOUT_MS, maximumAge: 0 }
    );
  };

  const openLocationSettings = () => {
    if (isAndroid) {
      const action = locationIssue === 'denied'
        ? 'android.settings.APPLICATION_DETAILS_SETTINGS'
        : 'android.settings.LOCATION_SOURCE_SETTINGS';
      window.location.href = `intent:#Intent;action=${action};end`;
      return;
    }

    setShowLocationHelp(true);
  };

  const handleFinish = () => {
    localStorage.setItem('edsa_welcome_onboarding_v1', 'true');
    localStorage.setItem('edsa_terms_accepted_v1', 'true');
    window.dispatchEvent(new Event(LOCATION_ONBOARDING_COMPLETE_EVENT));
    setIsVisible(false);
  };

  const steps: OnboardingStep[] = [
    {
      badge: 'COMMUNITY AGREEMENT',
      title: 'Terms & Community Guidelines',
      subtitle: 'Please review and accept to enter EDSA Tracker',
      description:
        'To keep Sierra Leone electricity tracking safe, trustworthy, and accurate for everyone, please review and accept our usage guidelines.',
      icon: FileText,
      accentColor: 'text-yellow-400',
      bgGlow: 'from-yellow-500/20 to-transparent',
      preview: (
        <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 space-y-3 shadow-xl text-left">
          <div className="space-y-2 text-xs text-gray-300">
            <div className="flex items-start gap-2">
              <span className="text-yellow-400 text-sm leading-none mt-0.5">⚡</span>
              <p><strong className="text-white">Accurate Reports:</strong> Submit real power status only for your current community.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 text-sm leading-none mt-0.5">📍</span>
              <p><strong className="text-white">GPS Matching:</strong> GPS is used only to anchor outage and hazard reports to your zone.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-amber-400 text-sm leading-none mt-0.5">🛡️</span>
              <p><strong className="text-white">Zero False Alarms:</strong> Malicious or fake emergency reports are strictly forbidden.</p>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
            <Link 
              href="/terms" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-yellow-400 hover:text-yellow-300 underline font-semibold flex items-center gap-1"
            >
              <span>Read Terms</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <Link 
              href="/privacy" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-yellow-400 hover:text-yellow-300 underline font-semibold flex items-center gap-1"
            >
              <span>Privacy Policy</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setTermsAccepted(!termsAccepted)}
            className={`w-full p-3 rounded-xl border flex items-center gap-3 text-left transition-all ${
              termsAccepted
                ? 'bg-yellow-400/15 border-yellow-400 text-yellow-300 shadow-md shadow-yellow-400/10'
                : 'bg-white/5 border-white/15 text-gray-300 hover:bg-white/10'
            }`}
          >
            <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
              termsAccepted
                ? 'bg-yellow-400 border-yellow-400 text-slate-950'
                : 'border-white/30 bg-white/5'
            }`}>
              {termsAccepted && <CheckCircle2 className="w-4 h-4 fill-slate-950 text-yellow-400" />}
            </div>
            <span className="text-xs font-bold leading-snug">
              I accept the Terms & Conditions and Privacy Policy
            </span>
          </button>
        </div>
      ),
    },
    {
      badge: 'PRECISION GPS REQUIRED',
      title: 'Enable Device Location',
      subtitle: 'Required for community matching & fraud prevention',
      description:
        'To prevent fake outage reports and dispatch emergency crews to exact coordinates, EDSA Tracker requires your active GPS location to operate.',
      icon: Navigation,
      accentColor: 'text-emerald-400',
      bgGlow: 'from-emerald-500/20 to-transparent',
      preview: (
        <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 space-y-3 shadow-xl text-left">
          {locationGranted ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-emerald-400">GPS Successfully Linked</div>
                <div className="text-[10px] text-gray-300">
                  {locationAccuracy ? `Accuracy within ±${locationAccuracy}m • Ready` : 'Location verified for Sierra Leone coverage'}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-gray-300 space-y-1.5">
                <div className="flex items-center gap-2 text-white font-bold">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>Mandatory Location Access</span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Your coordinates are used strictly inside the app to link you to your nearest Sierra Leone community.
                </p>
              </div>

              {locationError && (
                <div className="space-y-2">
                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-[11px] flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{locationError}</span>
                  </div>
                  {locationIssue && (
                    <button
                      type="button"
                      onClick={openLocationSettings}
                      className="w-full p-2.5 rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-200 text-[11px] font-bold hover:bg-amber-400/20 transition-colors"
                    >
                      {locationIssue === 'denied' ? 'Open Permission Settings' : 'Open Location Settings'}
                    </button>
                  )}
                  {showLocationHelp && (
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-[11px] leading-relaxed">
                      Open your device Settings, turn on Location, then allow Location access for this browser or installed app. Return here and the check will run automatically.
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={requestLocation}
                disabled={locationLoading}
                className="w-full p-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
              >
                {locationLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Connecting GPS...</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 fill-slate-950" />
                    <span>Allow & Verify GPS Access</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ),
    },
    {
      badge: 'REAL-TIME GRID TRACKING',
      title: 'Track Live Power in Your Community',
      subtitle: 'Know your electricity status before you travel',
      description:
        'Get live crowdsourced power reports across Sierra Leone communities. Easily see which zones currently have active power, planned maintenance, or load shedding.',
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
                &ldquo;Power restored in Aberdeen! Check current voltage before connecting heavy appliances.&rdquo;
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
  const isTermsStep = currentStep === 0;
  const isLocationStep = currentStep === 1;
  const isNextDisabled = (isTermsStep && !termsAccepted) || (isLocationStep && !locationGranted);

  const nextStep = () => {
    if (isNextDisabled) return;
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
          {/* Top Bar: Skip button (only available after agreeing to Terms and granting GPS) and step counter */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </div>
            {!isLastStep && !isTermsStep && !isLocationStep && (
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
                  onClick={() => {
                    if (idx === 0) { setCurrentStep(0); return; }
                    if (!termsAccepted) return;
                    if (idx > 1 && !locationGranted) return;
                    setCurrentStep(idx);
                  }}
                  disabled={(idx > 0 && !termsAccepted) || (idx > 1 && !locationGranted)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentStep 
                      ? 'w-8 bg-yellow-400' 
                      : 'w-2 bg-white/20 hover:bg-white/40'
                  } ${(idx > 0 && !termsAccepted) || (idx > 1 && !locationGranted) ? 'opacity-30 cursor-not-allowed' : ''}`}
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
                disabled={isNextDisabled}
                className={`flex-1 py-3.5 px-6 rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 group ${
                  isNextDisabled
                    ? 'bg-yellow-400/30 text-slate-700 cursor-not-allowed border border-white/5'
                    : 'bg-yellow-400 hover:bg-yellow-300 text-slate-950 shadow-lg shadow-yellow-400/20'
                }`}
              >
                {isLastStep ? (
                  <>
                    <span>Enter EDSA Tracker</span>
                    <Zap className="w-4 h-4 fill-slate-950" />
                  </>
                ) : isTermsStep ? (
                  <>
                    <span>{termsAccepted ? 'I Agree & Continue' : 'Accept Terms to Continue'}</span>
                    <ChevronRight className={`w-4 h-4 ${termsAccepted ? 'group-hover:translate-x-0.5' : ''} transition-transform`} />
                  </>
                ) : isLocationStep ? (
                  <>
                    <span>{locationGranted ? 'GPS Verified — Continue' : 'Allow GPS to Continue'}</span>
                    <ChevronRight className={`w-4 h-4 ${locationGranted ? 'group-hover:translate-x-0.5' : ''} transition-transform`} />
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
