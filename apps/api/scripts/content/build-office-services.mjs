#!/usr/bin/env node
/**
 * Builds content/corpora/office-services.json: an office services guide where
 * every paragraph is one service. The first sentence names the service; the
 * three after it give its facts and only say "it" ("The fee is 25 euros a
 * month."). Every service uses the same few kinds of fact, so a chunk that
 * holds a fact without its first sentence looks like dozens of others and
 * ranks anywhere. A chunk has to be big enough to keep the paragraph together
 * and small enough that five of them fit the context budget.
 *
 * Also writes content/corpora/office-services.questions.json (gold = the fact
 * sentence).
 *
 * Deterministic. Usage: node scripts/content/build-office-services.mjs [--check]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { contentRoot } from './paths.mjs';

const CHECK = process.argv.includes('--check');
const OUT = path.join(contentRoot, 'corpora', 'office-services.json');
const QUESTIONS_OUT = path.join(
  contentRoot,
  'corpora',
  'office-services.questions.json',
);

/**
 * The kinds of fact a service can have. Each sentence says "it" instead of
 * the service, and shares its wording with every other service of that kind.
 */
const FACTS = {
  fee: {
    sentence: (n) => `The fee is ${n} euros a month.`,
    question: (name) => `What is the monthly fee for ${name}?`,
  },
  notice: {
    sentence: (n) => `Ask at least ${n} working days in advance.`,
    question: (name) => `How much notice do I need to give for ${name}?`,
  },
  hours: {
    sentence: (n) => `It is available from ${n}:00 until ${n + 9}:00.`,
    question: (name) => `During which hours is ${name} available?`,
  },
  limit: {
    sentence: (n) => `Each person may use it ${n} times a month.`,
    question: (name) => `How often may I use ${name} each month?`,
  },
  extension: {
    sentence: (n) => `Requests go to phone extension ${n}.`,
    question: (name) => `Which phone extension takes requests for ${name}?`,
  },
  cancel: {
    sentence: (n) =>
      `Cancel at least ${n} hours before, or the slot is charged.`,
    question: (name) => `How late can I cancel ${name} without being charged?`,
  },
};
const KINDS = Object.keys(FACTS);

