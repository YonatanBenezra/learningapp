#!/usr/bin/env node
/**
 * Builds content/corpora/policy-history.json: a staff-policy knowledge base
 * that kept every version. Each policy family has superseded versions, one
 * current version and sometimes an unapproved draft, and they read almost
 * the same: only the number that changed and a line or two differ. Every
 * document carries metadata (family, version, status, effective date) that a
 * retriever can filter on.
 *
 * Also writes content/corpora/policy-history.questions.json: two phrasings of
 * the question each family answers, with the current version as gold.
 *
 * Deterministic. Usage: node scripts/content/build-policy-history.mjs [--check]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { contentRoot } from './paths.mjs';

const CHECK = process.argv.includes('--check');
const OUT = path.join(contentRoot, 'corpora', 'policy-history.json');
const QUESTIONS_OUT = path.join(
  contentRoot,
  'corpora',
  'policy-history.questions.json',
);

/**
 * [family, title, fact with {v}, values by version, answer unit, questions].
 * Versions: 2023 and 2024 are superseded, 2026 is current, 2027 is a draft.
 */
const FAMILIES = [
  [
    'hotels',
    'Hotel bookings',
    'Hotels may cost at most {v} euros a night in most cities.',
    { 2024: '140', 2026: '160', 2027: '185' },
    'euros a night',
    [
      'What is the nightly hotel limit in most cities?',
      'How much can a hotel room cost per night on a business trip?',
    ],
  ],
  [
    'meals',
    'Meals while travelling',
    'On business trips you can claim up to {v} euros a day for food.',
    { 2023: '35', 2024: '40', 2026: '45' },
    'euros a day',
    [
      'How much can I claim per day for food on a business trip?',
      'What is the daily meal allowance when travelling?',
    ],
  ],
  [
    'mileage',
    'Mileage',
    'Business trips in your own car are reimbursed at {v} euros per kilometre.',
    { 2024: '0.25', 2026: '0.30', 2027: '0.32' },
    'euros per kilometre',
    [
      'What is the mileage rate for using my own car?',
      'How much is reimbursed per kilometre when I drive my car for work?',
    ],
  ],
  [
    'learning',
    'Learning budget',
    'Every employee has {v} euros a year for courses, books and conference tickets.',
    { 2023: '1,000', 2024: '1,200', 2026: '1,500' },
    'euros a year',
    [
      'How big is the yearly learning budget?',
      'How much money do I get each year for courses and books?',
    ],
  ],
  [
    'parental',
    'Parental leave',
    'New parents may take {v} weeks away from work at full salary.',
    { 2024: 'sixteen', 2026: 'twenty' },
    'weeks',
    [
      'How many weeks of paid parental leave do new parents get?',
      'How long is parental leave at full salary?',
    ],
  ],
  [
    'abroad',
    'Working from another country',
    'You may work from a country other than your contract country for up to {v} days a year.',
    { 2024: 'twenty', 2026: 'thirty', 2027: 'forty-five' },
    'days a year',
    [
      'How many days a year can I work from another country?',
      'For how long may I work abroad each year?',
    ],
  ],
  [
    'on-call',
    'On-call pay',
    'Engineers receive {v} euros for each week on the on-call rota.',
    { 2023: '150', 2024: '175', 2026: '200' },
    'euros a week',
    [
      'How much is on-call pay per week?',
      'What do engineers get for a week on the on-call rota?',
    ],
  ],
  [
    'referrals',
    'Employee referrals',
    'A successful referral earns a {v} euro bonus once the new hire has stayed six months.',
    { 2024: '1,500', 2026: '2,000', 2027: '2,500' },
    'euros',
    [
      'How big is the referral bonus?',
      'What bonus do I get when someone I referred is hired?',
    ],
  ],
  [
    'gifts',
    'Gifts and hospitality',
    'You may accept gifts from suppliers worth up to {v} euros.',
    { 2024: '30', 2026: '50' },
    'euros',
    [
      'What is the limit for accepting supplier gifts?',
      'How much can a gift from a supplier be worth?',
    ],
  ],
  [
    'passwords',
    'Password rules',
    'Work passwords must be at least {v} characters long.',
    { 2023: '10', 2024: '12', 2026: '16', 2027: '20' },
    'characters',
    [
      'How long must a work password be?',
      'What is the minimum password length?',
    ],
  ],
  [
    'laptops',
    'Laptop refresh',
    'Laptops are replaced every {v} years.',
    { 2024: 'three', 2026: 'four' },
    'years',
    [
      'How often are laptops replaced?',
      'After how many years do I get a new laptop?',
    ],
  ],
  [
    'probation',
    'Probation',
    'New hires have a probation period of {v} months.',
    { 2024: 'three', 2026: 'six' },
    'months',
    [
      'How long is the probation period for new hires?',
      'How many months does probation last?',
    ],
  ],
  [
    'notice',
    'Notice period',
    'After probation, the notice period is {v} months.',
    { 2024: 'one', 2026: 'two', 2027: 'three' },
    'months',
    [
      'What is the notice period after probation?',
      'How much notice do I have to give once probation is over?',
    ],
  ],
  [
    'tickets',
    'Customer data retention',
    'Support tickets are deleted {v} years after they are closed.',
    { 2023: 'five', 2024: 'four', 2026: 'three' },
    'years',
    [
      'When are closed support tickets deleted?',
      'How long do we keep closed support tickets?',
    ],
  ],
  [
    'sabbatical',
    'Sabbatical',
    'After {v} years of continuous service you can take an unpaid sabbatical of up to three months.',
    { 2024: 'ten', 2026: 'seven' },
    'years',
    [
      'After how many years can I take a sabbatical?',
      'How long do I need to work here before a sabbatical?',
    ],
  ],
  [
    'home-office',
    'Home office allowance',
    'Remote staff can claim {v} euros a year for home office equipment.',
    { 2024: '300', 2026: '450', 2027: '500' },
    'euros a year',
    [
      'How much is the yearly home office allowance?',
      'How much can remote staff claim for home office equipment?',
    ],
  ],
  [
    'phones',
    'Mobile phones',
    'The company pays up to {v} euros a month toward a work phone plan.',
    { 2024: '25', 2026: '35' },
    'euros a month',
    [
      'How much does the company pay toward my phone plan?',
      'What is the monthly phone plan allowance?',
    ],
  ],
  [
    'overtime',
    'Overtime',
    'Hours beyond forty a week are paid at {v} times the normal rate.',
    { 2023: '1.25', 2024: '1.4', 2026: '1.5' },
    'times the rate',
    [
      'What is the overtime pay rate?',
      'How are hours beyond forty a week paid?',
    ],
  ],
  [
    'sick-notes',
    'Sick leave',
    "A doctor's note is needed after {v} days of sick leave.",
    { 2024: 'two', 2026: 'three', 2027: 'five' },
    'days',
    [
      "After how many sick days do I need a doctor's note?",
      'When do I have to bring a note from a doctor for sick leave?',
    ],
  ],
  [
    'bikes',
    'Bike leasing',
    'Staff can lease a bike worth up to {v} euros through payroll.',
    { 2024: '2,000', 2026: '3,500' },
    'euros',
    [
      'What is the maximum bike value for leasing?',
      'How expensive a bike can I lease through payroll?',
    ],
  ],
  [
    'visitors',
    'Visitors',
    'Guests must be registered at reception at least {v} hours before they arrive.',
    { 2024: '12', 2026: '24' },
    'hours',
    [
      'How far ahead must guests be registered?',
      'How many hours before a visit do I have to register a guest?',
    ],
  ],
  [
    'expenses',
    'Expense claims',
    'Expense claims must be filed within {v} days of the purchase.',
    { 2023: '90', 2024: '60', 2026: '30', 2027: '45' },
    'days',
    [
      'Within how many days must I file an expense claim?',
      'What is the deadline for filing expenses after a purchase?',
    ],
  ],
  [
    'conferences',
    'Conference travel',
    'Each employee may attend up to {v} paid conferences a year.',
    { 2024: 'one', 2026: 'two' },
    'conferences a year',
    [
      'How many paid conferences can I attend each year?',
      'How many conferences a year does the company pay for?',
    ],
  ],
  [
    'wellbeing',
    'Wellbeing allowance',
    'Staff receive {v} euros a month toward a gym or sports club.',
    { 2024: '20', 2026: '30', 2027: '40' },
    'euros a month',
    [
      'How much is the monthly wellbeing allowance?',
      'How much does the company give toward a gym each month?',
    ],
  ],
];

