'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Bell, ChevronDown, ChevronUp, MessageSquare, Pencil, RefreshCw, Settings2, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';

type Data = {
  flags: Record<string, boolean>;
  definitions: Record<string, { label: string }>;
  feedbackCount: number;
  feedback: Array<{ id: string; name: string | null; email: string | null; category: string; rating: number; area: string | null; message: string; createdAt: string }>;
  announcements: Array<{ id: string; title: string; message: string; active: boolean; createdAt: string }>;
  logs: Array<{ id: string; action: string; detail: string | null; adminEmail: string; createdAt: string }>;
  directVending: { enabled: boolean; approved: boolean; credentialsConfigured: boolean; message: string };
};

export default function AdminOperations({ adminEmail }: { adminEmail: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingMessage, setEditingMessage] = useState('');
  const [auditLogOpen, setAuditLogOpen] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch('/api/admin/operations', { cache: 'no-store', credentials: 'same-origin' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not load operations data.');
    setData(result);
  }, []);

  useEffect(() => { void load().catch((err) => setError(err.message)); }, [load]);

  const perform = async (body: Record<string, unknown>, key: string) => {
    setBusy(key); setError(null); setSuccess(null);
    try {
      const response = await fetch('/api/admin/operations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Operation failed.');
      if (body.action === 'create-announcement') { setTitle(''); setMessage(''); }
      if (body.action === 'update-announcement') setEditingAnnouncementId(null);
      if (body.action === 'set-flag' && result.flags) {
        setData((current) => current ? { ...current, flags: result.flags } : current);
      }
      setSuccess(body.action === 'create-announcement' ? 'Announcement is now live in the app.' : 'Operations control updated.');
      void load().catch(() => undefined);
    } catch (err) { setError(err instanceof Error ? err.message : 'Operation failed.'); }
    finally { setBusy(null); }
  };

  const beginEditingAnnouncement = (announcement: Data['announcements'][number]) => {
    setEditingAnnouncementId(announcement.id);
    setEditingTitle(announcement.title);
    setEditingMessage(announcement.message);
  };

  const deleteAnnouncement = (id: string, title: string) => {
    if (window.confirm(`Delete the announcement "${title}"? This cannot be undone.`)) {
      void perform({ action: 'delete-announcement', id }, `delete-${id}`);
    }
  };

  const clearAuditLog = () => {
    if (window.confirm('Clear every admin activity entry? This cannot be undone.')) {
      void perform({ action: 'clear-audit-log' }, 'clear-audit-log');
    }
  };

  if (!data) return <main className="min-h-screen bg-slate-950 p-8 text-white"><p>{error || 'Loading operations console...'}</p></main>;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div><p className="text-xs font-bold uppercase tracking-wider text-yellow-400">Separate Operations Console</p><h1 className="mt-1 text-2xl font-black">App controls & intelligence</h1><p className="mt-1 text-sm text-gray-400">Signed in as {adminEmail}</p></div>
          <div className="flex gap-2"><Link href="/admin" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"><ArrowLeft className="h-4 w-4" /> Dashboard</Link><button onClick={() => void load()} className="rounded-lg border border-white/10 p-2 hover:bg-white/5" aria-label="Refresh"><RefreshCw className="h-4 w-4" /></button></div>
        </header>
        {error && <p className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
        {success && <p className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{success}</p>}
        <section className="grid gap-4 md:grid-cols-3">
          {Object.entries(data.definitions).map(([key, definition]) => <button key={key} onClick={() => void perform({ action: 'set-flag', key, enabled: !data.flags[key] }, key)} disabled={busy === key} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-5 text-left hover:bg-white/[0.06] disabled:opacity-60"><span><Settings2 className="mb-3 h-5 w-5 text-yellow-400" /><span className="block font-bold">{definition.label}</span><span className="text-xs text-gray-400">{data.flags[key] ? 'Enabled in the app' : 'Temporarily disabled'}</span></span>{data.flags[key] ? <ToggleRight className="h-8 w-8 text-emerald-400" /> : <ToggleLeft className="h-8 w-8 text-gray-500" />}</button>)}
        </section>
        <section className="rounded-lg border border-yellow-400/20 bg-yellow-400/[0.04] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-sm font-bold text-white">Direct EDSA vending readiness</p><p className="mt-1 text-xs text-gray-400">{data.directVending.message}</p></div>
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${data.directVending.enabled ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' : 'border-yellow-400/30 bg-yellow-400/10 text-yellow-200'}`}>{data.directVending.enabled ? 'Ready' : 'Not live'}</span>
          </div>
        </section>
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-2"><Bell className="h-5 w-5 text-yellow-400" /><h2 className="font-bold">Send in-app announcement</h2></div>
            <div className="mt-5 space-y-3"><input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="Announcement title" className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm" /><textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={500} placeholder="Message for all app users" className="min-h-28 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm" /><button disabled={!title.trim() || !message.trim() || busy === 'announcement'} onClick={() => void perform({ action: 'create-announcement', title, message }, 'announcement')} className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50">{busy === 'announcement' ? 'Sending...' : 'Publish announcement'}</button></div>
            <div className="mt-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Announcement history</h3>
              {data.announcements.map((item) => editingAnnouncementId === item.id ? (
                <div key={item.id} className="space-y-3 rounded-lg border border-yellow-400/30 bg-yellow-400/5 p-3">
                  <input value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} maxLength={120} className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm" />
                  <textarea value={editingMessage} onChange={(event) => setEditingMessage(event.target.value)} maxLength={500} className="min-h-24 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm" />
                  <div className="flex gap-2"><button disabled={!editingTitle.trim() || !editingMessage.trim() || busy === `edit-${item.id}`} onClick={() => void perform({ action: 'update-announcement', id: item.id, title: editingTitle, message: editingMessage }, `edit-${item.id}`)} className="rounded-lg bg-yellow-400 px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-50">Save changes</button><button onClick={() => setEditingAnnouncementId(null)} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-gray-300">Cancel</button></div>
                </div>
              ) : (
                <div key={item.id} className="rounded-lg bg-black/20 p-3 text-sm">
                  <div className="flex items-start justify-between gap-3"><div><p className="font-bold text-white">{item.title}<span className={`ml-2 text-xs ${item.active ? 'text-emerald-400' : 'text-gray-500'}`}>{item.active ? 'Live' : 'Hidden'}</span></p><p className="mt-1 text-xs text-gray-400">{item.message}</p><p className="mt-2 text-[10px] text-gray-600">{new Date(item.createdAt).toLocaleString()}</p></div><div className="flex shrink-0 gap-1"><button onClick={() => beginEditingAnnouncement(item)} className="rounded-md p-1.5 text-gray-400 hover:bg-white/10 hover:text-white" title="Edit announcement" aria-label="Edit announcement"><Pencil className="h-3.5 w-3.5" /></button><button onClick={() => deleteAnnouncement(item.id, item.title)} disabled={busy === `delete-${item.id}`} className="rounded-md p-1.5 text-red-300 hover:bg-red-500/10 disabled:opacity-50" title="Delete announcement" aria-label="Delete announcement"><Trash2 className="h-3.5 w-3.5" /></button></div></div><button onClick={() => void perform({ action: 'set-announcement-status', id: item.id, active: !item.active }, item.id)} className="mt-3 text-xs font-bold text-yellow-300">{item.active ? 'Disable' : 'Enable'}</button>
                </div>
              ))}
              {data.announcements.length === 0 && <p className="text-sm text-gray-500">No announcements have been created.</p>}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6"><div className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-yellow-400" /><h2 className="font-bold">Feedback inbox ({data.feedbackCount})</h2></div><div className="mt-5 max-h-[430px] space-y-3 overflow-y-auto">{data.feedback.length ? data.feedback.map((item) => <article key={item.id} className="rounded-lg bg-black/20 p-4"><p className="text-sm text-gray-200">{item.message}</p><p className="mt-2 text-xs text-gray-500">{item.name || 'Anonymous'} · {item.category} · {item.rating}/5 · {item.area || 'No area'} · {new Date(item.createdAt).toLocaleString()}</p></article>) : <p className="text-sm text-gray-500">No feedback received yet.</p>}</div></div>
        </section>
        <section className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="font-bold">Admin activity log</h2><p className="mt-1 text-xs text-gray-500">{data.logs.length} recent recorded actions</p></div>
            <div className="flex items-center gap-2">
              {auditLogOpen && data.logs.length > 0 && <button onClick={clearAuditLog} disabled={busy === 'clear-audit-log'} className="rounded-lg border border-red-400/30 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/10 disabled:opacity-50">{busy === 'clear-audit-log' ? 'Clearing...' : 'Clear log'}</button>}
              <button onClick={() => setAuditLogOpen((open) => !open)} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-gray-200 hover:bg-white/5">{auditLogOpen ? <><ChevronUp className="h-4 w-4" /> Close</> : <><ChevronDown className="h-4 w-4" /> Expand</>}</button>
            </div>
          </div>
          {auditLogOpen && <div className="mt-4 max-h-80 space-y-2 overflow-y-auto">{data.logs.length ? data.logs.map((log) => <p key={log.id} className="text-sm text-gray-400"><span className="text-white">{log.action.replaceAll('_', ' ')}</span>{log.detail ? ` (${log.detail})` : ''} <span className="text-gray-600">by {log.adminEmail} · {new Date(log.createdAt).toLocaleString()}</span></p>) : <p className="text-sm text-gray-500">No admin activity has been recorded.</p>}</div>}
        </section>
      </div>
    </main>
  );
}
