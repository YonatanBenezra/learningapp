// Shared answer-matching + answer-stripping for the data-driven simulators
// (SOC §2, Network/SIEM §2). No code execution — inherently safe.

export interface ScenarioQuestion {
  id: string;
  prompt: string;
  expected: string[]; // acceptable answers (normalized, case-insensitive)
  hint?: string;
}

export interface SubmittedAnswer {
  questionId: string;
  answer: string;
}

export interface QuestionResult {
  questionId: string;
  correct: boolean;
  expected?: string; // only revealed for questions answered correctly (no answer harvesting)
}

export interface ScenarioResult {
  scenarioId: string;
  score: number;
  total: number;
  correct: number;
  results: QuestionResult[];
}

const normalize = (v: string): string => v.trim().toLowerCase().replace(/\s+/g, ' ');

export function evaluateAnswers(
  scenarioId: string,
  questions: ScenarioQuestion[],
  answers: SubmittedAnswer[],
): ScenarioResult {
  const byId = new Map(answers.map((a) => [a.questionId, a.answer]));
  const results: QuestionResult[] = questions.map((q) => {
    const given = byId.get(q.id);
    const correct =
      typeof given === 'string' && q.expected.some((e) => normalize(e) === normalize(given));
    // Reveal the expected answer only when the user got it right — otherwise a
    // single throwaway submission would harvest every answer for a perfect resubmit.
    return correct ? { questionId: q.id, correct, expected: q.expected[0] } : { questionId: q.id, correct };
  });
  const correct = results.filter((r) => r.correct).length;
  return {
    scenarioId,
    score: questions.length ? Math.round((correct / questions.length) * 100) : 0,
    total: questions.length,
    correct,
    results,
  };
}

// Client-facing question list — expected answers removed so they never leak (§ same
// principle as stripping quiz correctAnswer).
export function publicQuestions(
  questions: ScenarioQuestion[],
): Array<{ id: string; prompt: string; hint?: string }> {
  return questions.map(({ id, prompt, hint }) => ({ id, prompt, hint }));
}
