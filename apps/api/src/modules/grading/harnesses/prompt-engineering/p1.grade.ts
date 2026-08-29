import type { P1Payload, PeHarnessGradeResult, PeItem } from './pe.types';
import { isPeCanary } from './pe.types';

const ACCURACY = 0.85;
const REQUIRED_KEYS = ['ticket_id', 'priority', 'category'] as const;

export function gradeP1(
  payload: P1Payload,
  hidden: PeItem[],
  publicItems: { question: string }[] = [],
): PeHarnessGradeResult {
  const audit = auditPrompt(payload);
  const usable = hidden.filter((item) => !isPeCanary(item));
  let correct = 0;
  const misses: PeHarnessGradeResult['failingCases'] = [];

  for (const item of usable) {
    const predicted = audit.passed ? extractTicket(item.input) : null;
    const match =
      predicted !== null &&
      predicted.ticket_id === item.gold.ticket_id &&
      predicted.priority === item.gold.priority &&
      predicted.category === item.gold.category;
    if (match) {
      correct += 1;
    } else if (misses.length < 6) {
      misses.push({
        question: item.input,
        output: predicted ? JSON.stringify(predicted) : '(no extraction)',
        note: audit.passed ? 'field-mismatch' : audit.reasons[0],
      });
    }
  }

  const accuracy = usable.length === 0 ? 0 : correct / usable.length;
  const accuracyPass = accuracy >= ACCURACY;
  const auditPass = audit.passed;
  const passed = accuracyPass && auditPass;

  return {
    verdict: passed ? 'pass' : 'fail',
    metrics: {
      field_accuracy: { value: accuracy, correct, total: usable.length },
      prompt_audit: { value: auditPass ? 1 : 0 },
    },
    gateResults: [
      {
        id: 'prompt-audit',
        class: 'A',
        metric: 'prompt_audit',
        op: 'eq',
        value: 1,
        actual: auditPass ? 1 : 0,
        passed: auditPass,
      },
      {
        id: 'field-accuracy',
        class: 'A',
        metric: 'field_accuracy',
        op: 'gte',
        value: ACCURACY,
        actual: accuracy,
        passed: accuracyPass,
      },
    ],
    failureClasses: passed
      ? []
      : [
          ...(auditPass ? [] : ['weak-prompt-contract']),
          ...(accuracyPass ? [] : ['extraction-errors']),
        ],
    scorecard: {
      promptAudit: audit.reasons,
      accuracy,
      requiredKeys: REQUIRED_KEYS,
    },
    failingCases: misses,
    trace: {
      simulator: 'prompt_engineering',
      payload,
      k: 0,
      chunkCount: 0,
      tokensIn: 0,
      tokensOut: 0,
      costEurMicros: 0,
      queries: [
        ...publicItems.slice(0, 2).map((item, index) => ({
          source: 'public' as const,
          question: item.question,
          retrieved: [
            {
              chunkId: `public-${index}`,
              docId: 'brief',
              score: 1,
              text: item.question.slice(0, 120),
            },
          ],
        })),
        ...misses.slice(0, 3).map((item, index) => ({
          source: 'hidden_sample' as const,
          question: item.question ?? '',
          retrieved: [
            {
              chunkId: `miss-${index}`,
              docId: 'extract',
              score: 0,
              text: item.output?.slice(0, 120) ?? '',
            },
          ],
        })),
      ],
    },
  };
}

function auditPrompt(payload: P1Payload): { passed: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const sys = payload.systemPrompt.toLowerCase();

  if (!sys.includes('json')) {
    reasons.push('missing-json-instruction');
  }
  for (const key of REQUIRED_KEYS) {
    if (!sys.includes(key)) {
      reasons.push(`missing-${key}`);
    }
  }
  if (!/(only|valid json|json only|no markdown)/i.test(payload.systemPrompt)) {
    reasons.push('missing-json-only-rule');
  }

  const examples = parseFewShots(payload.fewShotBlock);
  if (examples.length < 2) {
    reasons.push('insufficient-few-shots');
  }
  for (const example of examples) {
    if (!validExtractionJson(example.output)) {
      reasons.push('invalid-few-shot-json');
      break;
    }
  }

  return { passed: reasons.length === 0, reasons };
}

function parseFewShots(block: string): { input: string; output: string }[] {
  const examples: { input: string; output: string }[] = [];
  let currentInput: string | null = null;

  for (const line of block.split('\n')) {
    const inputMatch =
      line.match(/^\s*-\s*input:\s*"(.*)"\s*$/) ??
      line.match(/^\s*input:\s*"(.*)"\s*$/);
    const outputMatch =
      line.match(/^\s*output:\s*'(.*)'\s*$/) ??
      line.match(/^\s*output:\s*"(.*)"\s*$/);

    if (inputMatch) {
      currentInput = inputMatch[1] ?? '';
    }
    if (outputMatch && currentInput) {
      examples.push({ input: currentInput, output: outputMatch[1] ?? '' });
      currentInput = null;
    }
  }

  return examples;
}

function validExtractionJson(raw: string): boolean {
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return REQUIRED_KEYS.every(
      (key) => typeof parsed[key] === 'string' && parsed[key].length > 0,
    );
  } catch {
    return false;
  }
}

function extractTicket(
  input: string,
): { ticket_id: string; priority: string; category: string } | null {
  const ticketMatch = input.match(/TCK-\d+/i);
  if (!ticketMatch) {
    return null;
  }

  const ticket_id = ticketMatch[0].toUpperCase();
  const lower = input.toLowerCase();

  let priority = 'medium';
  if (/\b(urgent|critical|high|asap|escalated)\b/.test(lower)) {
    priority = 'high';
  } else if (/\b(low|minor)\b/.test(lower)) {
    priority = 'low';
  }

  const categories = [
    'billing',
    'wifi',
    'refund',
    'access',
    'booking',
    'security',
    'hardware',
  ];
  let category = 'general';
  for (const candidate of categories) {
    if (lower.includes(candidate)) {
      category = candidate;
      break;
    }
  }

  return { ticket_id, priority, category };
}