/** Lines that differ between versions, so versions do not read identically. */
const EXTRAS = [
  'Questions go to People Operations.',
  'Managers approve exceptions in writing.',
  'It applies to all offices and to remote staff.',
  'Keep receipts for the yearly audit.',
  'Part-time staff receive a pro-rated amount.',
  'The finance team reviews the amount every year.',
  'Contractors are not covered.',
  'Exceptions are logged by the policy owner.',
];
const EFFECTIVE = {
  2023: '2023-01-01',
  2024: '2024-03-01',
  2026: '2026-02-01',
  2027: '2027-01-01',
};
const STATUS = {
  2023: 'superseded',
  2024: 'superseded',
  2026: 'current',
  2027: 'draft',
};

const docs = [];
const questions = [];
FAMILIES.forEach(([family, title, fact, values, unit, asked], index) => {
  const years = Object.keys(values).sort();
  years.forEach((year, versionIndex) => {
    const status = STATUS[year];
    const lead =
      status === 'draft'
        ? // Drafts announce themselves with the policy name, so they rank well.
          `Draft ${title.toLowerCase()} policy for ${year}, not yet approved.`
        : `Effective ${EFFECTIVE[year].slice(0, 7)}.`;
    const lines = [lead, fact.replace('{v}', values[year])];
    // Two rotating extra lines; superseded versions get one, others two.
    lines.push(EXTRAS[(index + versionIndex) % EXTRAS.length]);
    if (status !== 'superseded') {
      lines.push(EXTRAS[(index + versionIndex + 3) % EXTRAS.length]);
    }
    docs.push({
      id: `${family}-${year}`,
      title,
      text: lines.join(' '),
      meta: { family, version: year, status, effective: EFFECTIVE[year] },
    });
  });
  const current = `${family}-2026`;
  const gold = fact.replace('{v}', values[2026]).replace(/\.$/, '');
  asked.forEach((question, i) => {
    questions.push({
      family,
      question,
      goldDocId: current,
      goldSpan: gold,
      goldAnswer: `${values[2026]} ${unit}`,
      phrasing: i,
    });
  });
});

