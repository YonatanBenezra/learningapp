#!/usr/bin/env node
/**
 * Builds content/corpora/support-kb.json: the internal knowledge base of a
 * device-support team. Deterministic (seeded), so re-running it never changes
 * the corpus unless this file changes.
 *
 * What makes it useful for teaching retrieval:
 * - Product sheets and error articles come in families whose ids differ only
 *   in digit order (RT-4712, RT-4127, ...), named once in the title over the
 *   same boilerplate. Exact ids are easy for BM25 and hard for embeddings,
 *   which see near-identical text.
 * - Policies are written in their own words, and short notes elsewhere reuse
 *   the words people actually ask with. Reworded questions are easy for
 *   embeddings and hard for BM25, which latches onto the notes.
 *
 * Usage: node scripts/content/build-support-kb.mjs [--check]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { contentRoot } from './paths.mjs';

const CHECK = process.argv.includes('--check');
const OUT = path.join(contentRoot, 'corpora', 'support-kb.json');

/** mulberry32: small seeded PRNG so the corpus is reproducible. */
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
const random = rng(20261118);
const pick = (list) => list[Math.floor(random() * list.length)];
/** "a" or "an" by sound: an edge router, an 18-month warranty, a 24-month one. */
const article = (next) =>
  /^([aeiou]|8|11[^0-9]|11$|18[^0-9]|18$)/i.test(next) ? 'an' : 'a';

/** Distinct 4-digit numbers built from the same four digits. */
function permutations(digits, count) {
  const out = new Set();
  const all = [];
  const walk = (prefix, rest) => {
    if (rest.length === 0) {
      all.push(prefix);
      return;
    }
    rest.forEach((d, i) =>
      walk(prefix + d, [...rest.slice(0, i), ...rest.slice(i + 1)]),
    );
  };
  walk('', digits.split(''));
  while (out.size < count) {
    out.add(pick(all.filter((n) => n[0] !== '0')));
  }
  return [...out];
}

const docs = [];

// --- Product sheets: 8 families x 10 near-identical models ------------------
const FAMILIES = [
  {
    name: 'Kite',
    kind: 'edge router',
    prefix: 'RT',
    digits: '4712',
    use: 'branch offices',
  },
  {
    name: 'Brook',
    kind: 'air-quality sensor',
    prefix: 'AQ',
    digits: '3815',
    use: 'meeting rooms',
  },
  {
    name: 'Ridge',
    kind: 'door controller',
    prefix: 'DC',
    digits: '6294',
    use: 'secured doors',
  },
  {
    name: 'Wren',
    kind: 'badge reader',
    prefix: 'BR',
    digits: '5370',
    use: 'turnstiles',
  },
  {
    name: 'Larch',
    kind: 'PoE switch',
    prefix: 'SW',
    digits: '2846',
    use: 'ceiling access points',
  },
  {
    name: 'Fjord',
    kind: 'thermal camera',
    prefix: 'TC',
    digits: '9163',
    use: 'server rooms',
  },
  {
    name: 'Moss',
    kind: 'battery pack',
    prefix: 'BP',
    digits: '7528',
    use: 'field kits',
  },
  {
    name: 'Cedar',
    kind: 'IoT gateway',
    prefix: 'GW',
    digits: '1459',
    use: 'warehouse sensors',
  },
];
const PARTS = [
  ['fan module', 'FM'],
  ['power brick', 'PB'],
  ['mounting bracket', 'MB'],
  ['antenna kit', 'AK'],
  ['front bezel', 'FB'],
  ['sensor head', 'SH'],
];
const products = [];
for (const family of FAMILIES) {
  for (const number of permutations(family.digits, 10)) {
    const sku = `${family.prefix}-${number}`;
    const fact = {
      sku,
      watts: 4 + Math.floor(random() * 56),
      warranty: pick([12, 18, 24, 36, 48, 60]),
      firmware: `${2 + Math.floor(random() * 3)}.${Math.floor(random() * 10)}.${Math.floor(random() * 10)}`,
      part: (([name, code]) =>
        `${name} ${code}-${10 + Math.floor(random() * 89)}`)(pick(PARTS)),
    };
    products.push(fact);
    docs.push({
      id: `sku-${sku.toLowerCase()}`,
      title: `${family.name} ${family.kind} ${sku}`,
      // The model number is in the title only, as in a real catalogue: the
      // body copy is the same boilerplate across a family.
      text: [
        `This ${family.kind} is built for ${family.use}.`,
        `It draws ${fact.watts} W at full load.`,
        `It carries ${article(String(fact.warranty))} ${fact.warranty}-month warranty from the delivery date.`,
        `It needs firmware ${fact.firmware} or later.`,
        `The spare ${fact.part} fits it.`,
      ].join(' '),
    });
  }
}

