import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  A2_NEAR_MISS_PAYLOAD,
  A2_REFERENCE_PAYLOAD,
} from '../../../catalogue/exercises/exercises.constants';
import { runLocalPython } from '../../../sandbox/local-python';
import { agentTasksJson } from './agent.input';
import { RECOVERY_FAIL_MESSAGE } from './agent.ceilings';
import type { AgentItem } from './agent.types';
import { gradeA2 } from './a2.grade';

const hidden = JSON.parse(
  readFileSync(
    path.join(
      process.cwd(),
      'content/exercises/agt-002-recover-and-stop/eval_hidden.json',
    ),
    'utf8',
  ),
) as AgentItem[];

describe('gradeA2', () => {
  it('does not mount the canary into the workspace', () => {
    const raw = agentTasksJson(hidden);
    expect(raw).not.toContain('HIDDEN_EVAL');
    expect(raw).toContain('fallback=9*9');
  });

  it('passes a reference that retries with different args after a tool error', async () => {
    const result = await gradeA2(
      A2_REFERENCE_PAYLOAD,
      hidden,
      [{ question: 'CALCULATOR expr=oops fallback=2+2' }],
      runLocalPython,
    );
    expect(result.verdict).toBe('pass');
    expect(result.metrics.recovered.value).toBe(1);
    expect(result.metrics.loop_ok.value).toBe(1);
    expect(result.trace.steps.some((step) => !step.ok)).toBe(true);
    expect(result.trace.steps.some((step) => step.ok && step.name === 'calculator')).toBe(
      true,
    );
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
    expect(JSON.stringify(result.trace)).not.toContain('HIDDEN_EVAL');
  });

  it('fails a near-miss that ignores errors and repeats the same call', async () => {
    const result = await gradeA2(
      A2_NEAR_MISS_PAYLOAD,
      hidden,
      [],
      runLocalPython,
    );
    expect(result.verdict).toBe('fail');
    expect(result.failureClasses).toContain('no-recovery');
    expect(result.scorecard.message).toBe(RECOVERY_FAIL_MESSAGE);
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
  });
});
