import { AppError } from '../../../common/errors/AppError';
import {
  evaluateAnswers,
  publicQuestions,
  type ScenarioResult,
  type SubmittedAnswer,
} from '../scenario.shared';
import { NETWORK_SCENARIOS } from './network.scenarios';

export function listScenarios(): Array<{ id: string; title: string; difficulty: string }> {
  return Object.values(NETWORK_SCENARIOS).map((s) => ({
    id: s.id,
    title: s.title,
    difficulty: s.difficulty,
  }));
}

// Scenario view WITHOUT expected answers.
export function getScenario(id: string) {
  const s = NETWORK_SCENARIOS[id];
  if (!s) throw new AppError(404, 'Scenario not found');
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    difficulty: s.difficulty,
    pcapSummary: s.pcapSummary,
    questions: publicQuestions(s.questions),
  };
}

export function submitScenario(id: string, answers: SubmittedAnswer[]): ScenarioResult {
  const s = NETWORK_SCENARIOS[id];
  if (!s) throw new AppError(404, 'Scenario not found');
  return evaluateAnswers(id, s.questions, answers);
}
