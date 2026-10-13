import { randomUUID } from 'crypto';

export const INCIDENT_STATUSES = ['received', 'reviewing', 'dispatched', 'resolved'] as const;
export const INCIDENT_SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;

export type IncidentStatus = typeof INCIDENT_STATUSES[number];
export type IncidentSeverity = typeof INCIDENT_SEVERITIES[number];

export function createHazardReference() {
  return `HZ-${new Date().getFullYear()}-${randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

export function initialSeverity(type: string): IncidentSeverity {
  if (type === 'Sparking Cable' || type === 'Falling Pole') return 'critical';
  if (type === 'Illegal Connection') return 'high';
  return 'medium';
}

export function initialSlaDueAt(severity: IncidentSeverity) {
  const hours = severity === 'critical' ? 2 : severity === 'high' ? 8 : severity === 'medium' ? 24 : 72;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
