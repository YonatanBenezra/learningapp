import type { PromptLabRunResult, SimulationSubmitResult } from './simulation.types';

const PASS_SCORE = 70;

function scorePromptText(prompt: string): number {
  const p = prompt.trim().toLowerCase();
  if (!p) return 0;

  let score = 15;
  if (/\bjson\b/.test(p)) score += 25;
  if (/\btitle\b/.test(p) && /\bsummary\b/.test(p)) score += 25;
  if (/\b(only|just|must|exactly|keys?)\b/.test(p)) score += 15;
  if (/\b(no markdown|without markdown|plain json|valid json)\b/.test(p)) score += 10;
  if (/\b(500 words|essay|paragraph|explain in detail|markdown)\b/.test(p)) score -= 20;
  if (p.length < 40) score -= 10;

  return Math.max(0, Math.min(100, score));
}

function mockOutput(score: number): string {
  if (score >= PASS_SCORE) {
    return JSON.stringify(
      {
        title: 'Solid budget earbuds',
        summary: 'Clear sound and good value; battery and case quality are average.',
      },
      null,
      2,
    );
  }
  if (score >= 40) {
    return 'Title: Solid budget earbuds\n\nSummary: Clear sound and good value, though battery life and case quality are only average.';
  }
  return 'These wireless earbuds sound surprisingly clear for the price. Battery lasts about five hours. The case feels a bit cheap, but overall great value for commuters.';
}

function buildHints(prompt: string, score: number): string[] {
  const hints: string[] = [];
  const p = prompt.toLowerCase();

  if (score >= PASS_SCORE) {
    hints.push('Your prompt is explicit enough to steer the model toward structured JSON.');
    return hints;
  }
  if (!/\bjson\b/.test(p)) hints.push('Ask for JSON output explicitly.');
  if (!/\btitle\b/.test(p) || !/\bsummary\b/.test(p)) {
    hints.push('Name the required keys: "title" and "summary".');
  }
  if (!/\b(only|must|exactly|no markdown)\b/.test(p)) {
    hints.push('Add constraints like "JSON only" or "no markdown".');
  }
  if (prompt.trim().length < 40) hints.push('Add a bit more instruction so the model knows the format.');

  return hints.slice(0, 3);
}

function buildFeedback(score: number, passed: boolean): string {
  if (passed) {
    return 'Strong prompt. You specified JSON, the required keys, and format constraints — the mock model returned valid structured output.';
  }
  if (score >= 40) {
    return 'Partially structured output. Tighten the prompt so the model must return JSON only with keys "title" and "summary".';
  }
  return 'Unstructured output. The prompt reads like a generic writing task — specify JSON, key names, and "no markdown".';
}

export function runPromptLab(prompt: string): PromptLabRunResult {
  const qualityScore = scorePromptText(prompt);
  return {
    output: mockOutput(qualityScore),
    qualityScore,
    hints: buildHints(prompt, qualityScore),
  };
}

export function submitPromptLab(prompt: string): SimulationSubmitResult {
  const score = scorePromptText(prompt);
  const passed = score >= PASS_SCORE;
  return {
    passed,
    score,
    output: mockOutput(score),
    feedback: buildFeedback(score, passed),
  };
}
