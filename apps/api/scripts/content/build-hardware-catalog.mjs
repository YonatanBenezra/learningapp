#!/usr/bin/env node
/**
 * Builds content/corpora/hardware-catalog.json: the internal hardware
 * catalogue, one markdown page per category with a section and a table per
 * range. Every table uses the same model names (Air, Pro, Max, Mini), so a
 * row on its own ("| Pro | 32 GB | ... |") could be any category. Only the
 * page title and section heading say which "Pro" it is: a split that keeps
 * the heading with its rows can find it, a split that cuts rows loose cannot.
 *
 * Also writes content/corpora/hardware-catalog.questions.json (gold = the
 * table row).
 *
 * Deterministic. Usage: node scripts/content/build-hardware-catalog.mjs [--check]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { contentRoot } from './paths.mjs';

const CHECK = process.argv.includes('--check');
const OUT = path.join(contentRoot, 'corpora', 'hardware-catalog.json');
const QUESTIONS_OUT = path.join(
  contentRoot,
  'corpora',
  'hardware-catalog.questions.json',
);

/** mulberry32, so the catalogue is the same on every build. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = rng(20261119);
const pick = (list) => list[Math.floor(random() * list.length)];

const MODELS = ['Air', 'Pro', 'Max', 'Mini'];
const RANGES = ['Office range', 'Studio range'];

/** category (singular for questions), the spec column, its values, its question. */
const CATEGORIES = [
  [
    'Laptops',
    'laptop',
    'Memory',
    ['8 GB', '16 GB', '32 GB', '64 GB'],
    'How much memory does the {m} laptop in the {r} have?',
  ],
  [
    'Monitors',
    'monitor',
    'Screen',
    ['24 inch', '27 inch', '32 inch', '34 inch'],
    'What screen size is the {m} monitor in the {r}?',
  ],
  [
    'Keyboards',
    'keyboard',
    'Layout',
    ['compact', 'full size', 'split', 'tenkeyless'],
    'What layout does the {m} keyboard in the {r} use?',
  ],
  [
    'Headsets',
    'headset',
    'Battery',
    ['20 hours', '30 hours', '40 hours', '50 hours'],
    'How long does the battery of the {m} headset in the {r} last?',
  ],
  [
    'Docks',
    'dock',
    'Ports',
    ['4 ports', '6 ports', '8 ports', '11 ports'],
    'How many ports does the {m} dock in the {r} have?',
  ],
  [
    'Webcams',
    'webcam',
    'Resolution',
    ['720p', '1080p', '1440p', '4K'],
    'What resolution does the {m} webcam in the {r} record?',
  ],
  [
    'Desk chairs',
    'chair',
    'Warranty',
    ['2 years', '5 years', '7 years', '10 years'],
    'How long is the warranty on the {m} chair in the {r}?',
  ],
  [
    'Phones',
    'phone',
    'Storage',
    ['128 GB', '256 GB', '512 GB', '1 TB'],
    'How much storage does the {m} phone in the {r} have?',
  ],
];

const docs = [];
const questions = [];
for (const [category, noun, spec, values, ask] of CATEGORIES) {
  const id = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const lines = [];
  RANGES.forEach((range, rangeIndex) => {
    lines.push(
      `## ${range}`,
      '',
      `| Model | ${spec} | Price |`,
      '| --- | --- | --- |',
    );
    MODELS.forEach((model) => {
      const value = pick(values);
      const price = `${(rangeIndex + 1) * 100 + Math.floor(random() * 900)} euros`;
      const row = `| ${model} | ${value} | ${price} |`;
      lines.push(row);
      questions.push({
        topic: `${id}/${rangeIndex}`,
        question: ask.replace('{m}', model).replace('{r}', range.toLowerCase()),
        goldDocId: id,
        goldSpan: row,
        goldAnswer: value,
        noun,
      });
    });
    lines.push('');
  });
  docs.push({ id, title: category, text: lines.join('\n').trim() });
}

// Each (doc, row) must be unique within its page so the gold is unambiguous.
for (const q of questions) {
  const doc = docs.find((d) => d.id === q.goldDocId);
  if (doc.text.split(q.goldSpan).length !== 2) {
    throw new Error(`row is not unique in ${doc.id}: ${q.goldSpan}`);
  }
}

const outputs = [
  [OUT, `${JSON.stringify(docs, null, 2)}\n`],
  [QUESTIONS_OUT, `${JSON.stringify(questions, null, 2)}\n`],
];
let stale = false;
for (const [file, json] of outputs) {
  let current = '';
  try {
    current = readFileSync(file, 'utf8');
  } catch {
    // first build
  }
  if (current !== json) {
    stale = true;
    if (!CHECK) {
      writeFileSync(file, json);
    }
  }
}
if (CHECK && stale) {
  console.error('hardware-catalog is out of date: re-run this script.');
  process.exit(1);
}
console.log(
  `hardware-catalog: ${docs.length} docs, ${questions.length} questions${CHECK ? ', up to date' : ''}`,
);
