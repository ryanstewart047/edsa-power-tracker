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
// Previous active bundle: Version code 5 (1.0.4)
// New release bundle: Version code 6 (1.0.5)
export const CURRENT_RELEASE: AppRelease = {
  version: '1.0.5',
  releaseNumber: 6,
  releaseId: 'play-release-6-v1.0.5',
  releasedAt: '2026-10-21',
  title: 'EDSA Power Tracker v1.0.5 Update Available',
  notes: 'Individual meter financial analytics, Sierra Leone numeric keypad shortcodes, private community grid bulletin sync, and EDSA homepage news & events carousel.',
  changelog: [
    'Per-Meter Financial & Usage Breakdown: Deep-dive spending analytics (weekly/monthly), visual expenditure charts, daily burn rate, and projected token expiry dates',
    'Interactive Meter Nickname Editing: Rename meters anytime with instant multi-tier persistence',
    'Numeric-Only Meter Keypad Support: Added direct shortcodes for Sierra Leone prepaid meters without * or # keys (Conlog, Hexing, Holley, Inhemeter, Landis+Gyr, Chint)',
    'Community Grid Bulletin Synchronization: Persistent neighborhood outage reports with strict area-level privacy and 15-second background sync',
    'EDSA News & Events Carousel: Interactive homepage slider with smooth-scrolling popup modal and one-click WhatsApp sharing',
    'News & Events Admin Suite: Control panel for uploading photos, editing announcements, and instantly toggling card visibility',
    'Clean Meter Management: Fully removed the default demo meter so users start with a clean slate and manage real meters'
  ],
};
