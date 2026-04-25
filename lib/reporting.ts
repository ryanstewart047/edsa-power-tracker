import {
  AreaStatus,
  FREETOWN_CITY,
  MAX_REPORTING_DISTANCE_KM,
  REPORTING_TOLERANCE_KM,
  findAreaByName,
  getAreaProximity,
} from './areas';

export const REPORT_EXPIRY_HOURS = 6;
export const MIN_REPORTS_TO_CONFIRM = 3;
export const DUPLICATE_WINDOW_HOURS = 2;
export const HAZARD_DUPLICATE_WINDOW_MINUTES = 10;
export const RECENT_REPORT_WINDOW_MINUTES = 30;

export const GEOLOCATION_TIMEOUT_MS = 15_000;
export const GEOLOCATION_MAXIMUM_AGE_MS = 30_000;
export const GPS_WARNING_ACCURACY_METERS = 250;
export const MAX_REPORTING_ACCURACY_METERS = 1_000;

export const HAZARD_TYPES = [
  'Falling Pole',
  'Sparking Cable',
  'Transformer Issue',
  'Illegal Connection',
  'Other Danger',
] as const;

export type HazardType = (typeof HAZARD_TYPES)[number];

const MAX_IMAGE_LENGTH = 2_000_000;

export type ReporterLocationValidation =
  | {
      ok: true;
      area: string;
      lat: number;
      lng: number;
      closestAreaName: string;
      distanceKm: number;
    }
  | {
      ok: false;
      status: number;
      body: {
        error: string;
        message: string;
      };
    };

export function parseCoordinate(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function parseOptionalText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, maxLength);
}

export function parseDeviceId(value: unknown): string | null {
  return parseOptionalText(value, 120);
}

export function normalizePowerStatus(value: unknown): AreaStatus | null {
  return value === 'on' || value === 'out' || value === 'unknown' ? value : null;
}

export function normalizeHazardType(value: unknown): HazardType | null {
  return HAZARD_TYPES.includes(value as HazardType) ? (value as HazardType) : null;
}

export function normalizeHazardImage(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const image = value.trim();
  if (!image || image.length > MAX_IMAGE_LENGTH) {
    return null;
  }

  if (image.startsWith('data:image/')) {
    return image;
  }

  try {
    const url = new URL(image);
    return url.protocol === 'http:' || url.protocol === 'https:' ? image : null;
  } catch {
    return null;
  }
}

export function validateReporterLocation(
  areaInput: unknown,
  latInput: unknown,
  lngInput: unknown,
): ReporterLocationValidation {
  const areaName = parseOptionalText(areaInput, 80);
  if (!areaName) {
    return {
      ok: false,
      status: 400,
      body: {
        error: 'Invalid area',
        message: 'Please choose a valid area before submitting a report.',
      },
    };
  }

  const area = findAreaByName(areaName);
  if (!area) {
    return {
      ok: false,
      status: 400,
      body: {
        error: 'Unknown area',
        message: 'That area is not part of the tracked Freetown coverage list.',
      },
    };
  }

  const lat = parseCoordinate(latInput);
  const lng = parseCoordinate(lngInput);

  if (lat === null || lng === null) {
    return {
      ok: false,
      status: 403,
      body: {
        error: 'Location required',
        message: 'Your GPS location is required to verify this report.',
      },
    };
  }

  const proximity = getAreaProximity(area.name, lat, lng);
  const targetArea = proximity.targetArea;
  const closestArea = proximity.closestArea;

  if (!targetArea || targetArea.distanceKm > MAX_REPORTING_DISTANCE_KM) {
    return {
      ok: false,
      status: 403,
      body: {
        error: 'Out of bounds',
        message: `You are too far from ${FREETOWN_CITY} to submit a report.`,
      },
    };
  }

  if (
    closestArea &&
    targetArea.distanceKm > closestArea.distanceKm + REPORTING_TOLERANCE_KM
  ) {
    return {
      ok: false,
      status: 403,
      body: {
        error: 'Location mismatch',
        message: `You appear to be closer to ${closestArea.name}. Please report for your current area.`,
      },
    };
  }

  return {
    ok: true,
    area: area.name,
    lat,
    lng,
    closestAreaName: closestArea?.name ?? area.name,
    distanceKm: Number(targetArea.distanceKm.toFixed(2)),
  };
}
