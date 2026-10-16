/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Zap, ZapOff, HelpCircle, RefreshCw, MapPin, Loader2, Camera, AlertTriangle, X, ChevronDown, ArrowLeft, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import type { AreaWithStatus } from '@/lib/areas';
import { calculateDistanceKm, MAX_REPORTING_DISTANCE_KM } from '@/lib/locationMath';
import LocationOnboarding from '@/components/LocationOnboarding';
import AdUnit from '@/components/AdUnit';
import AreaAlertsPanel from '@/components/AreaAlertsPanel';
import EmergencySafetyCard from '@/components/EmergencySafetyCard';
import {
  GEOLOCATION_MAXIMUM_AGE_MS,
  GEOLOCATION_TIMEOUT_MS,
  GPS_WARNING_ACCURACY_METERS,
  HAZARD_TYPES,
  HazardType,
  MAX_REPORTING_ACCURACY_METERS,
} from '@/lib/locationConfig';

const LOCATION_STALE_AFTER_MS = 2 * 60_000;
const GPS_REFRESH_INTERVAL_MS = 30_000;
const MOVEMENT_REFRESH_DISTANCE_METERS = 35;

const STATUS_META = {
  on: { label: 'Power ON', icon: Zap, dot: 'bg-emerald-500', ring: 'ring-emerald-500/30', card: 'border-emerald-200 bg-emerald-50/60 shadow-sm', text: 'text-emerald-700' },
  out: { label: 'Power OUT', icon: ZapOff, dot: 'bg-rose-500 animate-ping-slow', ring: 'ring-rose-500/30', card: 'border-rose-200 bg-rose-50/60 shadow-sm', text: 'text-rose-700' },
  unknown: { label: 'Unknown', icon: HelpCircle, dot: 'bg-slate-400', ring: 'ring-slate-400/20', card: 'border-slate-200 bg-slate-50/60 shadow-sm', text: 'text-slate-600' },
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
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function formatAccuracy(accuracy: number | null): string {
  if (accuracy === null) return 'GPS accuracy unknown';
  return `${Math.round(accuracy)}m accuracy`;
}

function createLocationSnapshot(pos: GeolocationPosition): LocationSnapshot {
  return {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude,
    accuracy: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null,
    capturedAt: new Date().toISOString(),
  };
}

function getLocationAgeMs(location: LocationSnapshot): number {
  const capturedAt = new Date(location.capturedAt).getTime();
  return Number.isFinite(capturedAt) ? Date.now() - capturedAt : Infinity;
}

function shouldUseLocationFix(next: LocationSnapshot, current: LocationSnapshot | null): boolean {
  if (!current) {
    return true;
  }

  const nextAccuracy = next.accuracy ?? Infinity;
  const currentAccuracy = current.accuracy ?? Infinity;

  if (nextAccuracy <= currentAccuracy) {
    return true;
  }

  if (getLocationAgeMs(current) > 15_000 && nextAccuracy <= MAX_REPORTING_ACCURACY_METERS) {
    return true;
  }

  const movedMeters = calculateDistanceKm(next.lat, next.lng, current.lat, current.lng) * 1000;
  return (
    movedMeters > MOVEMENT_REFRESH_DISTANCE_METERS &&
    nextAccuracy <= Math.max(MAX_REPORTING_ACCURACY_METERS, currentAccuracy * 1.5)
  );
}

function getGeolocationErrorMessage(error: GeolocationPositionError): string {
  const isDesktop = typeof window !== 'undefined' && !/android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return isDesktop
        ? 'Location permission was denied. You can search and select your community from the list below.'
        : 'Location permission was denied. Enable GPS access in your browser settings to submit reports.';
    case error.POSITION_UNAVAILABLE:
      return isDesktop
        ? 'Your computer does not have a GPS receiver or location is unavailable. You can search and select your community below.'
        : 'Your location could not be determined right now. Try moving to a clearer spot.';
    case error.TIMEOUT:
      return isDesktop
        ? 'Location lookup timed out. You can search and select your community from the list below.'
        : 'Location lookup timed out. Refresh GPS and try again.';
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

function compressImageFile(file: File, maxDimension = 1280, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
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
  const locationRef = useRef<LocationSnapshot | null>(null);
  const lastAutoRefreshLocationRef = useRef<LocationSnapshot | null>(null);
  const hasNearbyAreaRef = useRef(false);
  const isSearchingRef = useRef(false);

  useEffect(() => {
    // Load primary area from local storage
    const saved = localStorage.getItem('edsa_primary_area');
    if (saved?.startsWith('ft-') || saved?.startsWith('gn-')) {
      setPrimaryArea(saved);
    } else if (saved) {
      localStorage.removeItem('edsa_primary_area');
    }
  }, []);

  useEffect(() => {
    locationRef.current = location;
    if (!lastAutoRefreshLocationRef.current && location) {
      lastAutoRefreshLocationRef.current = location;
    }
  }, [location]);

  useEffect(() => {
    hasNearbyAreaRef.current = areas.some((area) => area.isNearby);
  }, [areas]);

  useEffect(() => {
    isSearchingRef.current = Boolean(search.trim());
  }, [search]);

  // Hazard Report State
  const [hazardType, setHazardType] = useState<HazardType>(HAZARD_TYPES[0]);
  const [hazardDesc, setHazardDesc] = useState('');
  const [hazardStreet, setHazardStreet] = useState('');
  const [hazardHouse, setHazardHouse] = useState('');
  const [hazardAreaName, setHazardAreaName] = useState('');
  const [hazardImage, setHazardImage] = useState<string | null>(null);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [meterNumber, setMeterNumber] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const handleImageSelection = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressingImage(true);
      const compressedDataUrl = await compressImageFile(file);
      setHazardImage(compressedDataUrl);
    } catch (err) {
      console.error('Error processing camera/gallery image:', err);
      const fallbackReader = new FileReader();
      fallbackReader.onloadend = () => setHazardImage(fallbackReader.result as string);
      fallbackReader.readAsDataURL(file);
    } finally {
      setIsCompressingImage(false);
      e.target.value = '';
    }
  }, []);

  const fetchStatus = useCallback(async (snapshot: LocationSnapshot | null = null, query = '') => {
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('search', query.trim());
      if (snapshot) {
        params.set('lat', String(snapshot.lat));
        params.set('lng', String(snapshot.lng));
        if (snapshot.accuracy !== null) params.set('accuracy', String(snapshot.accuracy));
      }
      const suffix = params.size > 0 ? `?${params.toString()}` : '';
      const res = await fetch(`/api/status${suffix}`, { cache: 'no-store' });
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchStatus(location, search);
    }, search.trim() ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [fetchStatus, location, search]);

  const handleLocationSuccess = useCallback((pos: GeolocationPosition) => {
    const nextLocation = createLocationSnapshot(pos);
    setLocation((currentLocation) => (
      shouldUseLocationFix(nextLocation, currentLocation) ? nextLocation : currentLocation
    ));
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
            maximumAge: GEOLOCATION_MAXIMUM_AGE_MS,
          },
        );
      },
      {
        enableHighAccuracy: true,
        timeout: GEOLOCATION_TIMEOUT_MS,
        maximumAge: 0,
      },
    );
  }, [handleLocationError, handleLocationSuccess]);

  const refreshLocationWhenNeeded = useCallback(() => {
    const currentLocation = locationRef.current;
    const lastRefreshLocation = lastAutoRefreshLocationRef.current;
    const movedMeters = currentLocation && lastRefreshLocation
      ? calculateDistanceKm(
        currentLocation.lat,
        currentLocation.lng,
        lastRefreshLocation.lat,
        lastRefreshLocation.lng,
      ) * 1000
      : 0;
    const areaNotFound = !isSearchingRef.current && !hasNearbyAreaRef.current;
    const deviceIsMoving = movedMeters > MOVEMENT_REFRESH_DISTANCE_METERS;

    if (areaNotFound || deviceIsMoving) {
      lastAutoRefreshLocationRef.current = currentLocation;
      requestLocation();
    }
  }, [requestLocation]);

  useEffect(() => {
    requestLocation();
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return undefined;
    }

    const refreshInterval = window.setInterval(refreshLocationWhenNeeded, GPS_REFRESH_INTERVAL_MS);
    const watchId = navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleLocationError,
      {
        enableHighAccuracy: true,
        timeout: GEOLOCATION_TIMEOUT_MS,
        maximumAge: GEOLOCATION_MAXIMUM_AGE_MS,
      },
    );

    return () => {
      window.clearInterval(refreshInterval);
      navigator.geolocation.clearWatch(watchId);
    };
  }, [handleLocationError, handleLocationSuccess, refreshLocationWhenNeeded, requestLocation]);

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
    setIsCompressingImage(false);
    setMeterNumber('');
    setContactPhone('');
  }, []);

  const closeHazardModal = useCallback(() => {
    setHazardModal(null);
    setReportResult(null);
    resetHazardForm();
  }, [resetHazardForm]);

  const locationFreshEnough = location ? getLocationAgeMs(location) <= LOCATION_STALE_AFTER_MS : false;
  const locationAccurateEnough =
    locationFreshEnough &&
    location?.accuracy !== null &&
    location?.accuracy !== undefined &&
    location.accuracy <= MAX_REPORTING_ACCURACY_METERS;

  const locationHelpMessage = useMemo(() => {
    if (locationError) {
      return locationError;
    }

    if (!location) {
      return 'Enable GPS to verify your reporting area.';
    }

    if (!locationFreshEnough) {
      return 'Refresh GPS to verify your current position before reporting.';
    }

    if (location.accuracy === null) {
      return 'Your browser did not provide a GPS accuracy radius. Refresh GPS before reporting.';
    }

    if (!locationAccurateEnough) {
      return `Your GPS signal is too broad (${formatAccuracy(location.accuracy)}). Refresh your location or move outdoors before reporting.`;
    }

    if (location.accuracy > GPS_WARNING_ACCURACY_METERS) {
      return `GPS locked at ${formatAccuracy(location.accuracy)}. You can report, but refresh GPS or move outdoors if the suggested area looks wrong.`;
    }

    return null;
  }, [location, locationAccurateEnough, locationError, locationFreshEnough]);

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
          area: reportModal.id,
          status,
          deviceId: getDeviceId(),
          lat: location.lat,
          lng: location.lng,
          accuracy: location.accuracy,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Behavioral Learning: Update primary area if user reports for a specific area
        localStorage.setItem('edsa_primary_area', reportModal.id);
        setPrimaryArea(reportModal.id);

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
          area: hazardModal.id,
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
          lng: location.lng,
          accuracy: location.accuracy,
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
    meterNumber,
    contactPhone,
  ]);

  const areasWithProximity = useMemo(() => {
    if (!location) {
      return areas.map(area => ({
        ...area,
        isCandidate: false,
        distance: null,
        isClosest: false,
        isSecondClosest: false,
        isSavedArea: area.id === primaryArea,
      }));
    }

    const nearbyAreas = areas
      .filter((area) => area.isNearby)
      .map((area) => ({ ...area, distance: calculateDistanceKm(location.lat, location.lng, area.lat, area.lng) }))
      .sort((a, b) => a.distance - b.distance);
    const candidateIds = new Set(nearbyAreas.map((area) => area.id));
    const closestId = nearbyAreas[0]?.id;
    const secondClosestId = nearbyAreas[1]?.id;

    return areas.map(area => {
      const distance = calculateDistanceKm(location.lat, location.lng, area.lat, area.lng);
      const isCandidate = candidateIds.has(area.id);
      const isClosest = area.id === closestId;
      const isSecondClosest = area.id === secondClosestId && !isClosest;
      const isSavedArea = area.id === primaryArea;
      return { ...area, isCandidate, distance, isClosest, isSecondClosest, isSavedArea };
    });
  }, [areas, location, primaryArea]);

  const nearbyAreas = useMemo(() => {
    if (!location) return [];
    return areasWithProximity
      .filter(a => a.isCandidate)
      .sort((a, b) => {
        // Always put the saved primary area first to avoid GPS jitter flips
        if (a.isSavedArea && !b.isSavedArea) return -1;
        if (!a.isSavedArea && b.isSavedArea) return 1;
        return (a.distance || 0) - (b.distance || 0);
      });
  }, [areasWithProximity, location]);

  const filtered = areasWithProximity.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || a.status === filter;
    return matchSearch && matchFilter;
  });

  const subscribedAreaName = primaryArea ? areas.find((area) => area.id === primaryArea)?.name ?? null : null;

  const counts = {
    on: areas.filter(a => a.status === 'on').length,
    out: areas.filter(a => a.status === 'out').length,
    unknown: areas.filter(a => a.status === 'unknown').length,
  };

  const locationChipTone = !location
    ? 'bg-slate-100 border-slate-200 text-slate-500'
    : !locationAccurateEnough || (location.accuracy !== null && location.accuracy > GPS_WARNING_ACCURACY_METERS)
      ? 'bg-blue-50 border-blue-200 text-blue-700'
      : 'bg-emerald-50 border-emerald-200 text-emerald-700';

  const locationChipLabel = !location
    ? 'Locating...'
    : !locationAccurateEnough
      ? 'Low GPS accuracy'
      : location.accuracy !== null && location.accuracy > GPS_WARNING_ACCURACY_METERS
        ? 'Broad GPS lock'
        : formatAccuracy(location.accuracy);

  const locationActionLabel =
    location && (!locationAccurateEnough || (location.accuracy !== null && location.accuracy > GPS_WARNING_ACCURACY_METERS))
      ? 'Improve GPS'
      : location
        ? 'Refresh GPS'
        : 'Enable GPS';

  return (
    <main className="min-h-screen relative text-slate-900 bg-white selection:bg-blue-100 overflow-x-hidden">
      <LocationOnboarding onComplete={(area) => setPrimaryArea(area)} />
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-100/60 blur-[120px] rounded-full" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-50/70 blur-[120px] rounded-full" />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 min-h-screen">
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-2xl border-b border-slate-200/80 shadow-xs">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 -ml-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-all group"
                title="Back to Home"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
                  <Zap className="w-5 h-5 text-white fill-white" />
                </div>
                <div>
                  <h1 className="font-bold text-base sm:text-lg leading-tight text-slate-900">Live Tracker</h1>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] uppercase tracking-wider font-bold ${locationChipTone
                }`}>
                {locationLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                {locationLoading ? 'Refreshing GPS...' : locationChipLabel}
              </div>
              <button
                onClick={() => fetchStatus(location, search)}
                className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 transition-colors px-3 py-2 rounded-lg hover:bg-slate-100"
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
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-xs">
              {statusError}
            </div>
          )}

          {locationHelpMessage && (
            <div className={`rounded-2xl border px-4 py-3 text-sm flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shadow-xs ${location && !locationAccurateEnough
                ? 'border-blue-200 bg-blue-50 text-blue-900'
                : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}>
              <span>{locationHelpMessage}</span>
              <button
                onClick={requestLocation}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-800 hover:bg-slate-100 shadow-xs"
              >
                {locationLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                {locationActionLabel}
              </button>
            </div>
          )}

          {/* Your Reporting Area - Shows Nearby Areas */}
          {nearbyAreas.length > 0 ? (
            <div className="bg-blue-50/60 border border-blue-200 rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-sm scroll-reveal">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">Your Current & Nearby Areas</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={requestLocation}
                    className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-all shadow-xs"
                  >
                    {locationLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    {locationActionLabel}
                  </button>
                  <div className="flex items-center gap-1.5 text-[10px] text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full font-bold">
                    <MapPin className="w-3 h-3 text-blue-600" />
                    LIVE TRACKING
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nearbyAreas.map((area) => {
                  const canReportForArea =
                    locationAccurateEnough &&
                    area.distance !== null &&
                    area.distance <= MAX_REPORTING_DISTANCE_KM;

                  return (
                    <div key={area.id} className={`relative p-5 rounded-2xl border transition-all duration-300 shadow-xs ${area.isSavedArea ? 'border-blue-300 bg-white ring-2 ring-blue-500/20' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <h3 className="text-xl font-bold text-slate-900 mb-1 flex flex-wrap items-center gap-1.5">
                        {area.name}
                        {area.isSavedArea && (
                          <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-md uppercase font-black tracking-tight">Your Area</span>
                        )}
                        {area.isClosest && !area.isSavedArea && (
                          <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-md uppercase font-black tracking-tighter">GPS Closest</span>
                        )}
                        {!area.isClosest && !area.isSavedArea && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded-md uppercase font-bold">Nearby</span>
                        )}
                      </h3>
                      <p className={`text-xs font-medium mb-1 ${STATUS_META[area.status].text}`}>{STATUS_META[area.status].label}</p>
                      <p className="text-[10px] text-slate-500 mb-3">{area.region}</p>

                      <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-500 mb-4">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 border border-slate-200 font-medium">
                          {area.distance !== null ? `${(area.distance * 1000).toFixed(0)}m away` : 'Distance unavailable'}
                        </span>
                        {location && (area.isClosest || area.isSavedArea) && (
                          <span className={`rounded px-1.5 py-0.5 font-medium ${location.accuracy !== null && location.accuracy > GPS_WARNING_ACCURACY_METERS
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                            }`}>
                            GPS ±{formatAccuracy(location.accuracy)}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => { setReportModal(area); setReportResult(null); }}
                          disabled={!canReportForArea}
                          className="flex-1 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold transition-all flex items-center justify-center gap-1.5 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                          title={!locationAccurateEnough ? "Low GPS accuracy" : area.distance !== null && area.distance > MAX_REPORTING_DISTANCE_KM ? "Too far from this area" : ""}
                        >
                          <Zap className="w-3.5 h-3.5 text-blue-600" /> Report Status
                        </button>
                        <button
                          onClick={() => { setHazardModal(area); setReportResult(null); }}
                          disabled={!canReportForArea}
                          className="flex-1 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold transition-all flex items-center justify-center gap-1.5 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                          title={!locationAccurateEnough ? "Low GPS accuracy" : area.distance !== null && area.distance > MAX_REPORTING_DISTANCE_KM ? "Too far from this area" : ""}
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Report Hazard
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500 text-center mt-2 pt-2 border-t border-blue-100">
                Select the correct exact neighbourhood from above to submit your report.
              </p>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 text-center scroll-reveal shadow-xs">
              <p className="text-slate-600 font-medium">Waiting for location... Enable GPS to report</p>
              <button
                onClick={requestLocation}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20 active:scale-95"
              >
                {locationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Enable GPS
              </button>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 scroll-reveal">
            {[
              { label: 'Have Power', count: counts.on, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
              { label: 'Power Out', count: counts.out, color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
              { label: 'Unknown', count: counts.unknown, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl border p-4 text-center shadow-xs ${s.bg}`}>
                <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <AreaAlertsPanel area={subscribedAreaName} />
          <EmergencySafetyCard />

          <div className="flex flex-col sm:flex-row gap-3 scroll-reveal">
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search Sierra Leone locations..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
            <div className="flex gap-2">
              {(['all', 'out', 'on', 'unknown'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shadow-xs ${filter === f
                      ? f === 'out' ? 'bg-rose-600 text-white'
                        : f === 'on' ? 'bg-emerald-600 text-white'
                          : 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <AdUnit />

          <div className="border-t border-slate-200 pt-6 scroll-reveal">
            <button
              onClick={() => setShowCommunities(!showCommunities)}
              className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors mb-4 shadow-xs"
            >
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest">All Communities</h3>
              <ChevronDown
                className={`w-5 h-5 text-slate-500 transition-transform ${showCommunities ? 'rotate-180' : ''}`}
              />
            </button>

            {showCommunities && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {loading ? (
                  Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="h-32 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
                  ))
                ) : (
                  filtered.map(area => {
                    const meta = STATUS_META[area.status];
                    const Icon = meta.icon;
                    const canReport =
                      area.isCandidate &&
                      area.distance !== null &&
                      area.distance <= MAX_REPORTING_DISTANCE_KM &&
                      locationAccurateEnough;

                    return (
                      <div key={area.id} className={`relative group p-4 rounded-2xl border transition-all duration-300 ${meta.card} ${!canReport ? 'opacity-60' : ''}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className={`w-3 h-3 rounded-full mt-1 ${meta.dot}`} />
                          <Icon className={`w-5 h-5 ${meta.text}`} />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900">{area.name}</h3>
                        <p className="text-[10px] text-slate-500">{area.region}</p>
                        <p className={`text-sm font-medium ${meta.text}`}>{meta.label}</p>

                        <div className="mt-4 flex items-center gap-2">
                          <button
                            onClick={() => { if (canReport) { setReportModal(area); setReportResult(null); } }}
                            disabled={!canReport}
                            className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200"
                          >
                            Report Status
                          </button>
                          <button
                            onClick={() => { if (canReport) { setHazardModal(area); setReportResult(null); } }}
                            disabled={!canReport}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-rose-200"
                            title={canReport ? "Report Hazard" : "Move to this area and verify GPS to report"}
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>
                        </div>

                        {!canReport && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-[1px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-[10px] bg-slate-900 text-white px-2.5 py-1 rounded-lg uppercase tracking-widest font-bold shadow-sm">
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
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[70] flex items-center justify-center p-3 sm:p-4 pb-safe">
            <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-900">
              <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 shrink-0">
                <h2 className="text-lg font-bold text-slate-900">Report Status</h2>
                <button onClick={closeReportModal} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto overscroll-contain space-y-5">
                {reportResult ? (
                  <div className={`p-4 rounded-2xl border ${reportResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                    <p className="font-bold">{reportResult.success ? 'Report Received' : 'Failed'}</p>
                    <p className="text-sm mt-1">{reportResult.message}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600">Your report for <span className="text-slate-900 font-bold">{reportModal.name}</span> helps verify the local power status.</p>
                    {location && (
                      <p className="text-xs text-slate-500">
                        Reporting with {formatAccuracy(location.accuracy)} GPS accuracy.
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={() => handleReport('on')}
                        disabled={reporting || !locationAccurateEnough}
                        className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                      >
                        <Zap className="w-8 h-8 text-emerald-600" />
                        <span className="font-bold text-emerald-700">Power ON</span>
                      </button>
                      <button
                        onClick={() => handleReport('out')}
                        disabled={reporting || !locationAccurateEnough}
                        className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-300 hover:bg-rose-100 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                      >
                        <ZapOff className="w-8 h-8 text-rose-600" />
                        <span className="font-bold text-rose-700">Power OUT</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Hazard Report Modal with smooth scrolling to avoid bottom cutoff */}
        {hazardModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[70] flex items-center justify-center p-3 sm:p-4 pb-safe">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden text-slate-900">
              <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Report Hazard</h2>
                    <p className="text-xs text-slate-500">{hazardModal.name}</p>
                  </div>
                </div>
                <button onClick={closeHazardModal} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 sm:p-6 overflow-y-auto overscroll-contain flex-1 space-y-4">
                {reportResult ? (
                  <div className={`p-4 rounded-2xl border ${reportResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                    <p className="font-bold">{reportResult.success ? 'Hazard Reported!' : 'Failed'}</p>
                    <p className="text-sm mt-1">{reportResult.message}</p>
                  </div>
                ) : (
                  <div className="space-y-4 pb-2">
                    <div className="space-y-1.5">
                      <label className="text-xs uppercase tracking-wider font-bold text-slate-700">Hazard Type</label>
                      <select
                        value={hazardType}
                        onChange={e => setHazardType(e.target.value as HazardType)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 text-slate-900"
                      >
                        {HAZARD_TYPES.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs uppercase tracking-wider font-bold text-slate-700">Specific Area Name <span className="text-rose-600">*</span></label>
                      <input
                        value={hazardAreaName}
                        onChange={e => setHazardAreaName(e.target.value)}
                        placeholder="e.g. Jui Junction"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 text-slate-900 placeholder-slate-400"
                      />
                    </div>

                    {hazardType === 'Stolen Meter' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-1.5">
                          <label className="text-xs uppercase tracking-wider font-bold text-blue-600">Meter Number (11 digits) <span className="text-rose-600">*</span></label>
                          <input
                            value={meterNumber}
                            maxLength={11}
                            onChange={e => setMeterNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                            placeholder="e.g. 01423859201"
                            className="w-full bg-slate-50 border border-blue-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 font-mono text-slate-900"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs uppercase tracking-wider font-bold text-blue-600">Contact Phone <span className="text-rose-600">*</span></label>
                          <input
                            value={contactPhone}
                            onChange={e => setContactPhone(e.target.value)}
                            placeholder="e.g. 076..."
                            className="w-full bg-slate-50 border border-blue-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-900"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs uppercase tracking-wider font-bold text-slate-700">Street Name {(hazardType === 'Illegal Connection' || hazardType === 'Stolen Meter') && <span className="text-rose-600">*</span>}</label>
                        <input
                          value={hazardStreet}
                          onChange={e => setHazardStreet(e.target.value)}
                          placeholder="e.g. Main St"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 text-slate-900 placeholder-slate-400"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs uppercase tracking-wider font-bold text-slate-700">House No {(hazardType === 'Illegal Connection' || hazardType === 'Stolen Meter') && <span className="text-rose-600">*</span>}</label>
                        <input
                          value={hazardHouse}
                          onChange={e => setHazardHouse(e.target.value)}
                          placeholder="e.g. 12B"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 text-slate-900 placeholder-slate-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs uppercase tracking-wider font-bold text-slate-700">Description</label>
                      <textarea
                        value={hazardDesc}
                        onChange={e => setHazardDesc(e.target.value)}
                        placeholder="Briefly describe the danger..."
                        className="w-full h-24 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 resize-none text-slate-900 placeholder-slate-400"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs uppercase tracking-wider font-bold text-slate-700">Evidence (Photo)</label>
                        {isCompressingImage && <span className="text-[11px] text-blue-600 animate-pulse font-medium">Optimizing photo...</span>}
                      </div>

                      {hazardImage ? (
                        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                          <img src={hazardImage} alt="Hazard preview" className="w-full h-36 object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 flex items-between justify-between p-3 flex-col pointer-events-none">
                            <div className="flex justify-between items-center w-full pointer-events-auto">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold backdrop-blur-sm shadow-sm">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Photo Attached
                              </span>
                              <button
                                type="button"
                                onClick={() => setHazardImage(null)}
                                className="p-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg transition-colors"
                                title="Remove Photo"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-200 pointer-events-auto">
                              Tap the remove button above to retake or pick another photo.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2.5">
                          {/* Direct Camera Button */}
                          <label className="relative flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50/50 hover:bg-rose-50 cursor-pointer transition-all active:scale-[0.98] group">
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              onChange={handleImageSelection}
                              disabled={isCompressingImage}
                            />
                            <div className="p-2.5 rounded-xl bg-rose-100 text-rose-600 group-hover:scale-110 transition-transform">
                              {isCompressingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                            </div>
                            <span className="text-xs font-bold text-slate-900 mt-1.5">Take Photo</span>
                            <span className="text-[10px] text-slate-500 font-medium">Use Camera</span>
                          </label>

                          {/* Gallery / File Button */}
                          <label className="relative flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-all active:scale-[0.98] group">
                            <input
                              type="file"
                              accept="image/*"
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                              onChange={handleImageSelection}
                              disabled={isCompressingImage}
                            />
                            <div className="p-2.5 rounded-xl bg-slate-200 text-slate-700 group-hover:scale-110 transition-transform">
                              {isCompressingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                            </div>
                            <span className="text-xs font-bold text-slate-900 mt-1.5">Choose File</span>
                            <span className="text-[10px] text-slate-500 font-medium">From Gallery</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky Footer for action button — pinned above home/nav buttons */}
              {!reportResult && (
                <div className="p-4 sm:p-5 border-t border-slate-100 bg-white/95 backdrop-blur-md shrink-0 pb-6 sm:pb-5">
                  <button
                    onClick={handleHazardReport}
                    disabled={reporting || !locationAccurateEnough || isCompressingImage}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold transition-all disabled:opacity-30 flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 active:scale-[0.98]"
                  >
                    {reporting || isCompressingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <MegaphoneIcon className="w-5 h-5" />}
                    {isCompressingImage ? 'Optimizing Photo...' : 'Submit Danger Report'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </main>
  );
}

function MegaphoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></svg>
  )
}
