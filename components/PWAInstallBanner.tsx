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

export default function PWAInstallBanner() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [device, setDevice] = useState({ isMobile: false, isIOS: false, isAndroid: false });

  useEffect(() => {
    const d = detectDevice();
    setDevice(d);

    // Don't show if already in standalone mode
    if (isPWAInstalled()) return;

    // Check session storage to see if they closed it recently
    if (sessionStorage.getItem('edsa-pwa-dismissed')) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Fallback for iOS
    if (d.isIOS) {
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }

    // Fallback for Android if the event doesn't fire
    if (d.isAndroid) {
      const timer = setTimeout(() => {
        if (!deferredPrompt) setShow(true);
      }, 5000);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [deferredPrompt]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShow(false);
      }
      setDeferredPrompt(null);
    } else if (device.isIOS) {
      // iOS just needs the instructions, so we keep it open or close it
      setShow(false);
    }
  };

  if (!show || !device.isMobile) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[100] animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-gray-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl">
        <button 
          onClick={() => { setShow(false); sessionStorage.setItem('edsa-pwa-dismissed', 'true'); }}
          className="absolute top-4 right-4 text-gray-500 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-green-500/20">
            <Zap className="w-8 h-8 text-white fill-white" />
          </div>
          
          <div className="flex-1 pr-6">
            <h3 className="font-bold text-white text-lg leading-tight">Install EDSA Tracker</h3>
            <p className="text-gray-400 text-sm mt-0.5">
              {device.isIOS 
                ? 'Add to home screen for real-time alerts' 
                : 'Get the native app for better tracking'}
            </p>
          </div>
        </div>

        <div className="mt-5">
          {device.isIOS ? (
            <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-3 border border-white/5">
              <div className="p-2 bg-blue-500/10 rounded-xl">
                <Share className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-xs text-gray-300">
                Tap <span className="text-white font-bold">Share</span> then <span className="text-white font-bold">Add to Home Screen</span>
              </p>
            </div>
          ) : (
            <button
              onClick={handleInstall}
              className="w-full bg-white text-black font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors shadow-lg"
            >
              <Download className="w-5 h-5" />
              Install App
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