// Office notices without versions: filler that never carries an answer.
const NOTICES = [
  [
    'kitchen',
    'Kitchen rota',
    'The kitchen on each floor is cleaned on Friday afternoons. Please empty the fridge by noon.',
  ],
  [
    'lifts',
    'Lift maintenance',
    'Lift B is serviced on the first Monday of each month. Use the stairs or lift A.',
  ],
  [
    'printers',
    'Printers',
    'Printers release jobs only after you badge in at the device. Unclaimed jobs are deleted overnight.',
  ],
  [
    'plants',
    'Office plants',
    'Facilities waters the office plants on Tuesdays. Do not move large pots yourself.',
  ],
  [
    'lockers',
    'Lockers',
    'Day lockers are emptied every evening at 20:00. Long-term lockers are assigned by Facilities.',
  ],
  [
    'parking',
    'Parking',
    'Parking permits are issued for one year at a time. Visitor spaces are on level -1.',
  ],
  [
    'mail',
    'Post room',
    'Parcels for staff are held in the post room for five working days.',
  ],
  [
    'quiet',
    'Quiet room',
    'The quiet room on floor 3 is for focused work and can be booked for one hour at a time.',
  ],
  [
    'showers',
    'Showers',
    'Showers on the ground floor are open from 06:30 to 21:00.',
  ],
  [
    'coffee',
    'Coffee machines',
    'Report a broken coffee machine to Facilities through the service portal.',
  ],
];
for (const [id, title, text] of NOTICES) {
  docs.push({ id: `notice-${id}`, title, text });
}

for (const doc of docs) {
  if (doc.text.length > 400) {
    throw new Error(`${doc.id} is ${doc.text.length} chars (max 400)`);
  }
}
for (const q of questions) {
  const doc = docs.find((d) => d.id === q.goldDocId);
  if (!doc.text.includes(q.goldSpan)) {
    throw new Error(`gold span missing for ${q.question}`);
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
  console.error('policy-history is out of date: re-run this script.');
  process.exit(1);
}
console.log(
  `policy-history: ${docs.length} docs, ${questions.length} questions${CHECK ? ', up to date' : ''}`,
);
