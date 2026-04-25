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
  { name: "Aberdeen",        lat: 8.4697, lng: -13.2889 },
  { name: "Lumley",          lat: 8.4701, lng: -13.2800 },
  { name: "Goderich",        lat: 8.4503, lng: -13.3001 },
  { name: "Wilberforce",     lat: 8.4750, lng: -13.2700 },
  { name: "Hill Station",    lat: 8.4850, lng: -13.2600 },
  { name: "Murray Town",     lat: 8.4820, lng: -13.2500 },
  { name: "Congo Cross",     lat: 8.4780, lng: -13.2450 },
  { name: "Tengbeh Town",    lat: 8.4740, lng: -13.2400 },
  { name: "Brookfields",     lat: 8.4760, lng: -13.2350 },
  { name: "New England",     lat: 8.4820, lng: -13.2280 },
  { name: "Circular Road",   lat: 8.4860, lng: -13.2300 },
  { name: "Tower Hill",      lat: 8.4880, lng: -13.2250 },
  { name: "Kissy",           lat: 8.4700, lng: -13.2050 },
  { name: "Wellington",      lat: 8.4600, lng: -13.1900 },
  { name: "Calaba Town",     lat: 8.4650, lng: -13.2000 },
  { name: "Allen Town",      lat: 8.4550, lng: -13.1800 },
  { name: "Waterloo",        lat: 8.3400, lng: -13.0700 },
  { name: "Regent",          lat: 8.5100, lng: -13.2100 },
  { name: "Charlotte",       lat: 8.5200, lng: -13.1900 },
  { name: "Tombo",           lat: 8.2800, lng: -13.1500 },
  { name: "Jui Junction",    lat: 8.4200, lng: -13.1600 },
  { name: "Grafton",         lat: 8.3900, lng: -13.1300 },
  { name: "Leicester Peak",  lat: 8.4900, lng: -13.2150 },
  { name: "Susan's Bay",     lat: 8.4900, lng: -13.2350 },
  { name: "Magazine Cut",    lat: 8.4870, lng: -13.2300 },
  { name: "Cline Town",      lat: 8.4750, lng: -13.2200 },
  { name: "East End",        lat: 8.4730, lng: -13.2150 },
  { name: "Fourah Bay",      lat: 8.4820, lng: -13.2180 },
  { name: "Kroo Bay",        lat: 8.4870, lng: -13.2320 },
  { name: "Fullah Town",     lat: 8.4770, lng: -13.2270 },
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