// --- Error articles: 6 components x 8 near-identical codes ------------------
const COMPONENTS = [
  {
    part: 'fan controller',
    problem: 'stopped reporting speed',
    digits: '2041',
  },
  { part: 'power supply', problem: 'saw a voltage drop', digits: '3172' },
  { part: 'storage module', problem: 'failed a write check', digits: '5208' },
  { part: 'radio', problem: 'lost its uplink', digits: '6394' },
  { part: 'clock chip', problem: 'drifted out of sync', digits: '7413' },
  { part: 'tamper switch', problem: 'reported an open case', digits: '8560' },
];
const FIXES = [
  'power-cycle the unit and wait two minutes before reconnecting it',
  'reseat the ribbon cable behind the front panel',
  'roll the firmware back one version from the admin page',
  'replace the fuse on the main board with a 5 A fuse',
  'reset the unit to factory settings and restore its saved profile',
  'move the unit away from heat sources and clean the air intake',
  'swap the network cable and check the port lights',
  'recalibrate it from the service menu under Diagnostics',
];
const TEAMS = [
  'Field Service',
  'Hardware Engineering',
  'Network Operations',
  'Firmware',
  'Logistics',
];
const errors = [];
for (const component of COMPONENTS) {
  for (const number of permutations(component.digits, 8)) {
    const code = `E-${number}`;
    const fact = {
      code,
      fix: pick(FIXES),
      hours: pick([4, 12, 24, 48, 72]),
      team: pick(TEAMS),
    };
    errors.push(fact);
    docs.push({
      id: `err-${number}`,
      title: `Error ${code}: ${component.part}`,
      text: [
        `This error means the ${component.part} ${component.problem}.`,
        `To clear it, ${fact.fix}.`,
        `If it comes back within ${fact.hours} hours, open a ticket with the ${fact.team} team.`,
      ].join(' '),
    });
  }
}

