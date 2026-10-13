'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Mail, Users, CheckCircle2, Clock, Download,
  RefreshCw, Search, Loader2, Copy, Check, ExternalLink,
} from 'lucide-react';

interface Signup {
  id: string;
  email: string;
  name: string | null;
  source: string | null;
  notified: boolean;
  createdAt: string;
}

export default function WaitlistPanel() {
  const [signups, setSignups] = useState<Signup[]>([]);
  const [filtered, setFiltered] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendResult, setResendResult] = useState<Record<string, string>>({});

  const loadSignups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/waitlist');
      if (!res.ok) throw new Error('Failed to fetch signups');
      const data = await res.json();
      setSignups(data.signups || []);
      setFiltered(data.signups || []);
    } catch {
      setError('Failed to load signups. Check the ADMIN_SECRET env var.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSignups(); }, [loadSignups]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(signups);
    } else {
      const q = search.toLowerCase();
      setFiltered(signups.filter(
        (s) => s.email.toLowerCase().includes(q) || (s.name || '').toLowerCase().includes(q)
      ));
    }
  }, [search, signups]);

  const copyEmail = (email: string, id: string) => {
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resendLink = async (signup: Signup) => {
    setResendingId(signup.id);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: signup.email, name: signup.name, source: 'admin-resend' }),
      });
      const data = await res.json();
      setResendResult((prev) => ({
        ...prev,
        [signup.id]: res.ok ? '✓ Link resent!' : (data.error || 'Failed'),
      }));
      setTimeout(() => setResendResult((prev) => { const n = { ...prev }; delete n[signup.id]; return n; }), 4000);
    } catch {
      setResendResult((prev) => ({ ...prev, [signup.id]: 'Error' }));
    } finally {
      setResendingId(null);
    }
  };

  const downloadCsv = () => {
    const rows = [
      ['Email', 'Name', 'Source', 'Notified', 'Signed Up'],
      ...filtered.map((s) => [
        s.email,
        s.name || '',
        s.source || '',
        s.notified ? 'Yes' : 'No',
        new Date(s.createdAt).toLocaleString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edsa-waitlist-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const notifiedCount = signups.filter((s) => s.notified).length;

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Users, label: 'Total Signups', value: signups.length, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { icon: CheckCircle2, label: 'Link Sent', value: notifiedCount, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { icon: Clock, label: 'Pending', value: signups.length - notifiedCount, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-2xl border p-4 ${stat.bg}`}>
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Manual Tester Activation Instructions Banner */}
      <div className="bg-amber-950/40 border border-amber-500/30 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Closed Testing Workflow & 15-Minute Activation</span>
        </div>
        <p className="text-xs text-amber-200/90 leading-relaxed">
          When a user signs up, copy their email below and add it to your <strong>Google Play Console</strong> tester list under <em>Release &gt; Testing &gt; Closed testing &gt; Testers</em>.
          Testers are automatically told to <strong>wait at least 15 minutes</strong> for Google Play to activate their access before tapping the links.
        </p>
        <div className="flex flex-wrap gap-2 pt-1 text-xs">
          <a
            href="https://play.google.com/apps/testing/com.bridgetech.edsapowertracker"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-blue-300 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>Join on Web Link</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=com.bridgetech.edsapowertracker"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-emerald-300 font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>Join on Android Link</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://play.google.com/console"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/40 text-white font-semibold flex items-center gap-1.5 transition-colors ml-auto"
          >
            <span>Open Play Console</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by email or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-[#040e40]"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadSignups}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={downloadCsv}
            disabled={filtered.length === 0}
            className="px-4 py-2.5 rounded-xl bg-[#040e40] hover:bg-[#020820] text-white text-sm font-black flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Join page link */}
      <div className="flex items-center gap-3 bg-[#040e40]/10 border border-[#040e40]/25 rounded-2xl px-5 py-3">
        <Mail className="w-4 h-4 text-blue-400 shrink-0" />
        <div className="text-sm text-gray-300 flex-1">
          <span className="font-bold text-white">Share this link</span> with users to collect emails:
          {' '}
          <a
            href="/join"
            target="_blank"
            className="text-blue-400 underline underline-offset-2 hover:text-blue-300 font-mono text-xs"
          >
            /join
          </a>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/join`);
            setCopiedId('link');
            setTimeout(() => setCopiedId(null), 2000);
          }}
          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-bold text-gray-300 flex items-center gap-1 transition-colors"
        >
          {copiedId === 'link' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copiedId === 'link' ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading signups…</span>
        </div>
      ) : error ? (
        <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Mail className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-bold">No signups yet</p>
          <p className="text-xs mt-1">Share the /join link to start collecting emails.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-xs text-gray-400 font-bold uppercase tracking-wider px-5 py-3">Email</th>
                <th className="text-left text-xs text-gray-400 font-bold uppercase tracking-wider px-5 py-3 hidden sm:table-cell">Name</th>
                <th className="text-left text-xs text-gray-400 font-bold uppercase tracking-wider px-5 py-3 hidden md:table-cell">Signed Up</th>
                <th className="text-left text-xs text-gray-400 font-bold uppercase tracking-wider px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((signup) => (
                <tr key={signup.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono text-xs truncate max-w-[180px]">{signup.email}</span>
                      <button
                        onClick={() => copyEmail(signup.email, signup.id)}
                        className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
                      >
                        {copiedId === signup.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell text-gray-300 text-xs">
                    {signup.name || <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-gray-400 text-xs">
                    {new Date(signup.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </td>
                  <td className="px-5 py-3.5">
                    {signup.notified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Link sent
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {resendResult[signup.id] ? (
                      <span className="text-[11px] text-emerald-400 font-bold">{resendResult[signup.id]}</span>
                    ) : (
                      <button
                        onClick={() => resendLink(signup)}
                        disabled={resendingId === signup.id}
                        className="text-xs font-bold text-blue-400 hover:text-blue-300 disabled:opacity-50 flex items-center gap-1 ml-auto transition-colors"
                      >
                        {resendingId === signup.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Mail className="w-3.5 h-3.5" />
                        )}
                        Resend
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t border-white/5 text-xs text-gray-500">
            Showing {filtered.length} of {signups.length} signups
          </div>
        </div>
      )}
    </div>
  );
}
