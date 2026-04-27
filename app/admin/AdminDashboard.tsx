/* eslint-disable @next/next/no-img-element */
'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Zap, ZapOff, AlertTriangle, Clock, MapPin, Search, CheckCircle, RefreshCw, BarChart3, LucideIcon, X, Eye, Download, LogOut, MessageCircleMore, Users } from 'lucide-react';

interface Stats {
  totalReports: number;
  totalHazards: number;
  totalResolvedHazards: number;
  areaSummary: {
    name: string;
    status: 'on' | 'out' | 'unknown';
    reportCount: number;
    confidence: number;
    lastUpdated: string | null;
  }[];
  recentReports: {
    id: string;
    area: string;
    status: string;
    reportedAt: string;
    deviceId: string | null;
    reporterLat: number | null;
    reporterLng: number | null;
  }[];
  recentHazards: {
    id: string;
    type: string;
    description: string | null;
    streetName: string | null;
    houseNumber: string | null;
    areaName: string | null;
    imageUrl: string | null;
    area: string;
    reportedAt: string;
    lat: number | null;
    lng: number | null;
    resolved: boolean;
    resolvedBy: string | null;
    resolvedAt: string | null;
  }[];
}

interface SidebarItemProps {
  label: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
  badge?: number;
}

type HazardItem = Stats['recentHazards'][number];
type DashboardTab = 'overview' | 'hazards' | 'feed';

