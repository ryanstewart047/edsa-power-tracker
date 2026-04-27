/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Zap, ZapOff, HelpCircle, RefreshCw, MapPin, Loader2, Camera, AlertTriangle, X, ChevronDown, ArrowLeft } from 'lucide-react';
import { AreaWithStatus, calculateDistanceKm, REPORTING_TOLERANCE_KM } from '@/lib/areas';
import LocationOnboarding from '@/components/LocationOnboarding';

const PRIMARY_AREA_BIAS_KM = 5.0; // If GPS is within 5km of primary area, trust the user choice more.

import {
  GEOLOCATION_MAXIMUM_AGE_MS,
  GEOLOCATION_TIMEOUT_MS,
  GPS_WARNING_ACCURACY_METERS,
  HAZARD_TYPES,
  HazardType,
  MAX_REPORTING_ACCURACY_METERS,
} from '@/lib/reporting';

const STATUS_META = {
  on:      { label: 'Power ON',  icon: Zap,         dot: 'bg-green-400', ring: 'ring-green-500/30', card: 'border-green-500/30 bg-green-500/5',  text: 'text-green-400' },
  out:     { label: 'Power OUT', icon: ZapOff,       dot: 'bg-red-400 animate-ping-slow', ring: 'ring-red-500/30', card: 'border-red-500/30 bg-red-500/5',    text: 'text-red-400' },
  unknown: { label: 'Unknown',   icon: HelpCircle,   dot: 'bg-gray-500',  ring: 'ring-gray-500/20', card: 'border-white/10 bg-white/5',            text: 'text-gray-400' },
};

type LocationSnapshot = {
  lat: number;
  lng: number;
  accuracy: number | null;
  capturedAt: string;
};

type SubmissionResult = {
  success: boolean;
  confirmed: boolean;
  reportsNeeded: number;
  message: string;
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'No data yet';
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 0) return 'Just now';
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function formatAccuracy(accuracy: number | null): string {
  if (accuracy === null) return 'GPS locked';
  return `${Math.round(accuracy)}m accuracy`;
}

function getGeolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location permission was denied. Enable GPS access in your browser settings to submit reports.';
    case error.POSITION_UNAVAILABLE:
      return 'Your location could not be determined right now. Try moving to a clearer spot.';
    case error.TIMEOUT:
      return 'Location lookup timed out. Refresh GPS and try again.';
    default:
      return 'Unable to verify your location right now.';
  }
}

