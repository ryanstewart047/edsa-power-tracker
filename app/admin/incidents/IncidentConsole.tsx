'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { ArrowLeft, Clock3, RefreshCw, MapPin, X, Check, Plus, Edit2, Trash2, Camera, Download, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
  reportedAt?: string | null;
  resolved?: boolean;
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

const STATUS_COLORS: Record<string, string> = {
  received: 'bg-slate-500/20 text-slate-200 border-slate-500/30',
  reviewing: 'bg-amber-500/20 text-amber-200 border-amber-500/30',
  dispatched: 'bg-blue-500/20 text-blue-200 border-blue-500/30',
  resolved: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30',
};

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  medium: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  high: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  critical: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

function formatDateForInput(dateVal: string | Date | undefined): string {
  if (!dateVal) return '';
  try {
    const d = new Date(dateVal);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  } catch {
    return '';
  }
}

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
  const [successMessage, setSuccessMessage] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  // New outage form state
  const [outage, setOutage] = useState(emptyOutage);

  // Edit outage state & modal
  const [editingOutage, setEditingOutage] = useState<Outage | null>(null);
  const [editForm, setEditForm] = useState(emptyOutage);
  const [editError, setEditError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Evidence photo preview lightbox modal
  const [viewingPhoto, setViewingPhoto] = useState<{
    url: string;
    title: string;
    subtitle?: string;
  } | null>(null);

  const downloadPhoto = (url: string, filename = 'evidence-photo.jpg') => {
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.warn('Download photo error:', err);
    }
  };

  // Auto-search dropdown and input ref for main outage creation
  const [isAreaOpen, setIsAreaOpen] = useState(false);
  const areaSearchRef = useRef<HTMLDivElement>(null);
  const areaInputRef = useRef<HTMLInputElement>(null);

  // Auto-search dropdown and input ref for edit modal
  const [isEditAreaOpen, setIsEditAreaOpen] = useState(false);
  const editAreaSearchRef = useRef<HTMLDivElement>(null);
  const editAreaInputRef = useRef<HTMLInputElement>(null);

  // Close area dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (areaSearchRef.current && !areaSearchRef.current.contains(event.target as Node)) {
        setIsAreaOpen(false);
      }
      if (editAreaSearchRef.current && !editAreaSearchRef.current.contains(event.target as Node)) {
        setIsEditAreaOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Creation: List of already confirmed selected areas
  const selectedAreaList = useMemo(() => {
    return outage.area
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }, [outage.area]);

  // Creation: Current query segment after the last comma
  const currentSegment = useMemo(() => {
    const segments = outage.area.split(',');
    return segments[segments.length - 1].trim().toLowerCase();
  }, [outage.area]);

  // Creation: Filter areas based on current segment
  const filteredAreas = useMemo(() => {
    const selectedSet = new Set(selectedAreaList.map((s) => s.toLowerCase()));
    const available = SIERRA_LEONE_AREAS.filter((a) => !selectedSet.has(a.name.toLowerCase()));

    if (!currentSegment) {
      return available.slice(0, 10);
    }

    const startsWith = available.filter((a) => a.name.toLowerCase().startsWith(currentSegment));
    const contains = available.filter(
      (a) => !a.name.toLowerCase().startsWith(currentSegment) && a.name.toLowerCase().includes(currentSegment)
    );
    return [...startsWith, ...contains].slice(0, 15);
  }, [selectedAreaList, currentSegment]);

  // Edit: List of already confirmed selected areas
  const editSelectedAreaList = useMemo(() => {
    return editForm.area
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }, [editForm.area]);

  // Edit: Current query segment
  const editCurrentSegment = useMemo(() => {
    const segments = editForm.area.split(',');
    return segments[segments.length - 1].trim().toLowerCase();
  }, [editForm.area]);

  // Edit: Filtered areas for modal
  const editFilteredAreas = useMemo(() => {
    const selectedSet = new Set(editSelectedAreaList.map((s) => s.toLowerCase()));
    const available = SIERRA_LEONE_AREAS.filter((a) => !selectedSet.has(a.name.toLowerCase()));

    if (!editCurrentSegment) {
      return available.slice(0, 10);
    }

    const startsWith = available.filter((a) => a.name.toLowerCase().startsWith(editCurrentSegment));
    const contains = available.filter(
      (a) => !a.name.toLowerCase().startsWith(editCurrentSegment) && a.name.toLowerCase().includes(editCurrentSegment)
    );
    return [...startsWith, ...contains].slice(0, 15);
  }, [editSelectedAreaList, editCurrentSegment]);

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
      setSuccessMessage('Incident updated successfully.');
      setTimeout(() => setSuccessMessage(''), 3000);
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
      const cleanedArea = outage.area
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .join(', ');

      const response = await fetch('/api/admin/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-outage', ...outage, area: cleanedArea || null }),
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

  const startEditOutage = (item: Outage) => {
    setEditingOutage(item);
    setEditError('');
    setEditForm({
      title: item.title,
      message: item.message,
      area: item.area || '',
      startsAt: formatDateForInput(item.startsAt),
      endsAt: formatDateForInput(item.endsAt),
    });
  };

  const saveEditOutage = async () => {
    if (!editingOutage) return;
    setBusy(editingOutage.id);
    setEditError('');
    setError('');

    if (!editForm.title.trim()) {
      setEditError('Please enter a notice title.');
      setBusy(null);
      return;
    }
    if (!editForm.message.trim()) {
      setEditError('Please enter notice details/message.');
      setBusy(null);
      return;
    }

    try {
      const cleanedArea = editForm.area
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .join(', ');

      const response = await fetch('/api/admin/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-outage',
          id: editingOutage.id,
          title: editForm.title.trim(),
          message: editForm.message.trim(),
          area: cleanedArea || null,
          startsAt: editForm.startsAt || undefined,
          endsAt: editForm.endsAt || undefined,
        }),
      });
      const result = await parseResponse(response);
      if (!response.ok) {
        throw new Error(typeof result.error === 'string' ? result.error : 'Could not update maintenance notice.');
      }
      setEditingOutage(null);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not update maintenance notice.';
      setEditError(msg);
      setError(msg);
    } finally {
      setBusy(null);
    }
  };

  const deleteOutage = async (id: string) => {
    setBusy(id);
    setError('');
    try {
      const response = await fetch('/api/admin/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete-outage', id }),
      });
      const result = await parseResponse(response);
      if (!response.ok) throw new Error(typeof result.error === 'string' ? result.error : 'Could not delete notice.');
      setConfirmDeleteId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete notice.');
    } finally {
      setBusy(null);
    }
  };

  const selectArea = (areaItem: AreaDefinition | null) => {
    if (!areaItem) {
      setOutage({ ...outage, area: '' });
      setIsAreaOpen(false);
      return;
    }

    const segments = outage.area.split(',');
    const previousSegments = segments.slice(0, -1).map((s) => s.trim()).filter(Boolean);
    const updatedList = [...previousSegments, areaItem.name];

    setOutage({ ...outage, area: updatedList.join(', ') + ', ' });
    setIsAreaOpen(true);
    setTimeout(() => {
      areaInputRef.current?.focus();
    }, 50);
  };

  const removeArea = (nameToRemove: string) => {
    const remaining = selectedAreaList.filter((n) => n.toLowerCase() !== nameToRemove.toLowerCase());
    setOutage({
      ...outage,
      area: remaining.length > 0 ? remaining.join(', ') + ', ' : '',
    });
  };

  const selectEditArea = (areaItem: AreaDefinition | null) => {
    if (!areaItem) {
      setEditForm({ ...editForm, area: '' });
      setIsEditAreaOpen(false);
      return;
    }

    const segments = editForm.area.split(',');
    const previousSegments = segments.slice(0, -1).map((s) => s.trim()).filter(Boolean);
    const updatedList = [...previousSegments, areaItem.name];

    setEditForm({ ...editForm, area: updatedList.join(', ') + ', ' });
    setIsEditAreaOpen(true);
    setTimeout(() => {
      editAreaInputRef.current?.focus();
    }, 50);
  };

  const removeEditArea = (nameToRemove: string) => {
    const remaining = editSelectedAreaList.filter((n) => n.toLowerCase() !== nameToRemove.toLowerCase());
    setEditForm({
      ...editForm,
      area: remaining.length > 0 ? remaining.join(', ') + ', ' : '',
    });
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

        {error && (
          <div className="flex items-center justify-between rounded-2xl border border-rose-500/30 bg-rose-500/15 p-4 text-sm text-rose-200 shadow-lg backdrop-blur-md animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError('')}
              className="p-1 hover:bg-white/10 rounded-lg text-rose-300 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/15 p-4 text-sm text-emerald-200 shadow-lg backdrop-blur-md animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage('')}
              className="p-1 hover:bg-white/10 rounded-lg text-emerald-300 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

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

            {/* Affected Area with Multi-Area Auto-Search */}
            <div ref={areaSearchRef} className="relative">
              {/* Selected Area Badges */}
              {selectedAreaList.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedAreaList.map((name) => (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-600/20 border border-blue-500/30 px-2.5 py-1 text-xs font-semibold text-blue-200"
                    >
                      <MapPin className="h-3 w-3 text-blue-400" />
                      {name}
                      <button
                        type="button"
                        onClick={() => removeArea(name)}
                        className="hover:text-white p-0.5 ml-0.5 rounded-full hover:bg-white/10 transition-colors"
                        title={`Remove ${name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="relative">
                <input
                  ref={areaInputRef}
                  value={outage.area}
                  onFocus={() => setIsAreaOpen(true)}
                  onChange={(event) => {
                    setOutage({ ...outage, area: event.target.value });
                    setIsAreaOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setIsAreaOpen(false);
                  }}
                  placeholder="Affected areas: type letter, pick, separate with comma (,)..."
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
                    title="Clear all areas"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>

              {/* Autocomplete Dropdown */}
              {isAreaOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-xl border border-white/15 bg-slate-900/98 p-1.5 shadow-2xl backdrop-blur-xl space-y-0.5">
                  <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    <span>
                      {currentSegment
                        ? `Areas starting with "${currentSegment}" (${filteredAreas.length})`
                        : selectedAreaList.length > 0
                        ? 'Type a letter for next area or select below'
                        : 'Select or search area'}
                    </span>
                    <span className="text-[9px] text-gray-500 lowercase">use comma (,) for multiple</span>
                  </div>

                  {/* All Areas (Nationwide) option */}
                  <button
                    type="button"
                    onClick={() => selectArea(null)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-semibold hover:bg-blue-600/20 text-blue-300 transition-colors"
                  >
                    <span>🌐 All Areas (Nationwide Outage)</span>
                    {!outage.area ? <Check className="h-3.5 w-3.5 text-blue-400" /> : null}
                  </button>

                  {/* Filtered Areas */}
                  {filteredAreas.length > 0 ? (
                    filteredAreas.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => selectArea(item)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-colors text-gray-200 hover:bg-white/10 group"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium group-hover:text-blue-300 transition-colors">{item.name}</span>
                          <span className="text-[10px] text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">
                            {item.region}
                          </span>
                        </div>
                        <span className="text-[10px] text-blue-400 flex items-center gap-0.5 opacity-80 group-hover:opacity-100 font-semibold">
                          <Plus className="h-3 w-3" /> Add
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-3 text-center text-xs text-gray-500">
                      No matching areas found for &quot;{currentSegment}&quot;. You can keep typing custom area names.
                    </div>
                  )}

                  <div className="border-t border-white/5 px-2.5 py-1 text-[10px] text-gray-500">
                    💡 Tip: Separate areas with a comma (,) to add multiple areas.
                  </div>
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
            className="mt-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 px-6 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50 shadow-lg shadow-blue-600/25 active:scale-[0.98] inline-flex items-center gap-2"
          >
            {busy === 'outage' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Publishing Notice...</span>
              </>
            ) : (
              <>
                <Clock3 className="h-4 w-4" />
                <span>Publish Maintenance Notice</span>
              </>
            )}
          </button>

          {/* List of active and recent maintenance notices */}
          <div className="mt-5 space-y-2">
            {outages.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-black/25 border border-white/5 p-3.5 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-white">{item.title}</span>
                    <span className="text-blue-300 font-medium text-xs">
                      {item.area ? `· ${item.area}` : '· Nationwide (All areas)'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">{item.message}</p>
                  <div className="text-[11px] text-gray-500 mt-1">
                    {new Date(item.startsAt).toLocaleString()} — {new Date(item.endsAt).toLocaleString()}
                  </div>
                </div>

                {/* Action buttons: Edit, Toggle Hide/Show, Delete */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    disabled={busy === item.id}
                    onClick={() => startEditOutage(item)}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-blue-500/30 text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 inline-flex items-center gap-1 transition-all disabled:opacity-50"
                  >
                    <Edit2 className="h-3 w-3" /> Edit
                  </button>

                  <button
                    type="button"
                    disabled={busy === item.id}
                    onClick={() => void toggleOutage(item)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 ${
                      item.active
                        ? 'border-amber-500/30 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20'
                        : 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20'
                    }`}
                  >
                    {item.active ? 'Hide' : 'Show'}
                  </button>

                  {confirmDeleteId === item.id ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-red-300 font-bold bg-red-950/70 border border-red-500/40 rounded-lg px-2 py-1">
                      Delete?
                      <button
                        type="button"
                        disabled={busy === item.id}
                        onClick={() => void deleteOutage(item.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded text-[11px] font-bold"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-gray-400 hover:text-white px-1 text-[11px]"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={busy === item.id}
                      onClick={() => setConfirmDeleteId(item.id)}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-red-500/30 text-red-300 bg-red-500/10 hover:bg-red-500/20 inline-flex items-center gap-1 transition-all disabled:opacity-50"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Edit Outage Modal with scrollable form and sticky actions */}
        {editingOutage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl rounded-3xl border border-white/20 bg-slate-900 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 shrink-0 bg-slate-900/95">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
                    <Edit2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">Edit Maintenance Notice</h3>
                    <p className="text-xs text-gray-400">Update times, message, or affected areas</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingOutage(null)}
                  className="rounded-xl p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto overscroll-contain flex-1 space-y-4">
                {editError && (
                  <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                    {editError}
                  </p>
                )}

              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-400">Notice Title</label>
                  <input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    placeholder="Notice Title"
                    className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Edit Affected Areas */}
                <div ref={editAreaSearchRef} className="relative">
                  <label className="text-xs font-bold text-gray-400">Affected Areas</label>
                  {editSelectedAreaList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 my-1.5">
                      {editSelectedAreaList.map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-600/20 border border-blue-500/30 px-2 py-0.5 text-xs font-semibold text-blue-200"
                        >
                          <MapPin className="h-3 w-3 text-blue-400" />
                          {name}
                          <button
                            type="button"
                            onClick={() => removeEditArea(name)}
                            className="hover:text-white p-0.5 ml-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="relative mt-1">
                    <input
                      ref={editAreaInputRef}
                      value={editForm.area}
                      onFocus={() => setIsEditAreaOpen(true)}
                      onChange={(e) => {
                        setEditForm({ ...editForm, area: e.target.value });
                        setIsEditAreaOpen(true);
                      }}
                      placeholder="Type area name or comma to add more..."
                      className="w-full rounded-xl border border-white/10 bg-slate-950 pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                    {editForm.area ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEditForm({ ...editForm, area: '' });
                          setIsEditAreaOpen(true);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>

                  {isEditAreaOpen && (
                    <div className="absolute z-50 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-white/15 bg-slate-950 p-1.5 shadow-2xl backdrop-blur-xl space-y-0.5">
                      <button
                        type="button"
                        onClick={() => selectEditArea(null)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-semibold hover:bg-blue-600/20 text-blue-300 transition-colors"
                      >
                        <span>🌐 All Areas (Nationwide Outage)</span>
                        {!editForm.area ? <Check className="h-3.5 w-3.5 text-blue-400" /> : null}
                      </button>

                      {editFilteredAreas.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => selectEditArea(item)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-colors text-gray-200 hover:bg-white/10 group"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium group-hover:text-blue-300 transition-colors">{item.name}</span>
                            <span className="text-[10px] text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">
                              {item.region}
                            </span>
                          </div>
                          <span className="text-[10px] text-blue-400 flex items-center gap-0.5 font-semibold">
                            <Plus className="h-3 w-3" /> Add
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400">Notice Details / Message</label>
                  <textarea
                    value={editForm.message}
                    onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                    className="mt-1 w-full min-h-24 rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold text-gray-400">Start Time</label>
                    <input
                      type="datetime-local"
                      value={editForm.startsAt}
                      onChange={(e) => setEditForm({ ...editForm, startsAt: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400">Estimated End Time</label>
                    <input
                      type="datetime-local"
                      value={editForm.endsAt}
                      onChange={(e) => setEditForm({ ...editForm, endsAt: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2 text-sm focus:outline-none focus:border-blue-500 text-white"
                    />
                  </div>
                </div>
              </div>
              </div>

              {/* Sticky Footer */}
              <div className="flex justify-end gap-3 border-t border-white/10 px-6 py-4 bg-slate-900/95 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingOutage(null)}
                  className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold hover:bg-white/5 transition-colors text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={busy === editingOutage.id || !editForm.title || !editForm.message}
                  onClick={() => void saveEditOutage()}
                  className="rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 px-6 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50 shadow-lg shadow-blue-600/25 active:scale-[0.98] inline-flex items-center gap-2"
                >
                  {busy === editingOutage.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Incidents feed section */}
        <section className="space-y-4">
          {incidents.map((item) => {
            const overdue = item.slaDueAt && new Date(item.slaDueAt).getTime() < now && item.incidentStatus !== 'resolved';
            return (
              <article key={item.id} className={`rounded-2xl border p-5 shadow-md transition-all ${
                item.incidentStatus === 'resolved'
                  ? 'border-emerald-500/20 bg-emerald-500/[0.03]'
                  : overdue
                  ? 'border-rose-500/30 bg-rose-500/[0.04]'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/15'
              }`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="text-xs font-mono text-blue-300 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">{item.referenceCode || 'Report'}</p>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${STATUS_COLORS[item.incidentStatus] || STATUS_COLORS.received}`}>
                        {item.incidentStatus.charAt(0).toUpperCase() + item.incidentStatus.slice(1)}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${SEVERITY_COLORS[item.severity] || SEVERITY_COLORS.medium}`}>
                        {item.severity.charAt(0).toUpperCase() + item.severity.slice(1)}
                      </span>
                    </div>
                    <h2 className="font-bold text-base text-white">
                      {item.type} · {item.areaName || item.area}
                    </h2>
                    <p className="mt-1 max-w-2xl text-sm text-gray-300 leading-relaxed">
                      {item.description || 'No description supplied.'}
                    </p>
                    {item.reportedAt && (
                      <p className="text-xs text-gray-500 mt-1">{new Date(item.reportedAt).toLocaleString()}</p>
                    )}
                    {item.imageUrl && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setViewingPhoto({
                              url: item.imageUrl!,
                              title: `${item.type} · ${item.areaName || item.area}`,
                              subtitle: `Reference: ${item.referenceCode || 'Report'} · Reported: ${item.reportedAt ? new Date(item.reportedAt).toLocaleString() : 'Recent'}`,
                            })
                          }
                          className="inline-flex items-center gap-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 px-3 py-1.5 text-xs text-blue-200 hover:text-white font-semibold transition-all shadow-sm"
                        >
                          <Camera className="h-3.5 w-3.5 text-blue-400" />
                          View evidence photo
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {overdue && (
                      <span className="rounded-full px-2.5 py-1 text-xs font-bold bg-rose-500/20 text-rose-200 border border-rose-500/30 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> SLA Overdue
                      </span>
                    )}
                    {!overdue && item.slaDueAt && (
                      <span className="text-xs text-gray-400">
                        SLA: {new Date(item.slaDueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                    {busy === item.id && (
                      <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                  <select
                    value={item.incidentStatus}
                    onChange={(event) => void update(item, { incidentStatus: event.target.value })}
                    disabled={busy === item.id}
                    className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 disabled:opacity-50 text-white"
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
                    className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 disabled:opacity-50 text-white"
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
                    disabled={busy === item.id}
                    className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 disabled:opacity-50 text-white placeholder-gray-500"
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
                      disabled={busy === item.id}
                      className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 disabled:opacity-50 text-white placeholder-gray-500"
                    />
                    <div className="flex flex-col gap-1">
                      <input
                        defaultValue={item.resolutionImageUrl || ''}
                        onBlur={(event) =>
                          event.target.value !== (item.resolutionImageUrl || '') &&
                          void update(item, { resolutionImageUrl: event.target.value })
                        }
                        placeholder="Resolution photo URL"
                        disabled={busy === item.id}
                        className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 disabled:opacity-50 text-white placeholder-gray-500"
                      />
                      {item.resolutionImageUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            setViewingPhoto({
                              url: item.resolutionImageUrl!,
                              title: `Resolution Evidence · ${item.type}`,
                              subtitle: `Resolved report for ${item.areaName || item.area}`,
                            })
                          }
                          className="inline-flex items-center gap-1.5 text-xs text-emerald-300 hover:text-emerald-200 font-semibold"
                        >
                          <Camera className="h-3 w-3" /> View resolution photo
                        </button>
                      )}
                    </div>
                    <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-200 hover:bg-emerald-500/10 transition-colors">
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

        {/* Evidence Photo Lightbox Modal */}
        {viewingPhoto && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setViewingPhoto(null)}
          >
            <div
              className="relative max-h-[90vh] max-w-4xl w-full rounded-2xl border border-white/20 bg-slate-900 p-4 shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Camera className="h-4 w-4 text-blue-400" />
                    {viewingPhoto.title}
                  </h3>
                  {viewingPhoto.subtitle && (
                    <p className="text-xs text-gray-400 mt-0.5">{viewingPhoto.subtitle}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      downloadPhoto(
                        viewingPhoto.url,
                        `${viewingPhoto.title.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-semibold text-gray-200 hover:text-white transition-colors"
                  >
                    <Download className="h-3.5 w-3.5 text-blue-400" /> Download
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingPhoto(null)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Photo Display */}
              <div className="relative flex-1 flex items-center justify-center overflow-hidden rounded-xl bg-black/60 min-h-[300px] max-h-[70vh]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={viewingPhoto.url}
                  alt={viewingPhoto.title}
                  className="max-h-[70vh] max-w-full object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
