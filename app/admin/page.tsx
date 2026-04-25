/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Zap, ZapOff, AlertTriangle, Clock, MapPin, Search, CheckCircle, RefreshCw, BarChart3, LucideIcon } from 'lucide-react';

interface Stats {
  totalReports: number;
  totalHazards: number;
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
  }[];
}

interface SidebarItemProps {
  label: string;
  icon: LucideIcon;
  active: boolean;
  onClick: () => void;
  badge?: number;
}

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

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'hazards' | 'feed'>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Unable to load admin statistics right now.');
      }

      const data = await res.json();
      setStats(data);
      setError(null);
    } catch (e) {
      console.error('Failed to fetch admin stats', e);
      setError(e instanceof Error ? e.message : 'Failed to fetch admin stats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, []);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredHazards = useMemo(() => {
    if (!stats) return [];

    return stats.recentHazards.filter((hazard) => {
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
  }, [normalizedSearch, stats]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-yellow-500 animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-gray-900 border-r border-white/10 p-6 space-y-8">
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
        </nav>
      </aside>

      <main className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold capitalize">{activeTab}</h2>
            <p className="text-gray-500 mt-1">Monitoring power and safety across Freetown</p>
          </div>
          <div className="flex items-center gap-4">
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
            <button onClick={fetchStats} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
              <RefreshCw className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Reports', value: stats.totalReports, icon: BarChart3, color: 'text-blue-400' },
                { label: 'Danger Alerts', value: stats.totalHazards, icon: AlertTriangle, color: 'text-red-400' },
                { label: 'Power On Areas', value: stats.areaSummary.filter(a => a.status === 'on').length, icon: Zap, color: 'text-green-400' },
                { label: 'Outage Areas', value: stats.areaSummary.filter(a => a.status === 'out').length, icon: ZapOff, color: 'text-orange-400' },
              ].map(card => (
                <div key={card.label} className="bg-gray-900 border border-white/10 p-6 rounded-3xl space-y-4">
                  <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${card.color}`}>
                    <card.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-4xl font-bold">{card.value}</p>
                    <p className="text-sm text-gray-500 mt-1 font-medium">{card.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-900 border border-white/10 rounded-3xl overflow-hidden">
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
                <div key={hazard.id} className="bg-gray-900 border border-white/10 rounded-3xl overflow-hidden group">
                  <div className="aspect-video relative overflow-hidden">
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
                  </div>
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
                      <div className="flex items-center gap-2 text-xs text-blue-400 font-bold">
                        <MapPin className="w-3 h-3" />
                        {hazard.lat !== null && hazard.lng !== null ? `${hazard.lat.toFixed(4)}, ${hazard.lng.toFixed(4)}` : 'Coordinates unavailable'}
                      </div>
                      <button className="text-xs bg-white text-black font-bold px-3 py-1.5 rounded-lg hover:bg-yellow-500 transition-colors">
                        Mark Resolved
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'feed' && (
          <div className="space-y-4 max-w-4xl">
            {filteredReports.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-gray-900 p-6 text-sm text-gray-400">
                {normalizedSearch ? 'No reports matched your search.' : 'No recent power reports yet.'}
              </div>
            ) : filteredReports.map(report => (
              <div key={report.id} className="bg-gray-900 border border-white/10 p-5 rounded-2xl flex items-center justify-between group">
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
    </div>
  );
}
