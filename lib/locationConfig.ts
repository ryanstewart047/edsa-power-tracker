export const GEOLOCATION_TIMEOUT_MS = 15_000;
export const GEOLOCATION_MAXIMUM_AGE_MS = 5_000;
export const GPS_WARNING_ACCURACY_METERS = 250;
export const MAX_REPORTING_ACCURACY_METERS = 500;

export const HAZARD_TYPES = [
  'Falling Pole',
  'Sparking Cable',
  'Transformer Issue',
  'Illegal Connection',
  'Stolen Meter',
  'Other Danger',
] as const;

export type HazardType = (typeof HAZARD_TYPES)[number];
