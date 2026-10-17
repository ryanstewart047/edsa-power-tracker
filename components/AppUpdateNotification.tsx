'use client';

import { useEffect, useState, useCallback } from 'react';
import { Sparkles, RefreshCw, X, Loader2 } from 'lucide-react';
import { AppRelease } from '@/lib/versionConfig';

export default function AppUpdateNotification() {
  const [release, setRelease] = useState<AppRelease | null>(null);
  const [showUpdate, setShowUpdate] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [sessionDismissed, setSessionDismissed] = useState(false);

  const checkVersion = useCallback(async () => {
    try {
      const res = await fetch('/api/version', { cache: 'no-store' });
      if (!res.ok) return;
      const data: AppRelease = await res.json();

      if (typeof window === 'undefined') return;

      const acknowledgedRelease = localStorage.getItem('edsa_app_acknowledged_release');

      // On first visit, register current release so user isn't prompted immediately
      if (!acknowledgedRelease) {
        localStorage.setItem('edsa_app_acknowledged_release', data.releaseId);
        localStorage.setItem('edsa_app_version', data.version);
        return;
      }

      // If a newer releaseId is detected, trigger the notification
      if (acknowledgedRelease !== data.releaseId) {
        setRelease(data);
        setShowUpdate(true);
      }
    } catch (err) {
      console.warn('[AppUpdate] Failed to check for new release:', err);
    }
  }, []);

  useEffect(() => {
    checkVersion();

    // Listen for Service Worker updatefound event
    const handleSwUpdate = () => {
      checkVersion();
    };
    window.addEventListener('app-update-ready', handleSwUpdate);

    // Periodic check every 10 minutes and on window focus
    window.addEventListener('focus', checkVersion);
    const interval = window.setInterval(checkVersion, 10 * 60 * 1000);

    return () => {
      window.removeEventListener('app-update-ready', handleSwUpdate);
      window.removeEventListener('focus', checkVersion);
      window.clearInterval(interval);
    };
  }, [checkVersion]);

  useEffect(() => {
    if (showUpdate && release && !sessionDismissed) {
      document.body.classList.add('edsa-update-banner-active');
    } else {
      document.body.classList.remove('edsa-update-banner-active');
    }
    return () => {
      document.body.classList.remove('edsa-update-banner-active');
    };
  }, [showUpdate, release, sessionDismissed]);

  const handleUpdateApp = async () => {
    if (!release || updating) return;
    setUpdating(true);

    try {
      // 1. Mark this release as acknowledged so the banner never pops up again for this release
      localStorage.setItem('edsa_app_acknowledged_release', release.releaseId);
      localStorage.setItem('edsa_app_version', release.version);
      localStorage.setItem('edsa_app_last_updated_at', new Date().toISOString());

      // 2. Instruct Service Worker to skip waiting and activate immediately
      const swReg = (window as unknown as { __swRegistration?: ServiceWorkerRegistration }).__swRegistration;
      if (swReg?.waiting) {
        swReg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }

      // 3. Purge cached assets so newest release files load
      if ('caches' in window) {
        try {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        } catch {
          // Ignore cache deletion errors
        }
      }

      // 4. Force reload to execute latest bundle
      setTimeout(() => {
        window.location.reload();
      }, 400);
    } catch {
      window.location.reload();
    }
  };

  if (!showUpdate || !release || sessionDismissed) {
    return null;
  }

  return (
    <aside
      className="fixed inset-x-4 top-4 z-[10020] mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border-2 border-amber-500/80 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 p-3.5 text-slate-950 shadow-2xl shadow-amber-500/35 backdrop-blur-md animate-in slide-in-from-top-4 duration-300 ring-1 ring-amber-300"
      aria-live="polite"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="rounded-xl bg-amber-950/15 p-2 text-slate-950 shrink-0">
          <Sparkles className="h-4 w-4 animate-pulse text-slate-950" />
        </div>
        <p className="text-sm font-black text-slate-950 truncate">Update available</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleUpdateApp}
          disabled={updating}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-amber-300 px-3.5 py-2 text-xs font-black uppercase tracking-wider shadow-md shadow-slate-950/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
        >
          {updating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          <span>{updating ? 'Updating...' : 'Update App'}</span>
        </button>

        <button
          type="button"
          onClick={() => setSessionDismissed(true)}
          className="p-1.5 rounded-xl text-slate-800 hover:text-slate-950 hover:bg-black/10 transition-colors shrink-0"
          aria-label="Dismiss update notification"
          title="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
