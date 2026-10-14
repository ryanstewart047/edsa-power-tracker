'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { ArrowLeft, Clock3, ExternalLink, RefreshCw, MapPin, X, Check } from 'lucide-react';
import { SIERRA_LEONE_AREAS, AreaDefinition } from '@/lib/areas';

type Incident = {
  id: string;
  referenceCode: string | null;
  type: string;
  area: string;
  areaName: string | null;
  description: string | null;
  imageUrl: string | null;
  incidentStatus: string;
  severity: string;
  assignedTo: string | null;
  slaDueAt: string | null;
  resolutionNote: string | null;
  resolutionImageUrl: string | null;
};

type Outage = {
  id: string;
  title: string;
  message: string;
  area: string | null;
  startsAt: string;
  endsAt: string;
  active: boolean;
};

const emptyOutage = { title: '', message: '', area: '', startsAt: '', endsAt: '' };

async function parseResponse(response: Response) {
  const body = await response.text();
  if (!body) return {} as Record<string, unknown>;
  try {
    return JSON.parse(body) as Record<string, unknown>;
  } catch {
    throw new Error('The server returned an invalid response. Please try again.');
  }
}

export default function IncidentConsole({ adminEmail }: { adminEmail: string }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [outages, setOutages] = useState<Outage[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [outage, setOutage] = useState(emptyOutage);

  // Auto-search dropdown state for affected areas
  const [isAreaOpen, setIsAreaOpen] = useState(false);
  const areaSearchRef = useRef<HTMLDivElement>(null);

  // Close area dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (areaSearchRef.current && !areaSearchRef.current.contains(event.target as Node)) {
        setIsAreaOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter areas based on input: prioritizing starting letters
  const filteredAreas = useMemo(() => {
    const q = outage.area.trim().toLowerCase();
    if (!q) {
      // If nothing typed yet, show top Freetown areas
      return SIERRA_LEONE_AREAS.slice(0, 10);
    }
    // As soon as user enters a letter, show all areas starting with that letter first!
    const startsWith = SIERRA_LEONE_AREAS.filter((a) => a.name.toLowerCase().startsWith(q));
    const contains = SIERRA_LEONE_AREAS.filter(
      (a) => !a.name.toLowerCase().startsWith(q) && a.name.toLowerCase().includes(q)
    );
    return [...startsWith, ...contains].slice(0, 15);
  }, [outage.area]);

  const load = useCallback(async () => {
    const response = await fetch('/api/admin/incidents', { cache: 'no-store' });
    const data = await parseResponse(response);
    if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Could not load incidents.');
    setIncidents(Array.isArray(data.incidents) ? (data.incidents as Incident[]) : []);
    setOutages(Array.isArray(data.outages) ? (data.outages as Outage[]) : []);
  }, []);

  useEffect(() => {
    void load().catch((loadError) => setError(loadError.message));
  }, [load]);

  const update = async (incident: Incident, data: Record<string, unknown>) => {
    setBusy(incident.id);
    setError('');
    try {
      const response = await fetch(`/api/hazards/${incident.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await parseResponse(response);
      if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : 'Could not update incident.');
      await load();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update incident.');
    } finally {
      setBusy(null);
    }
  };

  const uploadResolutionPhoto = (incident: Incident, file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('Choose an image file for the resolution evidence.');
    if (file.size > 1_400_000) return setError('Resolution photos must be smaller than 1.4 MB.');
    const reader = new FileReader();
    reader.onload = () => void update(incident, { resolutionImageUrl: reader.result });
    reader.onerror = () => setError('Could not read the selected photo.');
    reader.readAsDataURL(file);
  };

  const createOutage = async () => {
    setBusy('outage');
    setError('');
    try {
      const response = await fetch('/api/admin/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-outage', ...outage }),
      });
      const result = await parseResponse(response);
      if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : 'Could not schedule outage.');
      setOutage(emptyOutage);
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Could not schedule outage.');
    } finally {
      setBusy(null);
    }
  };

  const toggleOutage = async (item: Outage) => {
    setBusy(item.id);
    try {
      const response = await fetch('/api/admin/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set-outage-status', id: item.id, active: !item.active }),
      });
      const result = await parseResponse(response);
      if (!response.ok)
        throw new Error(typeof result.error === 'string' ? result.error : 'Could not update maintenance notice.');
      await load();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Could not update maintenance notice.');
    } finally {
      setBusy(null);
    }
  };

  const selectArea = (areaItem: AreaDefinition | null) => {
    if (!areaItem) {
      setOutage({ ...outage, area: '' });
    } else {
      setOutage({ ...outage, area: areaItem.name });
    }
    setIsAreaOpen(false);
  };

  const now = Date.now();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Operations workflow</p>
            <h1 className="text-2xl font-black">Incident Queue</h1>
            <p className="text-sm text-gray-400">Ownership, response targets, and citizen-visible resolution.</p>
            <p className="mt-1 text-xs text-gray-500">Signed in as {adminEmail}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm">
              <ArrowLeft className="h-4 w-4" /> Dashboard
            </Link>
            <button
              type="button"
              aria-label="Refresh incidents"
              onClick={() => void load()}
              className="rounded-lg border border-white/10 p-2 hover:bg-white/5"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </header>

        {error && <p className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}

        {/* Planned maintenance notice section */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-lg">
          <div className="flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-blue-300" />
            <h2 className="font-bold text-base">Planned Maintenance Notice</h2>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {/* Maintenance title */}
            <input
              value={outage.title}
              onChange={(event) => setOutage({ ...outage, title: event.target.value })}
              placeholder="Maintenance title (e.g. Substation Maintenance)"
              className="rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            />

            {/* Affected Area with Auto-Search */}
            <div ref={areaSearchRef} className="relative">
              <div className="relative">
                <input
                  value={outage.area}
                  onFocus={() => setIsAreaOpen(true)}
                  onChange={(event) => {
                    setOutage({ ...outage, area: event.target.value });
                    setIsAreaOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setIsAreaOpen(false);
                  }}
                  placeholder="Affected area (type any letter to auto-search)..."
                  className="w-full rounded-xl border border-white/10 bg-slate-900 pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                />
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />

                {outage.area ? (
                  <button
                    type="button"
                    onClick={() => {
                      setOutage({ ...outage, area: '' });
                      setIsAreaOpen(true);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>

              {/* Autocomplete Dropdown */}
              {isAreaOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-xl border border-white/15 bg-slate-900/98 p-1.5 shadow-2xl backdrop-blur-xl space-y-0.5">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    {outage.area.trim() ? `Areas matching "${outage.area}"` : 'Select or search area'}
                  </div>

                  {/* All Areas (Nationwide) option */}
                  <button
                    type="button"
                    onClick={() => selectArea(null)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-semibold hover:bg-blue-600/20 text-blue-300 transition-colors"
                  >
                    <span>🌐 All Areas (Nationwide)</span>
                    {!outage.area ? <Check className="h-3.5 w-3.5 text-blue-400" /> : null}
                  </button>

                  {/* Filtered Areas */}
                  {filteredAreas.length > 0 ? (
                    filteredAreas.map((item) => {
                      const isSelected = outage.area.trim().toLowerCase() === item.name.toLowerCase();
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => selectArea(item)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                            isSelected
                              ? 'bg-blue-600 text-white font-bold'
                              : 'text-gray-200 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-[10px] text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">
                              {item.region}
                            </span>
                          </div>
                          {isSelected ? <Check className="h-3.5 w-3.5" /> : null}
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-3 py-3 text-center text-xs text-gray-500">
                      No matching areas found. You can keep typing custom text.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Description textarea */}
            <textarea
              value={outage.message}
              onChange={(event) => setOutage({ ...outage, message: event.target.value })}
              placeholder="What residents should expect (e.g. Power will be isolated for 3 hours while line repair takes place)"
              className="min-h-20 rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500 md:col-span-2"
            />

            {/* StartsAt and EndsAt */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400">Start Time</label>
              <input
                type="datetime-local"
                value={outage.startsAt}
                onChange={(event) => setOutage({ ...outage, startsAt: event.target.value })}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400">Estimated End Time</label>
              <input
                type="datetime-local"
                value={outage.endsAt}
                onChange={(event) => setOutage({ ...outage, endsAt: event.target.value })}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-3.5 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="button"
            disabled={busy === 'outage' || !outage.title || !outage.message || !outage.startsAt || !outage.endsAt}
            onClick={() => void createOutage()}
            className="mt-4 rounded-xl bg-[#2607d5] hover:bg-[#1d05aa] px-5 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50 shadow-md"
          >
            {busy === 'outage' ? 'Publishing...' : 'Publish Maintenance Notice'}
          </button>

          {/* List of active and recent maintenance notices */}
          <div className="mt-5 space-y-2">
            {outages.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-black/25 border border-white/5 p-3.5 text-sm"
              >
                <div>
                  <span className="font-bold text-white">{item.title}</span>
                  <span className="ml-2 text-blue-300 font-medium">
                    {item.area ? `· ${item.area}` : '· Nationwide (All areas)'}
                  </span>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {new Date(item.startsAt).toLocaleString()} — {new Date(item.endsAt).toLocaleString()}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={busy === item.id}
                  onClick={() => void toggleOutage(item)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 ${
                    item.active
                      ? 'border-red-500/30 text-red-300 bg-red-500/10 hover:bg-red-500/20'
                      : 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20'
                  }`}
                >
                  {item.active ? 'Hide Notice' : 'Activate Notice'}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Incidents feed section */}
        <section className="space-y-3">
          {incidents.map((item) => {
            const overdue = item.slaDueAt && new Date(item.slaDueAt).getTime() < now && item.incidentStatus !== 'resolved';
            return (
              <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-md">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-mono text-blue-300">{item.referenceCode || 'Report'}</p>
                    <h2 className="font-bold text-base mt-0.5">
                      {item.type} · {item.areaName || item.area}
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm text-gray-300 leading-relaxed">
                      {item.description || 'No description supplied.'}
                    </p>
                    {item.imageUrl && (
                      <a
                        href={item.imageUrl}
                        target="_blank"
                        className="mt-2 inline-flex items-center gap-1.5 text-xs text-blue-300 hover:underline font-semibold"
                        rel="noreferrer"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> View reporter evidence photo
                      </a>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      overdue ? 'bg-red-500/20 text-red-200 border border-red-500/30' : 'bg-white/10 text-gray-300'
                    }`}
                  >
                    {overdue ? 'SLA Overdue' : item.slaDueAt ? `SLA Due: ${new Date(item.slaDueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Standard SLA'}
                  </span>
                </div>

                <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                  <select
                    value={item.incidentStatus}
                    onChange={(event) => void update(item, { incidentStatus: event.target.value })}
                    disabled={busy === item.id}
                    className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="received">Received</option>
                    <option value="reviewing">Under review</option>
                    <option value="dispatched">Dispatched</option>
                    <option value="resolved">Resolved</option>
                  </select>

                  <select
                    value={item.severity}
                    onChange={(event) => void update(item, { severity: event.target.value })}
                    disabled={busy === item.id}
                    className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="low">Low Severity</option>
                    <option value="medium">Medium Severity</option>
                    <option value="high">High Severity</option>
                    <option value="critical">Critical Severity</option>
                  </select>

                  <input
                    defaultValue={item.assignedTo || ''}
                    onBlur={(event) =>
                      event.target.value !== (item.assignedTo || '') &&
                      void update(item, { assignedTo: event.target.value })
                    }
                    placeholder="Assign to crew / team"
                    className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                {item.incidentStatus === 'resolved' && (
                  <div className="mt-3 grid gap-2.5 sm:grid-cols-3 pt-3 border-t border-white/5">
                    <input
                      defaultValue={item.resolutionNote || ''}
                      onBlur={(event) =>
                        event.target.value !== (item.resolutionNote || '') &&
                        void update(item, { resolutionNote: event.target.value })
                      }
                      placeholder="Resolution note for citizens"
                      className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <input
                      defaultValue={item.resolutionImageUrl || ''}
                      onBlur={(event) =>
                        event.target.value !== (item.resolutionImageUrl || '') &&
                        void update(item, { resolutionImageUrl: event.target.value })
                      }
                      placeholder="Resolution photo URL"
                      className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 px-3 py-2 text-sm text-blue-200 hover:bg-white/10 transition-colors">
                      Upload resolution evidence
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(event) => uploadResolutionPhoto(item, event.target.files?.[0])}
                      />
                    </label>
                  </div>
                )}
              </article>
            );
          })}
          {incidents.length === 0 && (
            <p className="rounded-2xl border border-white/10 p-8 text-center text-gray-400">
              No incidents reported right now.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
