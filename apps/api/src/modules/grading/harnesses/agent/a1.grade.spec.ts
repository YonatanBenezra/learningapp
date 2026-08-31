import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  A1_LOOP_PAYLOAD,
  A1_NEAR_MISS_PAYLOAD,
  A1_REFERENCE_PAYLOAD,
} from '../../../catalogue/exercises/exercises.constants';
import { runLocalPython } from '../../../sandbox/local-python';
import { agentTasksJson } from './agent.input';
import { KILLED_LOOP_MESSAGE } from './agent.ceilings';
import type { AgentItem } from './agent.types';
import { gradeA1 } from './a1.grade';

const hidden = JSON.parse(
  readFileSync(
    path.join(
      process.cwd(),
      'content/exercises/agt-001-call-the-right-tool/eval_hidden.json',
    ),
    'utf8',
  ),
) as AgentItem[];

describe('gradeA1', () => {
  it('does not mount hidden canaries into the sandbox workspace', () => {
    const raw = agentTasksJson(hidden);
    expect(raw).not.toContain('HIDDEN_EVAL');
    expect(raw).toContain('CALCULATOR');
    expect(raw).toContain('JSON_STORE');
  });

  it('passes the reference agent with a readable step trace and no hidden eval', async () => {
    const result = await gradeA1(
      A1_REFERENCE_PAYLOAD,
      hidden,
      [{ question: 'CALCULATOR expr=2+2' }],
      runLocalPython,
    );
    expect(result.verdict).toBe('pass');
    expect(result.metrics.tool_hits.value).toBe(1);
    expect(result.metrics.loop_ok.value).toBe(1);
    expect(result.trace.sandbox.durationMs).toBeGreaterThan(0);
    expect(result.scorecard.wallClock).toBe('information');
    expect(result.trace.steps.some((step) => step.name === 'calculator')).toBe(
      true,
    );
    expect(result.trace.steps.some((step) => step.name === 'json_store')).toBe(
      true,
    );
    expect(result.trace.steps.every((step) => step.argsSummary.length > 0)).toBe(
      true,
    );
    expect(result.trace.steps.every((step) => step.kind === 'tool')).toBe(true);
    expect(JSON.stringify(result.trace.steps)).not.toContain('"args":');
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
    expect(JSON.stringify(result.trace)).not.toContain('HIDDEN_EVAL');
    expect(JSON.stringify(result.failingCases)).not.toContain('12*(3+4)');
  });

  it('fails a near-miss that always calls calculator', async () => {
    const result = await gradeA1(
      A1_NEAR_MISS_PAYLOAD,
      hidden,
      [],
      runLocalPython,
    );
    expect(result.verdict).toBe('fail');
    expect(result.failureClasses).toContain('wrong-tool');
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
  });

  it('fails an over-loop attempt with a learner-facing killed_loop message', async () => {
    const result = await gradeA1(A1_LOOP_PAYLOAD, hidden, [], runLocalPython);
    expect(result.verdict).toBe('fail');
    expect(result.failureClasses).toContain('killed_loop');
    expect(result.metrics.loop_ok.value).toBe(0);
    expect(result.scorecard.message).toBe(KILLED_LOOP_MESSAGE);
    expect(result.failingCases[0]?.note).toBe(KILLED_LOOP_MESSAGE);
    expect(result.trace.ceilings.killedLoop).toBe(true);
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
  });

  it('fails a canary echo without putting the canary in the scorecard', async () => {
    const result = await gradeA1(
      {
        source: 'print("HIDDEN_EVAL_A1_CANARY_PHRASE")',
        systemPrompt: '',
        toolSchemas: '',
      },
      hidden,
      [],
      runLocalPython,
    );
    expect(result.verdict).toBe('fail');
    expect(result.failureClasses).toContain('canary-leak');
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
  });
});