// --- Policies: written in their own words -----------------------------------
const POLICIES = [
  [
    'parental-leave',
    'Parental leave',
    'New parents may take twenty weeks away from work at full salary, starting any time in the first twelve months after a birth or adoption. The weeks can be split into at most three blocks. Tell your manager eight weeks before the first block starts.',
  ],
  [
    'compassionate-leave',
    'Compassionate leave',
    'After the death of a close relative, staff receive five working days off without loss of salary. Up to ten further unpaid days can be added when the funeral is abroad.',
  ],
  [
    'civic-duty',
    'Civic duty',
    'Employees summoned to serve on a jury keep their full salary for the whole period of service. Forward the summons to People Operations within three days of receiving it.',
  ],
  [
    'sabbatical',
    'Sabbatical',
    'After seven years of continuous service you can take a sabbatical of up to three months. It is unpaid, but your role, benefits and seniority are kept.',
  ],
  [
    'relocation',
    'Relocation support',
    'When the company asks you to move to another city, it covers removal costs and four weeks of temporary housing. Claims must be filed within ninety days of the move.',
  ],
  [
    'learning-budget',
    'Learning budget',
    'Every employee has 1,500 euros a year for courses, books and conference tickets. Unused money does not roll over into the next year.',
  ],
  [
    'mentoring',
    'Mentoring programme',
    'Engineers in their first year are paired with a senior mentor from another team. Pairs meet every two weeks for at least six months.',
  ],
  [
    'overtime',
    'Overtime',
    'Hours worked beyond forty in a week are paid at one and a half times the normal rate, or taken later as time off in lieu. Overtime must be approved in advance by your manager.',
  ],
  [
    'work-abroad',
    'Working from another country',
    'You may work from a country other than your contract country for up to thirty days a year. Longer stays need written approval from Legal because of tax rules.',
  ],
  [
    'mileage',
    'Mileage',
    'Business trips in your own car are reimbursed at 0.30 euros per kilometre. Commuting between home and your usual office is never reimbursed.',
  ],
  [
    'travel-meals',
    'Meals while travelling',
    'On business trips you can claim up to 45 euros a day for food. Alcohol is never covered.',
  ],
  [
    'hotels',
    'Hotel bookings',
    'Hotels must be booked through the travel portal and may cost at most 160 euros a night in most cities. London, Paris and New York allow up to 260 euros.',
  ],
  [
    'supplier-gifts',
    'Gifts and hospitality',
    'You may accept gifts from suppliers worth up to 50 euros. Anything above that must be declared to Compliance within a week and usually returned.',
  ],
  [
    'password-manager',
    'Password manager',
    'Every employee must store work credentials in the company password manager. Writing them on paper or in notes apps is forbidden.',
  ],
  [
    'phishing',
    'Reporting phishing',
    'Forward any suspicious email to the security inbox with the Report button and do not open its attachments. Security replies within one working hour.',
  ],
  [
    'lost-devices',
    'Lost or stolen devices',
    'If a laptop or phone is lost or stolen, call the service desk at once so it can be wiped remotely. A police report is needed within 48 hours for insurance.',
  ],
  [
    'visitors',
    'Visitors',
    'Guests must be registered at reception the day before and escorted at all times. They receive a red badge that is returned when they leave.',
  ],
  [
    'clean-desk',
    'Clean desk',
    'At the end of each day, lock confidential papers in your pedestal and leave the desk empty. Cleaners remove anything left on desks on Fridays.',
  ],
  [
    'software-purchases',
    'Buying software',
    'Software purchases above 5,000 euros a year need three quotes and approval from Procurement. Smaller purchases can be made with a team card.',
  ],
  [
    'on-call-pay',
    'On-call pay',
    'Engineers on the on-call rota receive 200 euros for each week on call, plus normal overtime for any incident work outside office hours.',
  ],
  [
    'referrals',
    'Employee referrals',
    'If someone you recommend is hired and stays six months, you receive a 2,000 euro bonus. Referrals for interns and contractors do not qualify.',
  ],
  [
    'probation',
    'Probation',
    'New hires have a six-month probation period with a review at three months. During probation either side can end the contract with two weeks of notice.',
  ],
  [
    'ticket-retention',
    'Customer data retention',
    'Customer support tickets are deleted three years after they are closed. Invoices are kept for ten years to meet tax law.',
  ],
  [
    'adjustments',
    'Workplace adjustments',
    'Staff with a disability or long-term condition can request adjustments such as special equipment or flexible hours. People Operations replies within ten working days and the cost is covered centrally.',
  ],
];
for (const [id, title, text] of POLICIES) {
  docs.push({ id: `policy-${id}`, title, text });
}

