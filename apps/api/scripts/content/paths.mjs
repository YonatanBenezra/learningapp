import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const apiRoot = path.join(scriptDir, '../..');
export const contentRoot = path.join(apiRoot, 'content');
export const exercisesRoot = path.join(contentRoot, 'exercises');
export const templatesRoot = path.join(contentRoot, 'templates');
export const sharedCorpusPath = path.join(contentRoot, 'corpora', 'internal-policy.json');
export const sharedCorpusUri = `file:${sharedCorpusPath}`;
