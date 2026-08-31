import {
  assertWorkspaceSafe,
  buildDockerRunArgs,
  classifyExit,
  parseDockerMemUsage,
  sandboxEnvArgs,
} from './sandbox.runner';
import { parseAgentToolLog, splitToolLogStderr, withAgentEnvelope } from './sandbox.agent';
import {
  AGENT_SANDBOX_DEFAULTS,
  SANDBOX_DEFAULTS,
  SANDBOX_ERROR_CODES,
} from './sandbox.constants';

describe('sandbox runner helpers', () => {
  it('classifies timeout, oom, ok, and runtime errors', () => {
    expect(classifyExit(null, null, true)).toBe(SANDBOX_ERROR_CODES.TIMEOUT);
    expect(classifyExit(137, 'SIGKILL', false)).toBe(SANDBOX_ERROR_CODES.OOM);
    expect(classifyExit(0, null, false)).toBe(SANDBOX_ERROR_CODES.OK);
    expect(classifyExit(1, null, false)).toBe(
      SANDBOX_ERROR_CODES.RUNTIME_ERROR,
    );
  });

  it('builds hardened docker args with gVisor runtime and limits', () => {
    const args = buildDockerRunArgs({
      containerName: 'labpath-sbx-test',
      workDir: '/tmp/work',
      image: SANDBOX_DEFAULTS.image,
      runtime: 'runsc',
      maxMemoryMb: 512,
      maxWallClockS: 30,
      gatewayUrl: SANDBOX_DEFAULTS.gatewayUrl,
      dockerNetwork: SANDBOX_DEFAULTS.dockerNetwork,
    });

    expect(args).toContain('--runtime=runsc');
    expect(args).toContain('--memory=512m');
    expect(args).toContain('--read-only');
    expect(args).toContain('--cap-drop');
    expect(args).toContain('ALL');
    expect(args).toContain('--network');
    expect(args).toContain(SANDBOX_DEFAULTS.dockerNetwork);
    expect(args).toContain('-v');
    expect(args).toContain('/tmp/work:/workspace:ro');
    expect(args).toContain(
      `SANDBOX_GATEWAY_URL=${SANDBOX_DEFAULTS.gatewayUrl}`,
    );
    expect(args.join(' ')).not.toContain('--rm');
    expect(args.join(' ')).not.toContain('eval_hidden');
    expect(args.join(' ')).not.toContain('DATABASE_URL');
    expect(args.join(' ')).not.toContain('JWT_');
    expect(args.filter((part) => part === '-e')).toHaveLength(2);
  });

  it('exposes only gateway and python env flags', () => {
    const args = sandboxEnvArgs(SANDBOX_DEFAULTS.gatewayUrl);
    expect(args).toEqual([
      '-e',
      `SANDBOX_GATEWAY_URL=${SANDBOX_DEFAULTS.gatewayUrl}`,
      '-e',
      'PYTHONUNBUFFERED=1',
    ]);
  });

  it('parses docker stats memory usage', () => {
    expect(parseDockerMemUsage('12.5MiB / 512MiB')).toBeCloseTo(12.5);
    expect(parseDockerMemUsage('256KiB / 512MiB')).toBeCloseTo(0.25);
    expect(parseDockerMemUsage('bad')).toBeNull();
  });

  it('rejects hidden eval and secret files in the workspace', () => {
    expect(() =>
      assertWorkspaceSafe({ 'labpath_tools.py': 'def calculator(x): return 0' }),
    ).toThrow(/forbidden file/);
    expect(() =>
      assertWorkspaceSafe({ 'eval_hidden.json': '{"id":1}' }),
    ).toThrow(/forbidden file/);
    expect(() =>
      assertWorkspaceSafe({ 'input.json': '{"q":"HIDDEN_EVAL_R9_CANARY"}' }),
    ).toThrow(/hidden eval canary/);
    expect(() => assertWorkspaceSafe({ '../secret': 'x' })).toThrow(
      /sandbox path/,
    );
  });

  it('keeps Phase 1 BYOC limits while Agent jobs get a longer envelope', () => {
    expect(SANDBOX_DEFAULTS.maxWallClockS).toBe(30);
    expect(SANDBOX_DEFAULTS.maxMemoryMb).toBe(512);
    expect(AGENT_SANDBOX_DEFAULTS.maxWallClockS).toBe(180);
    expect(AGENT_SANDBOX_DEFAULTS.maxMemoryMb).toBe(512);
    expect(AGENT_SANDBOX_DEFAULTS.maxToolCalls).toBe(12);
    expect(AGENT_SANDBOX_DEFAULTS.maxSteps).toBe(8);
    const agent = withAgentEnvelope({
      image: SANDBOX_DEFAULTS.image,
      maxMemoryMb: SANDBOX_DEFAULTS.maxMemoryMb,
      maxWallClockS: SANDBOX_DEFAULTS.maxWallClockS,
      gatewayUrl: SANDBOX_DEFAULTS.gatewayUrl,
      dockerNetwork: SANDBOX_DEFAULTS.dockerNetwork,
      allowRuncFallback: false,
    });
    expect(agent.maxWallClockS).toBe(180);
    expect(agent.maxMemoryMb).toBe(512);
  });

  it('parses allowlisted tool-log rows and drops unknown tools', () => {
    const calls = parseAgentToolLog(
      JSON.stringify([
        {
          name: 'calculator',
          args: { expr: '1+1' },
          ok: true,
          durationMs: 1,
          result: 2,
        },
        { name: 'shell', args: {}, ok: true, durationMs: 1 },
        { name: 'calculator' },
      ]),
    );
    expect(calls).toEqual([
      {
        name: 'calculator',
        args: { expr: '1+1' },
        ok: true,
        durationMs: 1,
        result: 2,
      },
    ]);
    expect(parseAgentToolLog('not-json')).toEqual([]);
  });

  it('strips tool-log markers from stderr', () => {
    const { stderr, toolLog } = splitToolLogStderr(
      'warn\nLABPATH_TOOL_LOG:[{"name":"calculator","args":{"expr":"1"},"ok":true,"durationMs":0,"result":1}]\n',
    );
    expect(stderr.trim()).toBe('warn');
    expect(toolLog).toEqual([
      expect.objectContaining({ name: 'calculator', ok: true, result: 1 }),
    ]);
  });
});
