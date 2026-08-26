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

export async function readGenCacheBlob(uri: string): Promise<unknown> {
  if (!uri.startsWith('file:')) {
    throw new Error(`Unsupported gen cache URI: ${uri}`);
  }
  const filePath = path.resolve(uri.slice('file:'.length));
  if (!filePath.includes(CACHE_MARKER)) {
    throw new Error('Refusing to read a cache blob outside var/gen-cache');
  }
  return JSON.parse(await readFile(filePath, 'utf8')) as unknown;
}
