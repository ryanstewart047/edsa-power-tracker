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
import { GEOLOCATION_TIMEOUT_MS, MAX_REPORTING_ACCURACY_METERS } from '@/lib/locationConfig';

const LOCATION_ONBOARDING_COMPLETE_EVENT = 'edsa-location-onboarding-complete';

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
  const [onboardingActive, setOnboardingActive] = useState(true);
  const [showManualGuide, setShowManualGuide] = useState(false);
  
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

  // Detect Android device
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      setIsAndroid(/android/i.test(ua));
    }
  }, []);

  // Monitor onboarding status from localStorage
  useEffect(() => {
    const checkOnboarding = () => {
      const completed = localStorage.getItem('edsa_welcome_onboarding_v1') === 'true';
      setOnboardingActive(!completed);
    };

    checkOnboarding();
    window.addEventListener(LOCATION_ONBOARDING_COMPLETE_EVENT, checkOnboarding);
    window.addEventListener('storage', checkOnboarding);
    return () => {
      window.removeEventListener(LOCATION_ONBOARDING_COMPLETE_EVENT, checkOnboarding);
      window.removeEventListener('storage', checkOnboarding);
    };
  }, []);

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
          maximumAge: GEOLOCATION_TIMEOUT_MS,
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

  // Auto-polling when blocked to catch quick settings toggle
  useEffect(() => {
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
  }, [state, probeLocation]);

  // User Actions
  const handleRequestPermission = () => {
    probeLocation(false);
  };

  const handleOpenLocationSettings = () => {
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
  if (isExemptRoute || onboardingActive || state === 'READY') {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl overflow-y-auto"
      >
        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[140px] bg-red-600/15 pointer-events-none" />

        <motion.div
          initial={{ scale: 0.94, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl text-center space-y-6 my-auto"
        >
          {/* Header Icon Indicator */}
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
            {state === 'GPS_OFF' || state === 'GPS_UNAVAILABLE' ? (
              <>
                <div className="absolute inset-0 rounded-3xl bg-amber-500/10 border border-amber-500/20 animate-pulse" />
                <MapPinOff className="w-12 h-12 text-amber-400" />
              </>
            ) : state === 'PERMISSION_DENIED' ? (
              <>
                <div className="absolute inset-0 rounded-3xl bg-red-500/10 border border-red-500/20" />
                <ShieldAlert className="w-12 h-12 text-red-500" />
              </>
            ) : (
              <>
                <div className="absolute inset-0 rounded-3xl bg-blue-500/10 border border-blue-500/20" />
                <Navigation className="w-12 h-12 text-blue-400 animate-bounce" />
              </>
            )}
          </div>

          {/* Badge & Title */}
          <div className="space-y-2">
            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
              state === 'GPS_OFF' || state === 'GPS_UNAVAILABLE'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                : state === 'PERMISSION_DENIED'
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
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

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
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

            <p className="text-xs text-gray-300 leading-relaxed max-w-sm mx-auto">
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
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-2 text-xs text-gray-300">
            <div className="flex items-center gap-2 font-bold text-white text-[11px] uppercase tracking-wider mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
              <span>Why GPS is mandatory:</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold leading-none mt-0.5">•</span>
              <p><strong className="text-white">Auto-Detection:</strong> Anchors power status directly to your exact Sierra Leone community.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold leading-none mt-0.5">•</span>
              <p><strong className="text-white">Fraud Prevention:</strong> Blocks false reports submitted from outside the actual zone.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold leading-none mt-0.5">•</span>
              <p><strong className="text-white">Hazard Response:</strong> Attaches exact coordinates for transformer and cable fires.</p>
            </div>
          </div>

          {/* Manual Instructions Accordion / Card */}
          {showManualGuide && (
            <div className="bg-slate-950/80 border border-amber-500/20 rounded-2xl p-4 text-left text-xs text-amber-200/90 space-y-2">
              <p className="font-bold text-white">How to enable location:</p>
              <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-gray-300">
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
                className="w-full py-4 px-6 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/20 active:scale-95 disabled:opacity-50"
              >
                {isRequesting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Detecting Location...</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 fill-slate-950" />
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
                  className="w-full py-4 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 active:scale-95"
                >
                  <Settings className="w-4 h-4" />
                  <span>{state === 'GPS_OFF' ? 'Turn On Device GPS' : 'Open Location Settings'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => probeLocation(false)}
                  disabled={isRequesting}
                  className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
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
                  className="w-full py-4 px-6 rounded-2xl bg-red-500 hover:bg-red-400 text-white font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 active:scale-95"
                >
                  <Settings className="w-4 h-4" />
                  <span>Open App Permissions</span>
                </button>

                <button
                  type="button"
                  onClick={() => probeLocation(false)}
                  disabled={isRequesting}
                  className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRequesting ? 'animate-spin' : ''}`} />
                  <span>I Allowed Permission — Re-Check</span>
                </button>
              </>
            )}

            {!showManualGuide && (state === 'GPS_OFF' || state === 'GPS_UNAVAILABLE' || state === 'LOW_ACCURACY' || state === 'PERMISSION_DENIED') && (
              <button
                type="button"
                onClick={() => setShowManualGuide(true)}
                className="text-xs text-gray-400 hover:text-white underline font-medium"
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
