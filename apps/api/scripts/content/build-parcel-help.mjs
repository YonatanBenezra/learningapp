#!/usr/bin/env node
/**
 * Builds content/corpora/parcel-help.json: a parcel company's help pages, one
 * page per service with five facts (price, weight limit, delivery time, size
 * limit, insurance), each under 400 characters so a page is one chunk at the
 * default chunk size.
 *
 * Half the services also have one or two "news" pages that repeat the
 * service's name and the words people ask with ("what a large parcel costs,
 * how long delivery of a large parcel takes") without giving a single fact.
 * They outrank the real page, so for those services the answer sits at rank
 * 2 or 3, while for the other half it is a clear first. Questions about one
 * service never share an answer with another exercise: each exercise takes
 * its own (service, fact) pairs.
 *
 * Also writes content/corpora/parcel-help.questions.json.
 *
 * Deterministic. Usage: node scripts/content/build-parcel-help.mjs [--check]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { contentRoot } from './paths.mjs';

const CHECK = process.argv.includes('--check');
const OUT = path.join(contentRoot, 'corpora', 'parcel-help.json');
const QUESTIONS_OUT = path.join(
  contentRoot,
  'corpora',
  'parcel-help.questions.json',
);

/** Service name, then how many news pages crowd it (0 = a clear first). */
const SERVICES = [
  ['standard parcel', 0],
  ['express parcel', 2],
  ['same-day parcel', 1],
  ['large parcel', 2],
  ['international parcel', 0],
  ['international express parcel', 1],
  ['economy parcel', 0],
  ['standard letter', 1],
  ['registered letter', 0],
  ['express letter', 2],
  ['international letter', 0],
  ['large letter', 1],
  ['full pallet', 0],
  ['half pallet', 2],
  ['express pallet', 0],
  ['international pallet', 1],
  ['return parcel', 0],
  ['express return', 2],
  ['international return', 0],
  ['small packet', 1],
  ['tracked packet', 0],
  ['document tube', 2],
  ['bike box', 0],
  ['furniture delivery', 1],
  ['two-person delivery', 0],
  ['chilled parcel', 2],
  ['fragile parcel', 0],
  ['wine box', 1],
  ['locker drop-off', 0],
  ['locker pick-up', 2],
  ['saturday parcel', 0],
  ['evening parcel', 1],
  ['signed-for parcel', 0],
  ['cash-on-delivery parcel', 2],
  ['oversized parcel', 0],
  ['garden tool box', 1],
  ['laptop sleeve parcel', 0],
  ['medicine pouch', 2],
  ['camping gear bag', 0],
  ['ski bag', 1],
];

/** The five facts, worded the way people ask about them. */
const FACTS = {
  price: {
    sentence: (name, n) => `A ${name} costs ${n} euros to send.`,
    question: (name) => `How much does a ${name} cost?`,
  },
  weight: {
    sentence: (name, n) => `The weight limit for a ${name} is ${n} kg.`,
    question: (name) => `What is the weight limit for a ${name}?`,
  },
  delivery: {
    sentence: (name, n) =>
      `Delivery of a ${name} takes ${n} working day${n === 1 ? '' : 's'}.`,
    question: (name) => `How long does delivery of a ${name} take?`,
  },
  size: {
    sentence: (name, n) =>
      `The size limit for a ${name} is ${n} cm on the longest side.`,
    question: (name) => `What is the size limit for a ${name}?`,
  },
  insurance: {
    sentence: (name, n) => `A ${name} is insured for up to ${n} euros.`,
    question: (name) => `How much is a ${name} insured for?`,
  },
};
const KINDS = Object.keys(FACTS);

/** News pages: the service's name and the asking words, never a fact. */
const NEWS = [
  (name) => [
    `${capital(name)} news`,
    `Customers ask what a ${name} costs, the weight limit for a ${name} and how long delivery of a ${name} takes. We are reviewing the ${name} size limit and how much a ${name} is insured for.`,
  ],
  (name) => [
    `Choosing a ${name}`,
    `Compare what a ${name} costs with other services, check the weight limit and size limit for a ${name}, and how long delivery of a ${name} takes and how much a ${name} is insured for.`,
  ],
];

function capital(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Small deterministic generator, so numbers differ without Math.random. */
function lcg(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}
const random = lcg(2026_11_19);
const between = (low, high) => low + Math.floor(random() * (high - low + 1));
const RANGES = {
  price: [3, 95],
  weight: [1, 40],
  delivery: [1, 6],
  size: [30, 200],
  insurance: [50, 900],
};

const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const docs = [];
const questions = [];
for (const [name, crowd] of SERVICES) {
  const id = slug(name);
  const facts = KINDS.map((kind) => ({
    kind,
    sentence: FACTS[kind].sentence(name, between(...RANGES[kind])),
  }));
  const text = facts.map((fact) => fact.sentence).join(' ');
  if (`${name}. ${text}`.length > 400) {
    throw new Error(`${name} page is over 400 chars`);
  }
  docs.push({ id, title: capital(name), text });
  for (let i = 0; i < crowd; i += 1) {
    const [title, body] = NEWS[i](name);
    if (`${title}. ${body}`.length > 400) {
      throw new Error(`${name} news page ${i} is over 400 chars`);
    }
    docs.push({ id: `${id}-news-${i + 1}`, title, text: body });
  }
  for (const fact of facts) {
    questions.push({
      service: name,
      kind: fact.kind,
      crowded: crowd > 0,
      question: FACTS[fact.kind].question(name),
      goldDocId: id,
      goldSpan: fact.sentence,
      goldAnswer: fact.sentence,
    });
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
  console.error('parcel-help is out of date: re-run this script.');
  process.exit(1);
}
console.log(
  `parcel-help: ${docs.length} pages, ${questions.length} questions${CHECK ? ', up to date' : ''}`,
);
