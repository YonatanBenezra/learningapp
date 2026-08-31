import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { splitToolLogStderr } from './sandbox.agent';
import {
  SANDBOX_DEFAULTS,
  SANDBOX_ERROR_CODES,
  SANDBOX_FORBIDDEN_FILE_PATTERNS,
  type SandboxErrorCode,
} from './sandbox.constants';
import type { SandboxJobInput, SandboxJobResult } from './sandbox.types';

const execFileAsync = promisify(execFile);

export function classifyExit(
  exitCode: number | null,
  signal: NodeJS.Signals | null,
  timedOut: boolean,
): SandboxErrorCode {
  if (timedOut) {
    return SANDBOX_ERROR_CODES.TIMEOUT;
  }
  if (signal === 'SIGKILL' || exitCode === 137) {
    return SANDBOX_ERROR_CODES.OOM;
  }
  if (exitCode === 0) {
    return SANDBOX_ERROR_CODES.OK;
  }
  return SANDBOX_ERROR_CODES.RUNTIME_ERROR;
}

export function buildDockerRunArgs(input: {
  containerName: string;
  workDir: string;
  image: string;
  runtime: 'runsc' | 'runc';
  maxMemoryMb: number;
  maxWallClockS: number;
  gatewayUrl: string;
  dockerNetwork: string;
}): string[] {
  return [
    'run',
    '--name',
    input.containerName,
    `--runtime=${input.runtime}`,
    `--memory=${input.maxMemoryMb}m`,
    '--memory-swap',
    `${input.maxMemoryMb}m`,
    '--pids-limit',
    String(SANDBOX_DEFAULTS.pidsLimit),
    '--cpus',
    '1',
    '--read-only',
    '--tmpfs',
    `/tmp:rw,noexec,nosuid,size=${SANDBOX_DEFAULTS.tmpfsSizeMb}m`,
    '--cap-drop',
    'ALL',
    '--security-opt',
    'no-new-privileges',
    '--network',
    input.dockerNetwork,
    '-v',
    `${input.workDir}:/workspace:ro`,
    ...sandboxEnvArgs(input.gatewayUrl),
    '--workdir',
    '/workspace',
    input.image,
    'python',
    '-u',
    '/workspace/main.py',
  ];
}

export async function detectRunscRuntime(): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync('docker', [
      'info',
      '--format',
      '{{json .Runtimes}}',
    ]);
    return stdout.includes('runsc');
  } catch {
    return false;
  }
}

export async function resolveSandboxRuntime(
  allowRuncFallback: boolean,
): Promise<'runsc' | 'runc' | null> {
  if (await detectRunscRuntime()) {
    return 'runsc';
  }
  if (allowRuncFallback) {
    return 'runc';
  }
  return null;
}

export async function runSandboxJob(
  input: SandboxJobInput,
): Promise<SandboxJobResult> {
  const started = Date.now();
  const workDir = await mkdtemp(path.join(tmpdir(), 'labpath-sandbox-'));
  const containerName = `labpath-sbx-${randomBytes(6).toString('hex')}`;
  const maxMemoryMb = input.maxMemoryMb ?? SANDBOX_DEFAULTS.maxMemoryMb;
  const maxWallClockS = input.maxWallClockS ?? SANDBOX_DEFAULTS.maxWallClockS;
  const image = input.image ?? SANDBOX_DEFAULTS.image;
  const gatewayUrl = input.gatewayUrl ?? SANDBOX_DEFAULTS.gatewayUrl;
  const dockerNetwork = input.dockerNetwork ?? SANDBOX_DEFAULTS.dockerNetwork;
  const allowRuncFallback = input.allowRuncFallback ?? false;

  try {
    await materialiseWorkspace(workDir, input.source, input.workspaceFiles);

    const runtime = await resolveSandboxRuntime(allowRuncFallback);
    if (!runtime) {
      return {
        ok: false,
        errorCode: SANDBOX_ERROR_CODES.RUNTIME_UNAVAILABLE,
        exitCode: null,
        stdout: '',
        stderr:
          'gVisor runtime (runsc) is not configured. Install runsc or set SANDBOX_ALLOW_RUNC_FALLBACK=true for local dev.',
        durationMs: Date.now() - started,
        memoryPeakMb: null,
        runtime: 'runsc',
        toolLog: [],
      };
    }

    const args = buildDockerRunArgs({
      containerName,
      workDir,
      image,
      runtime,
      maxMemoryMb,
      maxWallClockS,
      gatewayUrl,
      dockerNetwork,
    });

    const { exitCode, signal, stdout, stderr, memoryPeakMb } =
      await execDockerWithTimeout(
        args,
        maxWallClockS * 1000 + 5_000,
        containerName,
        maxMemoryMb,
      );

    const errorCode = classifyExit(exitCode, signal, false);
    const split = splitToolLogStderr(stderr);
    return {
      ok: errorCode === SANDBOX_ERROR_CODES.OK,
      errorCode,
      exitCode,
      stdout,
      stderr: split.stderr,
      durationMs: Date.now() - started,
      memoryPeakMb:
        errorCode === SANDBOX_ERROR_CODES.OOM ? maxMemoryMb : memoryPeakMb,
      runtime,
      containerId: containerName,
      toolLog: split.toolLog,
    };
  } catch (error) {
    const timedOut =
      error instanceof Error && error.message === 'sandbox_timeout';
    if (timedOut) {
      return {
        ok: false,
        errorCode: SANDBOX_ERROR_CODES.TIMEOUT,
        exitCode: null,
        stdout: '',
        stderr: `Execution exceeded ${maxWallClockS}s wall clock`,
        durationMs: Date.now() - started,
        memoryPeakMb: null,
        runtime: 'runsc',
        containerId: containerName,
        toolLog: [],
      };
    }

    return {
      ok: false,
      errorCode: SANDBOX_ERROR_CODES.RUNTIME_ERROR,
      exitCode: null,
      stdout: '',
      stderr: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - started,
      memoryPeakMb: null,
      runtime: 'runsc',
      containerId: containerName,
      toolLog: [],
    };
  } finally {
    await rm(workDir, { recursive: true, force: true });
    await removeContainer(containerName).catch(() => undefined);
  }
}

