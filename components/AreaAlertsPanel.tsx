'use client';

import { BellRing, ClipboardList, ShieldAlert, Check, Bell, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

type Outage = {
  id: string;
  title: string;
  message: string;
  area: string | null;
  startsAt: string;
  endsAt: string;
};

type Report = {
  id: string;
  referenceCode: string | null;
  type: string;
  area: string;
  areaName: string | null;
  reportedAt: string;
  incidentStatus: string;
  resolutionNote: string | null;
  resolutionImageUrl: string | null;
};

function getDeviceId(): string {
  if (typeof window === 'undefined') return 'dev_anon';
  let id = localStorage.getItem('edsa_device_id');
  if (!id) {
    id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? `dev_${crypto.randomUUID()}` : `dev_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem('edsa_device_id', id);
  }
  return id;
}

function getStoredSubscriptions(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('edsa_subscribed_areas') || '[]') as string[];
  } catch {
    return [];
  }
}

function saveStoredSubscription(areaName: string, active: boolean) {
  if (typeof window === 'undefined') return;
  try {
    const subs = new Set(getStoredSubscriptions());
    if (active) {
      subs.add(areaName);
    } else {
      subs.delete(areaName);
    }
    localStorage.setItem('edsa_subscribed_areas', JSON.stringify(Array.from(subs)));
  } catch (err) {
    console.warn('Could not save subscription to localStorage:', err);
  }
}

export default function AreaAlertsPanel({ area }: { area: string | null }) {
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [outages, setOutages] = useState<Outage[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [open, setOpen] = useState(false);

  // Initialize from localStorage immediately for instant UI feedback
  useEffect(() => {
    if (area) {
      const stored = getStoredSubscriptions();
      setSubscribed(stored.includes(area));
    } else {
      setSubscribed(false);
    }
  }, [area]);

  const load = useCallback(async () => {
    const deviceId = getDeviceId();
    try {
      const [alertsRes, historyRes] = await Promise.all([
        fetch(
          `/api/alerts?deviceId=${encodeURIComponent(deviceId)}${area ? `&area=${encodeURIComponent(area)}` : ''}`,
          { cache: 'no-store' }
        ),
        fetch(`/api/reports?deviceId=${encodeURIComponent(deviceId)}`, { cache: 'no-store' }),
      ]);

      if (alertsRes.ok) {
        const alertData = (await alertsRes.json()) as { outages?: Outage[]; subscriptions?: string[] };
        setOutages(alertData.outages || []);
        if (area) {
          const isSub = (alertData.subscriptions || []).includes(area) || getStoredSubscriptions().includes(area);
          setSubscribed(isSub);
          if (isSub) saveStoredSubscription(area, true);
        }
      }

      if (historyRes.ok) {
        const historyData = (await historyRes.json()) as { reports?: Report[] };
        setReports(historyData.reports || []);
      }
    } catch (err) {
      console.warn('Could not load area alerts data:', err);
    }
  }, [area]);

  useEffect(() => {
    void load();
    const id = window.setInterval(load, 60_000);
    return () => window.clearInterval(id);
  }, [load]);

  // Desktop/Browser notification dispatch for new outages
  useEffect(() => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    try {
      const seen = new Set(JSON.parse(localStorage.getItem('edsa_seen_outage_alerts') || '[]') as string[]);
      const newOutage = outages.find((item) => !seen.has(item.id));
      if (!newOutage) return;
      new Notification(newOutage.title, {
        body: newOutage.message,
        icon: '/assets/edsa-icon-v2-192.png',
      });
      seen.add(newOutage.id);
      localStorage.setItem('edsa_seen_outage_alerts', JSON.stringify(Array.from(seen).slice(-50)));
    } catch {
      // Ignore notification storage issues
    }
  }, [outages]);

  const toggle = async () => {
    if (!area || busy) return;
    const active = !subscribed;
    
    // Optimistic UI update: immediately show 'Following' or 'Follow area'
    setSubscribed(active);
    saveStoredSubscription(area, active);
    setBusy(true);

    if (active && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      try {
        void Notification.requestPermission();
      } catch {
        // Notification permission optional
      }
    }

    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: getDeviceId(), area, active }),
      });

      if (!response.ok) {
        // Revert on failure
        setSubscribed(!active);
        saveStoredSubscription(area, !active);
      }
    } catch (err) {
      console.warn('Failed to update area subscription on server:', err);
      // Keep optimistic local subscription if network temporarily blips
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-3">
      {/* Area Alerts Box */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-3">
            <BellRing className="mt-0.5 h-5 w-5 text-blue-600" />
            <div>
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">Area Alerts</h2>
              <p className="text-xs text-slate-600">
                Maintenance and restoration updates for {area || 'your saved community'}.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void toggle()}
            disabled={!area || busy}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-sm disabled:opacity-50 active:scale-95 ${
              subscribed
                ? 'bg-emerald-100 border border-emerald-300 text-emerald-800 hover:bg-emerald-200'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
            }`}
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : subscribed ? (
              <Check className="h-3.5 w-3.5 text-emerald-700" />
            ) : (
              <Bell className="h-3.5 w-3.5" />
            )}
            <span>{subscribed ? 'Following' : 'Follow area'}</span>
          </button>
        </div>

        {/* Outage notices list */}
        {outages.length > 0 && (
          <div className="mt-3.5 space-y-2">
            {outages.map((item) => (
              <div key={item.id} className="rounded-xl bg-white border border-blue-200/80 p-3 text-sm shadow-xs">
                <b className="text-slate-900">{item.title}</b>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">{item.message}</p>
                <p className="mt-2 text-[10px] text-blue-700 font-medium">
                  {new Date(item.startsAt).toLocaleString()} — {new Date(item.endsAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Hazard Reports Box */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            <span>
              <b className="text-slate-900 text-sm sm:text-base">My Hazard Reports</b>
              <small className="ml-2 text-slate-500">({reports.length})</small>
            </span>
          </span>
          <span className="text-xs font-semibold text-blue-600 hover:text-blue-700">
            {open ? 'Hide' : 'View status'}
          </span>
        </button>

        {open && (
          <div className="mt-4 space-y-3 pt-3 border-t border-slate-100">
            {reports.map((item) => (
              <article key={item.id} className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-sm">
                <div className="flex justify-between gap-3 items-start">
                  <div>
                    <p className="font-mono text-xs text-blue-600 font-bold">{item.referenceCode || 'Report'}</p>
                    <b className="text-slate-900 text-sm">{item.type}</b>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.areaName || item.area} · {new Date(item.reportedAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-200 border border-slate-300 px-2.5 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                    {item.incidentStatus.replace('_', ' ')}
                  </span>
                </div>

                {item.resolutionNote && (
                  <p className="mt-2.5 border-t border-slate-200 pt-2 text-xs text-emerald-800 leading-relaxed">
                    <ShieldAlert className="mr-1.5 inline h-3.5 w-3.5 text-emerald-600" />
                    <b>Resolution:</b> {item.resolutionNote}
                  </p>
                )}

                {item.resolutionImageUrl && (
                  <a
                    href={item.resolutionImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs font-bold text-blue-600 hover:underline"
                  >
                    View resolution evidence
                  </a>
                )}
              </article>
            ))}

            {reports.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-3">
                Reports sent from this device will appear here with live tracking references.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
