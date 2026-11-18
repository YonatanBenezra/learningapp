#!/usr/bin/env node
/**
 * Builds content/corpora/staff-handbook.json: formal company policies that
 * always spell terms out ("paid time off", "purchase order"), a glossary that
 * maps the abbreviations staff actually type to those terms, and office
 * announcements full of everyday words. Staff ask with abbreviations and
 * typos ("How much PTO...", "...purchse order"), so a keyword search finds the
 * glossary and the announcements, not the policy. A query rewrite that
 * expands the abbreviation or fixes the spelling finds it.
 *
 * Also writes content/corpora/staff-handbook.questions.json.
 *
 * Deterministic. Usage: node scripts/content/build-staff-handbook.mjs [--check]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { contentRoot } from './paths.mjs';

const CHECK = process.argv.includes('--check');
const OUT = path.join(contentRoot, 'corpora', 'staff-handbook.json');
const QUESTIONS_OUT = path.join(
  contentRoot,
  'corpora',
  'staff-handbook.questions.json',
);

/**
 * id, abbreviation, the term it stands for, policy title and text, and two
 * questions: one with the abbreviation, one with typos in the policy's own
 * words. [question, gold sentence index, kind].
 */
const POLICIES = [
  {
    id: 'pto',
    abbr: 'PTO',
    term: 'paid time off',
    title: 'Annual paid time off',
    text: [
      'Full-time employees accrue twenty-five days of paid time off per calendar year.',
      'At most five unused days carry over into the following year.',
    ],
    questions: [
      ['How much PTO do I get each year?', 0, 'abbreviation'],
      ['How many unusd days cary over?', 1, 'typo'],
    ],
  },
  {
    id: 'wfh',
    abbr: 'WFH',
    term: 'working from home',
    title: 'Working from home',
    text: [
      'Staff may work from home up to three days per week with manager agreement.',
      'Home working equipment is ordered through the service desk.',
    ],
    questions: [
      ['How many WFH days are allowed per week?', 0, 'abbreviation'],
      ['Where do I ordr equipmnt for home?', 1, 'typo'],
    ],
  },
  {
    id: 'ooo',
    abbr: 'OOO',
    term: 'out of office',
    title: 'Out-of-office replies',
    text: [
      'Set an automatic out-of-office reply when absent for more than one working day.',
      'The reply must name a colleague who can help while you are away.',
    ],
    questions: [
      ['When do I need to set an OOO message?', 0, 'abbreviation'],
      ['Who should my automatc absnce reply name?', 1, 'typo'],
    ],
  },
  {
    id: 'mfa',
    abbr: 'MFA',
    term: 'multi-factor authentication',
    title: 'Multi-factor authentication',
    text: [
      'Multi-factor authentication is required for email, the VPN and the expense tool.',
      'Hardware security keys are issued by the service desk.',
    ],
    questions: [
      ['Which systems need MFA?', 0, 'abbreviation'],
      ['Who issues hardwre securty keys?', 1, 'typo'],
    ],
  },
  {
    id: 'po',
    abbr: 'PO',
    term: 'purchase order',
    title: 'Purchase orders',
    text: [
      'A purchase order is needed for any supplier spend above 2,000 euros.',
      'The purchase order must be approved before the invoice arrives.',
    ],
    questions: [
      ['Above what amount is a PO required?', 0, 'abbreviation'],
      ['Must a purchse ordr be aproved before the invoce?', 1, 'typo'],
    ],
  },
  {
    id: 'nda',
    abbr: 'NDA',
    term: 'non-disclosure agreement',
    title: 'Confidentiality agreements',
    text: [
      'Visitors and contractors sign a non-disclosure agreement before seeing unreleased products.',
      'Legal keeps the signed copies for seven years.',
    ],
    questions: [
      ['Who keeps signed NDAs, and for how long?', 1, 'abbreviation'],
      ['Do contractrs sign befor seeing unreleasd products?', 0, 'typo'],
    ],
  },
  {
    id: 'pip',
    abbr: 'PIP',
    term: 'performance improvement plan',
    title: 'Performance improvement plans',
    text: [
      'A performance improvement plan lasts eight weeks.',
      'There is a check-in with the manager every two weeks during the plan.',
    ],
    questions: [
      ['How long does a PIP last?', 0, 'abbreviation'],
      ['How oftn are chek-ins during an improvment plan?', 1, 'typo'],
    ],
  },
  {
    id: 'rto',
    abbr: 'RTO',
    term: 'return to office',
    title: 'Office attendance',
    text: [
      'Teams return to the office on Tuesdays and Thursdays.',
      'The other weekdays are flexible.',
    ],
    questions: [
      ['Which days are RTO days?', 0, 'abbreviation'],
      ['Which weekdys are flexibl?', 1, 'typo'],
    ],
  },
  {
    id: 'okr',
    abbr: 'OKR',
    term: 'objectives and key results',
    title: 'Quarterly objectives and key results',
    text: [
      'Each team sets three objectives and key results per quarter.',
      'They are reviewed in the second week of the following quarter.',
    ],
    questions: [
      ['How many OKRs does a team set?', 0, 'abbreviation'],
      ['When are quartrly objectivs reviewd?', 1, 'typo'],
    ],
  },
  {
    id: 'sla',
    abbr: 'SLA',
    term: 'service level agreement',
    title: 'Service level agreements',
    text: [
      'Under the service level agreement, priority one tickets are answered within 30 minutes.',
      'Priority one tickets are resolved within four hours.',
    ],
    questions: [
      [
        'What is the SLA response time for priority one tickets?',
        0,
        'abbreviation',
      ],
      ['How fast are priorty one tickts resolvd?', 1, 'typo'],
    ],
  },
  {
    id: 'byod',
    abbr: 'BYOD',
    term: 'bring your own device',
    title: 'Personal devices',
    text: [
      'Personal phones may access email only after enrolling in device management.',
      'Personal laptops are not allowed on the internal network.',
    ],
    questions: [
      ['Is BYOD allowed for laptops?', 1, 'abbreviation'],
      ['Can personl phnes acess email?', 0, 'typo'],
    ],
  },
  {
    id: 'eap',
    abbr: 'EAP',
    term: 'employee assistance programme',
    title: 'Employee assistance programme',
    text: [
      'The employee assistance programme offers six free counselling sessions a year.',
      'Sessions are fully confidential and are not reported to managers.',
    ],
    questions: [
      ['How many EAP sessions are free?', 0, 'abbreviation'],
      ['Are counseling sesions confidental?', 1, 'typo'],
    ],
  },
  {
    id: 'dpo',
    abbr: 'DPO',
    term: 'data protection officer',
    title: 'Data protection officer',
    text: [
      'Report a suspected personal data breach to the data protection officer within 24 hours.',
      'Do not contact affected customers before the officer has assessed the breach.',
    ],
    questions: [
      ['How quickly must a breach go to the DPO?', 0, 'abbreviation'],
      ['Can I contct affectd custmers about a breech?', 1, 'typo'],
    ],
  },
  {
    id: 'sow',
    abbr: 'SOW',
    term: 'statement of work',
    title: 'Statements of work',
    text: [
      'Every contractor engagement needs a signed statement of work.',
      'The statement of work lists the deliverables and an end date.',
    ],
    questions: [
      ['What must an SOW list?', 1, 'abbreviation'],
      ['Does every contractr engagment ned a signd statemnt?', 0, 'typo'],
    ],
  },
  {
    id: 'rfp',
    abbr: 'RFP',
    term: 'request for proposal',
    title: 'Requests for proposal',
    text: [
      'Purchases above 50,000 euros require a request for proposal.',
      'The request for proposal goes to at least three suppliers.',
    ],
    questions: [
      ['When do we need an RFP?', 0, 'abbreviation'],
      ['How many supplirs must recieve the proposl?', 1, 'typo'],
    ],
  },
  {
    id: 'eol',
    abbr: 'EOL',
    term: 'end of life',
    title: 'Hardware end of life',
    text: [
      'Laptops and phones reach end of life after five years.',
      'IT collects end-of-life devices for certified recycling.',
    ],
    questions: [
      ['After how many years do laptops hit EOL?', 0, 'abbreviation'],
      ['Who colects devices for certifed recyling?', 1, 'typo'],
    ],
  },
  {
    id: 'toil',
    abbr: 'TOIL',
    term: 'time off in lieu',
    title: 'Time off in lieu',
    text: [
      'Overtime can be taken as time off in lieu within three months of being worked.',
      'Time off in lieu needs manager approval like any other leave.',
    ],
    questions: [
      ['How long do I have to use TOIL?', 0, 'abbreviation'],
      ['Does overtme leave ned managr aproval?', 1, 'typo'],
    ],
  },
  {
    id: 'cpd',
    abbr: 'CPD',
    term: 'continuing professional development',
    title: 'Continuing professional development',
    text: [
      'Engineers log at least twenty hours of continuing professional development each year.',
      'Conference talks and certified courses both count toward the hours.',
    ],
    questions: [
      ['How many CPD hours must engineers log?', 0, 'abbreviation'],
      ['Do conferance talks and certifid courses count?', 1, 'typo'],
    ],
  },
  {
    id: 'dei',
    abbr: 'DEI',
    term: 'diversity, equity and inclusion',
    title: 'Diversity, equity and inclusion',
    text: [
      'Every hiring panel includes at least one interviewer from outside the hiring team.',
      'Job adverts are reviewed for biased wording before they are published.',
    ],
    questions: [
      ['What is the DEI rule for hiring panels?', 0, 'abbreviation'],
      ['Are job advrts reviewd for biasd wording?', 1, 'typo'],
    ],
  },
  {
    id: 'kyc',
    abbr: 'KYC',
    term: 'know your customer checks',
    title: 'Know your customer checks',
    text: [
      'New business customers pass know your customer checks before their first invoice.',
      'The checks are repeated every two years.',
    ],
    questions: [
      ['When do new customers go through KYC?', 0, 'abbreviation'],
      ['How oftn are custmer chcks repeatd?', 1, 'typo'],
    ],
  },
  {
    id: 'rif',
    abbr: 'LOA',
    term: 'leave of absence',
    title: 'Unpaid leave of absence',
    text: [
      'An unpaid leave of absence can last up to six months.',
      'Benefits pause during the leave and restart on return.',
    ],
    questions: [
      ['How long can an LOA last?', 0, 'abbreviation'],
      ['What hapens to benfits during unpaid leve?', 1, 'typo'],
    ],
  },
  {
    id: 'ndr',
    abbr: 'ESPP',
    term: 'employee share purchase plan',
    title: 'Employee share purchase plan',
    text: [
      'Employees can buy company shares at a fifteen percent discount through the employee share purchase plan.',
      'Purchases happen twice a year, in March and September.',
    ],
    questions: [
      ['What discount does the ESPP give?', 0, 'abbreviation'],
      ['In which monts are share purchses made?', 1, 'typo'],
    ],
  },
];

