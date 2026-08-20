import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { env } from '../../../config/env';
import { AppError } from '../../../common/errors/AppError';
import { logger } from '../../../common/utils/logger';
import type { SandboxProvider, SandboxResult, SandboxSpec } from './types';

// The hardened `docker run` argument list (§7.1). Kept pure + exported so the
// security posture is directly asserted in tests — this is where breakout
// PREVENTION is defined: no network, capped memory/cpu/pids, read-only rootfs,
// all capabilities dropped, no privilege escalation, non-root user, ephemeral.
export function buildDockerArgs(name: string, spec: SandboxSpec): string[] {
  return [
    'run',
    '--rm', // ephemeral — container is removed on exit
    '-i',
    '--name',
    name,
    '--network',
    'none', // no network egress / internal access
    '--memory',
    `${spec.memoryMb}m`,
    '--memory-swap',
    `${spec.memoryMb}m`, // == memory ⇒ swap disabled
    '--cpus',
    String(spec.cpus),
    '--pids-limit',
    String(spec.pidsLimit), // contains fork bombs
    '--read-only', // immutable root filesystem
    '--cap-drop',
    'ALL',
    '--security-opt',
    'no-new-privileges',
    '--user',
    '65534:65534', // nobody:nogroup
    '--tmpfs',
    '/tmp:rw,noexec,nosuid,size=16m', // small writable scratch, non-executable
    spec.image,
    ...spec.argv,
  ];
}

export class DockerSandboxProvider implements SandboxProvider {
  run(spec: SandboxSpec): Promise<SandboxResult> {
    const name = `b2c-lab-${randomUUID()}`;
    const args = buildDockerArgs(name, spec);
    const start = Date.now();

    return new Promise<SandboxResult>((resolve) => {
      const child = spawn('docker', args, { stdio: ['pipe', 'pipe', 'pipe'] });
      const cap = spec.maxOutputBytes;
      const outBuf: Buffer[] = [];
      const errBuf: Buffer[] = [];
      let outBytes = 0;
      let errBytes = 0;
      let timedOut = false;
      let launchFailed = false;
      let settled = false;

      // Byte-accurate output cap (prevents an output-flood DoS); buffers are
      // concatenated and decoded once at the end so multibyte sequences split
      // across chunk boundaries aren't corrupted.
      const capture = (buf: Buffer[], used: number, chunk: Buffer): number => {
        if (used >= cap) return used;
        const take = chunk.subarray(0, cap - used);
        buf.push(take);
        return used + take.length;
      };
      child.stdout.on('data', (c: Buffer) => (outBytes = capture(outBuf, outBytes, c)));
      child.stderr.on('data', (c: Buffer) => (errBytes = capture(errBuf, errBytes, c)));

      const timer = setTimeout(() => {
        timedOut = true;
        // Force-remove the container; killing only the docker client can leave it running.
        spawn('docker', ['rm', '-f', name], { stdio: 'ignore' });
        child.kill('SIGKILL');
      }, spec.timeoutMs);

      const finish = (exitCode: number | null): void => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({
          stdout: Buffer.concat(outBuf).toString('utf8'),
          stderr: Buffer.concat(errBuf).toString('utf8'),
          exitCode,
          timedOut,
          oom: exitCode === 137 && !timedOut, // SIGKILL w/o our timeout ⇒ likely OOM-killed
          launchFailed: launchFailed || exitCode === 125, // 125 ⇒ docker run itself failed
          durationMs: Date.now() - start,
        });
      };

      child.on('close', (code) => finish(code));
      child.on('error', (err) => {
        logger.error({ err }, 'Sandbox docker spawn failed');
        launchFailed = true;
        errBytes = capture(errBuf, errBytes, Buffer.from(`[sandbox] ${(err as Error).message}`));
        finish(null);
      });

      if (spec.stdin) child.stdin.write(spec.stdin);
      child.stdin.end();
    });
  }
}

let provider: SandboxProvider | null = null;

// Lazy singleton — importing this module spawns nothing.
export function getSandboxProvider(): SandboxProvider {
  if (provider) return provider;
  if (env.sandboxProvider === 'docker-local') {
    provider = new DockerSandboxProvider();
    return provider;
  }
  throw new AppError(501, `Sandbox provider '${env.sandboxProvider}' is not implemented yet.`);
}
