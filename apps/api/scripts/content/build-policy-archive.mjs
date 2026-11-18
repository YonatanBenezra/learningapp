#!/usr/bin/env node
/**
 * Builds content/corpora/policy-archive.json: a policy archive that keeps
 * every version of every policy. Versions are worded the same and differ
 * only in their numbers and in the first sentence, which says when they took
 * effect ("Effective 2025-04.") or that they are a draft ("Draft, not yet
 * approved."). Nothing else marks which one is current, and the archive has
 * no metadata a program could read: the date has to be read from the text.
 *
 * Keyword search cannot tell versions apart. A retriever has to group them
 * and keep the newest version that is not a draft.
 *
 * Also writes content/corpora/policy-archive.questions.json (gold = the
 * current version's sentence).
 *
 * Deterministic. Usage: node scripts/content/build-policy-archive.mjs [--check]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { contentRoot } from './paths.mjs';

const CHECK = process.argv.includes('--check');
const OUT = path.join(contentRoot, 'corpora', 'policy-archive.json');
const QUESTIONS_OUT = path.join(
  contentRoot,
  'corpora',
  'policy-archive.questions.json',
);

/**
 * Policy, its versions (effective date or 'draft'), then fact templates with
 * the value in every version, oldest first, and the question.
 */
const POLICIES = [
  [
    'Hotel stays',
    ['2023-02', '2024-06', '2026-01', 'draft'],
    [
      [
        (n) => `Hotels may cost at most ${n} euros a night in most cities.`,
        [120, 135, 150, 170],
        'What is the nightly hotel limit in most cities?',
      ],
      [
        (n) => `In capital cities the limit is ${n} euros a night.`,
        [160, 175, 190, 210],
        'What is the nightly hotel limit in capital cities?',
      ],
      [
        (n) => `Rooms are booked at least ${n} days before the trip.`,
        [7, 10, 14, 21],
        'How far ahead must hotel rooms be booked?',
      ],
    ],
  ],
  [
    'Meals on trips',
    ['2022-09', '2025-03', 'draft'],
    [
      [
        (n) => `The daily meal allowance abroad is ${n} euros.`,
        [40, 50, 55],
        'What is the daily meal allowance abroad?',
      ],
      [
        (n) => `At home the daily meal allowance is ${n} euros.`,
        [25, 30, 35],
        'What is the daily meal allowance for trips at home?',
      ],
      [
        (n) => `Client dinners may cost up to ${n} euros per guest.`,
        [60, 70, 85],
        'How much may a client dinner cost per guest?',
      ],
    ],
  ],
  [
    'Home office',
    ['2021-05', '2023-10', '2026-04'],
    [
      [
        (n) =>
          `Home office equipment is paid up to ${n} euros every three years.`,
        [300, 350, 400],
        'How much is paid for home office equipment?',
      ],
      [
        (n) => `Internet at home is refunded at ${n} euros a month.`,
        [15, 20, 25],
        'How much is refunded for internet at home each month?',
      ],
      [
        (n) => `Staff work from home up to ${n} days a week.`,
        [2, 3, 3.5],
        'How many days a week may staff work from home?',
      ],
    ],
  ],
  [
    'Mileage',
    ['2023-01', '2025-07', 'draft'],
    [
      [
        (n) =>
          `Driving your own car on business is refunded at ${n} cents a kilometre.`,
        [25, 30, 33],
        'What is the mileage rate for driving your own car?',
      ],
      [
        (n) => `Electric cars get an extra ${n} cents a kilometre.`,
        [2, 4, 5],
        'How much extra do electric cars get per kilometre?',
      ],
      [
        (n) => `Trips shorter than ${n} kilometres are not refunded.`,
        [5, 10, 8],
        'Which short trips are not refunded?',
      ],
    ],
  ],
  [
    'Learning budget',
    ['2022-01', '2024-01', '2026-01', 'draft'],
    [
      [
        (n) =>
          `Every member of staff has a learning budget of ${n} euros a year.`,
        [600, 800, 1000, 1200],
        'How big is the yearly learning budget?',
      ],
      [
        (n) => `Courses above ${n} euros need the manager's approval.`,
        [300, 400, 500, 600],
        "Which courses need the manager's approval?",
      ],
      [
        (n) => `Unused budget of up to ${n} euros moves to the next year.`,
        [0, 100, 200, 300],
        'How much unused learning budget moves to the next year?',
      ],
    ],
  ],
  [
    'Phones',
    ['2023-05', '2025-11'],
    [
      [
        (n) => `Company phones are replaced every ${n} years.`,
        [2, 3],
        'How often are company phones replaced?',
      ],
      [
        (n) => `Roaming data abroad is included up to ${n} gigabytes a month.`,
        [5, 10],
        'How much roaming data abroad is included each month?',
      ],
      [
        (n) => `Personal phones used for work get ${n} euros a month.`,
        [10, 15],
        'What allowance do personal phones used for work get?',
      ],
    ],
  ],
  [
    'Parental leave',
    ['2021-01', '2024-09', 'draft'],
    [
      [
        (n) => `Parents receive ${n} weeks of fully paid leave.`,
        [12, 16, 20],
        'How many weeks of paid parental leave do parents get?',
      ],
      [
        (n) => `The leave can be split into up to ${n} blocks.`,
        [2, 3, 4],
        'Into how many blocks can parental leave be split?',
      ],
      [
        (n) => `It must be taken within ${n} months of the birth.`,
        [9, 12, 18],
        'Within how many months must parental leave be taken?',
      ],
    ],
  ],
  [
    'Bike lease',
    ['2022-04', '2023-08', '2025-05'],
    [
      [
        (n) => `Bikes worth up to ${n} euros can be leased through the salary.`,
        [1500, 2500, 3000],
        'Up to what value can a bike be leased?',
      ],
      [
        (n) => `The lease runs for ${n} months.`,
        [24, 36, 48],
        'How long does a bike lease run?',
      ],
      [
        (n) =>
          `At the end the bike can be bought for ${n} percent of its price.`,
        [20, 15, 10],
        'For how much can the bike be bought at the end of the lease?',
      ],
    ],
  ],
  [
    'Gifts',
    ['2020-11', '2024-02', 'draft'],
    [
      [
        (n) => `Gifts from suppliers may be accepted up to ${n} euros.`,
        [25, 50, 40],
        'Up to what value may gifts from suppliers be accepted?',
      ],
      [
        (n) => `Gifts above the limit are reported within ${n} days.`,
        [14, 7, 5],
        'Within how many days are gifts above the limit reported?',
      ],
      [
        (n) => `Gifts to clients may cost up to ${n} euros each.`,
        [50, 75, 60],
        'How much may a gift to a client cost?',
      ],
    ],
  ],
  [
    'Sick leave',
    ['2022-06', '2026-02'],
    [
      [
        (n) => `A doctor's note is needed after ${n} days of sick leave.`,
        [2, 3],
        "After how many days is a doctor's note needed?",
      ],
      [
        (n) =>
          `Sick leave is reported to the manager before ${n} in the morning.`,
        [9, 10],
        'By what time must sick leave be reported?',
      ],
      [
        (n) => `Full salary is paid for the first ${n} weeks of illness.`,
        [26, 52],
        'For how many weeks of illness is full salary paid?',
      ],
    ],
  ],
  [
    'Overtime',
    ['2023-03', '2025-09', 'draft'],
    [
      [
        (n) => `Overtime is paid at ${n} percent of the hourly rate.`,
        [125, 150, 175],
        'At what rate is overtime paid?',
      ],
      [
        (n) => `Overtime above ${n} hours a month needs approval in advance.`,
        [10, 20, 15],
        'How much overtime a month needs approval in advance?',
      ],
      [
        (n) => `Overtime can be taken as time off within ${n} months.`,
        [3, 6, 12],
        'Within how many months can overtime be taken as time off?',
      ],
    ],
  ],
  [
    'Relocation',
    ['2021-08', '2024-11'],
    [
      [
        (n) => `Moving costs are paid up to ${n} euros.`,
        [3000, 5000],
        'Up to how much are moving costs paid?',
      ],
      [
        (n) => `Temporary housing is paid for ${n} weeks.`,
        [4, 8],
        'For how many weeks is temporary housing paid?',
      ],
      [
        (n) =>
          `Relocation costs are paid back if you leave within ${n} months.`,
        [24, 12],
        'When must relocation costs be paid back?',
      ],
    ],
  ],
];