function getDeviceId() {
  if (typeof window === 'undefined') return null;
  let id = localStorage.getItem('edsa_device_id');
  if (!id) {
    id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? `dev_${crypto.randomUUID()}`
      : `dev_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem('edsa_device_id', id);
  }
  return id;
}

export default function Home() {
  const [areas, setAreas] = useState<AreaWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'out' | 'on' | 'unknown'>('all');
  const [reportModal, setReportModal] = useState<AreaWithStatus | null>(null);
  const [hazardModal, setHazardModal] = useState<AreaWithStatus | null>(null);
  const [reporting, setReporting] = useState(false);
  const [reportResult, setReportResult] = useState<SubmissionResult | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [location, setLocation] = useState<LocationSnapshot | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showCommunities, setShowCommunities] = useState(true);
  const [primaryArea, setPrimaryArea] = useState<string | null>(null);

  useEffect(() => {
    // Load primary area from local storage
    const saved = localStorage.getItem('edsa_primary_area');
    if (saved) setPrimaryArea(saved);
  }, []);

  // Hazard Report State
  const [hazardType, setHazardType] = useState<HazardType>(HAZARD_TYPES[0]);
  const [hazardDesc, setHazardDesc] = useState('');
  const [hazardStreet, setHazardStreet] = useState('');
  const [hazardHouse, setHazardHouse] = useState('');
  const [hazardAreaName, setHazardAreaName] = useState('');
  const [hazardImage, setHazardImage] = useState<string | null>(null);
  const [meterNumber, setMeterNumber] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Unable to load the latest area status right now.');
      }

      const data = await res.json();
      setAreas(data);
      setLastRefresh(new Date());
      setStatusError(null);
    } catch (e) {
      console.error('Failed to fetch status', e);
      setStatusError(e instanceof Error ? e.message : 'Failed to fetch status.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 60_000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleLocationSuccess = useCallback((pos: GeolocationPosition) => {
    setLocation({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null,
      capturedAt: new Date().toISOString(),
    });
    setLocationError(null);
    setLocationLoading(false);
  }, []);

  const handleLocationError = useCallback((error: GeolocationPositionError) => {
    setLocationLoading(false);
    setLocationError(getGeolocationErrorMessage(error));
  }, []);

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError('Geolocation is not supported on this device.');
      setLocationLoading(false);
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      handleLocationSuccess,
      (error) => {
        const canRetryWithLowerAccuracy =
          error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE;

        if (!canRetryWithLowerAccuracy) {
          handleLocationError(error);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          handleLocationSuccess,
          (fallbackError) => {
            setLocationLoading(false);
            setLocationError(
              `${getGeolocationErrorMessage(fallbackError)} Try moving outdoors or enabling precise location for your browser.`,
            );
          },
          {
            enableHighAccuracy: false,
            timeout: GEOLOCATION_TIMEOUT_MS * 2,
            maximumAge: GEOLOCATION_MAXIMUM_AGE_MS * 2,
          },
        );
      },
      {
        enableHighAccuracy: true,
        timeout: GEOLOCATION_TIMEOUT_MS,
        maximumAge: GEOLOCATION_MAXIMUM_AGE_MS,
      },
    );
  }, [handleLocationError, handleLocationSuccess]);

  useEffect(() => {
    requestLocation();
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return undefined;
    }

    const watchId = navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleLocationError,
      {
        enableHighAccuracy: true,
        timeout: GEOLOCATION_TIMEOUT_MS,
        maximumAge: GEOLOCATION_MAXIMUM_AGE_MS,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [handleLocationError, handleLocationSuccess, requestLocation]);

  const closeReportModal = useCallback(() => {
    setReportModal(null);
    setReportResult(null);
  }, []);

  const resetHazardForm = useCallback(() => {
    setHazardType(HAZARD_TYPES[0]);
    setHazardDesc('');
    setHazardStreet('');
    setHazardHouse('');
    setHazardAreaName('');
    setHazardImage(null);
    setMeterNumber('');
    setContactPhone('');
  }, []);

  const closeHazardModal = useCallback(() => {
    setHazardModal(null);
    setReportResult(null);
    resetHazardForm();
  }, [resetHazardForm]);

  const locationAccurateEnough = useMemo(() => {
    if (!location) {
      return false;
    }

    return location.accuracy === null || location.accuracy <= MAX_REPORTING_ACCURACY_METERS;
  }, [location]);

  const locationHelpMessage = useMemo(() => {
    if (locationError) {
      return locationError;
    }

    if (!location) {
      return 'Enable GPS to verify your reporting area.';
    }

    if (!locationAccurateEnough) {
      return `Your GPS signal is too broad (${formatAccuracy(location.accuracy)}). Refresh your location or move outdoors before reporting.`;
    }

    return null;
  }, [location, locationAccurateEnough, locationError]);

  const handleReport = useCallback(async (status: 'on' | 'out') => {
    if (!reportModal) {
      return;
    }

    if (!location || !locationAccurateEnough) {
      setReportResult({
        success: false,
        confirmed: false,
        reportsNeeded: 0,
        message: locationHelpMessage ?? 'We need a reliable GPS fix before you can submit a report.',
      });
      return;
    }

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
        // Behavioral Learning: Update primary area if user reports for a specific area
        localStorage.setItem('edsa_primary_area', reportModal.name);
        setPrimaryArea(reportModal.name);

        setReportResult({
          success: true,
          confirmed: Boolean(data.confirmed),
          reportsNeeded: Number(data.reportsNeeded ?? 0),
          message: data.message || 'Your report was saved.',
        });
        await fetchStatus();
        window.setTimeout(closeReportModal, 2600);
      } else {
        setReportResult({
          success: false,
          confirmed: false,
          reportsNeeded: 0,
          message: data.message || data.error || 'Submission blocked.',
        });
      }
    } catch {
      setReportResult({
        success: false,
        confirmed: false,
        reportsNeeded: 0,
        message: 'Network error. Please try again.',
      });
    } finally {
      setReporting(false);
    }
  }, [closeReportModal, fetchStatus, location, locationAccurateEnough, locationHelpMessage, reportModal]);

  const handleHazardReport = useCallback(async () => {
    if (!hazardModal) {
      return;
    }

    if (!location || !locationAccurateEnough) {
      setReportResult({
        success: false,
        confirmed: false,
        reportsNeeded: 0,
        message: locationHelpMessage ?? 'We need a reliable GPS fix before you can submit a hazard report.',
      });
      return;
    }

    if (!hazardAreaName.trim()) {
      setReportResult({ success: false, confirmed: false, reportsNeeded: 0, message: 'Please enter the Area or Community Name.' });
      return;
    }

    if (hazardType === 'Illegal Connection' && (!hazardStreet.trim() || !hazardHouse.trim())) {
      setReportResult({ success: false, confirmed: false, reportsNeeded: 0, message: 'Street name and house number are required for illegal connection reports.' });
      return;
    }

    if (!hazardDesc.trim() && !hazardImage) {
      setReportResult({ success: false, confirmed: false, reportsNeeded: 0, message: 'Add a short description or a photo so the hazard can be verified.' });
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
          areaName: hazardAreaName,
          streetName: hazardStreet,
          houseNumber: hazardHouse,
          meterNumber,
          contactPhone,
          description: hazardDesc,
          imageUrl: hazardImage,
          deviceId: getDeviceId(),
          lat: location.lat,
          lng: location.lng
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setReportResult({
          success: true,
          confirmed: true,
          reportsNeeded: 0,
          message: data.message || 'Hazard report saved.',
        });
        window.setTimeout(closeHazardModal, 2600);
      } else {
        setReportResult({ success: false, confirmed: false, reportsNeeded: 0, message: data.message || 'Failed to report.' });
      }
    } catch {
      setReportResult({ success: false, confirmed: false, reportsNeeded: 0, message: 'Network error.' });
    } finally {
      setReporting(false);
    }
  }, [
    closeHazardModal,
    hazardAreaName,
    hazardDesc,
    hazardHouse,
    hazardImage,
    hazardModal,
    hazardStreet,
    hazardType,
    location,
    locationAccurateEnough,
    locationHelpMessage,
  ]);

  const areasWithProximity = useMemo(() => {
    if (!location) {
      return areas.map(area => ({ ...area, isNearby: false, distance: null, isClosest: false, isSecondClosest: false }));
    }
    
    const withDist = areas.map(area => ({
      ...area,
      distance: calculateDistanceKm(location.lat, location.lng, area.lat, area.lng),
    })).sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));

    let closestName = withDist[0]?.name;
    const secondClosestName = withDist[1]?.name;

    // Smart Override: If primary area is set and GPS is within 5km of it,
    // we assume the user is actually at their primary location.
    if (primaryArea) {
      const primaryAreaObj = withDist.find(a => a.name === primaryArea);
      if (primaryAreaObj && (primaryAreaObj.distance ?? Infinity) <= PRIMARY_AREA_BIAS_KM) {
        closestName = primaryArea;
      }
    }

    return areas.map(area => {
      const distance = calculateDistanceKm(location.lat, location.lng, area.lat, area.lng);
      const isClosest = area.name === closestName;
      const isSecondClosest = area.name === secondClosestName && !isClosest;
      const isNearby = distance <= REPORTING_TOLERANCE_KM;
      return { ...area, isNearby, distance, isClosest, isSecondClosest };
    });
  }, [areas, location, primaryArea]);

  const nearbyAreas = useMemo(() => {
    if (!location) return [];
    return areasWithProximity
      .filter(a => a.isClosest || a.isSecondClosest)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }, [areasWithProximity, location]);

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

  const locationChipTone = !location
    ? 'bg-white/5 border-white/10 text-gray-500'
    : !locationAccurateEnough
      ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300'
      : 'bg-green-500/5 border-green-500/20 text-green-400';

  const locationChipLabel = !location
    ? 'Locating...'
    : !locationAccurateEnough
      ? 'Low GPS accuracy'
      : formatAccuracy(location.accuracy);

  const locationActionLabel = location ? 'Refresh GPS' : 'Enable GPS';

  return (
    <main className="min-h-screen relative text-white selection:bg-yellow-500/30 overflow-x-hidden">
      <LocationOnboarding onComplete={(area) => setPrimaryArea(area)} />
      {/* Background Image Layer */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: 'url("/assets/bg-action.png")',
          filter: 'brightness(0.3) saturate(1.2)',
        }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-transparent via-[#020617]/80 to-[#020617]" />
      
      {/* Content Layer */}
      <div className="relative z-10 min-h-screen">
      <header className="sticky top-0 z-40 bg-[#020617]/80 backdrop-blur-2xl border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="p-2 -ml-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all group"
              title="Back to Home"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h1 className="font-bold text-base sm:text-lg leading-tight">Live Tracker</h1>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] uppercase tracking-wider font-bold ${
              locationChipTone
            }`}>
              {locationLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
              {locationLoading ? 'Refreshing GPS...' : locationChipLabel}
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
        {statusError && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {statusError}
          </div>
        )}

        {locationHelpMessage && (
          <div className={`rounded-2xl border px-4 py-3 text-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${
            location && !locationAccurateEnough
              ? 'border-yellow-500/20 bg-yellow-500/10 text-yellow-100'
              : 'border-white/10 bg-white/5 text-gray-200'
          }`}>
            <span>{locationHelpMessage}</span>
            <button
              onClick={requestLocation}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/10"
            >
              {locationLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {locationActionLabel}
            </button>
          </div>
        )}

        {/* Your Reporting Area - Shows Nearby Areas */}
        {nearbyAreas.length > 0 ? (
          <div className="bg-gradient-to-br from-yellow-500/10 via-yellow-500/[0.03] to-transparent border border-yellow-500/30 rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-2xl shadow-yellow-500/5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-yellow-400">Your Current & Nearby Areas</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={requestLocation}
                  className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all"
                >
                  {locationLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  {locationActionLabel}
                </button>
                <div className="flex items-center gap-1.5 text-[10px] text-yellow-600 bg-yellow-500/20 px-2.5 py-1 rounded-full font-bold">
                  <MapPin className="w-3 h-3" />
                  LIVE TRACKING
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {nearbyAreas.map((area) => (
                <div key={area.name} className="relative p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all duration-500 group/card">
                  <h3 className="text-xl font-bold text-white mb-1">
                    {area.name} 
                    {area.isClosest && <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-md ml-2 uppercase align-middle font-black tracking-tighter">Current Position</span>}
                    {area.isSecondClosest && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-1.5 py-0.5 rounded-md ml-2 uppercase align-middle font-bold">Closest Area</span>}
                  </h3>
                  <p className={`text-xs font-medium mb-3 ${STATUS_META[area.status].text}`}>
                    {area.isSecondClosest ? 'View status only' : STATUS_META[area.status].label}
                  </p>
                  
                  <div className="flex flex-wrap gap-1.5 text-[10px] text-gray-400 mb-4">
                    <span className="rounded bg-white/10 px-1.5 py-0.5">
                      {area.distance !== null ? `${area.distance.toFixed(2)} km away` : 'Distance unavailable'}
                    </span>
                    {location && area.isClosest && (
                       <span className={`rounded px-1.5 py-0.5 ${
                        location.accuracy !== null && location.accuracy > GPS_WARNING_ACCURACY_METERS
                          ? 'bg-yellow-500/15 text-yellow-200'
                          : 'bg-green-500/10 text-green-200'
                      }`}>
                        Acc: {formatAccuracy(location.accuracy)}
                      </span>
                    )}
                  </div>

                  {area.isClosest ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setReportModal(area); setReportResult(null); }}
                        disabled={!locationAccurateEnough || (area.distance !== null && area.distance > 15)}
                        className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all flex items-center justify-center gap-1.5 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                        title={!locationAccurateEnough ? "Low GPS accuracy" : area.distance !== null && area.distance > 15 ? "Too far from this area" : ""}
                      >
                        <Zap className="w-3.5 h-3.5" /> Report Status
                      </button>
                      <button
                        onClick={() => { setHazardModal(area); setReportResult(null); }}
                        disabled={!locationAccurateEnough || (area.distance !== null && area.distance > 15)}
                        className="flex-1 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold transition-all flex items-center justify-center gap-1.5 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                        title={!locationAccurateEnough ? "Low GPS accuracy" : area.distance !== null && area.distance > 15 ? "Too far from this area" : ""}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" /> Report Hazard
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Reporting restricted to current position</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 text-center mt-2 pt-2 border-t border-white/5">
              Select the correct exact neighbourhood from above to submit your report.
            </p>
          </div>
        ) : (
          <div className="bg-gray-900/50 border border-white/10 rounded-3xl p-6 text-center">
            <p className="text-gray-400 font-medium">Waiting for location... Enable GPS to report</p>
            <button
              onClick={requestLocation}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
            >
              {locationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Enable GPS
            </button>
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
          <button
            onClick={() => setShowCommunities(!showCommunities)}
            className="w-full flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors mb-4"
          >
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">All Communities</h3>
            <ChevronDown 
              className={`w-5 h-5 text-gray-400 transition-transform ${showCommunities ? 'rotate-180' : ''}`} 
            />
          </button>
          
          {showCommunities && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {loading ? (
                Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />
                ))
              ) : (
                filtered.map(area => {
                  const meta = STATUS_META[area.status];
                  const Icon = meta.icon;
                  const canReport = (area.isClosest ? (area.distance !== null && area.distance <= 15) : area.isNearby) && locationAccurateEnough;

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
                          title={canReport ? "Report Hazard" : "Move to this area and verify GPS to report"}
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                      </div>

                      {!canReport && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-950/40 backdrop-blur-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-[10px] bg-black/80 px-2 py-1 rounded text-gray-400 uppercase tracking-widest font-bold">
                            {locationAccurateEnough ? 'Move to report here' : 'Need better GPS to report'}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Report Status Modal */}
      {reportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-gray-900 border border-white/10 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Report Status</h2>
              <button onClick={closeReportModal} className="p-2 hover:bg-white/5 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            {reportResult ? (
              <div className={`p-4 rounded-2xl border ${reportResult.success ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                <p className="font-bold">{reportResult.success ? 'Report Received' : 'Failed'}</p>
                <p className="text-sm mt-1">{reportResult.message}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-400">Your report for <span className="text-white font-bold">{reportModal.name}</span> helps verify the local power status.</p>
                {location && (
                  <p className="text-xs text-gray-500">
                    Reporting with {formatAccuracy(location.accuracy)} GPS accuracy.
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleReport('on')}
                    disabled={reporting || !locationAccurateEnough}
                    className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Zap className="w-8 h-8 text-green-400" />
                    <span className="font-bold text-green-400">Power ON</span>
                  </button>
                  <button
                    onClick={() => handleReport('out')}
                    disabled={reporting || !locationAccurateEnough}
                    className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
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
              <button onClick={closeHazardModal} className="p-2 hover:bg-white/5 rounded-full"><X className="w-5 h-5" /></button>
            </div>

            {reportResult ? (
              <div className={`p-4 rounded-2xl border ${reportResult.success ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                <p className="font-bold">{reportResult.success ? 'Hazard Reported!' : 'Failed'}</p>
                <p className="text-sm mt-1">{reportResult.message}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wider font-bold text-gray-500">Hazard Type</label>
                  <select 
                    value={hazardType} 
                    onChange={e => setHazardType(e.target.value as HazardType)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                  >
                    {HAZARD_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
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

                {hazardType === 'Stolen Meter' && (
                  <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wider font-bold text-gray-500 text-yellow-400">Meter Number <span className="text-red-400">*</span></label>
                      <input
                        value={meterNumber}
                        onChange={e => setMeterNumber(e.target.value)}
                        placeholder="e.g. 0012345"
                        className="w-full bg-white/5 border border-yellow-500/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-yellow-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wider font-bold text-gray-500 text-yellow-400">Contact Phone <span className="text-red-400">*</span></label>
                      <input
                        value={contactPhone}
                        onChange={e => setContactPhone(e.target.value)}
                        placeholder="e.g. 076..."
                        className="w-full bg-white/5 border border-yellow-500/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-yellow-500"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider font-bold text-gray-500">Street Name {(hazardType === 'Illegal Connection' || hazardType === 'Stolen Meter') && <span className="text-red-400">*</span>}</label>
                    <input
                      value={hazardStreet}
                      onChange={e => setHazardStreet(e.target.value)}
                      placeholder="e.g. Main St"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-red-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider font-bold text-gray-500">House No {(hazardType === 'Illegal Connection' || hazardType === 'Stolen Meter') && <span className="text-red-400">*</span>}</label>
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
                  disabled={reporting || !locationAccurateEnough}
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
      </div>

      <footer className="relative z-10 border-t border-white/5 py-12 px-6 mt-12 bg-black/20 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4 text-gray-500">
             <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
               <Zap className="h-4 w-4" />
             </div>
             <p className="text-xs font-bold uppercase tracking-widest">EDSA Field Operations</p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-1">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Developed by</p>
            <p className="text-xs text-yellow-500/80 font-black">Ryan J Stewart, BCA</p>
            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter">Amity University India</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

function MegaphoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
  )
}
