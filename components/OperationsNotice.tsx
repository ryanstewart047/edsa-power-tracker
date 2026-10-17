'use client';

import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';

type Announcement = { id: string; title: string; message: string };

export default function OperationsNotice() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [updateBannerActive, setUpdateBannerActive] = useState(false);

  useEffect(() => {
    const check = () => {
      if (typeof document !== 'undefined') {
        setUpdateBannerActive(document.body.classList.contains('edsa-update-banner-active'));
      }
    };
    check();
    const observer = new MutationObserver(check);
    if (typeof document !== 'undefined') {
      observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const refreshAnnouncement = () => {
      fetch('/api/operations', { cache: 'no-store' })
        .then((response) => response.ok ? response.json() : null)
        .then((data) => setAnnouncement(data?.announcement ?? null))
        .catch(() => undefined);
    };

    refreshAnnouncement();
    const interval = window.setInterval(refreshAnnouncement, 30_000);
    window.addEventListener('focus', refreshAnnouncement);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshAnnouncement);
    };
  }, []);

  if (!announcement || dismissed === announcement.id) return null;

  return (
    <aside
      className={`fixed inset-x-4 ${updateBannerActive ? 'top-32 sm:top-28' : 'top-4'} z-[10010] mx-auto flex max-w-xl items-start gap-3.5 rounded-2xl border-2 border-amber-500/70 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 p-4 text-slate-950 shadow-2xl shadow-amber-500/35 backdrop-blur-md transition-all duration-300 ring-1 ring-amber-300`}
      aria-live="polite"
    >
      <div className="rounded-xl bg-amber-950/15 p-2 text-slate-950 shrink-0">
        <Bell className="h-5 w-5 animate-pulse text-slate-950" />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-center gap-2">
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-950 text-amber-300">
            Notice
          </span>
          <p className="text-sm font-black text-slate-950 truncate">{announcement.title}</p>
        </div>
        <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-900">{announcement.message}</p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(announcement.id)}
        className="p-1.5 rounded-xl text-slate-800 hover:text-slate-950 hover:bg-black/10 transition-colors shrink-0"
        aria-label="Dismiss announcement"
      >
        <X className="h-4 w-4" />
      </button>
    </aside>
  );
}
