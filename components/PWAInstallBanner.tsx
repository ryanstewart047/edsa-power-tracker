'use client';

import { useState, useEffect } from 'react';
import { Download, X, Share, Zap } from 'lucide-react';
import { detectDevice, isPWAInstalled } from '@/lib/deviceDetection';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.bridgetech.edsapowertracker';

export default function PWAInstallBanner() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [device, setDevice] = useState({ isMobile: false, isIOS: false, isAndroid: false });

  useEffect(() => {
    const d = detectDevice();
    setDevice(d);

    if (isPWAInstalled()) return;
    if (sessionStorage.getItem('edsa-pwa-dismissed')) return;

    // 1. Check if beforeinstallprompt already fired and was saved globally
    const globalPrompt = (window as unknown as { deferredPrompt?: BeforeInstallPromptEvent }).deferredPrompt;
    if (globalPrompt) {
      setDeferredPrompt(globalPrompt);
    }

    // 2. Listen for the custom event dispatched in layout.tsx
    const handlePromptReady = () => {
      const updatedPrompt = (window as unknown as { deferredPrompt?: BeforeInstallPromptEvent }).deferredPrompt;
      if (updatedPrompt) {
        setDeferredPrompt(updatedPrompt);
      }
      setShow(true);
    };

    // 3. Keep the standard listener as backup
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      (window as unknown as { deferredPrompt: BeforeInstallPromptEvent }).deferredPrompt = promptEvent;
      setShow(true);
    };

    window.addEventListener('pwa-prompt-ready', handlePromptReady);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Smart banner timer: show smoothly after 2.5s on mobile if not already dismissed
    const timer = setTimeout(() => {
      if (!sessionStorage.getItem('edsa-pwa-dismissed') && !isPWAInstalled()) {
        setShow(true);
      }
    }, 2500);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('pwa-prompt-ready', handlePromptReady);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem('edsa-pwa-dismissed', 'true');
  };

  const handleWebInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        handleDismiss();
      }
      setDeferredPrompt(null);
    }
  };

  if (!show || !device.isMobile) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[9999] animate-in slide-in-from-top-10 duration-500 pointer-events-auto max-w-lg mx-auto">
      <div className="bg-white/95 backdrop-blur-2xl border border-slate-200 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.18)] ring-1 ring-slate-100 relative">
        <button 
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#040e40] border border-blue-900/30 flex items-center justify-center shrink-0 shadow-lg shadow-[#040e40]/25">
            <Zap className="w-8 h-8 text-amber-400 fill-amber-400" />
          </div>
          
          <div className="flex-1 pr-6">
            <h3 className="font-black text-slate-900 text-lg leading-tight">EDSA Power Tracker</h3>
            <p className="text-slate-600 text-xs sm:text-sm mt-0.5 font-medium">
              {device.isIOS 
                ? 'Add to home screen for real-time outage alerts' 
                : 'Get the official app on Google Play Store'}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {device.isIOS ? (
            <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-3.5 border border-slate-200">
              <div className="p-2 bg-blue-100 rounded-xl shrink-0">
                <Share className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Tap <span className="text-slate-900 font-bold">Share</span> at the bottom of Safari, then tap <span className="text-slate-900 font-bold">Add to Home Screen</span>.
              </p>
            </div>
          ) : (
            <>
              {/* Primary Action for Android: Google Play Store */}
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleDismiss}
                className="w-full bg-[#040e40] text-white font-black py-3.5 px-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-[#020820] transition-colors shadow-lg shadow-[#040e40]/25 active:scale-95 text-sm"
              >
                {/* Google Play Vector Icon */}
                <svg className="w-5 h-5 fill-current shrink-0 text-white" viewBox="0 0 24 24">
                  <path d="M3.609 1.814L13.793 12 3.61 22.186c-.198-.198-.3-.464-.3-.756V2.57c0-.292.102-.558.3-.756zm11.603 11.603l2.42 2.42-12.015 6.945 9.595-9.365zm0-2.834L5.617.218 17.632 7.163l-2.42 2.42zm1.417 1.417l3.757 2.172c.704.407.704 1.07 0 1.477l-3.757 2.172-2.316-2.316 2.316-2.316z"/>
                </svg>
                <span>Get on Google Play</span>
              </a>

              {/* Secondary fallback: Web PWA install (if supported by browser) */}
              {deferredPrompt && (
                <button
                  onClick={handleWebInstall}
                  className="w-full text-[11px] text-slate-500 hover:text-slate-800 font-semibold py-1.5 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Or install lightweight web version</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
