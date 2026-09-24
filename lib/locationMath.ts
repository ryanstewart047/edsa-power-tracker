export const REPORTING_TOLERANCE_KM = 3.0;
export const MAX_REPORTING_DISTANCE_KM = 15;
export const AREA_MATCH_TOLERANCE_KM = 1.35;
export const AREA_CANDIDATE_PADDING_KM = 0.5;

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusKm = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
