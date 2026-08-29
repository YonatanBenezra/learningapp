import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { SANDBOX_DEFAULTS, SANDBOX_ERROR_CODES } from './sandbox.constants';
import { classifyExit, materialiseWorkspace } from './sandbox.runner';
import type { SandboxJobInput, SandboxJobResult } from './sandbox.types';

export async function runLocalPython(
  input: SandboxJobInput,
): Promise<SandboxJobResult> {
  const started = Date.now();
  const workDir = await mkdtemp(path.join(tmpdir(), 'labpath-local-py-'));
  const maxWallClockS = input.maxWallClockS ?? SANDBOX_DEFAULTS.maxWallClockS;
  const containerId = `local-${randomBytes(4).toString('hex')}`;

  try {
    await materialiseWorkspace(workDir, input.source, input.workspaceFiles);
    const { exitCode, signal, stdout, stderr, timedOut } =
      await execPythonWithTimeout(workDir, maxWallClockS * 1000);
    const errorCode = classifyExit(exitCode, signal, timedOut);
    return {
      ok: errorCode === SANDBOX_ERROR_CODES.OK,
      errorCode,
      exitCode,
      stdout,
      stderr: timedOut
        ? `Execution exceeded ${maxWallClockS}s wall clock`
        : stderr,
      durationMs: Date.now() - started,
      memoryPeakMb: null,
      runtime: 'runc',
      containerId,
    };
  } catch (error) {
    return {
      ok: false,
      errorCode: SANDBOX_ERROR_CODES.RUNTIME_ERROR,
      exitCode: null,
      stdout: '',
      stderr: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - started,
      memoryPeakMb: null,
      runtime: 'runc',
      containerId,
    };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

function execPythonWithTimeout(
  workDir: string,
  timeoutMs: number,
): Promise<{
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}> {
  return new Promise((resolve) => {
    const child = execFile(
      'python3',
      ['-u', 'main.py'],
      { cwd: workDir, timeout: timeoutMs, maxBuffer: 4 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (!error) {
          resolve({
            exitCode: 0,
            signal: null,
            stdout: stdout.toString(),
            stderr: stderr.toString(),
            timedOut: false,
          });
          return;
        }
        const execError = error as NodeJS.ErrnoException & {
          code?: number | string;
          signal?: NodeJS.Signals;
          killed?: boolean;
        };
        const timedOut =
          execError.killed === true || execError.signal === 'SIGTERM';
        resolve({
          exitCode: typeof execError.code === 'number' ? execError.code : null,
          signal: execError.signal ?? null,
          stdout: stdout.toString(),
          stderr: stderr.toString(),
          timedOut,
        });
      },
    );
    child.on('error', (error) => {
      resolve({
        exitCode: null,
        signal: null,
        stdout: '',
        stderr: error.message,
        timedOut: false,
      });
    });
  });
}
