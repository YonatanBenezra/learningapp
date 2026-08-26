import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const TRACE_MARKER = `${path.sep}var${path.sep}traces${path.sep}`;

export function traceDir(): string {
  return path.join(process.cwd(), 'var', 'traces');
}

export function traceFilePath(runId: string): string {
  return path.join(traceDir(), `${runId}.json`);
}

export async function writeTraceBlob(
  runId: string,
  body: unknown,
): Promise<string> {
  await mkdir(traceDir(), { recursive: true });
  const filePath = traceFilePath(runId);
  await writeFile(filePath, JSON.stringify(body), 'utf8');
  return `file:${filePath}`;
}

export async function readTraceBlob(uri: string): Promise<unknown> {
  if (!uri.startsWith('file:')) {
    throw new Error(`Unsupported trace URI: ${uri}`);
  }
  const filePath = path.resolve(uri.slice('file:'.length));
  if (!filePath.includes(TRACE_MARKER)) {
    throw new Error('Refusing to read a trace outside var/traces');
  }
  return JSON.parse(await readFile(filePath, 'utf8')) as unknown;
}
