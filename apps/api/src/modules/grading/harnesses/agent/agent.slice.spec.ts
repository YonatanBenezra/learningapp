import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  A3_NEAR_MISS_PAYLOAD,
  A3_REFERENCE_PAYLOAD,
  A4_NEAR_MISS_PAYLOAD,
  A4_REFERENCE_PAYLOAD,
  A5_NEAR_MISS_PAYLOAD,
  A5_REFERENCE_PAYLOAD,
} from '../../../catalogue/exercises/exercises.constants';
import { runLocalPython } from '../../../sandbox/local-python';
import { agentTasksJson } from './agent.input';
import { gradeAgent } from './a1.grade';
import { agentGradeOptions } from './agent.options';
import {
  callBudgetMessage,
  ORDER_FAIL_MESSAGE,
} from './agent.ceilings';
import type { AgentItem } from './agent.types';

function loadHidden(slug: string): AgentItem[] {
  return JSON.parse(
    readFileSync(
      path.join(process.cwd(), `content/exercises/${slug}/eval_hidden.json`),
      'utf8',
    ),
  ) as AgentItem[];
}

async function grade(slug: string, payload: { source: string }) {
  return gradeAgent(
    { ...payload, systemPrompt: '', toolSchemas: '' },
    loadHidden(slug),
    [],
    runLocalPython,
    undefined,
    agentGradeOptions(slug),
  );
}

describe('agent content slice A3–A5', () => {
  it('A3: reference plans calc then store; near-miss stores first', async () => {
    const slug = 'agt-003-plan-the-sequence';
    const passed = await grade(slug, A3_REFERENCE_PAYLOAD);
    expect(passed.verdict).toBe('pass');
    expect(passed.metrics.calc_before_store.value).toBe(1);
    expect(JSON.stringify(passed)).not.toContain('HIDDEN_EVAL');

    const missed = await grade(slug, A3_NEAR_MISS_PAYLOAD);
    expect(missed.verdict).toBe('fail');
    expect(missed.failureClasses).toContain('wrong-order');
    expect(missed.scorecard.message).toBe(ORDER_FAIL_MESSAGE);
    expect(JSON.stringify(missed)).not.toContain('HIDDEN_EVAL');
  });

  it('A4: extra tool calls fail the call budget after gold hits', async () => {
    const slug = 'agt-004-call-budget';
    const passed = await grade(slug, A4_REFERENCE_PAYLOAD);
    expect(passed.verdict).toBe('pass');
    expect(passed.metrics.call_budget.hits).toBeLessThanOrEqual(3);

    const missed = await grade(slug, A4_NEAR_MISS_PAYLOAD);
    expect(missed.verdict).toBe('fail');
    expect(missed.failureClasses).toContain('call-budget');
    expect(missed.scorecard.message).toBe(callBudgetMessage(3));
    expect(JSON.stringify(missed)).not.toContain('HIDDEN_EVAL');
  });

  it('A5: workspace repeats instructions; dedupe passes and a full walk fails', async () => {
    const slug = 'agt-005-dedupe-and-halt';
    const hidden = loadHidden(slug);
    const raw = agentTasksJson(hidden);
    expect(raw).not.toContain('HIDDEN_EVAL');
    expect(JSON.parse(raw).tasks).toHaveLength(4);

    const passed = await grade(slug, A5_REFERENCE_PAYLOAD);
    expect(passed.verdict).toBe('pass');
    expect(passed.metrics.call_budget.hits).toBe(2);

    const missed = await grade(slug, A5_NEAR_MISS_PAYLOAD);
    expect(missed.verdict).toBe('fail');
    expect(missed.failureClasses).toContain('call-budget');
    expect(missed.scorecard.message).toBe(callBudgetMessage(2));
    expect(JSON.stringify(missed)).not.toContain('HIDDEN_EVAL');
  });
});
