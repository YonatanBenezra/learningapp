import { inspectAgentLog, KILLED_LOOP_MESSAGE } from './agent.ceilings';
import type { AgentToolCall } from '../../../sandbox/sandbox.types';

function call(
  name: string,
  args: Record<string, unknown>,
  ok: boolean,
  extra: Partial<AgentToolCall> = {},
): AgentToolCall {
  return { name, args, ok, durationMs: 1, ...extra };
}

describe('inspectAgentLog', () => {
  it('flags killed_loop from the tool error and from over-step logs', () => {
    const logged = inspectAgentLog([
      call('calculator', { expr: '1' }, true),
      call('calculator', { expr: '2' }, false, { error: 'killed_loop' }),
    ]);
    expect(logged.killedLoop).toBe(true);
    expect(logged.steps.at(-1)?.error).toBe('killed_loop');
    expect(KILLED_LOOP_MESSAGE).toContain('8 steps');

    const over = inspectAgentLog(
      Array.from({ length: 9 }, (_, index) =>
        call('calculator', { expr: String(index) }, true),
      ),
      { maxSteps: 8, maxToolCalls: 12 },
    );
    expect(over.killedLoop).toBe(true);
    expect(over.stepsUsed).toBe(9);
  });

  it('scores recovery after a different-args retry and rejects a tight fail loop', () => {
    const recovered = inspectAgentLog([
      call('calculator', { expr: 'not-a-number' }, false, {
        error: 'invalid expression',
      }),
      call('calculator', { expr: '9*9' }, true, { result: 81, resultBytes: 2 }),
    ]);
    expect(recovered.recovered).toBe(true);
    expect(recovered.tightLoop).toBe(false);
    expect(recovered.steps[0]?.argsSummary).toBe('expr="not-a-number"');
    expect(recovered.steps[1]?.resultBytes).toBe(2);
    expect(JSON.stringify(recovered.steps)).not.toContain('HIDDEN_EVAL');

    const hammer = inspectAgentLog([
      call('calculator', { expr: 'x' }, false, { error: 'invalid' }),
      call('calculator', { expr: 'x' }, false, { error: 'invalid' }),
      call('calculator', { expr: 'x' }, false, { error: 'invalid' }),
    ]);
    expect(hammer.tightLoop).toBe(true);
    expect(hammer.recovered).toBe(false);
  });

  it('summarises json_store without dumping values or canaries', () => {
    const inspection = inspectAgentLog([
      call(
        'json_store',
        { op: 'put', key: 'ticket', value: { secret: 'HIDDEN_EVAL_X' } },
        true,
      ),
    ]);
    const step = inspection.steps[0];
    expect(step?.argsSummary).toContain('op=');
    expect(step?.argsSummary).toContain('key=');
    expect(step?.argsSummary).not.toContain('HIDDEN_EVAL');
    expect(step?.argsSummary).not.toContain('secret');
  });
});
