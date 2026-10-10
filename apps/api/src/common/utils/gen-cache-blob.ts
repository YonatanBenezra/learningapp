import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const CACHE_MARKER = `${path.sep}var${path.sep}gen-cache${path.sep}`;

export function genCacheDir(): string {
  return path.join(process.cwd(), 'var', 'gen-cache');
}

export async function writeGenCacheBlob(
  key: string,
  body: unknown,
): Promise<string> {
  await mkdir(genCacheDir(), { recursive: true });
  const filePath = path.join(genCacheDir(), `${key}.json`);
  await writeFile(filePath, JSON.stringify(body), 'utf8');
  return `file:${filePath}`;
}

function resolveGenCacheFilePath(uri: string): string {
  if (!uri.startsWith('file:')) {
    throw new Error(`Unsupported gen cache URI: ${uri}`);
  }
  const filePath = path.resolve(uri.slice('file:'.length));
  if (!filePath.includes(CACHE_MARKER)) {
    throw new Error('Refusing to read a cache blob outside var/gen-cache');
  }
  return filePath;
}

async function readJsonFile(filePath: string): Promise<unknown> {
  return JSON.parse(await readFile(filePath, 'utf8')) as unknown;
}

export async function readGenCacheBlob(uri: string): Promise<unknown> {
  const filePath = resolveGenCacheFilePath(uri);
  return readJsonFile(filePath);
}

/** Stale DB rows may point at an old repo path — fall back to basename under cwd. */
export async function tryReadGenCacheBlob(
  uri: string,
): Promise<unknown | null> {
  const filePath = resolveGenCacheFilePath(uri);
  try {
    return await readJsonFile(filePath);
  } catch (error: unknown) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String((error as NodeJS.ErrnoException).code)
        : '';
    if (code !== 'ENOENT') {
      throw error;
    }
  }
  const fallback = path.join(genCacheDir(), path.basename(filePath));
  try {
    return await readJsonFile(fallback);
  } catch (error: unknown) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String((error as NodeJS.ErrnoException).code)
        : '';
    if (code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}
