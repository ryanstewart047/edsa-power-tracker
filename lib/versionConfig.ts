export interface AppRelease {
  version: string;
  releaseNumber: number;
  releaseId: string;
  releasedAt: string;
  title: string;
  notes: string;
  changelog?: string[];
}

// Configured to follow Google Play Console release sequence:
// Previous active bundle: Version code 4 (1.0.3)
// New release bundle: Version code 5 (1.0.4)
export const CURRENT_RELEASE: AppRelease = {
  version: '1.0.4',
  releaseNumber: 5,
  releaseId: 'play-release-5-v1.0.4',
  releasedAt: '2026-10-17',
  title: 'EDSA Power Tracker v1.0.4 Update Available',
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