function SidebarItem({ label, icon: Icon, active, onClick, badge }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
        active ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:bg-white/5'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5" />
        <span className="font-bold text-sm">{label}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${active ? 'bg-black text-white' : 'bg-red-500 text-white'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${Math.max(diff, 0)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function formatCoordinates(lat: number | null, lng: number | null): string {
  if (lat === null || lng === null) {
    return 'Coordinates unavailable';
  }

  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export default function AdminDashboard({ adminEmail, isSuperAdmin }: { adminEmail: string, isSuperAdmin?: boolean }) {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [selectedHazardId, setSelectedHazardId] = useState<string | null>(null);
  const [resolvingHazardId, setResolvingHazardId] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [hazardFilter, setHazardFilter] = useState<'active' | 'resolved' | 'all'>('all');

  const fetchStats = useCallback(async (options?: { initial?: boolean }) => {
    const isInitial = options?.initial ?? false;
    if (isInitial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const res = await fetch('/api/admin/stats', { cache: 'no-store' });
      if (res.status === 401) {
        router.push('/admin/login');
        router.refresh();
        return;
      }

      if (!res.ok) {
        throw new Error('Unable to load admin statistics right now.');
      }

      const data = await res.json();
      setStats(data);
      setError(null);
      setLastUpdated(new Date().toISOString());
    } catch (e) {
      console.error('Failed to fetch admin stats', e);
      setError(e instanceof Error ? e.message : 'Failed to fetch admin stats.');
    } finally {
      if (isInitial) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }, [router]);

  useEffect(() => {
    void fetchStats({ initial: true });
    const interval = setInterval(() => {
      void fetchStats();
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredHazards = useMemo(() => {
    if (!stats) return [];

    return stats.recentHazards.filter((hazard) => {
      // Apply status filter
      if (hazardFilter === 'active' && hazard.resolved) return false;
      if (hazardFilter === 'resolved' && !hazard.resolved) return false;

      if (!normalizedSearch) return true;

      return [
        hazard.type,
        hazard.area,
        hazard.areaName,
        hazard.streetName,
        hazard.description,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch));
    });
  }, [normalizedSearch, stats, hazardFilter]);

  const filteredReports = useMemo(() => {
    if (!stats) return [];

    return stats.recentReports.filter((report) => {
      if (!normalizedSearch) return true;

      return [
        report.area,
        report.status,
        report.deviceId,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch));
    });
  }, [normalizedSearch, stats]);

  const selectedHazard = useMemo(() => {
    if (!stats || !selectedHazardId) {
      return null;
    }

    return stats.recentHazards.find((hazard) => hazard.id === selectedHazardId) ?? null;
  }, [selectedHazardId, stats]);

  const handleDownloadOverview = useCallback(() => {
    window.location.href = '/api/admin/export';
  }, []);

  const handleShareWhatsApp = useCallback(() => {
    if (!stats) {
      return;
    }

    const origin = window.location.origin;
    const shareText = [
      'EDSA Admin Overview',
      `Total Reports: ${stats.totalReports}`,
      `Active Hazards: ${stats.totalHazards}`,
      `Power On Areas: ${stats.areaSummary.filter((area) => area.status === 'on').length}`,
      `Outage Areas: ${stats.areaSummary.filter((area) => area.status === 'out').length}`,
      `Dashboard: ${origin}/admin`,
    ].join('\n');

    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
  }, [stats]);

  const handleLogout = useCallback(async () => {
    setSigningOut(true);
    setError(null);

    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } finally {
      router.push('/admin/login');
      router.refresh();
      setSigningOut(false);
    }
  }, [router]);

  const handleResolveHazard = useCallback(async (hazard: HazardItem) => {
    const confirmed = window.confirm(`Mark "${hazard.type}" in ${hazard.areaName || hazard.area} as resolved?`);
    if (!confirmed) {
      return;
    }

    setResolvingHazardId(hazard.id);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/hazards/${hazard.id}`, {
        method: 'DELETE',
      });
      if (res.status === 401) {
        router.push('/admin/login');
        router.refresh();
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to resolve this hazard report.');
      }

      setStats((currentStats) => {
        if (!currentStats) {
          return currentStats;
        }

        return {
          ...currentStats,
          totalHazards: Math.max(0, currentStats.totalHazards - 1),
          // Update the specific hazard to show it's resolved, instead of completely removing it
          recentHazards: currentStats.recentHazards.map((item) =>
            item.id === hazard.id
              ? { ...item, resolved: true, resolvedBy: data.hazard?.resolvedBy || adminEmail, resolvedAt: new Date().toISOString() }
              : item
          ),
        };
      });
      setSelectedHazardId((currentId) => (currentId === hazard.id ? currentId : currentId)); // Keep expanded view open if they are looking at it
      setSuccessMessage(data.message || 'Hazard marked as resolved.');
      setLastUpdated(new Date().toISOString());
    } catch (e) {
      console.error('Failed to resolve hazard', e);
      setError(e instanceof Error ? e.message : 'Failed to resolve hazard.');
    } finally {
      setResolvingHazardId(null);
    }
  }, [router, adminEmail]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-yellow-500 animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-gray-900 p-6 space-y-4 text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
          <div className="space-y-2">
            <h1 className="text-xl font-bold">Admin data unavailable</h1>
            <p className="text-sm text-gray-400">{error || 'The dashboard could not load right now.'}</p>
          </div>
          <button
            onClick={() => void fetchStats({ initial: true })}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative text-white selection:bg-yellow-500/30 overflow-x-hidden">
      {/* Background Image Layer */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: 'url("/assets/bg-action.png")',
          filter: 'brightness(0.2) saturate(1.2)',
        }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-transparent via-[#020617]/90 to-[#020617]" />

      <div className="relative z-10 min-h-screen flex flex-col md:flex-row">
        <aside className="w-full md:w-64 bg-black/40 backdrop-blur-3xl border-r border-white/10 p-6 space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
            <Zap className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">EDSA Admin</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Realtime Monitor</p>
          </div>
        </div>

        <nav className="space-y-2">
          <SidebarItem label="Overview" icon={BarChart3} active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <SidebarItem label="Dangers" icon={AlertTriangle} active={activeTab === 'hazards'} onClick={() => setActiveTab('hazards')} badge={stats.totalHazards} />
          <SidebarItem label="Report Feed" icon={Clock} active={activeTab === 'feed'} onClick={() => setActiveTab('feed')} />
          
          {isSuperAdmin && (
            <button
              onClick={() => router.push('/admin/manage')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-400 hover:bg-white/5"
            >
              <Users className="w-5 h-5" />
              <span className="font-bold text-sm">Manage Admins</span>
            </button>
          )}
        </nav>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-gray-500 font-bold">Signed in as</p>
            <p className="mt-2 text-sm font-semibold text-white break-all">{adminEmail}</p>
          </div>
          <button
            onClick={() => void handleLogout()}
            disabled={signingOut}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-60"
          >
            <LogOut className="w-4 h-4" />
            {signingOut ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold capitalize">{activeTab}</h2>
            <p className="text-gray-500 mt-1">Monitoring power and safety across Freetown</p>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="hidden md:block text-right text-xs text-gray-500">
              <p>Last synced {timeAgo(lastUpdated)}</p>
              <p>{lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Waiting for sync'}</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search area..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-gray-900 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-yellow-500/50 transition-all w-full md:w-64"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {activeTab === 'overview' ? (
                <>
                  <button
                    onClick={handleDownloadOverview}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-500/10 px-3 py-2.5 text-sm font-semibold text-blue-100 hover:bg-blue-500/20 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Download Excel
                  </button>
                  <button
                    onClick={handleShareWhatsApp}
                    className="inline-flex items-center gap-2 rounded-xl bg-green-500/10 px-3 py-2.5 text-sm font-semibold text-green-100 hover:bg-green-500/20 transition-all"
                  >
                    <MessageCircleMore className="w-4 h-4" />
                    Share on WhatsApp
                  </button>
                </>
              ) : null}
              <button
                onClick={() => void fetchStats()}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2.5 text-sm text-gray-200 hover:bg-white/10 transition-all disabled:opacity-60"
              >
                <RefreshCw className={`w-5 h-5 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-200">
            {successMessage}
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Reports', value: stats.totalReports, icon: BarChart3, color: 'text-blue-400' },
                { label: 'Active Dangers', value: stats.totalHazards, icon: AlertTriangle, color: 'text-red-400' },
                { label: 'Resolved Issues', value: stats.totalResolvedHazards, icon: CheckCircle, color: 'text-green-400' },
                { label: 'Power On Areas', value: stats.areaSummary.filter(a => a.status === 'on').length, icon: Zap, color: 'text-green-400' },
                { label: 'Outage Areas', value: stats.areaSummary.filter(a => a.status === 'out').length, icon: ZapOff, color: 'text-orange-400' },
              ].map(card => (
                <div key={card.label} className="bg-white/[0.03] backdrop-blur-md border border-white/10 p-6 rounded-[2rem] space-y-4 hover:bg-white/[0.05] transition-all">
                  <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${card.color}`}>
                    <card.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-4xl font-bold tracking-tight">{card.value}</p>
                    <p className="text-sm text-gray-500 mt-1 font-bold uppercase tracking-widest">{card.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-bold">Community Status</h3>
                <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded italic">Requires 3 reports to update</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="text-[10px] uppercase tracking-widest text-gray-500 font-bold bg-gray-950/50">
                    <tr>
                      <th className="px-6 py-4">Area</th>
                      <th className="px-6 py-4">Current Status</th>
                      <th className="px-6 py-4">Reports (30m)</th>
                      <th className="px-6 py-4">Confidence</th>
                      <th className="px-6 py-4 text-right">Last Report</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stats.areaSummary
                      .filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map(area => (
                        <tr key={area.name} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 font-bold">{area.name}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                              area.status === 'on' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                              area.status === 'out' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                              'bg-gray-500/10 text-gray-400 border-gray-500/20'
                            }`}>
                              {area.status === 'on' ? <Zap className="w-3 h-3" /> : area.status === 'out' ? <ZapOff className="w-3 h-3" /> : <RefreshCw className="w-3 h-3" />}
                              {area.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{area.reportCount}</span>
                              <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${area.reportCount >= 3 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${Math.min(100, (area.reportCount / 3) * 100)}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs">{area.confidence}%</span>
                          </td>
                          <td className="px-6 py-4 text-right text-gray-500 text-xs">
                            {area.lastUpdated ? new Date(area.lastUpdated).toLocaleTimeString() : '—'}
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hazards' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl w-fit">
              {(['all', 'active', 'resolved'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setHazardFilter(f)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                    hazardFilter === f ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHazards.length === 0 ? (
              <div className="col-span-full py-20 text-center space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto opacity-20" />
                <p className="text-gray-500 font-medium">
                  {normalizedSearch ? 'No hazard reports matched your search.' : 'No active danger reports. Everything looks safe.'}
                </p>
              </div>
            ) : (
              filteredHazards.map(hazard => (
                <div key={hazard.id} className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden group shadow-2xl">
                  <button
                    onClick={() => setSelectedHazardId(hazard.id)}
                    className="aspect-video relative overflow-hidden block w-full text-left"
                  >
                    {hazard.imageUrl ? (
                      <img src={hazard.imageUrl} alt={hazard.type} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-gray-950 flex items-center justify-center text-gray-500 text-sm">
                        No photo provided
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="bg-red-600 text-white text-[10px] font-bold uppercase px-2 py-1 rounded-lg flex items-center gap-1.5 shadow-xl">
                        <AlertTriangle className="w-3 h-3" />
                        {hazard.type}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-colors flex items-end justify-end p-4">
                      <span className="inline-flex items-center gap-2 rounded-lg bg-black/70 px-3 py-2 text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye className="w-3.5 h-3.5" />
                        View details
                      </span>
                    </div>
                  </button>
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-lg">{hazard.areaName || hazard.area}</h4>
                      {(hazard.streetName || hazard.houseNumber) && (
                        <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-1 rounded-md text-right">
                          {hazard.houseNumber} {hazard.streetName}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(hazard.reportedAt).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-400 line-clamp-2 italic">&quot;{hazard.description || 'No description provided.'}&quot;</p>
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                      <button
                        onClick={() => setSelectedHazardId(hazard.id)}
                        className="flex items-center gap-2 text-xs text-blue-400 font-bold hover:text-blue-300"
                      >
                        <MapPin className="w-3 h-3" />
                        {formatCoordinates(hazard.lat, hazard.lng)}
                      </button>
                      
                      {hazard.resolved ? (
                        <div className="text-xs text-green-400 font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span className="max-w-[120px] truncate" title={`Resolved by ${hazard.resolvedBy || 'Admin'}`}>
                            Resolved by {hazard.resolvedBy || 'Admin'}
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => void handleResolveHazard(hazard)}
                          disabled={resolvingHazardId === hazard.id}
                          className="inline-flex items-center gap-2 text-xs bg-white text-black font-bold px-3 py-1.5 rounded-lg hover:bg-yellow-500 transition-colors disabled:opacity-60"
                        >
                          {resolvingHazardId === hazard.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                          {resolvingHazardId === hazard.id ? 'Resolving...' : 'Mark Resolved'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        )}

        {activeTab === 'feed' && (
          <div className="space-y-4 max-w-4xl">
            {filteredReports.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-gray-900 p-6 text-sm text-gray-400">
                {normalizedSearch ? 'No reports matched your search.' : 'No recent power reports yet.'}
              </div>
            ) : filteredReports.map(report => (
              <div key={report.id} className="bg-black/20 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex items-center justify-between group hover:bg-white/[0.05] transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${report.status === 'on' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {report.status === 'on' ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-bold">{report.area}</p>
                    <p className="text-xs text-gray-500">
                      Device: {report.deviceId ? `${report.deviceId.substring(0, 8)}...` : 'Anonymous'} · {new Date(report.reportedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${report.status === 'on' ? 'border-green-500/20 text-green-500' : 'border-red-500/20 text-red-500'}`}>
                    Power {report.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {selectedHazard && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 md:p-4">
          <div className="w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#020617] shadow-2xl custom-scrollbar">
            <div className="sticky top-0 z-20 bg-[#020617]/80 backdrop-blur-xl flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-red-400 font-black">{selectedHazard.type}</p>
                <h3 className="text-xl font-bold text-white">{selectedHazard.areaName || selectedHazard.area}</h3>
              </div>
              <button
                onClick={() => setSelectedHazardId(null)}
                className="rounded-xl p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="bg-black/40 min-h-[240px] md:min-h-[320px] flex items-center justify-center border-b lg:border-b-0 lg:border-r border-white/10">
                {selectedHazard.imageUrl ? (
                  <img
                    src={selectedHazard.imageUrl}
                    alt={selectedHazard.type}
                    className="w-full h-auto max-h-[40vh] lg:max-h-[70vh] object-contain p-2"
                  />
                ) : (
                  <div className="text-center text-gray-600 p-8">
                    <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-xs font-bold uppercase tracking-widest">No evidence photo provided</p>
                  </div>
                )}
              </div>

              <div className="p-6 space-y-5 lg:overflow-y-auto lg:max-h-[70vh]">
                <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2">
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">Reported</p>
                  <p className="text-sm text-white">{new Date(selectedHazard.reportedAt).toLocaleString()}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-1">
                    <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">Area</p>
                    <p className="text-sm text-white">{selectedHazard.area}</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-1">
                    <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">Community</p>
                    <p className="text-sm text-white">{selectedHazard.areaName || 'Not provided'}</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-1">
                    <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">Street name</p>
                    <p className="text-sm text-white">{selectedHazard.streetName || 'Not provided'}</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-1">
                    <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">House number</p>
                    <p className="text-sm text-white">{selectedHazard.houseNumber || 'Not provided'}</p>
                  </div>
                  {selectedHazard.type === 'Stolen Meter' && (
                    <>
                      <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/20 p-4 space-y-1">
                        <p className="text-xs uppercase tracking-widest text-yellow-500/60 font-bold">Meter Number</p>
                        <p className="text-sm text-white font-mono">{selectedHazard.meterNumber || 'Unknown'}</p>
                      </div>
                      <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/20 p-4 space-y-1">
                        <p className="text-xs uppercase tracking-widest text-yellow-500/60 font-bold">Contact Phone</p>
                        <p className="text-sm text-white font-bold">{selectedHazard.contactPhone || 'Unknown'}</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2">
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">Description</p>
                  <p className="text-sm text-gray-200 whitespace-pre-wrap">
                    {selectedHazard.description || 'No description provided.'}
                  </p>
                </div>

                <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2">
                  <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">Coordinates</p>
                  <p className="text-sm text-gray-200">{formatCoordinates(selectedHazard.lat, selectedHazard.lng)}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  {selectedHazard.resolved ? (
                    <div className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm font-bold text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      Resolved by {selectedHazard.resolvedBy || 'Admin'}
                    </div>
                  ) : (
                    <button
                      onClick={() => void handleResolveHazard(selectedHazard)}
                      disabled={resolvingHazardId === selectedHazard.id}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-500 px-4 py-3 text-sm font-bold text-black hover:bg-yellow-400 disabled:opacity-60"
                    >
                      {resolvingHazardId === selectedHazard.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                      {resolvingHazardId === selectedHazard.id ? 'Resolving...' : 'Mark Resolved'}
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedHazardId(null)}
                    className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-semibold text-gray-200 hover:bg-white/5"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
