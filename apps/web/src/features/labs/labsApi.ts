import { apiClient } from '@/src/infrastructure/apiClient';

export type CodeLanguage = 'javascript' | 'python' | 'shell';

export interface SandboxResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  oom: boolean;
  launchFailed: boolean;
  durationMs: number;
}

export interface TerminalCommandResult {
  output: string;
  cwd: string;
  error: boolean;
}

export interface ScenarioQuestion {
  id: string;
  prompt: string;
  hint?: string;
}

export interface SocScenario {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  alerts: Array<{ id: string; severity: string; source: string; message: string }>;
  logs: string[];
  questions: ScenarioQuestion[];
}

export interface NetworkScenario {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  pcapSummary: string[];
  questions: ScenarioQuestion[];
}

export interface ScenarioSubmitResult {
  scenarioId: string;
  score: number;
  total: number;
  correct: number;
  results: Array<{ questionId: string; correct: boolean; expected?: string }>;
}

export function executeCode(input: {
  language: CodeLanguage;
  code: string;
  stdin?: string;
}) {
  return apiClient<{ result: SandboxResult }>('/labs/code/execute', {
    method: 'POST',
    body: JSON.stringify(input),
  }).then((r) => r.result);
}

export function runTerminalCommand(input: { command: string; cwd?: string }) {
  return apiClient<TerminalCommandResult>('/labs/terminal/command', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function listSocScenarios() {
  return apiClient<{ scenarios: Array<{ id: string; title: string; difficulty: string }> }>(
    '/labs/soc/scenarios',
  ).then((r) => r.scenarios);
}

export function getSocScenario(id: string) {
  return apiClient<{ scenario: SocScenario }>(`/labs/soc/scenario/${id}`).then((r) => r.scenario);
}

export function submitSocScenario(
  id: string,
  answers: Array<{ questionId: string; answer: string }>,
) {
  return apiClient<{ result: ScenarioSubmitResult }>(`/labs/soc/scenario/${id}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  }).then((r) => r.result);
}

export function listNetworkScenarios() {
  return apiClient<{ scenarios: Array<{ id: string; title: string; difficulty: string }> }>(
    '/labs/network/scenarios',
  ).then((r) => r.scenarios);
}

export function getNetworkScenario(id: string) {
  return apiClient<{ scenario: NetworkScenario }>(`/labs/network/scenario/${id}`).then(
    (r) => r.scenario,
  );
}

export function submitNetworkScenario(
  id: string,
  answers: Array<{ questionId: string; answer: string }>,
) {
  return apiClient<{ result: ScenarioSubmitResult }>(`/labs/network/scenario/${id}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers }),
  }).then((r) => r.result);
}
