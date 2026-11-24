#!/usr/bin/env node
/**
 * Assigns `split` (feedback | holdout) and `tags` to every RAG hidden eval
 * item. Idempotent: re-run after editing eval_hidden.json.
 *
 * Split is decided by the question TEXT (hash), not the exercise, so a
 * question that several exercises share is holdout everywhere or feedback
 * everywhere. Holdout questions are never shown to learners, in any exercise.
 *
 * Tags are computed from the content, never hand-picked:
 *   unanswerable, numeric, multi-sentence, id-lookup (asks by a model number
 *   or error code) or else lexical | paraphrase, abbreviation (an acronym
 *   such as PTO that the answer's document never uses), multi-hop (the
 *   answer needs a chain of passages), cross-lingual (asked in Bangla and
 *   answered in English, or the reverse), distractor,
 *   stale-version
 *   (older or draft versions of the answer exist), and the R5 class
 *   (faq | policy | procedural).
 *
 * Usage: node scripts/content/tag-rag-eval.mjs [--check]
 *   --check  exit 1 if any file would change (for CI)
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { corpusPathFor, exercisesRoot, sharedCorpusPath } from './paths.mjs';

const CHECK = process.argv.includes('--check');
/** Share of questions that may be revealed when they fail. */
const FEEDBACK_BUCKETS = 3; // 1 in 3

const STOP = new Set(
  'a an the is are of to in on for and or how what when when where who which must may do does be by with it at as can i my our we you your this that from'.split(
    ' ',
  ),
);

function tokens(text) {
  return (text.normalize('NFKC').toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) ?? [])
    .filter((t) => t.length > 1 && !STOP.has(t))
    .map((t) =>
      /^[a-z0-9]+$/.test(t) && t.length > 3 && t.endsWith('s') && !t.endsWith('ss')
        ? t.slice(0, -1)
        : t,
    );
}

/** A model number or error code: RT-4712, E-2041. */
const ID_PATTERN = /\b[A-Z]{1,3}-\d{3,5}\b/;
/** An acronym the question uses instead of the spelled-out term (PTO, NDAs). */
const ABBREVIATION = /\b([A-Z]{2,5})s?\b(?!-\d)/g;

function isCanary(question) {
  return question.includes('HIDDEN_EVAL');
}

export function splitFor(question) {
  const normalized = question.trim().toLowerCase().replace(/\s+/g, ' ');
  const digest = createHash('sha256').update(normalized).digest();
  return digest[0] % FEEDBACK_BUCKETS === 0 ? 'feedback' : 'holdout';
}

function sentences(text) {
  return text.split(/(?<=[.!?।])\s+|\n+/u).map((s) => s.trim()).filter(Boolean);
}

function goldSentence(doc, span) {
  if (!doc) return span;
  return sentences(`${doc.title}. ${doc.text}`).find((s) => s.includes(span)) ?? span;
}

/** Whole-document BM25 rank of every doc for a question (1 = best). */
function bm25Ranks(question, docs) {
  const q = [...new Set(tokens(question))];
  const counts = docs.map((doc) => {
    const map = new Map();
    for (const t of tokens(`${doc.title} ${doc.text}`)) map.set(t, (map.get(t) ?? 0) + 1);
    return map;
  });
  const lengths = counts.map((m) => [...m.values()].reduce((a, b) => a + b, 0));
  const avg = lengths.reduce((a, b) => a + b, 0) / (lengths.length || 1);
  const scores = docs.map((doc, i) => {
    let score = 0;
    for (const term of q) {
      const df = counts.filter((m) => m.has(term)).length;
      const tf = counts[i].get(term) ?? 0;
      if (!tf) continue;
      const idf = Math.log(1 + (docs.length - df + 0.5) / (df + 0.5));
      const norm = 1 - 0.75 + (0.75 * lengths[i]) / avg;
      score += (idf * tf * 2.2) / (tf + 1.2 * norm);
    }
    return { id: doc.id, score };
  });
  scores.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  return new Map(scores.map((row, i) => [row.id, i + 1]));
}

