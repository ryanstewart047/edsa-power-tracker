'use client';

import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';

type Announcement = { id: string; title: string; message: string };

export default function OperationsNotice() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/operations', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setAnnouncement(data?.announcement ?? null))
      .catch(() => undefined);
  }, []);

  if (!announcement || dismissed === announcement.id) return null;

  return (
    <aside className="fixed inset-x-4 top-4 z-[9990] mx-auto flex max-w-xl gap-3 rounded-xl border border-yellow-400/30 bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur-md" aria-live="polite">
      <Bell className="mt-0.5 h-5 w-5 shrink-0 text-yellow-300" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">{announcement.title}</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-300">{announcement.message}</p>
      </div>
      <button type="button" onClick={() => setDismissed(announcement.id)} className="p-1 text-gray-400 hover:text-white" aria-label="Dismiss announcement">
        <X className="h-4 w-4" />
      </button>
    </aside>
  );
}
