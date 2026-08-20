// Static Network / SIEM investigation scenarios (§2). Low-risk: pure data +
// answer-matching, no code execution.
import type { ScenarioQuestion } from '../scenario.shared';

export interface NetworkScenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  pcapSummary: string[]; // human-readable packet/flow summary lines
  questions: ScenarioQuestion[];
}

export const NETWORK_SCENARIOS: Record<string, NetworkScenario> = {
  'port-scan': {
    id: 'port-scan',
    title: 'Reconnaissance Sweep',
    description: 'Review flow records from the perimeter firewall for scanning activity.',
    difficulty: 'easy',
    pcapSummary: [
      '10.0.0.5 -> 10.0.0.20:22 SYN',
      '10.0.0.5 -> 10.0.0.20:23 SYN',
      '10.0.0.5 -> 10.0.0.20:80 SYN',
      '10.0.0.5 -> 10.0.0.20:443 SYN',
      '10.0.0.5 -> 10.0.0.20:3389 SYN (1000+ ports in 4s)',
    ],
    questions: [
      { id: 'q1', prompt: 'Which host is performing the scan?', expected: ['10.0.0.5'] },
      { id: 'q2', prompt: 'Which host is the scan target?', expected: ['10.0.0.20'] },
      {
        id: 'q3',
        prompt: 'What reconnaissance technique is shown? (two words)',
        expected: ['port scan', 'port-scan', 'portscan'],
      },
    ],
  },
  'dns-exfil': {
    id: 'dns-exfil',
    title: 'Unusual DNS Traffic',
    description: 'A workstation is emitting a high volume of oddly-shaped DNS queries.',
    difficulty: 'hard',
    pcapSummary: [
      '10.0.0.42 -> 8.8.8.8 TXT a1b2c3d4e5.exfil.attacker.com',
      '10.0.0.42 -> 8.8.8.8 TXT f6g7h8i9j0.exfil.attacker.com',
      '10.0.0.42 -> 8.8.8.8 TXT (480 unique subdomains in 60s)',
    ],
    questions: [
      { id: 'q1', prompt: 'Which internal host is the source?', expected: ['10.0.0.42'] },
      {
        id: 'q2',
        prompt: 'What is the attacker-controlled domain?',
        expected: ['exfil.attacker.com', 'attacker.com'],
      },
      {
        id: 'q3',
        prompt: 'What technique is this? (two words)',
        expected: ['dns exfiltration', 'dns exfil', 'data exfiltration'],
      },
    ],
  },
  'syn-flood': {
    id: 'syn-flood',
    title: 'Perimeter SYN Flood',
    description: 'The edge firewall is logging an abnormal burst of half-open TCP connections.',
    difficulty: 'medium',
    pcapSummary: [
      '203.0.113.44 -> 10.0.0.10:443 SYN',
      '203.0.113.44 -> 10.0.0.10:443 SYN',
      '203.0.113.44 -> 10.0.0.10:443 SYN',
      '203.0.113.44 -> 10.0.0.10:443 SYN (12000 SYN/sec, no ACK)',
      '10.0.0.10 -> 203.0.113.44:443 SYN-ACK (backlog saturated)',
    ],
    questions: [
      { id: 'q1', prompt: 'Which IP is the attack source?', expected: ['203.0.113.44'] },
      { id: 'q2', prompt: 'Which internal service is targeted?', expected: ['10.0.0.10'] },
      {
        id: 'q3',
        prompt: 'What attack type is shown? (two words)',
        expected: ['syn flood', 'syn-flood', 'tcp syn flood'],
      },
    ],
  },
  'lateral-scan': {
    id: 'lateral-scan',
    title: 'Internal Lateral Scan',
    description: 'A compromised workstation is probing adjacent hosts on common admin ports.',
    difficulty: 'medium',
    pcapSummary: [
      '10.0.1.15 -> 10.0.1.20:445 SYN',
      '10.0.1.15 -> 10.0.1.21:445 SYN',
      '10.0.1.15 -> 10.0.1.22:445 SYN',
      '10.0.1.15 -> 10.0.1.20:3389 SYN',
      '10.0.1.15 -> 10.0.1.21:3389 SYN (15 hosts in 30s)',
    ],
    questions: [
      { id: 'q1', prompt: 'Which host is scanning internally?', expected: ['10.0.1.15'] },
      {
        id: 'q2',
        prompt: 'Which port suggests Windows admin access attempts?',
        expected: ['445', 'port 445'],
      },
      {
        id: 'q3',
        prompt: 'What stage of attack is this? (one word)',
        expected: ['lateral', 'lateral movement', 'discovery'],
      },
    ],
  },
  beaconing: {
    id: 'beaconing',
    title: 'C2 Beaconing Pattern',
    description: 'NetFlow shows a workstation calling out to the same external host every 60 seconds.',
    difficulty: 'hard',
    pcapSummary: [
      '10.0.2.88 -> 198.51.100.7:443 HTTPS (60s interval)',
      '10.0.2.88 -> 198.51.100.7:443 HTTPS (60s interval)',
      '10.0.2.88 -> 198.51.100.7:443 HTTPS (60s interval)',
      '10.0.2.88 -> 198.51.100.7:443 HTTPS (fixed 512-byte payload)',
      '10.0.2.88 -> 198.51.100.7:443 HTTPS (beacon pattern over 6 hours)',
    ],
    questions: [
      { id: 'q1', prompt: 'Which internal host is beaconing?', expected: ['10.0.2.88'] },
      { id: 'q2', prompt: 'What is the external C2 IP?', expected: ['198.51.100.7'] },
      {
        id: 'q3',
        prompt: 'What is this behavior called? (one word)',
        expected: ['beaconing', 'c2', 'command and control'],
      },
    ],
  },
};
