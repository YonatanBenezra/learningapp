#!/usr/bin/env node
/**
 * Builds content/corpora/company-facts.json: short company facts that only
 * answer a question when chained. "What is the hotel limit for the design
 * summit?" needs the event page (the summit is in Porto) and then the travel
 * page for Porto, one of sixteen near-identical city pages. Searching with the
 * question alone finds the event page but cannot tell which city page to
 * pick; a second search that carries what the first one found can.
 *
 * Also writes content/corpora/company-facts.questions.json, where every
 * question lists both pages as evidence: [bridge, answer].
 *
 * Deterministic. Usage: node scripts/content/build-company-facts.mjs [--check]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { contentRoot } from './paths.mjs';

const CHECK = process.argv.includes('--check');
const OUT = path.join(contentRoot, 'corpora', 'company-facts.json');
const QUESTIONS_OUT = path.join(
  contentRoot,
  'corpora',
  'company-facts.questions.json',
);

const docs = [];
const questions = [];
const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// --- Chain A: event -> city -> hotel limit ------------------------------------
const CITIES = [
  ['Porto', 140],
  ['Lisbon', 155],
  ['Madrid', 170],
  ['Valencia', 135],
  ['Lyon', 150],
  ['Marseille', 145],
  ['Milan', 185],
  ['Turin', 130],
  ['Munich', 190],
  ['Hamburg', 175],
  ['Vienna', 165],
  ['Prague', 120],
  ['Krakow', 110],
  ['Gdansk', 105],
  ['Ghent', 125],
  ['Rotterdam', 160],
];
for (const [city, cap] of CITIES) {
  docs.push({
    id: `travel-${slug(city)}`,
    title: `Business travel: ${city}`,
    text: `Hotels in ${city} may cost at most ${cap} euros a night on business trips. Book through the travel portal and keep the receipt for the expense claim.`,
  });
}
const EVENTS = [
  ['design summit', 'Porto', 'March'],
  ['sales kickoff', 'Munich', 'January'],
  ['engineering offsite', 'Krakow', 'May'],
  ['security week', 'Vienna', 'October'],
  ['partner forum', 'Milan', 'June'],
  ['data science retreat', 'Ghent', 'September'],
  ['support conference', 'Lyon', 'April'],
  ['leadership seminar', 'Hamburg', 'November'],
];
EVENTS.forEach(([event, city, month]) => {
  docs.push({
    id: `event-${slug(event)}`,
    title: `The ${event}`,
    text: `This year the ${event} takes place in ${city} in ${month}. Registration opens six weeks before, and the agenda is shared in the events channel.`,
  });
  const cap = CITIES.find(([name]) => name === city)[1];
  const bridge = {
    docId: `event-${slug(event)}`,
    span: `This year the ${event} takes place in ${city} in ${month}`,
  };
  const answer = {
    docId: `travel-${slug(city)}`,
    span: `Hotels in ${city} may cost at most ${cap} euros a night on business trips`,
  };
  questions.push(
    {
      chain: 'event',
      key: event,
      question: `What is the nightly hotel limit for the ${event}?`,
      goldAnswer: `${cap} euros`,
      evidence: [bridge, answer],
    },
    {
      chain: 'event',
      key: event,
      question: `How much can a hotel cost per night when I attend the ${event}?`,
      goldAnswer: `${cap} euros`,
      evidence: [bridge, answer],
    },
  );
});

// --- Chain B: project -> team -> lead ------------------------------------------
const TEAMS = [
  ['Atlas', 'Mira Okafor'],
  ['Beacon', 'Tomas Lindqvist'],
  ['Cobalt', 'Priya Raman'],
  ['Delta', 'Jonas Weber'],
  ['Ember', 'Sofia Marchetti'],
  ['Falcon', 'Kenji Watanabe'],
  ['Granite', 'Amara Nwosu'],
  ['Harbor', 'Lucas Moreau'],
  ['Iris', 'Elena Petrova'],
  ['Juniper', 'Diego Alvarez'],
  ['Kestrel', 'Hannah Becker'],
  ['Lumen', 'Omar Haddad'],
];
for (const [team, lead] of TEAMS) {
  docs.push({
    id: `team-${slug(team)}`,
    title: `${team} team`,
    text: `The ${team} team is led by ${lead}, who approves the team budget and hiring. The team meets on Mondays and posts updates in its channel.`,
  });
}
const PROJECTS = [
  ['Northwind migration', 'Cobalt'],
  ['Bluebird checkout', 'Falcon'],
  ['Quartz analytics', 'Iris'],
  ['Saffron onboarding', 'Atlas'],
  ['Tidewater billing', 'Kestrel'],
  ['Orchid search', 'Delta'],
  ['Pinecone mobile', 'Lumen'],
  ['Copperline API', 'Granite'],
];
PROJECTS.forEach(([project, team]) => {
  docs.push({
    id: `project-${slug(project)}`,
    title: `Project ${project}`,
    text: `Project ${project} is run by the ${team} team. Status reports go out every second Friday, and the roadmap lives in the project space.`,
  });
  const lead = TEAMS.find(([name]) => name === team)[1];
  const bridge = {
    docId: `project-${slug(project)}`,
    span: `Project ${project} is run by the ${team} team`,
  };
  const answer = {
    docId: `team-${slug(team)}`,
    span: `The ${team} team is led by ${lead}, who approves the team budget and hiring`,
  };
  questions.push(
    {
      chain: 'project',
      key: project,
      question: `Who approves the budget for Project ${project}?`,
      goldAnswer: lead,
      evidence: [bridge, answer],
    },
    {
      chain: 'project',
      key: project,
      question: `Who signs off hiring for Project ${project}?`,
      goldAnswer: lead,
      evidence: [bridge, answer],
    },
  );
});

// --- Chain C: product -> supplier -> contract ------------------------------------
const SUPPLIERS = [
  ['Varden Electronics', 'January', 60],
  ['Holm Components', 'March', 90],
  ['Sorrel Plastics', 'April', 30],
  ['Brightwater Metals', 'June', 60],
  ['Calder Optics', 'July', 45],
  ['Fennick Circuits', 'August', 90],
  ['Marlow Textiles', 'September', 30],
  ['Oakridge Packaging', 'October', 60],
  ['Pellham Glass', 'November', 45],
  ['Quill Batteries', 'December', 90],
  ['Rook Fasteners', 'February', 30],
  ['Stellan Motors', 'May', 60],
];
for (const [supplier, month, days] of SUPPLIERS) {
  docs.push({
    id: `supplier-${slug(supplier)}`,
    title: `Supplier: ${supplier}`,
    text: `Our contract with ${supplier} renews every ${month}, and ending it needs ${days} days of notice. Orders go through the procurement portal.`,
  });
}
const PRODUCTS = [
  ['Aero desk lamp', 'Calder Optics'],
  ['Nimbus speaker', 'Varden Electronics'],
  ['Trail power bank', 'Quill Batteries'],
  ['Atlas backpack', 'Marlow Textiles'],
  ['Glint smart mirror', 'Pellham Glass'],
  ['Pulse fitness band', 'Fennick Circuits'],
  ['Drift e-scooter', 'Stellan Motors'],
  ['Nest storage box', 'Sorrel Plastics'],
];
PRODUCTS.forEach(([product, supplier]) => {
  docs.push({
    id: `product-${slug(product)}`,
    title: `${product}`,
    text: `The ${product} is manufactured for us by ${supplier}. Spare parts are stocked for five years after the last batch.`,
  });
  const [, month, days] = SUPPLIERS.find(([name]) => name === supplier);
  const bridge = {
    docId: `product-${slug(product)}`,
    span: `The ${product} is manufactured for us by ${supplier}`,
  };
  const answer = {
    docId: `supplier-${slug(supplier)}`,
    span: `Our contract with ${supplier} renews every ${month}, and ending it needs ${days} days of notice`,
  };
  questions.push(
    {
      chain: 'product',
      key: product,
      question: `In which month does the contract with the maker of the ${product} renew?`,
      goldAnswer: month,
      evidence: [bridge, answer],
    },
    {
      chain: 'product',
      key: product,
      question: `How much notice is needed to end the contract with whoever makes the ${product}?`,
      goldAnswer: `${days} days`,
      evidence: [bridge, answer],
    },
  );
});

for (const doc of docs) {
  if (doc.text.length > 400) {
    throw new Error(`${doc.id} is ${doc.text.length} chars (max 400)`);
  }
}
for (const q of questions) {
  for (const piece of q.evidence) {
    const doc = docs.find((d) => d.id === piece.docId);
    if (!doc || !doc.text.includes(piece.span)) {
      throw new Error(`evidence missing for ${q.question}`);
    }
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
  console.error('company-facts is out of date: re-run this script.');
  process.exit(1);
}
console.log(
  `company-facts: ${docs.length} docs, ${questions.length} questions${CHECK ? ', up to date' : ''}`,
);
