import {
  MAX_REPORTING_DISTANCE_KM,
  SIERRA_LEONE_COUNTRY,
  findAreaById,
  getAreaMatchToleranceKm,
  getAreaProximity,
} from './areas';
import type { AreaStatus } from './areas';
import {
  HAZARD_TYPES,
  MAX_REPORTING_ACCURACY_METERS,
} from './locationConfig';
import type { HazardType } from './locationConfig';

export {
  GEOLOCATION_MAXIMUM_AGE_MS,
  GEOLOCATION_TIMEOUT_MS,
  GPS_WARNING_ACCURACY_METERS,
  HAZARD_TYPES,
  MAX_REPORTING_ACCURACY_METERS,
} from './locationConfig';
export type { HazardType } from './locationConfig';

export const REPORT_EXPIRY_HOURS = 6;
export const MIN_REPORTS_TO_CONFIRM = 3;
export const DUPLICATE_WINDOW_HOURS = 2;
export const HAZARD_DUPLICATE_WINDOW_MINUTES = 10;
export const RECENT_REPORT_WINDOW_MINUTES = 30;

const MAX_IMAGE_LENGTH = 2_000_000;

export type ReporterLocationValidation =
  | {
      ok: true;
      area: string;
      areaName: string;
      region: string;
      lat: number;
      lng: number;
      accuracyMeters: number;
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

export function parseAccuracyMeters(value: unknown): number | null {
  const accuracy = parseCoordinate(value);
  return accuracy !== null && accuracy >= 0 ? accuracy : null;
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
  accuracyInput?: unknown,
): ReporterLocationValidation {
  const areaId = parseOptionalText(areaInput, 80);
  if (!areaId) {
    return {
      ok: false,
      status: 400,
      body: {
        error: 'Invalid area',
        message: 'Please choose a valid area before submitting a report.',
      },
    };
  }

  const area = findAreaById(areaId);
  if (!area) {
    return {
      ok: false,
      status: 400,
      body: {
        error: 'Unknown area',
        message: 'That location is not part of the tracked Sierra Leone coverage list.',
      },
    };
  }

  const lat = parseCoordinate(latInput);
  const lng = parseCoordinate(lngInput);
  const accuracyMeters = parseAccuracyMeters(accuracyInput);

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

  if (accuracyMeters === null) {
    return {
      ok: false,
      status: 403,
      body: {
        error: 'GPS accuracy required',
        message: 'Your browser must provide GPS accuracy before this report can be verified.',
      },
    };
  }

  if (accuracyMeters > MAX_REPORTING_ACCURACY_METERS) {
    return {
      ok: false,
      status: 403,
      body: {
        error: 'Low GPS accuracy',
        message: `Your GPS signal is too broad (${Math.round(accuracyMeters)}m). Refresh GPS or move outdoors before reporting.`,
      },
    };
  }

  const proximity = getAreaProximity(area.id, lat, lng);
  const targetArea = proximity.targetArea;
  const closestArea = proximity.closestArea;

  if (!targetArea || targetArea.distanceKm > MAX_REPORTING_DISTANCE_KM) {
    return {
      ok: false,
      status: 403,
      body: {
        error: 'Out of bounds',
        message: `You are too far from ${SIERRA_LEONE_COUNTRY} to submit a report.`,
      },
    };
  }

  if (
    closestArea &&
    targetArea.distanceKm > closestArea.distanceKm + getAreaMatchToleranceKm(accuracyMeters)
  ) {
    return {
      ok: false,
      status: 403,
      body: {
        error: 'Location mismatch',
        message: `You appear to be closer to ${closestArea.name}, ${closestArea.region}. Please report for your current location.`,
      },
    };
  }

  return {
    ok: true,
    area: area.id,
    areaName: area.name,
    region: area.region,
    lat,
    lng,
    accuracyMeters: Math.round(accuracyMeters),
    closestAreaName: closestArea?.name ?? area.name,
    distanceKm: Number(targetArea.distanceKm.toFixed(2)),
  };
}
