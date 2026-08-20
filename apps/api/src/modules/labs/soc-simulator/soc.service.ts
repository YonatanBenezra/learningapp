import { AppError } from '../../../common/errors/AppError';
import {
  evaluateAnswers,
  publicQuestions,
  type ScenarioResult,
  type SubmittedAnswer,
} from '../scenario.shared';
import { SOC_SCENARIOS } from './soc.scenarios';

export function listScenarios(): Array<{ id: string; title: string; difficulty: string }> {
  return Object.values(SOC_SCENARIOS).map((s) => ({
    id: s.id,
    title: s.title,
    difficulty: s.difficulty,
  }));
}

// Scenario view WITHOUT expected answers (they must never be served to the client).
export function getScenario(id: string) {
  const s = SOC_SCENARIOS[id];
  if (!s) throw new AppError(404, 'Scenario not found');
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    difficulty: s.difficulty,
    alerts: s.alerts,
    logs: s.logs,
    questions: publicQuestions(s.questions),
  };
}

export function submitScenario(id: string, answers: SubmittedAnswer[]): ScenarioResult {
  const s = SOC_SCENARIOS[id];
  if (!s) throw new AppError(404, 'Scenario not found');
  return evaluateAnswers(id, s.questions, answers);
}
