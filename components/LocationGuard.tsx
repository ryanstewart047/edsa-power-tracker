'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  MapPinOff, 
  Settings, 
  RefreshCw, 
  ShieldAlert, 
  Navigation, 
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import {
  GEOLOCATION_MAXIMUM_AGE_MS,
  GEOLOCATION_TIMEOUT_MS,
  MAX_REPORTING_ACCURACY_METERS,
} from '@/lib/locationConfig';

const LOCATION_ONBOARDING_COMPLETE_EVENT = 'edsa-location-onboarding-complete';

function isDesktopEnvironment() {
  if (typeof window === 'undefined') return false;
  const mobileUserAgent = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
  return !mobileUserAgent || window.matchMedia('(min-width: 768px) and (pointer: fine)').matches;
}

export type LocationState = 
  | 'INITIALIZING'
  | 'PERMISSION_PROMPT'
  | 'GPS_OFF'
  | 'GPS_UNAVAILABLE'
  | 'LOW_ACCURACY'
  | 'PERMISSION_DENIED'
  | 'READY'
  | 'UNSUPPORTED';

interface LocationGuardProps {
  onLocationReady?: (pos: GeolocationPosition) => void;
}

export default function LocationGuard({ onLocationReady }: LocationGuardProps) {
  const pathname = usePathname();
  const [state, setState] = useState<LocationState>('INITIALIZING');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [desktopLocationSkipped, setDesktopLocationSkipped] = useState(false);
  const [onboardingActive, setOnboardingActive] = useState(true);
  const [showManualGuide, setShowManualGuide] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  
  const permissionStatusRef = useRef<PermissionStatus | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if route is exempt from location enforcement (e.g. legal pages, admin, topup)
  const isExemptRoute = 
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/data-deletion') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/feedback') ||
    pathname.startsWith('/topup');

  // Detect Android device and Desktop environment
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      setIsAndroid(/android/i.test(ua));
      const desktop = isDesktopEnvironment();
      setIsDesktop(desktop);
      const isSkipped =
        desktop && (
          localStorage.getItem('edsa_desktop_location_skipped_v1') === 'true' ||
          localStorage.getItem('edsa_location_skipped_v1') === 'true'
        );
      setDesktopLocationSkipped(isSkipped);
    }
  }, []);

  // Monitor onboarding status from localStorage
  useEffect(() => {
    const checkOnboarding = () => {
      const completed = localStorage.getItem('edsa_welcome_onboarding_v1') === 'true';
      setOnboardingActive(!completed);
      const desktop = isDesktopEnvironment();
      setIsDesktop(desktop);
      const isSkipped =
        desktop && (
          localStorage.getItem('edsa_desktop_location_skipped_v1') === 'true' ||
          localStorage.getItem('edsa_location_skipped_v1') === 'true'
        );
      setDesktopLocationSkipped(isSkipped);
      if (isSkipped) {
        setState('READY');
      }
    };

    checkOnboarding();
    window.addEventListener(LOCATION_ONBOARDING_COMPLETE_EVENT, checkOnboarding);
    window.addEventListener('storage', checkOnboarding);
    return () => {
      window.removeEventListener(LOCATION_ONBOARDING_COMPLETE_EVENT, checkOnboarding);
      window.removeEventListener('storage', checkOnboarding);
    };
  }, []);

  const handleSkipLocation = useCallback(() => {
    if (typeof window !== 'undefined' && isDesktopEnvironment()) {
      localStorage.setItem('edsa_desktop_location_skipped_v1', 'true');
      setDesktopLocationSkipped(true);
      setState('READY');
    }
  }, []);

  const handleSkipOnDesktop = useCallback(() => {
    handleSkipLocation();
  }, [handleSkipLocation]);

  // Core function to test GPS availability and acquire coordinates
  const probeLocation = useCallback((silent = false) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState('UNSUPPORTED');
      return;
    }

    if (!silent) {
      setIsRequesting(true);
    }

    const acceptPosition = (position: GeolocationPosition) => {
      const accuracy = position.coords.accuracy;
      if (!Number.isFinite(accuracy) || accuracy > MAX_REPORTING_ACCURACY_METERS) {
        const roundedAccuracy = Number.isFinite(accuracy) ? Math.round(accuracy) : null;
        const isDesktop = !/android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
        setState('LOW_ACCURACY');
        setErrorMessage(
          roundedAccuracy === null
            ? 'Your browser did not provide a location accuracy radius. Check browser and operating-system Location Services, then try again.'
            : isDesktop
              ? `Your browser location is about ${roundedAccuracy}m accurate. Improve your computer's Location Services to reach the required ${MAX_REPORTING_ACCURACY_METERS}m accuracy.`
              : `Your current GPS accuracy is about ${roundedAccuracy}m. Move outdoors or turn on Precise Location to reach the required ${MAX_REPORTING_ACCURACY_METERS}m accuracy.`,
        );
        setIsRequesting(false);
        return;
      }
      setState('READY');
      setErrorMessage(null);
      setIsRequesting(false);
      if (onLocationReady) {
        onLocationReady(position);
      }
    };

    const reportFailure = (error: GeolocationPositionError) => {
      setIsRequesting(false);
      if (error.code === error.PERMISSION_DENIED) {
        setState('PERMISSION_DENIED');
        setErrorMessage('Location permission was denied. EDSA Tracker requires access to your GPS to operate.');
      } else if (error.code === error.POSITION_UNAVAILABLE || error.code === error.TIMEOUT) {
        setState('GPS_UNAVAILABLE');
        const isDesktop = !/android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
        setErrorMessage(
          isDesktop
            ? 'Your browser could not get a location from this computer. Check that Location Services are enabled in your operating system and allowed for this browser, then try again.'
            : 'We could not get a location fix. Check Location Services, move to an open area, and try again.',
        );
      } else {
        setState('GPS_UNAVAILABLE');
        setErrorMessage('We could not verify your location. Check Location services and try again.');
      }
    };

    const tryBrowserLocation = () => {
      navigator.geolocation.getCurrentPosition(
        acceptPosition,
        reportFailure,
        {
          // Desktop browsers frequently have no GPS receiver, but can resolve a
          // location through the operating system, Wi-Fi, or network provider.
          enableHighAccuracy: false,
          timeout: GEOLOCATION_TIMEOUT_MS * 2,
          maximumAge: GEOLOCATION_MAXIMUM_AGE_MS,
        },
      );
    };

    navigator.geolocation.getCurrentPosition(
      acceptPosition,
      (error) => {
        if (error.code === error.POSITION_UNAVAILABLE || error.code === error.TIMEOUT) {
          tryBrowserLocation();
          return;
        }
        reportFailure(error);
      },
      {
        enableHighAccuracy: true,
        timeout: GEOLOCATION_TIMEOUT_MS,
        maximumAge: 0,
      }
    );
  }, [onLocationReady]);

  // Initial check and permission query
  const checkStatus = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setState('UNSUPPORTED');
      return;
    }

    // Use navigator.permissions if available
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const perm = await navigator.permissions.query({ name: 'geolocation' });
        permissionStatusRef.current = perm;

        perm.onchange = () => {
          if (perm.state === 'granted') {
            probeLocation();
          } else if (perm.state === 'denied') {
            setState('PERMISSION_DENIED');
          } else {
            setState('PERMISSION_PROMPT');
          }
        };

        if (perm.state === 'denied') {
          setState('PERMISSION_DENIED');
          return;
        } else if (perm.state === 'prompt') {
          setState('PERMISSION_PROMPT');
          return;
        } else if (perm.state === 'granted') {
          // Permission is granted; test if GPS hardware is turned on
          probeLocation();
          return;
        }
      } catch {
        // Fallback for browsers with restricted permissions API
      }
    }

    // Direct probe if permissions query failed or is not available
    probeLocation();
  }, [probeLocation]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Listen to visibilitychange and focus to auto-resume when returning from Settings
  useEffect(() => {
    const handleRecheck = () => {
      if (document.visibilityState === 'visible') {
        checkStatus();
      }
    };

    window.addEventListener('visibilitychange', handleRecheck);
    window.addEventListener('focus', handleRecheck);

    return () => {
      if (permissionStatusRef.current) {
        permissionStatusRef.current.onchange = null;
      }
      window.removeEventListener('visibilitychange', handleRecheck);
      window.removeEventListener('focus', handleRecheck);
    };
  }, [checkStatus]);

  // Auto-polling when blocked to catch quick settings toggle (mobile only)
  useEffect(() => {
    // Avoid repeated background polling on desktop, where computers lack GPS hardware
    // and repeated queries cause CoreLocation / kCLErrorLocationUnknown log spam.
    if (isDesktop && (state === 'GPS_OFF' || state === 'GPS_UNAVAILABLE' || state === 'LOW_ACCURACY')) {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    if (state === 'GPS_OFF' || state === 'GPS_UNAVAILABLE' || state === 'LOW_ACCURACY') {
      pollTimerRef.current = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          probeLocation(true);
        }
      }, 4000);
    } else {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    }

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [state, probeLocation, isDesktop]);

  // User Actions
  const handleRequestPermission = () => {
    setAttemptCount((prev) => prev + 1);
    probeLocation(false);
  };

  const handleOpenLocationSettings = () => {
    setAttemptCount((prev) => prev + 1);
    if (isAndroid) {
      try {
        // Best-effort Android system settings link. Other browser/PWA environments
        // intentionally fall back to the visible, device-specific instructions.
        window.location.href = 'intent:#Intent;action=android.settings.LOCATION_SOURCE_SETTINGS;end';
      } catch {
        setShowManualGuide(true);
      }
    } else {
      setShowManualGuide(true);
    }
  };

  const handleOpenAppSettings = () => {
    setAttemptCount((prev) => prev + 1);
    if (isAndroid) {
      try {
        // A browser PWA does not have a stable Android package ID. Open the
        // browser's app-permission surface when the platform supports it.
        window.location.href = 'intent:#Intent;action=android.settings.APPLICATION_DETAILS_SETTINGS;end';
      } catch {
        setShowManualGuide(true);
      }
    } else {
      setShowManualGuide(true);
    }
  };

  // If route is exempt or onboarding still active or location ready, don't block
  if (isExemptRoute || onboardingActive || desktopLocationSkipped || state === 'READY') {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto"
      >
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[140px] bg-blue-100/60 pointer-events-none" />

        <motion.div
          initial={{ scale: 0.94, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-md bg-white border border-slate-200 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl text-center space-y-6 my-auto text-slate-900"
        >
          {/* Header Icon Indicator */}
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
            {state === 'GPS_OFF' || state === 'GPS_UNAVAILABLE' ? (
              <>
                <div className="absolute inset-0 rounded-3xl bg-amber-50 border border-amber-200 animate-pulse" />
                <MapPinOff className="w-12 h-12 text-amber-600" />
              </>
            ) : state === 'PERMISSION_DENIED' ? (
              <>
                <div className="absolute inset-0 rounded-3xl bg-rose-50 border border-rose-200" />
                <ShieldAlert className="w-12 h-12 text-rose-600" />
              </>
            ) : (
              <>
                <div className="absolute inset-0 rounded-3xl bg-blue-50 border border-blue-200" />
                <Navigation className="w-12 h-12 text-blue-600 animate-bounce" />
              </>
            )}
          </div>

          {/* Badge & Title */}
          <div className="space-y-2">
            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
              state === 'GPS_OFF' || state === 'GPS_UNAVAILABLE'
                ? 'bg-amber-50 border-amber-200 text-amber-700' 
                : state === 'PERMISSION_DENIED'
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'bg-blue-50 border-blue-200 text-blue-700'
            }`}>
              {state === 'GPS_OFF'
                ? 'DEVICE GPS TURNED OFF' 
                : state === 'GPS_UNAVAILABLE'
                ? 'GPS SIGNAL UNAVAILABLE'
                : state === 'LOW_ACCURACY'
                ? 'GPS NEEDS IMPROVEMENT'
                : state === 'PERMISSION_DENIED'
                ? 'PERMISSION BLOCKED'
                : 'LOCATION REQUIRED'}
            </span>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {state === 'GPS_OFF'
                ? 'Enable Location Services'
                : state === 'GPS_UNAVAILABLE'
                ? 'Improve GPS Signal'
                : state === 'LOW_ACCURACY'
                ? 'Improve GPS Accuracy'
                : state === 'PERMISSION_DENIED'
                ? 'Location Access Denied'
                : 'Allow Location Access'}
            </h2>

            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              {errorMessage || (
                state === 'GPS_OFF'
                  ? 'Your device location (GPS) is turned off. EDSA Tracker requires active GPS to detect your Sierra Leone community and prevent false outage alarms.'
                  : state === 'GPS_UNAVAILABLE'
                  ? 'Your location signal is currently unavailable. An open area and Precise Location help the app verify your exact community.'
                  : state === 'LOW_ACCURACY'
                  ? `A GPS radius of ${MAX_REPORTING_ACCURACY_METERS}m or better is required to match your Sierra Leone community accurately.`
                  : state === 'PERMISSION_DENIED'
                  ? 'Permission to access location was denied. To protect grid integrity, you must enable location permissions for this app to proceed.'
                  : 'EDSA Power Tracker requires real-time GPS location to match your community, verify power reports, and dispatch emergency hazard crews.'
              )}
            </p>
          </div>

          {/* Why We Need Location Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2 text-xs text-slate-600 shadow-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-[11px] uppercase tracking-wider mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-blue-600" />
              <span>Why GPS is mandatory:</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold leading-none mt-0.5">•</span>
              <p><strong className="text-slate-900">Auto-Detection:</strong> Anchors power status directly to your exact Sierra Leone community.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold leading-none mt-0.5">•</span>
              <p><strong className="text-slate-900">Fraud Prevention:</strong> Blocks false reports submitted from outside the actual zone.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold leading-none mt-0.5">•</span>
              <p><strong className="text-slate-900">Hazard Response:</strong> Attaches exact coordinates for transformer and cable fires.</p>
            </div>
          </div>

          {/* Manual Instructions Accordion / Card */}
          {showManualGuide && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left text-xs text-amber-900 space-y-2">
              <p className="font-bold text-slate-900">How to enable location:</p>
              <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-700">
                <li>Swipe down from the top of your phone screen to open Quick Settings.</li>
                <li>Tap the <strong>Location</strong> icon to turn it ON.</li>
                <li>If using a browser or app, tap the lock/tune icon next to the URL and select <strong>Permissions → Location → Allow</strong>.</li>
              </ol>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 pt-2">
            {state === 'PERMISSION_PROMPT' || state === 'INITIALIZING' ? (
              <button
                type="button"
                onClick={handleRequestPermission}
                disabled={isRequesting}
                className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
              >
                {isRequesting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Detecting Location...</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 text-white" />
                    <span>Allow Location Access</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : state === 'GPS_OFF' || state === 'GPS_UNAVAILABLE' || state === 'LOW_ACCURACY' ? (
              <>
                <button
                  type="button"
                  onClick={handleOpenLocationSettings}
                  className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95"
                >
                  <Settings className="w-4 h-4" />
                  <span>{state === 'GPS_OFF' ? 'Turn On Device GPS' : 'Open Location Settings'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAttemptCount((prev) => prev + 1);
                    probeLocation(false);
                  }}
                  disabled={isRequesting}
                  className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRequesting ? 'animate-spin' : ''}`} />
                  <span>I Switched It On — Check Again</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleOpenAppSettings}
                  className="w-full py-4 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 active:scale-95"
                >
                  <Settings className="w-4 h-4" />
                  <span>Open App Permissions</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAttemptCount((prev) => prev + 1);
                    probeLocation(false);
                  }}
                  disabled={isRequesting}
                  className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRequesting ? 'animate-spin' : ''}`} />
                  <span>I Allowed Permission — Re-Check</span>
                </button>
              </>
            )}

            {isDesktop && attemptCount >= 2 && (
              <button
                type="button"
                onClick={handleSkipLocation}
                className="w-full py-3.5 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Skip for now & open app (Set up later)</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {isDesktop && attemptCount < 2 && (
              <button
                type="button"
                onClick={handleSkipOnDesktop}
                className="w-full py-3.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <span>Continue without location on this computer</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {!showManualGuide && (state === 'GPS_OFF' || state === 'GPS_UNAVAILABLE' || state === 'LOW_ACCURACY' || state === 'PERMISSION_DENIED') && (
              <button
                type="button"
                onClick={() => setShowManualGuide(true)}
                className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
              >
                Need help turning on location?
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
