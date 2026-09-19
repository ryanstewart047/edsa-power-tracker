export interface AreaDefinition {
  name: string;
  lat: number;
  lng: number;
}

export const FREETOWN_CITY = 'Freetown';
export const REPORTING_TOLERANCE_KM = 3.0;
export const MAX_REPORTING_DISTANCE_KM = 15;
export const AREA_MATCH_TOLERANCE_KM = 1.35;
export const AREA_CANDIDATE_PADDING_KM = 0.5;
export const AREA_CANDIDATE_LIMIT = 5;

// Verified Freetown neighbourhoods with accurate landmark & junction coordinates
export const FREETOWN_AREAS: AreaDefinition[] = [
  { name: "Aberdeen",        lat: 8.4988, lng: -13.2662 }, // Cape Sierra / Sir Samuel Lewis Rd
  { name: "Lumley",          lat: 8.4650, lng: -13.2720 }, // Lumley Roundabout / Police Station / Grassfield
  { name: "Goderich",        lat: 8.4350, lng: -13.2840 }, // Milton Margai / Funkia / Goderich Village
  { name: "Wilberforce",     lat: 8.4720, lng: -13.2520 }, // Spur Road / Wilberforce Village / Barracks loop
  { name: "Hill Station",    lat: 8.4550, lng: -13.2410 }, // State House / IMATT / Hill Station
  { name: "Murray Town",     lat: 8.4910, lng: -13.2540 }, // Murray Town Village / Cole Farm
  { name: "Congo Cross",     lat: 8.4780, lng: -13.2480 }, // Congo Cross Roundabout / Main Motor Rd
  { name: "Tengbeh Town",    lat: 8.4770, lng: -13.2420 }, // Tengbeh Town Valley / Main Rd
  { name: "Brookfields",     lat: 8.4740, lng: -13.2370 }, // National Stadium / Jomo Kenyatta Rd
  { name: "New England",     lat: 8.4660, lng: -13.2380 }, // Youyi Building / New England Ville
  { name: "Circular Road",   lat: 8.4820, lng: -13.2300 }, // Circular Rd / Model School
  { name: "Tower Hill",      lat: 8.4840, lng: -13.2320 }, // Parliament Building / State Ave
  { name: "Kissy",           lat: 8.4680, lng: -13.1950 }, // Kissy Old Rd / Shell / Bye-pass
  { name: "Wellington",      lat: 8.4550, lng: -13.1700 }, // Wellington PMB / Industrial Estate
  { name: "Calaba Town",     lat: 8.4420, lng: -13.1480 }, // Calaba Town Market / Roundabout
  { name: "Allen Town",      lat: 8.4300, lng: -13.1320 }, // Allen Town Main Rd
  { name: "Waterloo",        lat: 8.3380, lng: -13.0710 }, // Waterloo 555 / Roundabout
  { name: "Regent",          lat: 8.4280, lng: -13.2200 }, // Regent Village Square
  { name: "Charlotte",       lat: 8.4150, lng: -13.2050 }, // Charlotte Village
  { name: "Tombo",           lat: 8.2300, lng: -13.0450 }, // Tombo Coastal Community
  { name: "Jui Junction",    lat: 8.4080, lng: -13.1420 }, // Jui Junction / Hospital
  { name: "Grafton",         lat: 8.3950, lng: -13.1550 }, // Grafton Main Rd
  { name: "Leicester Peak",  lat: 8.4480, lng: -13.2120 }, // Leicester Peak Summit
  { name: "Susan's Bay",     lat: 8.4900, lng: -13.2260 }, // Susan's Bay Coastal Community
  { name: "Magazine Cut",    lat: 8.4870, lng: -13.2230 }, // Magazine / Eastern Police
  { name: "Cline Town",      lat: 8.4850, lng: -13.2080 }, // Queen Elizabeth II Quay / Cline Town
  { name: "East End",        lat: 8.4800, lng: -13.2050 }, // Kissy Road / East End Freetown
  { name: "Fourah Bay",      lat: 8.4860, lng: -13.2160 }, // Fourah Bay Community
  { name: "Kroo Bay",        lat: 8.4890, lng: -13.2340 }, // Kroo Bay Coastal Community
  { name: "Fullah Town",     lat: 8.4830, lng: -13.2260 }, // Fullah Town / Mountain Cut
];

