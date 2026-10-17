export interface AppRelease {
  version: string;
  releaseId: string;
  releasedAt: string;
  title: string;
  notes: string;
  changelog?: string[];
}

// Update releaseId and version whenever a new production release is deployed.
// The in-app update notification will only appear to users when releaseId is newer
// than their acknowledged release in localStorage.
export const CURRENT_RELEASE: AppRelease = {
  version: '0.2.0',
  releaseId: 'rel-2026-10-17-v0.2.0',
  releasedAt: '2026-10-17',
  title: 'EDSA Power Tracker v0.2.0 Released',
  notes: 'Direct camera evidence capture, new hazard & billing services, high-visibility alerts, clean white theme with smooth scrolling, and instant app updates.',
  changelog: [
    'Direct camera photo capture with instant client-side compression for hazard reports',
    'Fixed hazard submission button visibility on mobile devices',
    'Added new service categories: Billing and Account services, Voltage Issues, and Cut or damaged Wires',
    'Modern clean white theme with smooth scrolling and dynamic scroll-driven reveal animations',
    'Interactive homepage quick links with deep-linking to Top-Up and Token Vault',
    'High-visibility orange-yellow in-app notification banners for urgent operations and alerts',
    'Smart app update detection with one-click refresh and silent post-update suppression',
    'Database resilience improvements with self-healing columns and multi-tier offline storage'
  ],
};