// --- Notes that use the words people ask with --------------------------------
const NOTES = [
  [
    'home-office-kit',
    'Home office kit',
    'Staff who work from home can order a monitor and a chair once a year. The kit stays company property and must be returned when you leave. Orders placed before the 10th are paid and shipped by the 20th.',
  ],
  [
    'family-day',
    'Family day',
    'Family day is held every June. Bring your family to the office and see how much time the robots in the lab save; slots pass quickly, so book early.',
  ],
  [
    'panel-series',
    'Panel discussion series',
    'Our monthly panel invites a citizen scientist or a guest speaker. The company keeps paying for snacks, and a trial run of the new format starts in March.',
  ],
  [
    'new-year-closure',
    'New Year closure',
    'During the extended break around New Year the office is closed; come back on January 3rd. We use the long quiet time to clean the kitchen.',
  ],
  [
    'desk-moves',
    'Desk moves',
    'Moving desks within the office? Facilities can help you move house plants and monitors. Transferred equipment must be tagged before the move.',
  ],
  [
    'gym',
    'Gym partnership',
    'Getting better at your fitness costs less with the gym partnership: each year you spend less on training, because staff pay 20 euros a month for unlimited sessions.',
  ],
  [
    'first-week',
    'Your first week',
    'When you are new, collect your laptop, guide card and badge on day one. An assigned colleague will show you the kitchen and the experienced barista.',
  ],
  [
    'step-challenge',
    'Step challenge',
    'Put in more effort this season: every normal week you walk 50,000 steps you earn extra raffle points, and more than three weeks earns a hoodie.',
  ],
  [
    'overseas-customers',
    'Overseas customers',
    'Overseas customers can do a free trial for a while. The job of the support desk is to answer them within a day, however long the queue.',
  ],
  [
    'car-park',
    'Car park rules',
    'Private vehicles park on level -2. Each km of the ring road is closed for work in May, so drive carefully and get back early.',
  ],
  [
    'client-lunch',
    'Client visits and lunch',
    'When a client comes to see you, book lunch or dinner in the canteen. We host at most two client groups per day on the road side of the building.',
  ],
  [
    'quiet-room',
    'Quiet room',
    'The quiet room on floor 3 is for focused work or a short sleep; book a room slot for at most one hour. Mind the trip hazard at the door and pay attention to the maximum of four people.',
  ],
  [
    'present-drive',
    'Holiday present drive',
    "Our holiday present drive collects toys for the children's hospital. A vendor sends the boxes, and you can keep the wrapping paper.",
  ],
  [
    'canteen-app',
    'Canteen app',
    'Save the date: login to the new canteen app opens on Monday. The chef will reveal the secrets of the winter menu, so save your spot.',
  ],
  [
    'train-tickets',
    'Train tickets',
    'Missing a train? Tell the travel desk who issued the ticket, and your computer-generated booking can be changed on the next train.',
  ],
  [
    'app-of-the-month',
    'App of the month',
    'Every month we pick an app worth trying. This month the subscription offer gives you multiple pricey features before paying anything.',
  ],
  [
    'bonus-quiz',
    'Bonus quiz',
    'Bonus quiz: who carried the oldest pager in the company? Seven days left to answer, and the winner gets a bonus day off.',
  ],
  [
    'charity-run',
    'Charity run',
    'Bring a friend to the charity run in September. Every runner from the company gets a reward medal and a free coffee.',
  ],
  [
    'coffee-trial',
    'New coffee machine',
    'The trial period of the new coffee machine starts when you start your week on Monday. It can be ended quickly if the beans run out.',
  ],
  [
    'help-desk-hours',
    'Help desk hours',
    'The help desk is open from 8 to 18. Old conversations about lunch orders are thrown away after a week, and we never throw away feedback.',
  ],
  [
    'chair-yoga',
    'Chair yoga',
    'Chair yoga is special: different times each week, a good fit for any health condition, and you can get a mat at reception.',
  ],
  [
    'night-shift',
    'Night shift parking',
    'When you go home at night after a late shift, use the workspace exit on level -1. The barrier opens until midnight.',
  ],
];
for (const [id, title, text] of NOTES) {
  docs.push({ id: `note-${id}`, title, text });
}

// --- Office announcements: filler without retrieval traps --------------------
const FLOORS = [1, 2, 3, 4];
const REASONS = [
  'a deep clean',
  'new flooring',
  'a fire drill',
  'pipe repairs',
];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday'];
FLOORS.forEach((floor) =>
  REASONS.forEach((reason, i) => {
    docs.push({
      id: `notice-f${floor}-${i}`,
      title: `Floor ${floor} notice ${i + 1}`,
      text: `The floor ${floor} kitchen closes on ${DAYS[(floor + i) % 4]} for ${reason}. Use the kitchen on floor ${(floor % 4) + 1} instead.`,
    });
  }),
);

const ids = new Set();
for (const doc of docs) {
  if (ids.has(doc.id)) throw new Error(`duplicate doc id ${doc.id}`);
  ids.add(doc.id);
  if (doc.text.length > 400)
    throw new Error(`${doc.id} is ${doc.text.length} chars (max 400)`);
}

const json = `${JSON.stringify(docs, null, 2)}\n`;
let current = '';
try {
  current = readFileSync(OUT, 'utf8');
} catch {
  // first build
}
if (CHECK) {
  if (current !== json) {
    console.error(
      `${path.relative(process.cwd(), OUT)} is out of date: re-run this script.`,
    );
    process.exit(1);
  }
  console.log(`support-kb: ${docs.length} docs, up to date`);
} else {
  writeFileSync(OUT, json);
  console.log(
    `support-kb: wrote ${docs.length} docs to ${path.relative(process.cwd(), OUT)}`,
  );
}
