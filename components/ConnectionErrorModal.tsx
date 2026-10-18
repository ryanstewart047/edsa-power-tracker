'use client';

import { useState, useEffect, useCallback } from 'react';
import { WifiOff, RefreshCw, KeyRound } from 'lucide-react';

export default function ConnectionErrorModal() {
  const [isOffline, setIsOffline] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setErrorMessage(null);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setErrorMessage('Your internet connection appears to be offline. Live grid tracking requires an active data connection.');
    };

    if (typeof window !== 'undefined') {
      if (!navigator.onLine) {
        setIsOffline(true);
        setErrorMessage('Your internet connection appears to be offline. Live grid tracking requires an active data connection.');
      }

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Listen for unhandled network errors (such as Vercel bot challenge code 99 or failed network fetches)
      const handleError = (event: ErrorEvent) => {
        const msg = (event.message || '').toLowerCase();
        if (
          msg.includes('verify your browser') ||
          msg.includes('code 99') ||
          msg.includes('code: 99') ||
          msg.includes('networkerror') ||
          msg.includes('failed to fetch') ||
          msg.includes('load failed')
        ) {
          setIsOffline(true);
          setErrorMessage(
            'Unable to reach the EDSA servers. Please verify your mobile data or Wi-Fi connection and tap retry.'
          );
        }
      };

      const handleRejection = (event: PromiseRejectionEvent) => {
        const reason = String(event.reason?.message || event.reason || '').toLowerCase();
        if (
          reason.includes('verify your browser') ||
          reason.includes('code 99') ||
          reason.includes('code: 99') ||
          reason.includes('networkerror') ||
          reason.includes('failed to fetch') ||
          reason.includes('load failed')
        ) {
          setIsOffline(true);
          setErrorMessage(
            'Unable to reach the EDSA servers. Please verify your mobile data or Wi-Fi connection and tap retry.'
          );
        }
      };

      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleRejection);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleRejection);
      };
    }
  }, []);

  const handleRetry = useCallback(async () => {
    setRetrying(true);
    try {
      // Test connectivity by checking an un-cached lightweight endpoint
      const response = await fetch('/api/version', { cache: 'no-store' });
      if (response.ok) {
        setIsOffline(false);
        setErrorMessage(null);
        window.location.reload();
      } else {
        throw new Error('Server unreachable');
      }
    } catch {
      // Still offline
      setTimeout(() => {
        setRetrying(false);
      }, 700);
    }
  }, []);

  if (!isOffline && !errorMessage) return null;

  return (
    <div className="fixed inset-0 z-[10040] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-[2rem] bg-white border border-slate-200 p-6 text-center shadow-2xl shadow-slate-950/20 animate-in zoom-in-95 duration-200 relative overflow-hidden">
        {/* Amber accent bar */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />

        <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-4 text-amber-600 shadow-sm">
          <WifiOff className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-black text-slate-900 mb-1.5">Connection Problem</h3>
        <p className="text-xs text-slate-600 leading-relaxed mb-6">
          {errorMessage || 'Unable to connect to EDSA servers. Please check your internet or mobile data connection.'}
        </p>

        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
            <span>{retrying ? 'Reconnecting...' : 'Retry Connection'}</span>
          </button>

          <a
            href="/topup?tab=vault"
            className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <KeyRound className="w-3.5 h-3.5 text-slate-500" />
            <span>Open Offline Token Vault</span>
          </a>

          <button
            type="button"
            onClick={() => { setIsOffline(false); setErrorMessage(null); }}
            className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition-colors pt-1"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
