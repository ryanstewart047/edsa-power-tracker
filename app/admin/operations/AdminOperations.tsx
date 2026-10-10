'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Bell, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, MessageSquare, Pencil, RefreshCw, Settings2, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';

type Data = {
  flags: Record<string, boolean>;
  definitions: Record<string, { label: string }>;
  feedbackCount: number;
  feedback: Array<{ id: string; name: string | null; email: string | null; category: string; rating: number; area: string | null; message: string; createdAt: string }>;
  announcements: Array<{ id: string; title: string; message: string; active: boolean; createdAt: string }>;
  logs: Array<{ id: string; action: string; detail: string | null; adminEmail: string; createdAt: string }>;
  directVending: { enabled: boolean; approved: boolean; credentialsConfigured: boolean; message: string };
};

export default function AdminOperations({ adminEmail, isSuperAdmin }: { adminEmail: string; isSuperAdmin: boolean }) {
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
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'excited' | 'happy' | 'sad'>('all');
  const [feedbackPage, setFeedbackPage] = useState(1);
  const [feedbackPageSize, setFeedbackPageSize] = useState(6);

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

  const deleteFeedback = (id: string) => {
    if (window.confirm('Delete this feedback item? This cannot be undone.')) {
      void perform({ action: 'delete-feedback', id }, `delete-fb-${id}`);
    }
  };

  if (!data) return <main className="min-h-screen bg-slate-950 p-8 text-white"><p>{error || 'Loading operations console...'}</p></main>;

  const getFeedbackSentiment = (item: Data['feedback'][number]) => {
    const cat = (item.category || '').toLowerCase();
    const msg = (item.message || '').toLowerCase();
    if (item.rating === 5 || cat.includes('excited') || msg.includes('🤩') || msg.includes('excited')) return 'excited';
    if (item.rating === 4 || cat.includes('happy') || msg.includes('😊') || msg.includes('happy')) return 'happy';
    if (item.rating <= 2 || cat.includes('sad') || msg.includes('😞') || msg.includes('sad')) return 'sad';
    return 'happy';
  };

  const totalFeedbackCount = data.feedback.length;
  const excitedCount = data.feedback.filter((i) => getFeedbackSentiment(i) === 'excited').length;
  const happyCount = data.feedback.filter((i) => getFeedbackSentiment(i) === 'happy').length;
  const sadCount = data.feedback.filter((i) => getFeedbackSentiment(i) === 'sad').length;

  const filteredFeedback = feedbackFilter === 'all'
    ? data.feedback
    : data.feedback.filter((i) => getFeedbackSentiment(i) === feedbackFilter);

  const totalFilteredCount = filteredFeedback.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / feedbackPageSize));
  const safePage = Math.min(Math.max(1, feedbackPage), totalPages);
  const startIndex = (safePage - 1) * feedbackPageSize;
  const endIndex = Math.min(startIndex + feedbackPageSize, totalFilteredCount);
  const paginatedFeedback = filteredFeedback.slice(startIndex, endIndex);

  const handleFilterChange = (filter: 'all' | 'excited' | 'happy' | 'sad') => {
    setFeedbackFilter(filter);
    setFeedbackPage(1);
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div><p className="text-xs font-bold uppercase tracking-wider text-blue-400">Separate Operations Console</p><h1 className="mt-1 text-2xl font-black">App controls & intelligence</h1><p className="mt-1 text-sm text-gray-400">Signed in as {adminEmail}</p></div>
          <div className="flex gap-2"><Link href="/admin" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"><ArrowLeft className="h-4 w-4" /> Dashboard</Link><button onClick={() => void load()} className="rounded-lg border border-white/10 p-2 hover:bg-white/5" aria-label="Refresh"><RefreshCw className="h-4 w-4" /></button></div>
        </header>
        {error && <p className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
        {success && <p className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">{success}</p>}
        <section className="grid gap-4 md:grid-cols-3">
          {Object.entries(data.definitions).map(([key, definition]) => <button key={key} onClick={() => void perform({ action: 'set-flag', key, enabled: !data.flags[key] }, key)} disabled={busy === key} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-5 text-left hover:bg-white/[0.06] disabled:opacity-60"><span><Settings2 className="mb-3 h-5 w-5 text-blue-400" /><span className="block font-bold">{definition.label}</span><span className="text-xs text-gray-400">{data.flags[key] ? 'Enabled in the app' : 'Temporarily disabled'}</span></span>{data.flags[key] ? <ToggleRight className="h-8 w-8 text-emerald-400" /> : <ToggleLeft className="h-8 w-8 text-gray-500" />}</button>)}
        </section>
        <section className="rounded-lg border border-[#2607d5]/20 bg-[#2607d5]/[0.06] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><p className="text-sm font-bold text-white">Direct EDSA vending readiness</p><p className="mt-1 text-xs text-gray-400">{data.directVending.message}</p></div>
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${data.directVending.enabled ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' : 'border-[#2607d5]/30 bg-[#2607d5]/15 text-blue-200'}`}>{data.directVending.enabled ? 'Ready' : 'Not live'}</span>
          </div>
        </section>
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-2"><Bell className="h-5 w-5 text-blue-400" /><h2 className="font-bold">Send in-app announcement</h2></div>
            {isSuperAdmin ? (
              <div className="mt-5 space-y-3"><input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="Announcement title" className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm" /><textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={500} placeholder="Message for all app users" className="min-h-28 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm" /><button disabled={!title.trim() || !message.trim() || busy === 'announcement'} onClick={() => void perform({ action: 'create-announcement', title, message }, 'announcement')} className="rounded-lg bg-[#2607d5] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy === 'announcement' ? 'Sending...' : 'Publish announcement'}</button></div>
            ) : (
              <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.03] p-4 flex items-start gap-3">
                <span className="text-xl shrink-0">🔒</span>
                <div>
                  <p className="text-sm font-semibold text-gray-300">Super admin access required</p>
                  <p className="mt-1 text-xs text-gray-500">Publishing announcements is restricted to super administrators. You can view and manage existing announcements below.</p>
                </div>
              </div>
            )}
            <div className="mt-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Announcement history</h3>
              {data.announcements.map((item) => editingAnnouncementId === item.id ? (
                <div key={item.id} className="space-y-3 rounded-lg border border-[#2607d5]/30 bg-[#2607d5]/[0.06] p-3">
                  <input value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} maxLength={120} className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm" />
                  <textarea value={editingMessage} onChange={(event) => setEditingMessage(event.target.value)} maxLength={500} className="min-h-24 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm" />
                  <div className="flex gap-2"><button disabled={!editingTitle.trim() || !editingMessage.trim() || busy === `edit-${item.id}`} onClick={() => void perform({ action: 'update-announcement', id: item.id, title: editingTitle, message: editingMessage }, `edit-${item.id}`)} className="rounded-lg bg-[#2607d5] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Save changes</button><button onClick={() => setEditingAnnouncementId(null)} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-gray-300">Cancel</button></div>
                </div>
              ) : (
                <div key={item.id} className="rounded-lg bg-black/20 p-3 text-sm">
                  <div className="flex items-start justify-between gap-3"><div><p className="font-bold text-white">{item.title}<span className={`ml-2 text-xs ${item.active ? 'text-emerald-400' : 'text-gray-500'}`}>{item.active ? 'Live' : 'Hidden'}</span></p><p className="mt-1 text-xs text-gray-400">{item.message}</p><p className="mt-2 text-[10px] text-gray-600">{new Date(item.createdAt).toLocaleString()}</p></div><div className="flex shrink-0 gap-1"><button onClick={() => beginEditingAnnouncement(item)} className="rounded-md p-1.5 text-gray-400 hover:bg-white/10 hover:text-white" title="Edit announcement" aria-label="Edit announcement"><Pencil className="h-3.5 w-3.5" /></button><button onClick={() => deleteAnnouncement(item.id, item.title)} disabled={busy === `delete-${item.id}`} className="rounded-md p-1.5 text-red-300 hover:bg-red-500/10 disabled:opacity-50" title="Delete announcement" aria-label="Delete announcement"><Trash2 className="h-3.5 w-3.5" /></button></div></div><button onClick={() => void perform({ action: 'set-announcement-status', id: item.id, active: !item.active }, item.id)} className="mt-3 text-xs font-bold text-blue-300">{item.active ? 'Disable' : 'Enable'}</button>
                </div>
              ))}
              {data.announcements.length === 0 && <p className="text-sm text-gray-500">No announcements have been created.</p>}
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-400" />
                <h2 className="font-bold text-lg">Citizen Feedback Inbox ({data.feedbackCount})</h2>
              </div>
            </div>

            {/* Emoji Sentiment Overview Cards */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="rounded-xl border border-[#2607d5]/30 bg-[#2607d5]/15 p-3 text-center">
                <span className="text-2xl">🤩</span>
                <p className="mt-1 text-xs font-bold text-blue-300">Excited</p>
                <p className="text-lg font-black text-white">{excitedCount}</p>
                <p className="text-[10px] text-gray-400">
                  {totalFeedbackCount ? Math.round((excitedCount / totalFeedbackCount) * 100) : 0}%
                </p>
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
                <span className="text-2xl">😊</span>
                <p className="mt-1 text-xs font-bold text-emerald-300">Happy</p>
                <p className="text-lg font-black text-white">{happyCount}</p>
                <p className="text-[10px] text-gray-400">
                  {totalFeedbackCount ? Math.round((happyCount / totalFeedbackCount) * 100) : 0}%
                </p>
              </div>

              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-center">
                <span className="text-2xl">😞</span>
                <p className="mt-1 text-xs font-bold text-rose-300">Sad</p>
                <p className="text-lg font-black text-white">{sadCount}</p>
                <p className="text-[10px] text-gray-400">
                  {totalFeedbackCount ? Math.round((sadCount / totalFeedbackCount) * 100) : 0}%
                </p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => handleFilterChange('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  feedbackFilter === 'all'
                    ? 'bg-[#2607d5] text-white shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                }`}
              >
                All ({totalFeedbackCount})
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('excited')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  feedbackFilter === 'excited'
                    ? 'bg-[#2607d5]/30 border border-[#2607d5] text-blue-300'
                    : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                }`}
              >
                🤩 Excited ({excitedCount})
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('happy')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  feedbackFilter === 'happy'
                    ? 'bg-emerald-500/30 border border-emerald-400 text-emerald-300'
                    : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                }`}
              >
                😊 Happy ({happyCount})
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('sad')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  feedbackFilter === 'sad'
                    ? 'bg-rose-500/30 border border-rose-400 text-rose-300'
                    : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                }`}
              >
                😞 Sad ({sadCount})
              </button>
            </div>

            {/* Feedback List */}
            <div className="space-y-3 pr-1">
              {paginatedFeedback.length ? (
                paginatedFeedback.map((item) => {
                  const sentiment = getFeedbackSentiment(item);
                  const sentimentEmoji = sentiment === 'excited' ? '🤩' : sentiment === 'happy' ? '😊' : '😞';
                  const sentimentColor =
                    sentiment === 'excited'
                      ? 'border-[#2607d5]/30 bg-[#2607d5]/15 text-blue-300'
                      : sentiment === 'happy'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-rose-500/30 bg-rose-500/10 text-rose-300';

                  return (
                    <article key={item.id} className="rounded-xl border border-white/5 bg-black/30 p-4 space-y-2 hover:border-white/10 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${sentimentColor}`}>
                            <span>{sentimentEmoji}</span>
                            <span className="capitalize">{sentiment}</span>
                          </span>
                          <span className="text-xs font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded">
                            {item.rating}/5 ★
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => deleteFeedback(item.id)}
                          disabled={busy === `delete-fb-${item.id}`}
                          className="rounded-md p-1.5 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          title="Delete feedback"
                          aria-label="Delete feedback"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <p className="text-sm text-gray-200 leading-relaxed font-medium">
                        {item.message}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5 text-[11px] text-gray-400">
                        <span>
                          <strong className="text-white">{item.name || 'Anonymous Citizen'}</strong>
                          {item.area ? ` • 📍 ${item.area}` : ''}
                          {item.category ? ` • ${item.category}` : ''}
                        </span>
                        <span className="text-gray-500">
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </article>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  No {feedbackFilter !== 'all' ? feedbackFilter : ''} feedback received yet.
                </p>
              )}
            </div>

            {/* Pagination Controls */}
            {totalFilteredCount > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-white/10 text-xs">
                <div className="flex items-center gap-3 text-gray-400">
                  <span>
                    Showing <strong className="text-white">{startIndex + 1}</strong>–<strong className="text-white">{endIndex}</strong> of <strong className="text-white">{totalFilteredCount}</strong>
                  </span>
                  <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
                    <span className="text-gray-500">Per page:</span>
                    {[6, 12, 24].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          setFeedbackPageSize(size);
                          setFeedbackPage(1);
                        }}
                        className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${
                          feedbackPageSize === size
                            ? 'bg-[#2607d5] text-white font-bold'
                            : 'bg-white/5 hover:bg-white/10 text-gray-300'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setFeedbackPage((p) => Math.max(1, p - 1))}
                      disabled={safePage <= 1}
                      className="p-1 rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Previous page"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <div className="flex items-center gap-1 px-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => {
                          if (totalPages <= 5) return true;
                          if (p === 1 || p === totalPages) return true;
                          if (Math.abs(p - safePage) <= 1) return true;
                          return false;
                        })
                        .reduce<(number | string)[]>((acc, p, idx, arr) => {
                          if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                            acc.push(`dots-${p}`);
                          }
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((pageItem) => {
                          if (typeof pageItem === 'string') {
                            return (
                              <span key={pageItem} className="px-1 text-gray-500">
                                …
                              </span>
                            );
                          }
                          return (
                            <button
                              key={pageItem}
                              type="button"
                              onClick={() => setFeedbackPage(pageItem)}
                              className={`h-7 w-7 rounded-lg text-xs font-bold transition-colors ${
                                safePage === pageItem
                                  ? 'bg-[#2607d5] text-white font-black'
                                  : 'border border-white/5 bg-white/5 hover:bg-white/10 text-gray-300'
                              }`}
                            >
                              {pageItem}
                            </button>
                          );
                        })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setFeedbackPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage >= totalPages}
                      className="p-1 rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      title="Next page"
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
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
