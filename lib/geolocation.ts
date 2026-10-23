import { GEOLOCATION_MAXIMUM_AGE_MS, GEOLOCATION_TIMEOUT_MS } from '@/lib/locationConfig';

let activeLocationRequest: Promise<GeolocationPosition> | null = null;

function getPosition(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

/**
 * Share one browser GPS request between the onboarding, location guard, and
 * tracker. Android WebView/TWA can leave parallel location requests pending.
 */
export function requestSharedLocation(): Promise<GeolocationPosition> {
  if (activeLocationRequest) {
    return activeLocationRequest;
  }

  activeLocationRequest = getPosition({
    enableHighAccuracy: true,
    timeout: GEOLOCATION_TIMEOUT_MS,
    maximumAge: GEOLOCATION_MAXIMUM_AGE_MS,
  }).catch((error: GeolocationPositionError) => {
    if (error.code !== error.POSITION_UNAVAILABLE && error.code !== error.TIMEOUT) {
      throw error;
    }

    // Android can have a valid network/GPS fix in its cache before a fresh
    // high-accuracy reading is available. Use it to identify the community.
    return getPosition({
      enableHighAccuracy: false,
      timeout: GEOLOCATION_TIMEOUT_MS,
      maximumAge: 5 * 60_000,
    });
  }).finally(() => {
    activeLocationRequest = null;
  });

  return activeLocationRequest;
}
