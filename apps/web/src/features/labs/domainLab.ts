import type { Domain } from '@/src/domain/course';

export type LabKind = 'code' | 'terminal' | 'soc' | 'network';

export interface LabMeta {
  kind: LabKind;
  label: string;
  description: string;
}

export const DOMAIN_LAB: Record<Domain, LabMeta> = {
  programming: {
    kind: 'code',
    label: 'Coding IDE',
    description: 'Write and run code in a sandboxed editor.',
  },
  os: {
    kind: 'terminal',
    label: 'Terminal Lab',
    description: 'Practice commands in a safe emulated shell.',
  },
  cybersecurity: {
    kind: 'soc',
    label: 'SOC Simulator',
    description: 'Triage alerts and investigate security incidents.',
  },
  networking: {
    kind: 'network',
    label: 'Network Simulator',
    description: 'Analyze traffic patterns and network events.',
  },
  general: {
    kind: 'code',
    label: 'Practice Lab',
    description: 'Hands-on practice for this lesson.',
  },
};

export function resolveLabForDomain(domain: string): LabMeta {
  return DOMAIN_LAB[domain as Domain] ?? DOMAIN_LAB.general;
}

export function resolveLabForExerciseDomain(domain: string): LabMeta {
  const normalized = domain.toLowerCase();
  if (normalized.includes('network')) return DOMAIN_LAB.networking;
  if (normalized.includes('cyber') || normalized.includes('security') || normalized.includes('soc')) {
    return DOMAIN_LAB.cybersecurity;
  }
  if (normalized.includes('terminal') || normalized.includes('os')) return DOMAIN_LAB.os;
  if (normalized.includes('program') || normalized.includes('code')) return DOMAIN_LAB.programming;
  return resolveLabForDomain(domain);
}
