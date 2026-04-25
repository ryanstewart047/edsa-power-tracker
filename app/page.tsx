'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Zap, ZapOff, HelpCircle, RefreshCw, MapPin, Loader2, Camera, AlertTriangle, X } from 'lucide-react';
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

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getDeviceId() {
  if (typeof window === 'undefined') return null;
  let id = localStorage.getItem('edsa_device_id');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('edsa_device_id', id);
  }
  return id;
}

export default function Home() {
  const [areas, setAreas] = useState<AreaWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'out' | 'on' | 'unknown'>('all');
  const [reportModal, setReportModal] = useState<AreaWithStatus | null>(null);
  const [hazardModal, setHazardModal] = useState<AreaWithStatus | null>(null);
  const [reporting, setReporting] = useState(false);
  const [reportResult, setReportResult] = useState<{ success: boolean; confirmed: boolean; reportsNeeded: number; message?: string } | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Hazard Report State
  const [hazardType, setHazardType] = useState('Falling Pole');
  const [hazardDesc, setHazardDesc] = useState('');
  const [hazardStreet, setHazardStreet] = useState('');
  const [hazardHouse, setHazardHouse] = useState('');
  const [hazardAreaName, setHazardAreaName] = useState('');
  const [hazardImage, setHazardImage] = useState<string | null>(null);

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
    const interval = setInterval(fetchStatus, 60_000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const requestLocation = useCallback(() => {
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLoading(false);
      },
      () => {
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    requestLocation();
    // Sync location every 15 seconds for real-time area tracking
    const locationInterval = setInterval(requestLocation, 15_000);
    return () => clearInterval(locationInterval);
  }, [requestLocation]);

  const handleReport = async (status: 'on' | 'out') => {
    if (!reportModal || !location) return;

    setReporting(true);
    setReportResult(null);
    
    try {
      const res = await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          area: reportModal.name, 
          status,
          deviceId: getDeviceId(),
          lat: location.lat,
          lng: location.lng
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setReportResult({ 
          success: true, 
          confirmed: data.confirmed, 
          reportsNeeded: data.reportsNeeded 
        });
        fetchStatus();
        setTimeout(() => { setReportModal(null); setReportResult(null); }, 3000);
      } else {
        setReportResult({ 
          success: false, 
          confirmed: false, 
          reportsNeeded: 0,
          message: data.message || data.error || 'Submission blocked.'
        });
      }
    } catch {
      setReportResult({ 
        success: false, 
        confirmed: false, 
        reportsNeeded: 0,
        message: 'Network error. Please try again.'
      });
    } finally {
      setReporting(false);
    }
  };

  const handleHazardReport = async () => {
    if (!hazardModal || !location) return;

    if (!hazardAreaName.trim()) {
      setReportResult({ success: false, confirmed: false, reportsNeeded: 0, message: 'Please enter the Area/Community Name.' });
      return;
    }

    if (hazardType === 'Illegal Connection' && (!hazardStreet.trim() || !hazardHouse.trim())) {
      setReportResult({ success: false, confirmed: false, reportsNeeded: 0, message: 'Street Name and House Number are mandatory for wrong connections.' });
      return;
    }

    setReporting(true);
    
    try {
      const res = await fetch('/api/hazards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          area: hazardModal.name,
          type: hazardType,
          description: hazardDesc,
          streetName: hazardStreet,
          houseNumber: hazardHouse,
          areaName: hazardAreaName,
          imageUrl: hazardImage || 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=300', // Placeholder
          deviceId: getDeviceId(),
          lat: location.lat,
          lng: location.lng
        }),
      });

      if (res.ok) {
        setReportResult({ success: true, confirmed: true, reportsNeeded: 0 });
        setTimeout(() => { setHazardModal(null); setReportResult(null); setHazardDesc(''); setHazardStreet(''); setHazardHouse(''); setHazardAreaName(''); setHazardImage(null); }, 3000);
      } else {
        const data = await res.json();
        setReportResult({ success: false, confirmed: false, reportsNeeded: 0, message: data.message || 'Failed to report.' });
      }
    } catch {
      setReportResult({ success: false, confirmed: false, reportsNeeded: 0, message: 'Network error.' });
    } finally {
      setReporting(false);
    }
  };

  const areasWithProximity = useMemo(() => {
    if (!location) {
      return areas.map(area => ({ ...area, isNearby: false, distance: null, isClosest: false }));
    }
    
    // First calculate distances to all areas
    const withDist = areas.map(area => ({
      ...area,
      distance: calculateDistance(location.lat, location.lng, area.lat, area.lng)
    }));
    
    // Find the closest area (only one area is closest)
    const minDistance = Math.min(...withDist.map(a => a.distance));
    
    return withDist.map(area => {
      const isClosest = area.distance === minDistance;
      // For power reporting: ONLY the closest area can be reported
      const isNearby = isClosest;
      return { ...area, isNearby, distance: area.distance, isClosest };
    });
  }, [areas, location]);

  const closestArea = useMemo(() => {
    return areasWithProximity.find(a => a.isClosest) || null;
  }, [areasWithProximity]);

  const filtered = areasWithProximity.filter(a => {
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
    <main className="min-h-screen bg-gray-950 text-white">
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
          <div className="flex items-center gap-3">
            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] uppercase tracking-wider font-bold ${
              location ? 'bg-green-500/5 border-green-500/20 text-green-400' : 'bg-white/5 border-white/10 text-gray-500'
            }`}>
              {locationLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
              {location ? 'Verified' : 'Locating...'}
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
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Your Reporting Area - Shows ONLY Closest Area */}
        {closestArea ? (
          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/30 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-yellow-400">Your Current Area</h2>
              <div className="flex items-center gap-1.5 text-[10px] text-yellow-600 bg-yellow-500/20 px-2.5 py-1 rounded-full font-bold">
                <MapPin className="w-3 h-3" />
                LIVE TRACKING
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-white">{closestArea.name}</h3>
                <p className={`text-sm font-medium ${STATUS_META[closestArea.status].text}`}>{STATUS_META[closestArea.status].label}</p>
                <p className="text-xs text-gray-400 mt-2">You can only report for your actual location. Move to a different area to report there.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setReportModal(closestArea); setReportResult(null); }}
                  className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Report Status
                </button>
                <button
                  onClick={() => { setHazardModal(closestArea); setReportResult(null); }}
                  className="flex-1 py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold transition-all flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Report Hazard
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900/50 border border-white/10 rounded-3xl p-6 text-center">
            <p className="text-gray-400 font-medium">Waiting for location... Enable GPS to report</p>
          </div>
        )}

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

        <div className="border-t border-white/5 pt-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">All Areas Reference</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {loading ? (
              Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />
              ))
            ) : (
              filtered.map(area => {
                const meta = STATUS_META[area.status];
                const Icon = meta.icon;
                const canReport = area.isClosest;

                return (
                  <div key={area.name} className={`relative group p-4 rounded-2xl border transition-all duration-300 ${meta.card} ${!canReport ? 'opacity-40' : ''}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className={`w-3 h-3 rounded-full mt-1 ${meta.dot}`} />
                      <Icon className={`w-5 h-5 ${meta.text}`} />
                    </div>
                    <h3 className="font-bold text-lg">{area.name}</h3>
                    <p className={`text-sm font-medium ${meta.text}`}>{meta.label}</p>
                    
                    <div className="mt-4 flex items-center gap-2">
                      <button
                        onClick={() => { if (canReport) { setReportModal(area); setReportResult(null); } }}
                        disabled={!canReport}
                        className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold transition-all disabled:opacity-0"
                      >
                        Report Status
                      </button>
                      <button
                        onClick={() => { if (canReport) { setHazardModal(area); setReportResult(null); } }}
                        disabled={!canReport}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 disabled:opacity-0 transition-all"
                        title={canReport ? "Report Hazard" : "Move to this area to report"}
                      >
                        <AlertTriangle className="w-4 h-4" />
                    </button>
                  </div>

                  {!canReport && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-950/40 backdrop-blur-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[10px] bg-black/80 px-2 py-1 rounded text-gray-400 uppercase tracking-widest font-bold">Move to report here</p>
                    </div>
                  )}
                </div>
              )
            })
          )}
          </div>
        </div>
      </div>

      {/* Report Status Modal */}
      {reportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Report Status</h2>
              <button onClick={() => setReportModal(null)} className="p-2 hover:bg-white/5 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            {reportResult ? (
              <div className={`p-4 rounded-2xl border ${reportResult.success ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                <p className="font-bold">{reportResult.success ? 'Report Received' : 'Failed'}</p>
                <p className="text-sm mt-1">{reportResult.message || (reportResult.confirmed ? 'Status updated!' : `Waiting for ${reportResult.reportsNeeded} more reports.`)}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-400">Your report for <span className="text-white font-bold">{reportModal.name}</span> helps verify the local power status.</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleReport('on')} className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-all">
                    <Zap className="w-8 h-8 text-green-400" />
                    <span className="font-bold text-green-400">Power ON</span>
                  </button>
                  <button onClick={() => handleReport('out')} className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all">
                    <ZapOff className="w-8 h-8 text-red-400" />
                    <span className="font-bold text-red-400">Power OUT</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hazard Report Modal */}
      {hazardModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Report Hazard</h2>
              <button onClick={() => setHazardModal(null)} className="p-2 hover:bg-white/5 rounded-full"><X className="w-5 h-5" /></button>
            </div>

            {reportResult ? (
              <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400">
                <p className="font-bold">Hazard Reported!</p>
                <p className="text-sm mt-1">Thank you. EDSA and authorities will be notified.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider font-bold text-gray-500">Hazard Type</label>
                  <select 
                    value={hazardType} 
                    onChange={e => setHazardType(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  >
                    <option value="Falling Pole">Falling Pole</option>
                    <option value="Sparking Cable">Sparking Cable</option>
                    <option value="Transformer Issue">Transformer Issue</option>
                    <option value="Illegal Connection">Illegal Connection</option>
                    <option value="Other Danger">Other Danger</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider font-bold text-gray-500">Specific Area Name <span className="text-red-400">*</span></label>
                  <input
                    value={hazardAreaName}
                    onChange={e => setHazardAreaName(e.target.value)}
                    placeholder="e.g. Jui Junction"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider font-bold text-gray-500">Street Name {hazardType === 'Illegal Connection' && <span className="text-red-400">*</span>}</label>
                    <input
                      value={hazardStreet}
                      onChange={e => setHazardStreet(e.target.value)}
                      placeholder="e.g. Main St"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider font-bold text-gray-500">House No {hazardType === 'Illegal Connection' && <span className="text-red-400">*</span>}</label>
                    <input
                      value={hazardHouse}
                      onChange={e => setHazardHouse(e.target.value)}
                      placeholder="e.g. 12B"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider font-bold text-gray-500">Description</label>
                  <textarea
                    value={hazardDesc}
                    onChange={e => setHazardDesc(e.target.value)}
                    placeholder="Briefly describe the danger..."
                    className="w-full h-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-500 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider font-bold text-gray-500">Evidence (Photo)</label>
                  <div className="relative group cursor-pointer h-32 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center hover:bg-white/5 transition-all">
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setHazardImage(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    {hazardImage ? (
                      <img src={hazardImage} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <>
                        <Camera className="w-8 h-8 text-gray-500 group-hover:text-red-400 transition-colors" />
                        <span className="text-[10px] mt-2 text-gray-500 font-bold uppercase">Snap or Upload</span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleHazardReport}
                  disabled={reporting || !location}
                  className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                >
                  {reporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <MegaphoneIcon className="w-5 h-5" />}
                  Submit Danger Report
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function MegaphoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
  )
}