/** Page title, then [first sentence, the name questions use] per service. */
const PAGES = [
  [
    'Getting to the office',
    [
      [
        'Staff parking permits cover the underground garage below the Mill Street building.',
        'a staff parking permit',
      ],
      [
        'Bicycle lockers stand in the covered yard behind the north entrance of the campus.',
        'a bicycle locker',
      ],
      [
        'The shuttle bus runs every morning between the central station and the main gate.',
        'the shuttle bus',
      ],
      [
        'Electric car chargers are fitted along the back wall on the second garage level.',
        'an electric car charger',
      ],
      [
        'Public transport passes for regular commuters are ordered through the travel desk.',
        'a public transport pass',
      ],
    ],
  ],
  [
    'Rooms and spaces',
    [
      [
        'The boardroom on the top floor has a video wall and a long table for twenty.',
        'the boardroom',
      ],
      [
        'Quiet booths line the corridor next to the library and are meant for focused calls.',
        'a quiet booth',
      ],
      [
        'The rooftop terrace with its plants and benches can host team events in summer.',
        'the rooftop terrace',
      ],
      [
        'The training kitchen in the basement is where the cooking workshops take place.',
        'the training kitchen',
      ],
      [
        'The prayer and rest room sits beside the lifts on the first floor of the east wing.',
        'the prayer and rest room',
      ],
    ],
  ],
  [
    'Equipment on loan',
    [
      [
        'Spare laptops are lent out by the service desk while your own one is being repaired.',
        'a spare laptop',
      ],
      [
        'Portable projectors come in a grey travel case together with every cable you need.',
        'a portable projector',
      ],
      [
        'Standing desk converters sit on top of an ordinary desk and lift the screen up.',
        'a standing desk converter',
      ],
      [
        'Noise-cancelling headsets are handed out to colleagues who sit in open-plan areas.',
        'a noise-cancelling headset',
      ],
      [
        'Camera kits for recording training videos include a tripod, a microphone and lights.',
        'a camera kit',
      ],
    ],
  ],
  [
    'Health and wellbeing',
    [
      [
        'The company gym on the ground floor has rowing machines, bikes and free weights.',
        'the company gym',
      ],
      [
        'Massage sessions are given by a visiting therapist in the treatment room on floor two.',
        'a massage session',
      ],
      [
        'The yoga class meets in the studio above the canteen with mats and blocks provided.',
        'the yoga class',
      ],
      [
        'Eye tests for screen work are carried out by an optician who visits the office.',
        'an eye test',
      ],
      [
        'Counselling sessions are private conversations with an outside, qualified counsellor.',
        'a counselling session',
      ],
    ],
  ],
  [
    'Food and drink',
    [
      [
        'Lunch vouchers can be spent in the staff canteen and at the coffee bar downstairs.',
        'lunch vouchers',
      ],
      [
        'Fruit boxes with apples, pears and bananas are delivered to every team kitchen.',
        'a fruit box',
      ],
      [
        'Catering for meetings is prepared by the canteen kitchen and brought up on trays.',
        'meeting catering',
      ],
      [
        'The barista bar on the atrium level serves espresso, tea and fresh juices to staff.',
        'the barista bar',
      ],
      [
        'Sparkling water coolers with chilled and fizzy water stand on every single floor.',
        'a sparkling water cooler',
      ],
    ],
  ],
  [
    'Family and care',
    [
      [
        'The childcare centre next door looks after children aged one to four during work.',
        'the childcare centre',
      ],
      [
        'Holiday camps keep school children busy with sport and crafts in the summer break.',
        'the holiday camp',
      ],
      [
        'The parent room has a fridge, a sink and a comfortable chair for nursing mothers.',
        'the parent room',
      ],
      [
        'Backup carers can step in at short notice when your usual childminder is ill.',
        'a backup carer',
      ],
      [
        'The homework club runs in the library after school for the children of colleagues.',
        'the homework club',
      ],
    ],
  ],
  [
    'Learning and growth',
    [
      [
        'Language courses in Dutch, German and Spanish are taught in groups of six learners.',
        'a language course',
      ],
      [
        'The leadership programme trains new team leads through workshops and peer coaching.',
        'the leadership programme',
      ],
      [
        'Online learning licences open a library of thousands of short video courses to you.',
        'an online learning licence',
      ],
      [
        'Mentoring pairs a junior colleague with an experienced one from a different team.',
        'mentoring',
      ],
      [
        'Conference tickets are paid from the learning budget whenever you present a talk.',
        'a conference ticket',
      ],
    ],
  ],
  [
    'Moving and settling in',
    [
      [
        'Relocation support helps colleagues moving from abroad to find a home and a school.',
        'relocation support',
      ],
      [
        'Temporary apartments close to the office host new colleagues in their first weeks.',
        'a temporary apartment',
      ],
      [
        'The tax adviser helps newcomers with their first tax return in the new country.',
        'the tax adviser',
      ],
      [
        'Storage units in the basement keep furniture and boxes safe while you are moving.',
        'a storage unit',
      ],
      [
        'Moving vans can be borrowed from the facilities team for moving house at weekends.',
        'a moving van',
      ],
    ],
  ],
];

/** Small deterministic generator, so numbers differ without Math.random. */
function lcg(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

const random = lcg(2026_11_19);
const RANGES = {
  fee: [12, 95],
  notice: [2, 14],
  hours: [6, 11],
  limit: [2, 12],
  extension: [2100, 2899],
  cancel: [2, 48],
};

const docs = [];
const questions = [];
let serviceIndex = 0;
for (const [title, services] of PAGES) {
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const used = new Set();
  const paragraphs = [];
  for (const [lead, name] of services) {
    // Three different kinds per service, rotating so every kind is common.
    const kinds = [0, 2, 4].map((step) => KINDS[(serviceIndex + step) % 6]);
    serviceIndex += 1;
    const facts = kinds.map((kind) => {
      const [low, high] = RANGES[kind];
      let n;
      do {
        n = low + Math.floor(random() * (high - low + 1));
      } while (used.has(`${kind}:${n}`));
      used.add(`${kind}:${n}`);
      return { kind, sentence: FACTS[kind].sentence(n) };
    });
    const paragraph = [lead, ...facts.map((fact) => fact.sentence)].join(' ');
    if (paragraph.length < 175 || paragraph.length > 235) {
      throw new Error(
        `"${name}" paragraph is ${paragraph.length} chars (keep 175-235)`,
      );
    }
    paragraphs.push(paragraph);
    for (const fact of facts) {
      questions.push({
        topic: name,
        kind: fact.kind,
        question: FACTS[fact.kind].question(name),
        goldDocId: id,
        goldSpan: fact.sentence,
        goldAnswer: fact.sentence,
      });
    }
  }
  docs.push({ id, title, text: paragraphs.join('\n\n') });
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
  console.error('office-services is out of date: re-run this script.');
  process.exit(1);
}
console.log(
  `office-services: ${docs.length} docs, ${questions.length} questions${CHECK ? ', up to date' : ''}`,
);