export function sandboxEnvArgs(gatewayUrl: string): string[] {
  return [
    '-e',
    `SANDBOX_GATEWAY_URL=${gatewayUrl}`,
    '-e',
    'PYTHONUNBUFFERED=1',
  ];
}

export function assertWorkspaceSafe(
  files: Record<string, string> | undefined,
): void {
  if (!files) {
    return;
  }
  for (const name of Object.keys(files)) {
    if (name.includes('..') || path.isAbsolute(name) || name.includes('/')) {
      throw new Error(`Refusing sandbox path: ${name}`);
    }
    const lowered = name.toLowerCase();
    if (
      SANDBOX_FORBIDDEN_FILE_PATTERNS.some((pattern) =>
        lowered.includes(pattern),
      )
    ) {
      throw new Error(`Refusing to mount forbidden file into sandbox: ${name}`);
    }
  }
  const joined = Object.values(files).join('\n');
  if (joined.includes('HIDDEN_EVAL')) {
    throw new Error(
      'Refusing to write hidden eval canary into sandbox workspace',
    );
  }
}

export async function materialiseWorkspace(
  workDir: string,
  source: string,
  workspaceFiles?: Record<string, string>,
): Promise<void> {
  assertWorkspaceSafe(workspaceFiles);
  await writeFile(path.join(workDir, 'main.py'), source, 'utf8');
  for (const [name, contents] of Object.entries(workspaceFiles ?? {})) {
    await writeFile(path.join(workDir, name), contents, 'utf8');
  }
}

export function parseDockerMemUsage(line: string): number | null {
  const match = line.trim().match(/^([\d.]+)\s*(B|KiB|MiB|GiB|kB|MB|GB)/i);
  if (!match) {
    return null;
  }
  const value = Number(match[1]);
  if (!Number.isFinite(value)) {
    return null;
  }
  const unit = match[2].toLowerCase();
  if (unit === 'b') {
    return value / (1024 * 1024);
  }
  if (unit === 'kib' || unit === 'kb') {
    return value / 1024;
  }
  if (unit === 'mib' || unit === 'mb') {
    return value;
  }
  if (unit === 'gib' || unit === 'gb') {
    return value * 1024;
  }
  return null;
}

async function execDockerWithTimeout(
  args: string[],
  timeoutMs: number,
  containerName: string,
  maxMemoryMb: number,
): Promise<{
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  memoryPeakMb: number | null;
}> {
  return new Promise((resolve, reject) => {
    let memoryPeakMb: number | null = null;
    const child = execFile(
      'docker',
      args,
      { maxBuffer: 4 * 1024 * 1024 },
      (error, stdout, stderr) => {
        clearTimeout(timer);
        clearInterval(statsTimer);
        if (!error) {
          resolve({
            exitCode: 0,
            signal: null,
            stdout: stdout.toString(),
            stderr: stderr.toString(),
            memoryPeakMb,
          });
          return;
        }

        const execError = error as NodeJS.ErrnoException & {
          code?: number | string;
          signal?: NodeJS.Signals;
        };
        resolve({
          exitCode: typeof execError.code === 'number' ? execError.code : null,
          signal: execError.signal ?? null,
          stdout: stdout.toString(),
          stderr: stderr.toString(),
          memoryPeakMb,
        });
      },
    );

    const statsTimer = setInterval(() => {
      void execFileAsync('docker', [
        'stats',
        containerName,
        '--no-stream',
        '--format',
        '{{.MemUsage}}',
      ])
        .then(({ stdout }) => {
          const used = parseDockerMemUsage(stdout);
          if (used !== null) {
            memoryPeakMb =
              memoryPeakMb === null
                ? Math.min(used, maxMemoryMb)
                : Math.min(maxMemoryMb, Math.max(memoryPeakMb, used));
          }
        })
        .catch(() => undefined);
    }, 250);

    const timer = setTimeout(() => {
      clearInterval(statsTimer);
      void killContainer(containerName).finally(() => {
        child.kill();
        reject(new Error('sandbox_timeout'));
      });
    }, timeoutMs);
  });
}

async function killContainer(containerName: string): Promise<void> {
  await execFileAsync('docker', ['kill', containerName]).catch(() => undefined);
}

async function removeContainer(containerName: string): Promise<void> {
  await execFileAsync('docker', ['rm', '-f', containerName]).catch(
    () => undefined,
  );
}

export async function dockerImageExists(image: string): Promise<boolean> {
  try {
    await execFileAsync('docker', ['image', 'inspect', image]);
    return true;
  } catch {
    return false;
  }
}

export async function ensureSandboxImage(
  image = SANDBOX_DEFAULTS.image,
  dockerfileDir = path.join(process.cwd(), '../../infra/sandbox'),
): Promise<void> {
  if (await dockerImageExists(image)) {
    return;
  }
  await execFileAsync('docker', ['build', '-t', image, dockerfileDir]);
}
