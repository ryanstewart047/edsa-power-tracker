import { GEOLOCATION_MAXIMUM_AGE_MS, GEOLOCATION_TIMEOUT_MS } from '@/lib/locationConfig';

let activeLocationRequest: Promise<GeolocationPosition> | null = null;

function getPosition(options: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const deadline = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject({
        code: 3,
        message: 'Location request timed out.',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError);
    }, (options.timeout ?? GEOLOCATION_TIMEOUT_MS) + 1_000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(deadline);
        resolve(position);
      },
      (error) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(deadline);
        reject(error);
      },
      options,
    );
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

  // A standard location fix is usually available much sooner in Android WebView
  // than a precise GPS fix. It is enough to load nearby communities; the
  // tracker's watchPosition request continues refining it afterwards.
  activeLocationRequest = getPosition({
    enableHighAccuracy: false,
    timeout: Math.min(GEOLOCATION_TIMEOUT_MS, 10_000),
    maximumAge: GEOLOCATION_MAXIMUM_AGE_MS,
  }).catch((error: GeolocationPositionError) => {
    if (error.code !== 2 && error.code !== 3) {
      throw error;
    }

    // Android can have a valid network/GPS fix in its cache before a fresh
    // high-accuracy reading is available. Use it to identify the community.
    return getPosition({
      enableHighAccuracy: true,
      timeout: Math.min(GEOLOCATION_TIMEOUT_MS, 12_000),
      maximumAge: 0,
    });
  }).finally(() => {
    activeLocationRequest = null;
  });

  return activeLocationRequest;
}
