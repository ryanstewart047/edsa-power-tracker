export interface AreaDefinition {
  name: string;
  lat: number;
  lng: number;
}

export const FREETOWN_CITY = 'Freetown';
export const REPORTING_TOLERANCE_KM = 2.5;
export const MAX_REPORTING_DISTANCE_KM = 15;

// Freetown neighbourhoods with approximate coordinates for map display
export const FREETOWN_AREAS: AreaDefinition[] = [
  { name: "Aberdeen",        lat: 8.4988, lng: -13.2662 },
  { name: "Lumley",          lat: 8.4839, lng: -13.2562 },
  { name: "Goderich",        lat: 8.4485, lng: -13.2755 },
  { name: "Wilberforce",     lat: 8.4800, lng: -13.2450 },
  { name: "Hill Station",    lat: 8.4720, lng: -13.2380 },
  { name: "Murray Town",     lat: 8.4880, lng: -13.2450 },
  { name: "Congo Cross",     lat: 8.4750, lng: -13.2370 },
  { name: "Tengbeh Town",    lat: 8.4810, lng: -13.2400 },
  { name: "Brookfields",     lat: 8.4780, lng: -13.2330 },
  { name: "New England",     lat: 8.4740, lng: -13.2350 },
  { name: "Circular Road",   lat: 8.4820, lng: -13.2290 },
  { name: "Tower Hill",      lat: 8.4850, lng: -13.2320 },
  { name: "Kissy",           lat: 8.4750, lng: -13.1900 },
  { name: "Wellington",      lat: 8.4600, lng: -13.1650 },
  { name: "Calaba Town",     lat: 8.4550, lng: -13.1400 },
  { name: "Allen Town",      lat: 8.4450, lng: -13.1250 },
  { name: "Waterloo",        lat: 8.3500, lng: -13.0600 },
  { name: "Regent",          lat: 8.4350, lng: -13.2150 },
  { name: "Charlotte",       lat: 8.4150, lng: -13.2050 },
  { name: "Tombo",           lat: 8.3200, lng: -13.0300 },
  { name: "Jui Junction",    lat: 8.4100, lng: -13.1400 },
  { name: "Grafton",         lat: 8.3950, lng: -13.1550 },
  { name: "Leicester Peak",  lat: 8.4450, lng: -13.2050 },
  { name: "Susan's Bay",     lat: 8.4900, lng: -13.2200 },
  { name: "Magazine Cut",    lat: 8.4850, lng: -13.2200 },
  { name: "Cline Town",      lat: 8.4850, lng: -13.2050 },
  { name: "East End",        lat: 8.4800, lng: -13.2000 },
  { name: "Fourah Bay",      lat: 8.4820, lng: -13.2100 },
  { name: "Kroo Bay",        lat: 8.4900, lng: -13.2300 },
  { name: "Fullah Town",     lat: 8.4850, lng: -13.2200 },
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

export function getAreaProximity(areaName: string, lat: number, lng: number): AreaProximity {
  const distances = getAreaDistances(lat, lng);
  return {
    closestArea: distances[0] ?? null,
    targetArea: distances.find((area) => area.name === areaName) ?? null,
  };
}
