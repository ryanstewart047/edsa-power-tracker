'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Bell, MessageSquare, RefreshCw, Settings2, ToggleLeft, ToggleRight } from 'lucide-react';

type Data = {
  flags: Record<string, boolean>;
  definitions: Record<string, { label: string }>;
  feedbackCount: number;
  feedback: Array<{ id: string; name: string | null; email: string | null; category: string; rating: number; area: string | null; message: string; createdAt: string }>;
  announcements: Array<{ id: string; title: string; message: string; active: boolean; createdAt: string }>;
  logs: Array<{ id: string; action: string; detail: string | null; adminEmail: string; createdAt: string }>;
};

export default function AdminOperations({ adminEmail }: { adminEmail: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');

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
      if (body.action === 'set-flag' && result.flags) {
        setData((current) => current ? { ...current, flags: result.flags } : current);
      }
      setSuccess(body.action === 'create-announcement' ? 'Announcement is now live in the app.' : 'Operations control updated.');
      void load().catch(() => undefined);
    } catch (err) { setError(err instanceof Error ? err.message : 'Operation failed.'); }
    finally { setBusy(null); }
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
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6"><div className="flex items-center gap-2"><Bell className="h-5 w-5 text-yellow-400" /><h2 className="font-bold">Send in-app announcement</h2></div><div className="mt-5 space-y-3"><input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="Announcement title" className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm" /><textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={500} placeholder="Message for all app users" className="min-h-28 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm" /><button disabled={!title.trim() || !message.trim() || busy === 'announcement'} onClick={() => void perform({ action: 'create-announcement', title, message }, 'announcement')} className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50">{busy === 'announcement' ? 'Sending...' : 'Publish announcement'}</button></div><div className="mt-6 space-y-2">{data.announcements.map((item) => <div key={item.id} className="flex items-center justify-between rounded-lg bg-black/20 p-3 text-sm"><span><b>{item.title}</b><span className="ml-2 text-xs text-gray-500">{item.active ? 'Live' : 'Hidden'}</span></span><button onClick={() => void perform({ action: 'set-announcement-status', id: item.id, active: !item.active }, item.id)} className="text-xs text-yellow-300">{item.active ? 'Disable' : 'Enable'}</button></div>)}</div></div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6"><div className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-yellow-400" /><h2 className="font-bold">Feedback inbox ({data.feedbackCount})</h2></div><div className="mt-5 max-h-[430px] space-y-3 overflow-y-auto">{data.feedback.length ? data.feedback.map((item) => <article key={item.id} className="rounded-lg bg-black/20 p-4"><p className="text-sm text-gray-200">{item.message}</p><p className="mt-2 text-xs text-gray-500">{item.name || 'Anonymous'} · {item.category} · {item.rating}/5 · {item.area || 'No area'} · {new Date(item.createdAt).toLocaleString()}</p></article>) : <p className="text-sm text-gray-500">No feedback received yet.</p>}</div></div>
        </section>
        <section className="rounded-lg border border-white/10 bg-white/[0.03] p-6"><h2 className="font-bold">Admin activity log</h2><div className="mt-4 space-y-2">{data.logs.map((log) => <p key={log.id} className="text-sm text-gray-400"><span className="text-white">{log.action.replaceAll('_', ' ')}</span>{log.detail ? ` (${log.detail})` : ''} <span className="text-gray-600">by {log.adminEmail} · {new Date(log.createdAt).toLocaleString()}</span></p>)}</div></section>
      </div>
    </main>
  );
}