export type AreaStatus = "on" | "out" | "unknown";

export interface AreaWithStatus {
  name: string;
  lat: number;
  lng: number;
  status: AreaStatus;
  confidence: number;
  reportCount: number;
  lastUpdated: string | null;
}

export interface AreaDistance extends AreaDefinition {
  distanceKm: number;
}

export interface AreaProximity {
  closestArea: AreaDistance | null;
  targetArea: AreaDistance | null;
}

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusKm = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export function findAreaByName(name: string): AreaDefinition | undefined {
  const normalized = name.trim().toLowerCase();
  return FREETOWN_AREAS.find((area) => area.name.toLowerCase() === normalized);
}

export function getAreaDistances(lat: number, lng: number): AreaDistance[] {
  return FREETOWN_AREAS
    .map((area) => ({
      ...area,
      distanceKm: calculateDistanceKm(lat, lng, area.lat, area.lng),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function getClosestArea(lat: number, lng: number): AreaDistance | null {
  return getAreaDistances(lat, lng)[0] ?? null;
}

function getAccuracyKm(accuracyMeters: number | null | undefined): number {
  if (typeof accuracyMeters !== 'number' || !Number.isFinite(accuracyMeters) || accuracyMeters < 0) {
    return 0;
  }

  return accuracyMeters / 1000;
}

export function getAreaMatchToleranceKm(accuracyMeters?: number | null): number {
  const accuracyKm = getAccuracyKm(accuracyMeters);
  return Math.min(
    REPORTING_TOLERANCE_KM,
    Math.max(AREA_MATCH_TOLERANCE_KM, accuracyKm + AREA_CANDIDATE_PADDING_KM),
  );
}

export function getAreaCandidates(
  lat: number,
  lng: number,
  accuracyMeters?: number | null,
  preferredAreaName?: string | null,
): AreaDistance[] {
  const distances = getAreaDistances(lat, lng);
  const closestArea = distances[0];

  if (!closestArea) {
    return [];
  }

  const tolerance = getAreaMatchToleranceKm(accuracyMeters);
  const candidateRadiusKm = Math.min(
    MAX_REPORTING_DISTANCE_KM,
    closestArea.distanceKm + tolerance,
  );

  let candidates = distances
    .filter((area) => area.distanceKm <= candidateRadiusKm)
    .slice(0, AREA_CANDIDATE_LIMIT);

  // If user has a saved / preferred primary area and it is within valid candidate range,
  // ensure it is ranked first so minor GPS jitter on border streets does not flip to the next neighborhood!
  if (preferredAreaName) {
    const normalizedPreferred = preferredAreaName.trim().toLowerCase();
    const preferredIndex = candidates.findIndex(
      (area) => area.name.toLowerCase() === normalizedPreferred
    );

    if (preferredIndex > 0) {
      const preferred = candidates[preferredIndex];
      if (preferred.distanceKm <= closestArea.distanceKm + tolerance) {
        candidates = [
          preferred,
          ...candidates.slice(0, preferredIndex),
          ...candidates.slice(preferredIndex + 1),
        ];
      }
    }
  }

  return candidates.length > 0 ? candidates : distances.slice(0, 1);
}

export function getAreaProximity(areaName: string, lat: number, lng: number): AreaProximity {
  const distances = getAreaDistances(lat, lng);
  return {
    closestArea: distances[0] ?? null,
    targetArea: distances.find((area) => area.name === areaName) ?? null,
  };
}
