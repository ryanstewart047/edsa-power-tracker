export const GEOLOCATION_TIMEOUT_MS = 20_000;
export const GEOLOCATION_MAXIMUM_AGE_MS = 60_000;
export const GPS_WARNING_ACCURACY_METERS = 250;
export const MAX_LOCATION_ACCESS_ACCURACY_METERS = 2000;
export const MAX_REPORTING_ACCURACY_METERS = 500;

export const HAZARD_TYPES = [
  'Falling Pole',
  'Sparking Cable',
  'Cut or damaged Wires',
  'Transformer Issue',
  'Voltage Issues (Low or high)',
  'Billing and Account services',
  'Illegal Connection',
  'Stolen Meter',
  'Other Danger',
] as const;

export type HazardType = (typeof HAZARD_TYPES)[number];
