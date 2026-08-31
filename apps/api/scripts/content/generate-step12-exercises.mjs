#!/usr/bin/env node
import { access, cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { exercisesRoot } from './paths.mjs';

const NEW_EXERCISES = [
  {
    slug: 'rag-010-window-fit',
    title: 'Window Fit',
    difficulty: 'E',
    copyFrom: 'rag-001-chunk-it-right',
    canary: 'HIDDEN_EVAL_R10_CANARY_PHRASE',
    brief:
      '# Window Fit\n\nFit chunk windows to policy headings. Pass when recall@5 ≥ 0.80.',
  },
  {
    slug: 'pe-006-id-extractor',
    title: 'ID Extractor',
    difficulty: 'E',
    copyFrom: 'pe-001-the-json-contract',
    canary: 'HIDDEN_EVAL_P6_CANARY_PHRASE',
    brief:
      '# ID Extractor\n\nExtract ticket_id from noisy support text. Same JSON contract as P1.',
  },
  {
    slug: 'pe-007-urgency-map',
    title: 'Urgency Map',
    difficulty: 'E',
    copyFrom: 'pe-001-the-json-contract',
    canary: 'HIDDEN_EVAL_P7_CANARY_PHRASE',
    brief:
      '# Urgency Map\n\nMap urgency language onto low/medium/high with few-shots.',
  },
  {
    slug: 'pe-008-slot-fill',
    title: 'Slot Fill',
    difficulty: 'E',
    copyFrom: 'pe-001-the-json-contract',
    canary: 'HIDDEN_EVAL_P8_CANARY_PHRASE',
    brief:
      '# Slot Fill\n\nFill ticket_id, priority, and category slots. JSON only.',
  },
  {
    slug: 'pe-009-schema-lock',
    title: 'Schema Lock',
    difficulty: 'M',
    copyFrom: 'pe-001-the-json-contract',
    canary: 'HIDDEN_EVAL_P9_CANARY_PHRASE',
    brief:
      '# Schema Lock\n\nLock the output schema so the model cannot add extra keys.',
  },
  {
    slug: 'pe-010-output-contract',
    title: 'Output Contract',
    difficulty: 'M',
    copyFrom: 'pe-001-the-json-contract',
    canary: 'HIDDEN_EVAL_P10_CANARY_PHRASE',
    brief:
      '# Output Contract\n\nA strict JSON contract with enumerated labels and two few-shots.',
  },
  {
    slug: 'eval-008-ssn-guard',
    title: 'SSN Guard',
    difficulty: 'E',
    copyFrom: 'eval-001-write-the-assertion-suite',
    canary: 'HIDDEN_EVAL_E8_CANARY_PHRASE',
    brief:
      '# SSN Guard\n\nBlock SSN leaks and keep ticket format with the Assertion DSL.',
  },
  {
    slug: 'eval-009-ticket-id',
    title: 'Ticket ID Check',
    difficulty: 'E',
    copyFrom: 'eval-001-write-the-assertion-suite',
    canary: 'HIDDEN_EVAL_E9_CANARY_PHRASE',
    brief:
      '# Ticket ID Check\n\nRequire TCK-#### in every reply via matches assertions.',
  },
  {
    slug: 'eval-010-reply-length',
    title: 'Reply Length',
    difficulty: 'E',
    copyFrom: 'eval-001-write-the-assertion-suite',
    canary: 'HIDDEN_EVAL_E10_CANARY_PHRASE',
    brief:
      '# Reply Length\n\nBound reply length so verbose traps fail.',
  },
  {
    slug: 'eval-011-refund-cap',
    title: 'Refund Cap',
    difficulty: 'M',
    copyFrom: 'eval-001-write-the-assertion-suite',
    canary: 'HIDDEN_EVAL_E11_CANARY_PHRASE',
    brief:
      '# Refund Cap\n\nNumeric refund cap via numeric_extract_compare.',
  },
  {
    slug: 'eval-012-full-suite',
    title: 'Full Suite',
    difficulty: 'M',
    copyFrom: 'eval-001-write-the-assertion-suite',
    canary: 'HIDDEN_EVAL_E12_CANARY_PHRASE',
    brief:
      '# Full Suite\n\nPII, ticket, refund, and length assertions in one suite.',
  },
  {
    slug: 'eval-013-strict-judge',
    title: 'Strict Judge',
    difficulty: 'M',
    copyFrom: 'eval-002-judge-the-judge',
    canary: 'HIDDEN_EVAL_E13_CANARY_PHRASE',
    brief:
      '# Strict Judge\n\nA calibrated rubric that fails verbose and unsafe replies.',
  },
  {
    slug: 'eval-014-trap-hunter',
    title: 'Trap Hunter',
    difficulty: 'M',
    copyFrom: 'eval-002-judge-the-judge',
    canary: 'HIDDEN_EVAL_E14_CANARY_PHRASE',
    brief:
      '# Trap Hunter\n\nCatch verbosity-bias traps without collapsing κ.',
  },
  {
    slug: 'eval-015-slice-alert',
    title: 'Slice Alert',
    difficulty: 'H',
    copyFrom: 'eval-003-catch-the-regression',
    canary: 'HIDDEN_EVAL_E15_CANARY_PHRASE',
    brief:
      '# Slice Alert\n\nFlag the regressed slice with a Slice Spec and a correction.',
  },
  {
    slug: 'grd-006-direct-jailbreak',
    title: 'Direct Jailbreak',
    difficulty: 'E',
    copyFrom: 'grd-001-break-the-concierge',
    canary: 'HIDDEN_EVAL_G6_CANARY_PHRASE',
    brief:
      '# Direct Jailbreak\n\nWin all concierge levels with an encoded override extract.',
  },
  {
    slug: 'grd-007-hex-extract',
    title: 'Hex Extract',
    difficulty: 'E',
    copyFrom: 'grd-001-break-the-concierge',
    canary: 'HIDDEN_EVAL_G7_CANARY_PHRASE',
    brief:
      '# Hex Extract\n\nHex-encoded override extraction against the concierge.',
  },
  {
    slug: 'grd-008-role-swap',
    title: 'Role Swap',
    difficulty: 'M',
    copyFrom: 'grd-001-break-the-concierge',
    canary: 'HIDDEN_EVAL_G8_CANARY_PHRASE',
    brief:
      '# Role Swap\n\nA jailbreak that still wins L1–L3 without a polite ask.',
  },
  {
    slug: 'grd-009-override-hunt',
    title: 'Override Hunt',
    difficulty: 'M',
    copyFrom: 'grd-001-break-the-concierge',
    canary: 'HIDDEN_EVAL_G9_CANARY_PHRASE',
    brief:
      '# Override Hunt\n\nExtract the booking override without leaking the canary in traces.',
  },
  {
    slug: 'grd-010-page-inject',
    title: 'Page Inject',
    difficulty: 'M',
    copyFrom: 'grd-002-the-indirect-payload',
    canary: 'HIDDEN_EVAL_G10_CANARY_PHRASE',
    brief:
      '# Page Inject\n\nIndirect injection that emails the attacker on all three levels.',
  },
  {
    slug: 'grd-011-bcc-smuggle',
    title: 'BCC Smuggle',
    difficulty: 'M',
    copyFrom: 'grd-002-the-indirect-payload',
    canary: 'HIDDEN_EVAL_G11_CANARY_PHRASE',
    brief:
      '# BCC Smuggle\n\nSmuggle attacker@evil.test through bcc past the policy checker.',
  },
  {
    slug: 'grd-012-wrapper-break',
    title: 'Wrapper Break',
    difficulty: 'H',
    copyFrom: 'grd-002-the-indirect-payload',
    canary: 'HIDDEN_EVAL_G12_CANARY_PHRASE',
    brief:
      '# Wrapper Break\n\nBreak the untrusted wrapper and still win L3.',
  },
  {
    slug: 'grd-013-filter-stack',
    title: 'Filter Stack',
    difficulty: 'H',
    copyFrom: 'grd-003-hold-the-line',
    canary: 'HIDDEN_EVAL_G13_CANARY_PHRASE',
    brief:
      '# Filter Stack\n\nSystem prompt plus input/output filters that hold Wilson gates.',
  },
  {
    slug: 'grd-014-wilson-gate',
    title: 'Wilson Gate',
    difficulty: 'H',
    copyFrom: 'grd-003-hold-the-line',
    canary: 'HIDDEN_EVAL_G14_CANARY_PHRASE',
    brief:
      '# Wilson Gate\n\nAttack block ≥ 90% and benign pass ≥ 95% with Wilson intervals.',
  },
  {
    slug: 'grd-015-benign-pass',
    title: 'Benign Pass',
    difficulty: 'H',
    copyFrom: 'grd-003-hold-the-line',
    canary: 'HIDDEN_EVAL_G15_CANARY_PHRASE',
    brief:
      '# Benign Pass\n\nKeep benign traffic passing while still blocking encoded attacks.',
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
    return;
  }
  if (Array.isArray(parsed)) {
    parsed.push({
      id: 'canary',
      input: canaryPhrase,
      question: canaryPhrase,
      answerable: false,
    });
    await writeJson(filePath, parsed);
  }
}

async function createExercise(spec) {
  const dir = path.join(exercisesRoot, spec.slug);
  if (await exists(path.join(dir, 'meta.json'))) {
    console.log(`Skip ${spec.slug} (exists)`);
    return;
  }
  const source = path.join(exercisesRoot, spec.copyFrom);
  await mkdir(path.join(dir, 'solution'), { recursive: true });
  await cp(path.join(source, 'eval_public.json'), path.join(dir, 'eval_public.json'));
  await cp(path.join(source, 'eval_hidden.json'), path.join(dir, 'eval_hidden.json'));
  await patchCanary(path.join(dir, 'eval_hidden.json'), spec.canary);
  await cp(
    path.join(source, 'solution', 'reference.json'),
    path.join(dir, 'solution', 'reference.json'),
  );
  await cp(
    path.join(source, 'solution', 'near-miss.json'),
    path.join(dir, 'solution', 'near-miss.json'),
  );
  if (await exists(path.join(source, 'corpus.json'))) {
    await cp(path.join(source, 'corpus.json'), path.join(dir, 'corpus.json'));
  }
  const sourceMeta = JSON.parse(
    await readFile(path.join(source, 'meta.json'), 'utf8'),
  );
  const meta = {
    ...sourceMeta,
    slug: spec.slug,
    title: spec.title,
    difficulty: spec.difficulty,
    briefMd: spec.brief,
    version: 1,
  };
  await writeJson(path.join(dir, 'meta.json'), meta);
  console.log(`Created ${spec.slug}`);
}

async function main() {
  for (const spec of NEW_EXERCISES) {
    await createExercise(spec);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
