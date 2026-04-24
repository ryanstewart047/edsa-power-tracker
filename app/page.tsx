'use client';

import { useState, useEffect, useCallback } from 'react';
import { Zap, ZapOff, HelpCircle, RefreshCw, Megaphone, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { AreaWithStatus } from '@/lib/areas';

const STATUS_META = {
  on:      { label: 'Power ON',  icon: Zap,         dot: 'bg-green-400', ring: 'ring-green-500/30', card: 'border-green-500/30 bg-green-500/5',  text: 'text-green-400' },
  out:     { label: 'Power OUT', icon: ZapOff,       dot: 'bg-red-400 animate-ping-slow', ring: 'ring-red-500/30', card: 'border-red-500/30 bg-red-500/5',    text: 'text-red-400' },
  unknown: { label: 'Unknown',   icon: HelpCircle,   dot: 'bg-gray-500',  ring: 'ring-gray-500/20', card: 'border-white/10 bg-white/5',            text: 'text-gray-400' },
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'No data yet';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function Home() {
  const [areas, setAreas] = useState<AreaWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'out' | 'on' | 'unknown'>('all');
  const [reportModal, setReportModal] = useState<AreaWithStatus | null>(null);
  const [reporting, setReporting] = useState(false);
  const [reportResult, setReportResult] = useState<{ success: boolean; confirmed: boolean; reportsNeeded: number } | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setAreas(data);
        setLastRefresh(new Date());
      }
    } catch (e) {
      console.error('Failed to fetch status', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60_000); // refresh every 60s
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleReport = async (status: 'on' | 'out') => {
    if (!reportModal) return;
    setReporting(true);
    setReportResult(null);
    try {
      const res = await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area: reportModal.name, status }),
      });
      if (res.ok) {
        const data = await res.json();
        setReportResult({ success: true, confirmed: data.confirmed, reportsNeeded: data.reportsNeeded });
        fetchStatus();
        setTimeout(() => { setReportModal(null); setReportResult(null); }, 3000);
      } else {
        setReportResult({ success: false, confirmed: false, reportsNeeded: 0 });
      }
    } catch {
      setReportResult({ success: false, confirmed: false, reportsNeeded: 0 });
    } finally {
      setReporting(false);
    }
  };

  const filtered = areas.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || a.status === filter;
    return matchSearch && matchFilter;
  });

  const counts = {
    on:      areas.filter(a => a.status === 'on').length,
    out:     areas.filter(a => a.status === 'out').length,
    unknown: areas.filter(a => a.status === 'unknown').length,
  };

  return (
    <main className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h1 className="font-bold text-base sm:text-lg leading-tight">EDSA Power Tracker</h1>
              <p className="text-[11px] text-gray-400 hidden sm:block">Freetown, Sierra Leone</p>
            </div>
          </div>
          <button
            onClick={fetchStatus}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/10"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Updated {timeAgo(lastRefresh.toISOString())}</span>
            <span className="sm:hidden">Refresh</span>
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Have Power', count: counts.on,      color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
            { label: 'Power Out',  count: counts.out,     color: 'text-red-400',   bg: 'bg-red-500/10 border-red-500/20' },
            { label: 'Unknown',    count: counts.unknown, color: 'text-gray-400',  bg: 'bg-gray-500/10 border-gray-500/20' },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl border p-4 text-center ${s.bg}`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
              <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search neighbourhood…"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/30"
          />
          <div className="flex gap-2">
            {(['all', 'out', 'on', 'unknown'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                  filter === f
                    ? f === 'out' ? 'bg-red-500 text-white'
                    : f === 'on'  ? 'bg-green-500 text-white'
                    : 'bg-white text-gray-900'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Area Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="area-card animate-pulse h-28 bg-white/5" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filtered.map(area => {
              const meta = STATUS_META[area.status];
              const Icon = meta.icon;
              return (
                <button
                  key={area.name}
                  onClick={() => { setReportModal(area); setReportResult(null); }}
                  className={`area-card text-left border ${meta.card}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1 ${meta.dot}`} />
                    <Icon className={`w-4 h-4 ${meta.text}`} />
                  </div>
                  <p className="font-semibold text-sm leading-tight">{area.name}</p>
                  <p className={`text-xs mt-1 font-medium ${meta.text}`}>{meta.label}</p>
                  {area.reportCount > 0 && (
                    <p className="text-[10px] text-gray-500 mt-1.5">
                      {area.reportCount} report{area.reportCount !== 1 ? 's' : ''} · {timeAgo(area.lastUpdated)}
                    </p>
                  )}
                  {area.reportCount === 0 && (
                    <p className="text-[10px] text-gray-600 mt-1.5">Tap to report</p>
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                No areas match your search.
              </div>
            )}
          </div>
        )}

        {/* Footer note */}
        <p className="text-center text-xs text-gray-600 pb-4">
          Data is crowdsourced. Reports expire after 6 hours. Tap any area to report.
        </p>
      </div>

      {/* Report Modal */}
      {reportModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) { setReportModal(null); setReportResult(null); } }}
        >
          <div className="w-full max-w-sm bg-gray-900 border border-white/15 rounded-3xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Report for</p>
                <h2 className="text-xl font-bold">{reportModal.name}</h2>
              </div>
              <div className={`w-3 h-3 rounded-full ${STATUS_META[reportModal.status].dot}`} />
            </div>

            <p className="text-sm text-gray-400">
              Current status: <span className={`font-semibold ${STATUS_META[reportModal.status].text}`}>{STATUS_META[reportModal.status].label}</span>
            </p>

            {reportResult ? (
              <div className={`rounded-2xl p-4 flex items-start gap-3 ${reportResult.success ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                {reportResult.success
                  ? reportResult.confirmed
                    ? <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                    : <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                  : <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                }
                <div className="text-sm">
                  {reportResult.success ? (
                    reportResult.confirmed
                      ? <p className="text-green-300 font-medium">Status confirmed! Map updated.</p>
                      : <p className="text-yellow-300 font-medium">Report received! Need {reportResult.reportsNeeded} more report{reportResult.reportsNeeded !== 1 ? 's' : ''} to confirm.</p>
                  ) : (
                    <p className="text-red-300">Failed to submit. Please try again.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-300 font-medium">What is the situation right now?</p>
                <button
                  onClick={() => handleReport('out')}
                  disabled={reporting}
                  className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 font-semibold hover:bg-red-500/20 transition-all disabled:opacity-50"
                >
                  <ZapOff className="w-5 h-5" />
                  ⚡ No light in my area
                </button>
                <button
                  onClick={() => handleReport('on')}
                  disabled={reporting}
                  className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-300 font-semibold hover:bg-green-500/20 transition-all disabled:opacity-50"
                >
                  <Zap className="w-5 h-5" />
                  💡 Light is on in my area
                </button>
              </div>
            )}

            {!reportResult && (
              <div className="flex items-start gap-2 bg-white/5 rounded-xl p-3">
                <Megaphone className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-xs text-gray-400">
                  Your report helps everyone in {reportModal.name}. 2+ reports in 30 mins confirms the status.
                </p>
              </div>
            )}

            <button
              onClick={() => { setReportModal(null); setReportResult(null); }}
              className="w-full py-3 text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
