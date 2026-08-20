// Static SOC (Security Operations Center) triage scenarios (§2). Low-risk: pure
// data + answer-matching, no code execution.
import type { ScenarioQuestion } from '../scenario.shared';

export interface SocAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  message: string;
}

export interface SocScenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  alerts: SocAlert[];
  logs: string[];
  questions: ScenarioQuestion[];
}

export const SOC_SCENARIOS: Record<string, SocScenario> = {
  'phishing-triage': {
    id: 'phishing-triage',
    title: 'Suspicious Email Campaign',
    description: 'Triage a burst of alerts from the email gateway and endpoint agents.',
    difficulty: 'easy',
    alerts: [
      {
        id: 'a1',
        severity: 'high',
        source: 'email-gw',
        message: 'Executable attachment invoice.exe delivered to 12 mailboxes from billing@paypa1.com',
      },
      {
        id: 'a2',
        severity: 'medium',
        source: 'edr',
        message: 'Process invoice.exe spawned powershell.exe with encoded command on HOST-14',
      },
    ],
    logs: [
      '2026-07-14T09:01Z email-gw ALLOW from=billing@paypa1.com subject="Overdue Invoice"',
      '2026-07-14T09:04Z edr HOST-14 invoice.exe -> powershell -enc SQBFAFgA...',
      '2026-07-14T09:05Z proxy HOST-14 GET http://45.33.12.8/payload.bin',
    ],
    questions: [
      {
        id: 'q1',
        prompt: 'What is the sender domain used for the phishing campaign?',
        expected: ['paypa1.com', 'billing@paypa1.com'],
        hint: 'Look closely at the spelling.',
      },
      {
        id: 'q2',
        prompt: 'Which host shows signs of compromise?',
        expected: ['HOST-14', 'host-14'],
      },
      {
        id: 'q3',
        prompt: 'What is the callback (C2) IP address contacted after execution?',
        expected: ['45.33.12.8'],
      },
    ],
  },
  'brute-force': {
    id: 'brute-force',
    title: 'Failed Login Storm',
    description: 'A spike in authentication failures hits an internet-facing service.',
    difficulty: 'medium',
    alerts: [
      {
        id: 'a1',
        severity: 'high',
        source: 'siem',
        message: '412 failed SSH logins for user root from a single source in 3 minutes',
      },
    ],
    logs: [
      '2026-07-14T02:11Z sshd Failed password for root from 203.0.113.77 port 51001',
      '2026-07-14T02:11Z sshd Failed password for root from 203.0.113.77 port 51002',
      '2026-07-14T02:14Z sshd Accepted password for root from 203.0.113.77 port 51244',
    ],
    questions: [
      {
        id: 'q1',
        prompt: 'What is the attacker source IP?',
        expected: ['203.0.113.77'],
      },
      {
        id: 'q2',
        prompt: 'What type of attack is this? (one word)',
        expected: ['brute-force', 'bruteforce', 'brute force'],
      },
      {
        id: 'q3',
        prompt: 'Did the attack ultimately succeed? (yes/no)',
        expected: ['yes'],
      },
    ],
  },
};