/** Everyday words that match many questions: announcements with no policy. */
const SUBJECTS = [
  'kitchen',
  'car park',
  'lift',
  'reception',
  'printer',
  'meeting room',
  'cafe',
  'gym',
  'bike shed',
  'roof terrace',
];
const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const ANNOUNCEMENTS = [];
SUBJECTS.forEach((subject, i) => {
  for (let j = 0; j < 6; j += 1) {
    const day = WEEK[(i + j) % WEEK.length];
    ANNOUNCEMENTS.push({
      id: `notice-${subject.replace(/\s+/g, '-')}-${j + 1}`,
      title: `${subject[0].toUpperCase()}${subject.slice(1)} update ${j + 1}`,
      text: [
        `The ${subject} will be closed on ${day} for ${j + 1} hour${j === 0 ? '' : 's'} of work.`,
        `How many days a week staff use the ${subject} is reviewed each year, and teams can request changes through the office team.`,
        j % 2 === 0
          ? 'Please tell your manager and colleagues if you need help while it is closed.'
          : 'Signed requests are kept by the office team, and approved changes start the following week.',
      ].join(' '),
    });
  }
});

const docs = [];
const questions = [];
for (const policy of POLICIES) {
  docs.push({
    id: `policy-${policy.id}`,
    title: policy.title,
    text: policy.text.join(' '),
  });
  policy.questions.forEach(([question, sentence, kind]) => {
    questions.push({
      topic: policy.id,
      question,
      kind,
      goldDocId: `policy-${policy.id}`,
      goldSpan: policy.text[sentence].replace(/\.$/, ''),
      goldAnswer: policy.text[sentence].replace(/\.$/, ''),
    });
  });
}
// The glossary staff are pointed to: abbreviations spelled out, nothing more.
const GLOSSARY_PAGE = 8;
const pages = [];
for (let start = 0; start < POLICIES.length; start += GLOSSARY_PAGE) {
  pages.push(POLICIES.slice(start, start + GLOSSARY_PAGE));
}
pages.forEach((group, i) => {
  docs.push({
    id: `glossary-${i + 1}`,
    title: `Glossary of abbreviations, part ${i + 1}`,
    text: group
      .map((policy) => `${policy.abbr} means ${policy.term}.`)
      .join(' '),
  });
});
docs.push(...ANNOUNCEMENTS);

for (const doc of docs) {
  if (doc.text.length > 400) {
    throw new Error(`${doc.id} is ${doc.text.length} chars (max 400)`);
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
  console.error('staff-handbook is out of date: re-run this script.');
  process.exit(1);
}
console.log(
  `staff-handbook: ${docs.length} docs, ${questions.length} questions${CHECK ? ', up to date' : ''}`,
);