function tagsFor(item, docs) {
  if (!item.answerable) return ['unanswerable'];
  const tags = [];
  const doc = docs.find((d) => d.id === item.goldDocId);
  const gold = goldSentence(doc, item.goldSpan ?? '');
  if (/\d/.test(item.goldAnswer ?? '') || /\d/.test(item.goldSpan ?? '')) tags.push('numeric');
  if (sentences(item.goldSpan ?? '').length > 1) tags.push('multi-sentence');
  if ((item.evidence?.length ?? 0) > 1) tags.push('multi-hop');
  // Asked in one script, answered in another (Bangla <-> Latin).
  const bangla = (text) => /[\u0980-\u09FF]/u.test(text);
  if (doc && bangla(item.question) !== bangla(`${doc.title} ${doc.text}`)) tags.push('cross-lingual');
  // An acronym the answer's document never uses: the words must be bridged.
  const docWords = new Set(`${doc?.title ?? ''} ${doc?.text ?? ''}`.toLowerCase().match(/[a-z0-9]+/g) ?? []);
  const acronyms = [...item.question.matchAll(ABBREVIATION)].map((m) => m[1].toLowerCase());
  if (acronyms.some((acronym) => !docWords.has(acronym))) tags.push('abbreviation');
  if (ID_PATTERN.test(item.question)) {
    // Asked by an exact id: word overlap with the answer says nothing here.
    tags.push('id-lookup');
  } else {
    const q = new Set(tokens(item.question));
    const g = new Set(tokens(gold));
    const shared = [...q].filter((t) => g.has(t)).length;
    tags.push(q.size > 0 && shared / q.size >= 0.5 ? 'lexical' : 'paraphrase');
  }
  if (doc && (bm25Ranks(item.question, docs).get(doc.id) ?? 1) > 1) tags.push('distractor');
  // Other versions of the same policy exist (only one of them is current).
  const family = doc?.meta?.family;
  if (family && docs.some((d) => d.id !== doc.id && d.meta?.family === family)) {
    tags.push('stale-version');
  }
  if (['faq', 'policy', 'procedural'].includes(item.class)) tags.push(item.class);
  return tags;
}

function corpusFor(dir, meta) {
  return JSON.parse(readFileSync(corpusPathFor(dir, meta) ?? sharedCorpusPath, 'utf8'));
}

let changed = 0;
const summary = [];
for (const name of readdirSync(exercisesRoot).sort()) {
  const dir = path.join(exercisesRoot, name);
  const metaPath = path.join(dir, 'meta.json');
  const hiddenPath = path.join(dir, 'eval_hidden.json');
  if (!existsSync(metaPath) || !existsSync(hiddenPath)) continue;
  const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
  if (meta.simulator !== 'rag' && !String(meta.graderArchetype).startsWith('rag-')) continue;
  const hidden = JSON.parse(readFileSync(hiddenPath, 'utf8'));
  if (!Array.isArray(hidden)) continue; // red team scenarios are objects
  const docs = corpusFor(dir, meta);
  const next = hidden.map((item) => {
    const { split: _s, tags: _t, ...rest } = item;
    if (isCanary(item.question)) return { ...rest, split: 'holdout', tags: [] };
    return { ...rest, split: splitFor(item.question), tags: tagsFor(item, docs) };
  });
  const before = readFileSync(hiddenPath, 'utf8');
  const after = `${JSON.stringify(next, null, 2)}\n`;
  if (before !== after) {
    changed += 1;
    if (!CHECK) writeFileSync(hiddenPath, after);
  }
  const real = next.filter((item) => !isCanary(item.question));
  const feedback = real.filter((item) => item.split === 'feedback');
  summary.push(
    `${meta.slug.padEnd(32)} ${String(real.length).padStart(3)} items  feedback ${feedback.length} (${feedback.filter((i) => i.answerable).length} answerable)`,
  );
}
console.log(summary.join('\n'));
if (CHECK && changed > 0) {
  console.error(`\n${changed} eval file(s) need re-tagging: run node scripts/content/tag-rag-eval.mjs`);
  process.exit(1);
}
console.log(`\n${CHECK ? 'checked' : 'updated'}: ${changed} file(s) ${CHECK ? 'out of date' : 'changed'}`);
