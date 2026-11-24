import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const apiRoot = path.join(scriptDir, '../..');
export const contentRoot = path.join(apiRoot, 'content');
export const exercisesRoot = path.join(contentRoot, 'exercises');
export const templatesRoot = path.join(contentRoot, 'templates');
export const sharedCorpusPath = path.join(contentRoot, 'corpora', 'internal-policy.json');
export const sharedCorpusUri = `file:${sharedCorpusPath}`;

/**
 * The corpus an exercise grades against. meta.corpusFile is "shared" (the
 * internal policy corpus), the name of a corpus in content/corpora/ (e.g.
 * "support-kb"), or absent for the exercise's own corpus.json.
 */
export function corpusPathFor(dir, meta) {
  if (meta.corpusFile === 'shared') {
    return sharedCorpusPath;
  }
  if (meta.corpusFile) {
    const named = path.join(contentRoot, 'corpora', `${meta.corpusFile}.json`);
    if (existsSync(named)) {
      return named;
    }
  }
  const own = path.join(dir, 'corpus.json');
  return existsSync(own) ? own : null;
}