const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const docs = [];
const questions = [];
for (const [title, versions, facts] of POLICIES) {
  const family = slug(title);
  versions.forEach((version, index) => {
    for (const [, values] of facts) {
      if (values.length !== versions.length) {
        throw new Error(`${title}: one value per version`);
      }
      if (new Set(values).size !== values.length) {
        throw new Error(`${title}: every version must change every value`);
      }
    }
    const lead =
      version === 'draft'
        ? `Draft, not yet approved. Proposed changes to the ${title.toLowerCase()} policy.`
        : `Effective ${version}.`;
    docs.push({
      id: `${family}-${version === 'draft' ? 'draft' : version.slice(0, 4)}`,
      title,
      text: [
        lead,
        ...facts.map(([sentence, values]) => sentence(values[index])),
      ].join(' '),
    });
  });
  const current = versions.reduce(
    (best, version, index) => (version !== 'draft' ? index : best),
    -1,
  );
  const currentId = `${family}-${versions[current].slice(0, 4)}`;
  for (const [sentence, values, question] of facts) {
    questions.push({
      family,
      question,
      goldDocId: currentId,
      goldSpan: sentence(values[current]),
      goldAnswer: sentence(values[current]),
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
  console.error('policy-archive is out of date: re-run this script.');
  process.exit(1);
}
console.log(
  `policy-archive: ${docs.length} versions, ${questions.length} questions${CHECK ? ', up to date' : ''}`,
);
