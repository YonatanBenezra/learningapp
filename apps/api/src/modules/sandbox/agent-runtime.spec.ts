import { runLocalPython } from './local-python';
import { AGENT_SANDBOX_DEFAULTS, SANDBOX_ERROR_CODES } from './sandbox.constants';

describe('agent tool host (local python)', () => {
  it('runs a trivial agent loop through calculator and writes a tool log', async () => {
    const result = await runLocalPython({
      source: `import labpath_tools as t
print(t.calculator("2+3*4"))
`,
    });
    expect(result.ok).toBe(true);
    expect(result.stdout.trim()).toBe('14');
    expect(result.toolLog).toEqual([
      expect.objectContaining({
        name: 'calculator',
        args: { expr: '2+3*4' },
        ok: true,
        result: 14,
      }),
    ]);
    expect(JSON.stringify(result)).not.toContain('HIDDEN_EVAL');
    expect(JSON.stringify(result.toolLog)).not.toContain('eval_hidden');
  });

  it('rejects python eval in calculator and stores JSON per-run', async () => {
    const result = await runLocalPython({
      source: `import json
import labpath_tools as t
try:
    t.calculator("__import__('os').system('id')")
    print("leaked")
except Exception:
    print("rejected")
t.json_store("put", "ticket", {"id": "TCK-1"})
print(json.dumps(t.json_store("get", "ticket"), sort_keys=True))
`,
    });
    expect(result.ok).toBe(true);
    expect(result.stdout.trim()).toBe('rejected\n{"id": "TCK-1"}');
    expect(result.toolLog?.some((row) => row.name === 'calculator' && !row.ok)).toBe(
      true,
    );
    expect(
      result.toolLog?.some(
        (row) => row.name === 'json_store' && row.ok && row.args.op === 'get',
      ),
    ).toBe(true);
  });

  it('blocks fixture_fetch from leaving the gateway allowlist', async () => {
    const result = await runLocalPython({
      source: `import labpath_tools as t
for path in ("http://example.com/", "//evil.test/x", "/../etc/passwd", "/x:80"):
    try:
        t.fixture_fetch(path)
        print("leaked", path)
    except Exception:
        print("blocked")
`,
    });
    expect(result.ok).toBe(true);
    expect(result.stdout.trim().split('\n')).toEqual([
      'blocked',
      'blocked',
      'blocked',
      'blocked',
    ]);
    expect(result.toolLog?.every((row) => row.name === 'fixture_fetch' && !row.ok)).toBe(
      true,
    );
  });

  it('kills a tight tool loop after the Agent step ceiling', async () => {
    const result = await runLocalPython({
      source: `import labpath_tools as t
for i in range(${AGENT_SANDBOX_DEFAULTS.maxSteps + 1}):
    try:
        t.calculator(str(i))
    except Exception as error:
        print(error)
        break
else:
    print("no-kill")
`,
    });
    expect(result.ok).toBe(true);
    expect(result.stdout.trim()).toBe('killed_loop');
    expect(result.toolLog?.length).toBe(AGENT_SANDBOX_DEFAULTS.maxSteps + 1);
    expect(result.toolLog?.at(-1)).toEqual(
      expect.objectContaining({ ok: false, error: 'killed_loop' }),
    );
  });

  it('does not inherit host secrets into local python', async () => {
    const result = await runLocalPython({
      source: `import os, json
print(json.dumps(sorted(os.environ)))
`,
    });
    expect(result.ok).toBe(true);
    expect(result.stdout).not.toContain('DATABASE_URL');
    expect(result.stdout).not.toContain('JWT_ACCESS_SECRET');
    expect(result.stdout).toContain('SANDBOX_GATEWAY_URL');
    expect(result.stdout).toContain('PYTHONPATH');
  });

  it('still maps over-time jobs to sandbox_timeout', async () => {
    const result = await runLocalPython({
      source: 'while True:\n    pass',
      maxWallClockS: 1,
    });
    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe(SANDBOX_ERROR_CODES.TIMEOUT);
  }, 15_000);
});
