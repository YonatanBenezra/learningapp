import {
  assertWorkspaceSafe,
  buildDockerRunArgs,
  classifyExit,
  parseDockerMemUsage,
  sandboxEnvArgs,
} from './sandbox.runner';
import { SANDBOX_DEFAULTS, SANDBOX_ERROR_CODES } from './sandbox.constants';

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
      assertWorkspaceSafe({ 'eval_hidden.json': '{"id":1}' }),
    ).toThrow(/forbidden file/);
    expect(() =>
      assertWorkspaceSafe({ 'input.json': '{"q":"HIDDEN_EVAL_R9_CANARY"}' }),
    ).toThrow(/hidden eval canary/);
    expect(() => assertWorkspaceSafe({ '../secret': 'x' })).toThrow(
      /sandbox path/,
    );
  });
});
