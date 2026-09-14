/**
 * Forks six RAG + six Eval exercises into the VA1 assessment pool (asmt-001 … asmt-012).
 * Novel slugs, unpublished, same harness assets. Run once; edit by hand after if needed.
 */
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { exercisesRoot } from './paths.mjs';

const SOURCES = [
  ['asmt-001-chunk-it-right', 'rag-001-chunk-it-right'],
  ['asmt-002-the-cost-ceiling', 'rag-002-the-cost-ceiling'],
  ['asmt-003-the-citation-contract', 'rag-003-the-citation-contract'],
  ['asmt-004-rerank-or-rethink', 'rag-004-rerank-or-rethink'],
  ['asmt-005-python-retriever', 'rag-009-python-retriever'],
  ['asmt-006-sentence-split', 'rag-005-sentence-split'],
  ['asmt-007-write-the-assertion-suite', 'eval-001-write-the-assertion-suite'],
  ['asmt-008-judge-the-judge', 'eval-002-judge-the-judge'],
  ['asmt-009-catch-the-regression', 'eval-003-catch-the-regression'],
  ['asmt-010-no-pii', 'eval-004-no-pii'],
  ['asmt-011-ticket-format', 'eval-005-ticket-format'],
  ['asmt-012-length-bound', 'eval-006-length-bound'],
];

async function copyDir(src, dest) {
  await mkdir(dest, { recursive: true });
  await cp(src, dest, { recursive: true });
}

async function patchMeta(destDir, slug, sourceTitle) {
  const metaPath = path.join(destDir, 'meta.json');
  const meta = JSON.parse(await readFile(metaPath, 'utf8'));
  meta.slug = slug;
  meta.title = `Assessment · ${sourceTitle.replace(/^Assessment · /, '')}`;
  meta.isPublished = false;
  if (typeof meta.briefMd === 'string') {
    meta.briefMd = meta.briefMd.replace(
      /^# /,
      '# Assessment · ',
    );
    if (!meta.briefMd.includes('not in the public catalogue')) {
      meta.briefMd +=
        '\n\n> **Verified assessment pool** — not in the catalogue or daily drill.\n';
    }
  }
  await writeFile(metaPath, `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
}

async function main() {
  for (const [targetSlug, sourceSlug] of SOURCES) {
    const src = path.join(exercisesRoot, sourceSlug);
    const dest = path.join(exercisesRoot, targetSlug);
    await copyDir(src, dest);
    const sourceMeta = JSON.parse(
      await readFile(path.join(src, 'meta.json'), 'utf8'),
    );
    await patchMeta(dest, targetSlug, sourceMeta.title);
    console.log(`Created ${targetSlug} from ${sourceSlug}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
