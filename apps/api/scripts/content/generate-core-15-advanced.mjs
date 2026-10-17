#!/usr/bin/env node
/**
 * Creates 15 new advanced exercises (6 RAG + 9 Guard) for Core 15 v2.
 * Copies harness + eval from catalogue templates with fresh hidden canaries.
 */
import { access, cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { exercisesRoot } from './paths.mjs';

const SPECS = [
  {
    slug: 'rag-025-adv-cost-ceiling',
    copyFrom: 'rag-002-the-cost-ceiling',
    title: 'Cost-Capped Retrieval (Advanced)',
    difficulty: 'H',
    canary: 'HIDDEN_EVAL_C15_R01_CANARY',
    brief:
      '# Advanced · Cost-Capped Retrieval\n\nStricter token and call budget with tighter recall@5 — production SLO under spend pressure.',
  },
  {
    slug: 'rag-026-adv-chunk-balance',
    copyFrom: 'rag-007-chunk-balance',
    title: 'Recall@k SLA on Policy KB (Advanced)',
    difficulty: 'H',
    canary: 'HIDDEN_EVAL_C15_R02_CANARY',
    brief:
      '# Advanced · Recall@k SLA\n\nHarder policy KB: chunk balance must clear recall@5 without oversizing context.',
  },
  {
    slug: 'rag-027-adv-citation-contract',
    copyFrom: 'rag-003-the-citation-contract',
    title: 'Citation-Grounded Answers (Advanced)',
    difficulty: 'H',
    canary: 'HIDDEN_EVAL_C15_R03_CANARY',
    brief:
      '# Advanced · Citation Contract\n\nMulti-hop questions: every claim needs [chunk:id]; refusals when context is incomplete.',
  },
  {
    slug: 'rag-028-adv-rerank-rethink',
    copyFrom: 'rag-004-rerank-or-rethink',
    title: 'Two-Stage Retrieve + Rerank (Advanced)',
    difficulty: 'H',
    canary: 'HIDDEN_EVAL_C15_R04_CANARY',
    brief:
      '# Advanced · Retrieve + Rerank\n\nLarger candidate pools; nDCG@5 lift under strict model-call caps.',
  },
  {
    slug: 'rag-029-adv-python-retriever',
    copyFrom: 'rag-009-python-retriever',
    title: 'Custom Retriever — Advanced Sandbox',
    difficulty: 'H',
    canary: 'HIDDEN_EVAL_C15_R05_CANARY',
    brief:
      '# Advanced · Python Retriever\n\nHarder corpus skew and paraphrase; recall@5 ≥ 0.80 on hidden set.',
  },
  {
    slug: 'rag-030-adv-score-gate',
    copyFrom: 'rag-022-score-gate',
    title: 'Eval Slice Regression Gate (Advanced)',
    difficulty: 'H',
    canary: 'HIDDEN_EVAL_C15_R06_CANARY',
    brief:
      '# Advanced · Regression Gate\n\nTighter Wilson gates on multiple slices — block any localized regression.',
  },
  {
    slug: 'grd-017-adv-indirect-payload',
    copyFrom: 'grd-002-the-indirect-payload',
    title: 'Indirect Injection via Retrieval (Advanced)',
    difficulty: 'H',
    canary: 'HIDDEN_EVAL_C15_G01_CANARY',
    brief:
      '# Advanced · Indirect Injection\n\nNested untrusted markup and tool smuggling through retrieved pages.',
  },
  {
    slug: 'grd-018-adv-encoding-trick',
    copyFrom: 'grd-005-encoding-trick',
    title: 'Obfuscation & Encoding Bypass (Advanced)',
    difficulty: 'H',
    canary: 'HIDDEN_EVAL_C15_G02_CANARY',
    brief:
      '# Advanced · Encoding Bypass\n\nLayered hex/base64/unicode smuggling vs output filters.',
  },
  {
    slug: 'grd-019-adv-hex-extract',
    copyFrom: 'grd-007-hex-extract',
    title: 'PII & Secret Canary Detection (Advanced)',
    difficulty: 'H',
    canary: 'HIDDEN_EVAL_C15_G03_CANARY',
    brief:
      '# Advanced · Canary Exfil\n\nSplit canaries across turns; block extraction without killing benign UX.',
  },
  {
    slug: 'grd-020-adv-bcc-smuggle',
    copyFrom: 'grd-011-bcc-smuggle',
    title: 'Tool Argument Validation (Advanced)',
    difficulty: 'H',
    canary: 'HIDDEN_EVAL_C15_G04_CANARY',
    brief:
      '# Advanced · Tool Args\n\nBCC/CC smuggle and alias fields — validate before any tool execution.',
  },
  {
    slug: 'grd-021-adv-page-inject',
    copyFrom: 'grd-010-page-inject',
    title: 'Supply-Chain Prompts in Documents (Advanced)',
    difficulty: 'H',
    canary: 'HIDDEN_EVAL_C15_G05_CANARY',
    brief:
      '# Advanced · Document Injection\n\nPDF-style hidden instructions in corpus pages the agent retrieves.',
  },
  {
    slug: 'grd-022-adv-filter-stack',
    copyFrom: 'grd-013-filter-stack',
    title: 'Defense in Depth — Advanced Stack',
    difficulty: 'H',
    canary: 'HIDDEN_EVAL_C15_G06_CANARY',
    brief:
      '# Advanced · Filter Stack\n\nRules + judge under higher attack volume; Wilson gates on attacks and benign.',
  },
  {
    slug: 'grd-023-adv-wilson-gate',
    copyFrom: 'grd-014-wilson-gate',
    title: 'FP/FN Tradeoff at Scale (Advanced)',
    difficulty: 'H',
    canary: 'HIDDEN_EVAL_C15_G07_CANARY',
    brief:
      '# Advanced · Wilson Gates\n\nTune thresholds where FP and FN budgets conflict at scale.',
  },
  {
    slug: 'grd-024-adv-benign-pass',
    copyFrom: 'grd-015-benign-pass',
    title: 'Control Mapping & Benign Pass (Advanced)',
    difficulty: 'H',
    canary: 'HIDDEN_EVAL_C15_G08_CANARY',
    brief:
      '# Advanced · Benign Pass\n\nMap controls to assertions; benign flows must pass under adversarial sampling.',
  },
  {
    slug: 'grd-025-adv-policy-window',
    copyFrom: 'grd-016-policy-window',
    title: 'Multi-Turn Jailbreak Escalation (Advanced)',
    difficulty: 'H',
    canary: 'HIDDEN_EVAL_C15_G09_CANARY',
    brief:
      '# Advanced · Multi-Turn Jailbreak\n\nLong-horizon persuasion across turns — final Core 15 boss.',
  },
];

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function patchCanary(filePath, canaryPhrase) {
  const raw = await readFile(filePath, 'utf8');
  if (raw.includes('HIDDEN_EVAL_')) {
    await writeFile(
      filePath,
      raw.replace(/HIDDEN_EVAL_[A-Z0-9_]+/g, canaryPhrase),
      'utf8',
    );
    return;
  }
  const parsed = JSON.parse(raw);
  if (parsed.leak) {
    parsed.leak = canaryPhrase;
    await writeJson(filePath, parsed);
  }
}

async function copyOptional(fromDir, toDir, name) {
  const src = path.join(fromDir, name);
  if (await exists(src)) {
    await cp(src, path.join(toDir, name));
  }
}

async function createExercise(spec) {
  const dir = path.join(exercisesRoot, spec.slug);
  if (await exists(path.join(dir, 'meta.json'))) {
    console.log(`Skip ${spec.slug} (exists)`);
    return;
  }
  const sourceDir = path.join(exercisesRoot, spec.copyFrom);
  await mkdir(path.join(dir, 'solution'), { recursive: true });
  await cp(path.join(sourceDir, 'eval_public.json'), path.join(dir, 'eval_public.json'));
  await cp(path.join(sourceDir, 'eval_hidden.json'), path.join(dir, 'eval_hidden.json'));
  await patchCanary(path.join(dir, 'eval_hidden.json'), spec.canary);
  await copyOptional(sourceDir, dir, 'corpus.json');
  await copyOptional(sourceDir, dir, 'hints.json');
  const solDir = path.join(sourceDir, 'solution');
  if (await exists(solDir)) {
    for (const file of ['reference.json', 'near-miss.json']) {
      await copyOptional(solDir, path.join(dir, 'solution'), file);
    }
  }
  const sourceMeta = JSON.parse(
    await readFile(path.join(sourceDir, 'meta.json'), 'utf8'),
  );
  const meta = {
    ...sourceMeta,
    slug: spec.slug,
    title: spec.title,
    difficulty: spec.difficulty,
    briefMd: spec.brief,
    catalogPhase: 7,
    version: 1,
    isPublished: true,
  };
  await writeJson(path.join(dir, 'meta.json'), meta);
  console.log(`Created ${spec.slug}`);
}

async function main() {
  for (const spec of SPECS) {
    await createExercise(spec);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
