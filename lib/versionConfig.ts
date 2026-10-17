export interface AppRelease {
  version: string;
  releaseId: string;
  releasedAt: string;
  title: string;
  notes: string;
}

// Update releaseId and version whenever a new production release is deployed.
// The in-app update notification will only appear to users when releaseId is newer
// than their acknowledged release in localStorage.
export const CURRENT_RELEASE: AppRelease = {
  version: '0.1.1',
  releaseId: 'rel-2026-10-17-01',
  releasedAt: '2026-10-17',
  title: 'EDSA Tracker Update Available',
  notes: 'Includes new hazard services, high-visibility alerts, and operational improvements.',
};
