'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Clock3, ExternalLink, RefreshCw } from 'lucide-react';

type Incident = {
  id: string; referenceCode: string; type: string; area: string; areaName: string | null;
  description: string | null; imageUrl: string | null; incidentStatus: string; severity: string;
  assignedTo: string | null; slaDueAt: string | null; resolutionNote: string | null; resolutionImageUrl: string | null;
};
type Outage = { id: string; title: string; message: string; area: string | null; startsAt: string; endsAt: string; active: boolean };
const emptyOutage = { title: '', message: '', area: '', startsAt: '', endsAt: '' };

export default function IncidentConsole({ adminEmail }: { adminEmail: string }) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [outages, setOutages] = useState<Outage[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [outage, setOutage] = useState(emptyOutage);

  const load = useCallback(async () => {
    const response = await fetch('/api/admin/incidents', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not load incidents.');
    setIncidents(data.incidents);
    setOutages(data.outages);
  }, []);

  useEffect(() => { void load().catch((loadError) => setError(loadError.message)); }, [load]);

  const update = async (incident: Incident, data: Record<string, unknown>) => {
    setBusy(incident.id); setError('');
    try {
      const response = await fetch(`/api/hazards/${incident.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not update incident.');
      await load();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update incident.');
    } finally { setBusy(null); }
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
    setBusy('outage'); setError('');
    try {
      const response = await fetch('/api/admin/incidents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create-outage', ...outage }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not schedule outage.');
      setOutage(emptyOutage); await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Could not schedule outage.');
    } finally { setBusy(null); }
  };

  const toggleOutage = async (item: Outage) => {
    setBusy(item.id);
    try {
      const response = await fetch('/api/admin/incidents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'set-outage-status', id: item.id, active: !item.active }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not update maintenance notice.');
      await load();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Could not update maintenance notice.');
    } finally { setBusy(null); }
  };

  const now = Date.now();
  return <main className="min-h-screen bg-slate-950 px-4 py-8 text-white md:px-8"><div className="mx-auto max-w-7xl space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5"><div><p className="text-xs font-bold uppercase tracking-wider text-blue-400">Operations workflow</p><h1 className="text-2xl font-black">Incident Queue</h1><p className="text-sm text-gray-400">Ownership, response targets, and citizen-visible resolution.</p><p className="mt-1 text-xs text-gray-500">Signed in as {adminEmail}</p></div><div className="flex gap-2"><Link href="/admin" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm"><ArrowLeft className="h-4 w-4" /> Dashboard</Link><button type="button" aria-label="Refresh incidents" onClick={() => void load()} className="rounded-lg border border-white/10 p-2"><RefreshCw className="h-4 w-4" /></button></div></header>
    {error && <p className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
    <section className="rounded-lg border border-white/10 bg-white/[0.03] p-5"><div className="flex items-center gap-2"><Clock3 className="h-5 w-5 text-blue-300" /><h2 className="font-bold">Planned maintenance notice</h2></div><div className="mt-4 grid gap-3 md:grid-cols-2"><input value={outage.title} onChange={(event) => setOutage({ ...outage, title: event.target.value })} placeholder="Maintenance title" className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm" /><input value={outage.area} onChange={(event) => setOutage({ ...outage, area: event.target.value })} placeholder="Affected area, or leave blank for all" className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm" /><textarea value={outage.message} onChange={(event) => setOutage({ ...outage, message: event.target.value })} placeholder="What residents should expect" className="min-h-20 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm md:col-span-2" /><input type="datetime-local" value={outage.startsAt} onChange={(event) => setOutage({ ...outage, startsAt: event.target.value })} className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm" /><input type="datetime-local" value={outage.endsAt} onChange={(event) => setOutage({ ...outage, endsAt: event.target.value })} className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm" /></div><button type="button" disabled={busy === 'outage' || !outage.title || !outage.message || !outage.startsAt || !outage.endsAt} onClick={() => void createOutage()} className="mt-3 rounded-lg bg-[#040e40] px-4 py-2 text-sm font-bold disabled:opacity-50">{busy === 'outage' ? 'Publishing...' : 'Publish maintenance notice'}</button><div className="mt-4 space-y-2">{outages.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-black/20 p-3 text-sm"><span><b>{item.title}</b> {item.area ? `· ${item.area}` : '· All areas'} <small className="ml-2 text-gray-500">{new Date(item.startsAt).toLocaleString()} - {new Date(item.endsAt).toLocaleString()}</small></span><button type="button" disabled={busy === item.id} onClick={() => void toggleOutage(item)} className="text-xs font-bold text-blue-300 disabled:opacity-50">{item.active ? 'Hide' : 'Show'}</button></div>)}</div></section>
    <section className="space-y-3">{incidents.map((item) => { const overdue = item.slaDueAt && new Date(item.slaDueAt).getTime() < now && item.incidentStatus !== 'resolved'; return <article key={item.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-mono text-blue-300">{item.referenceCode}</p><h2 className="font-bold">{item.type} · {item.areaName || item.area}</h2><p className="mt-1 max-w-2xl text-sm text-gray-400">{item.description || 'No description supplied.'}</p>{item.imageUrl && <a href={item.imageUrl} target="_blank" className="mt-2 inline-flex items-center gap-1 text-xs text-blue-300" rel="noreferrer"><ExternalLink className="h-3 w-3" /> Reporter evidence</a>}</div><span className={`rounded-full px-2 py-1 text-xs font-bold ${overdue ? 'bg-red-500/20 text-red-200' : 'bg-white/10 text-gray-300'}`}>{overdue ? 'SLA overdue' : item.slaDueAt ? `SLA ${new Date(item.slaDueAt).toLocaleString()}` : 'No SLA'}</span></div><div className="mt-4 grid gap-2 sm:grid-cols-3"><select value={item.incidentStatus} onChange={(event) => void update(item, { incidentStatus: event.target.value })} disabled={busy === item.id} className="rounded-md border border-white/10 bg-slate-900 px-2 py-2 text-sm"><option value="received">Received</option><option value="reviewing">Under review</option><option value="dispatched">Dispatched</option><option value="resolved">Resolved</option></select><select value={item.severity} onChange={(event) => void update(item, { severity: event.target.value })} disabled={busy === item.id} className="rounded-md border border-white/10 bg-slate-900 px-2 py-2 text-sm"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select><input defaultValue={item.assignedTo || ''} onBlur={(event) => event.target.value !== (item.assignedTo || '') && void update(item, { assignedTo: event.target.value })} placeholder="Assign to team/member" className="rounded-md border border-white/10 bg-slate-900 px-2 py-2 text-sm" /></div>{item.incidentStatus === 'resolved' && <div className="mt-3 grid gap-2 sm:grid-cols-3"><input defaultValue={item.resolutionNote || ''} onBlur={(event) => event.target.value !== (item.resolutionNote || '') && void update(item, { resolutionNote: event.target.value })} placeholder="Resolution note for citizen" className="rounded-md border border-white/10 bg-slate-900 px-2 py-2 text-sm" /><input defaultValue={item.resolutionImageUrl || ''} onBlur={(event) => event.target.value !== (item.resolutionImageUrl || '') && void update(item, { resolutionImageUrl: event.target.value })} placeholder="Resolution photo URL" className="rounded-md border border-white/10 bg-slate-900 px-2 py-2 text-sm" /><label className="flex cursor-pointer items-center justify-center rounded-md border border-dashed border-white/20 px-2 py-2 text-sm text-blue-200">Upload resolution photo<input type="file" accept="image/*" className="sr-only" onChange={(event) => uploadResolutionPhoto(item, event.target.files?.[0])} /></label></div>}</article>; })}{incidents.length === 0 && <p className="rounded-lg border border-white/10 p-8 text-center text-gray-400">No incidents have been reported.</p>}</section>
  </div></main>;
}
