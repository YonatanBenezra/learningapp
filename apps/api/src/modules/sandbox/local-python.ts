import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  readToolLogFile,
  sandboxToolsPythonPath,
  splitToolLogStderr,
} from './sandbox.agent';
import {
  AGENT_SANDBOX_DEFAULTS,
  SANDBOX_DEFAULTS,
  SANDBOX_ERROR_CODES,
} from './sandbox.constants';
import { classifyExit, materialiseWorkspace } from './sandbox.runner';
import type { SandboxJobInput, SandboxJobResult } from './sandbox.types';

export async function runLocalPython(
  input: SandboxJobInput,
): Promise<SandboxJobResult> {
  const started = Date.now();
  const workDir = await mkdtemp(path.join(tmpdir(), 'labpath-local-py-'));
  const maxWallClockS = input.maxWallClockS ?? SANDBOX_DEFAULTS.maxWallClockS;
  const containerId = `local-${randomBytes(4).toString('hex')}`;
  const logPath = path.join(workDir, '.labpath_tool_log.json');

  try {
    await materialiseWorkspace(workDir, input.source, input.workspaceFiles);
    const { exitCode, signal, stdout, stderr, timedOut } =
      await execPythonWithTimeout(
        workDir,
        maxWallClockS * 1000,
        localPythonEnv(workDir, logPath, input.gatewayUrl),
      );
    const errorCode = classifyExit(exitCode, signal, timedOut);
    const fromFile = await readToolLogFile(logPath);
    const split = splitToolLogStderr(stderr);
    return {
      ok: errorCode === SANDBOX_ERROR_CODES.OK,
      errorCode,
      exitCode,
      stdout,
      stderr: timedOut
        ? `Execution exceeded ${maxWallClockS}s wall clock`
        : split.stderr,
      durationMs: Date.now() - started,
      memoryPeakMb: null,
      runtime: 'runc',
      containerId,
      toolLog: fromFile.length > 0 ? fromFile : split.toolLog,
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
      toolLog: [],
    };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

function localPythonEnv(
  workDir: string,
  logPath: string,
  gatewayUrl?: string,
): NodeJS.ProcessEnv {
  return {
    PATH: process.env.PATH ?? '/usr/bin:/bin',
    HOME: workDir,
    LANG: process.env.LANG ?? 'C.UTF-8',
    PYTHONPATH: sandboxToolsPythonPath(),
    PYTHONUNBUFFERED: '1',
    SANDBOX_GATEWAY_URL: gatewayUrl ?? SANDBOX_DEFAULTS.gatewayUrl,
    LABPATH_TOOL_LOG: logPath,
    LABPATH_MAX_STEPS: String(AGENT_SANDBOX_DEFAULTS.maxSteps),
    LABPATH_MAX_TOOL_CALLS: String(AGENT_SANDBOX_DEFAULTS.maxToolCalls),
  };
}

function execPythonWithTimeout(
  workDir: string,
  timeoutMs: number,
  env: NodeJS.ProcessEnv,
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
      { cwd: workDir, timeout: timeoutMs, maxBuffer: 4 * 1024 * 1024, env },
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
