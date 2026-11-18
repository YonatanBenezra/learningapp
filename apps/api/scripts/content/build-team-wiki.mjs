#!/usr/bin/env node
/**
 * Builds content/corpora/team-wiki.json: an engineering wiki where every team
 * copied the handbook index pages into its own space and changed a word or
 * two. An index repeats the words people search with but holds no answers,
 * so a search returns five near-identical index copies before the one page
 * that answers, and those copies eat the context budget.
 *
 * Also writes content/corpora/team-wiki.questions.json (two per topic, the
 * specific page as gold).
 *
 * Deterministic. Usage: node scripts/content/build-team-wiki.mjs [--check]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { contentRoot } from './paths.mjs';

const CHECK = process.argv.includes('--check');
const OUT = path.join(contentRoot, 'corpora', 'team-wiki.json');
const QUESTIONS_OUT = path.join(
  contentRoot,
  'corpora',
  'team-wiki.questions.json',
);

const TEAMS = ['Payments', 'Search', 'Mobile', 'Platform'];

/**
 * topic: handbook name and the words people search with; answer: the page
 * that holds the fact; questions: [question, answer sentence index].
 */
const TOPICS = [
  {
    id: 'on-call',
    index:
      'when the on-call handover happens, and what the outgoing engineer posts at handover',
    handbook: 'On-call handbook',
    words: ['on-call', 'handover', 'incidents', 'alerts'],
    answer: [
      'Weekly on-call handover',
      [
        'The handover happens every Monday at 10:00 in the #oncall channel.',
        'The outgoing engineer posts every open incident and every silenced alert.',
      ],
    ],
    questions: [
      ['When does the on-call handover happen?', 0],
      ['Which channel is the on-call handover in?', 0],
      ['What does the outgoing on-call engineer post at handover?', 1],
    ],
  },
  {
    id: 'deploys',
    index:
      'whether you can deploy to production on a Friday afternoon, and what may be released during the December freeze',
    handbook: 'Deployment handbook',
    words: ['deploy', 'release', 'production', 'rollback'],
    answer: [
      'Release freeze calendar',
      [
        'No production deploys go out after 15:00 on Fridays.',
        'During the December freeze only rollbacks and security fixes are released.',
      ],
    ],
    questions: [
      ['Can I deploy to production on a Friday afternoon?', 0],
      ['What is the cutoff time for production deploys on Fridays?', 0],
      ['What may be released during the December freeze?', 1],
    ],
  },
  {
    id: 'code-review',
    index:
      'how many approvals a billing pull request needs before merge, and how quickly reviewers respond',
    handbook: 'Code review handbook',
    words: ['review', 'pull request', 'approval', 'merge'],
    answer: [
      'Review turnaround',
      [
        'A pull request needs two approvals before merge when it touches billing code.',
        'Reviewers should answer within one working day.',
      ],
    ],
    questions: [
      ['How many approvals does a billing pull request need before merge?', 0],
      ['How quickly should reviewers respond to a pull request?', 1],
    ],
  },
  {
    id: 'incidents',
    index:
      'when a severity 1 postmortem is due, and how often the status page is updated during an incident',
    handbook: 'Incident handbook',
    words: ['incident', 'severity', 'postmortem', 'status page'],
    answer: [
      'Postmortem deadlines',
      [
        'A postmortem is due within five working days of a severity 1 incident.',
        'The status page is updated every 30 minutes until the incident is resolved.',
      ],
    ],
    questions: [
      ['When is the postmortem for a severity 1 incident due?', 0],
      ['How often is the status page updated during an incident?', 1],
    ],
  },
  {
    id: 'access',
    index:
      'how long read access to the production database lasts, and who approves write access',
    handbook: 'Access handbook',
    words: ['access', 'production', 'database', 'request'],
    answer: [
      'Production database access',
      [
        'Read access to the production database expires after 8 hours.',
        'Write access needs a ticket approved by the database owner.',
      ],
    ],
    questions: [
      ['For how long does read access to the production database last?', 0],
      ['After how many hours does production database read access expire?', 0],
      ['Who approves write access to the production database?', 1],
    ],
  },
  {
    id: 'testing',
    index:
      'when a flaky test is quarantined, and what coverage new code must keep',
    handbook: 'Testing handbook',
    words: ['tests', 'coverage', 'flaky', 'pipeline'],
    answer: [
      'Flaky test policy',
      [
        'A test that fails twice in a week without a code change is quarantined.',
        'New code must keep line coverage at or above 80 percent.',
      ],
    ],
    questions: [
      ['When is a flaky test quarantined?', 0],
      ['What coverage must new code keep?', 1],
    ],
  },
  {
    id: 'secrets',
    index:
      'how often service keys are rotated, and how fast a leaked key must be rotated',
    handbook: 'Secrets handbook',
    words: ['secrets', 'keys', 'rotate', 'vault'],
    answer: [
      'Key rotation schedule',
      [
        'Service keys in the vault are rotated every 90 days.',
        'A leaked key must be rotated within one hour.',
      ],
    ],
    questions: [
      ['How often are service keys rotated?', 0],
      ['How many days can a vault service key stay in use?', 0],
      ['How fast must a leaked key be rotated?', 1],
    ],
  },
  {
    id: 'cloud-costs',
    index:
      'when idle development instances are stopped, and when a team gets a cloud budget alert',
    handbook: 'Cloud cost handbook',
    words: ['cloud', 'costs', 'budget', 'instances'],
    answer: [
      'Idle instance cleanup',
      [
        'Development instances idle for 7 days are stopped automatically.',
        'Teams get an alert when they pass 80 percent of the monthly cloud budget.',
      ],
    ],
    questions: [
      ['When are idle development instances stopped?', 0],
      ['When does a team get a cloud budget alert?', 1],
    ],
  },
  {
    id: 'logging',
    index:
      'how long application logs are kept, and how long debug logging may stay on in production',
    handbook: 'Logging handbook',
    words: ['logs', 'retention', 'personal data', 'debug'],
    answer: [
      'Log retention',
      [
        'Application logs are kept for 30 days and audit logs for one year.',
        'Debug logging in production must be switched off within 24 hours.',
      ],
    ],
    questions: [
      ['How long are application logs kept?', 0],
      ['How long are audit logs kept?', 0],
      ['For how long may debug logging stay on in production?', 1],
    ],
  },
  {
    id: 'interviews',
    index:
      'how soon interview feedback must be submitted, and how many interviews a candidate has',
    handbook: 'Hiring handbook',
    words: ['interview', 'candidate', 'feedback', 'hiring'],
    answer: [
      'Interview feedback rules',
      [
        'Interviewers submit written feedback within 24 hours of the interview.',
        'A candidate needs four interviews, including one with a hiring manager.',
      ],
    ],
    questions: [
      ['How soon must interview feedback be submitted?', 0],
      ['How many interviews does a candidate have?', 1],
    ],
  },
  {
    id: 'laptops',
    index:
      'how much memory engineering laptops have, and how quickly a broken laptop is replaced',
    handbook: 'Equipment handbook',
    words: ['laptop', 'equipment', 'replacement', 'order'],
    answer: [
      'Engineering laptop specs',
      [
        'Engineers get a laptop with 32 GB of memory.',
        'A broken laptop is replaced within two working days.',
      ],
    ],
    questions: [
      ['How much memory do engineering laptops have?', 0],
      ['How quickly is a broken laptop replaced?', 1],
    ],
  },
  {
    id: 'docs',
    index:
      'what every production service must have, and how often runbooks are reviewed',
    handbook: 'Documentation handbook',
    words: ['documentation', 'runbook', 'service', 'owner'],
    answer: [
      'Runbook ownership',
      [
        'Every production service needs a runbook with a named owner.',
        'Runbooks are reviewed every six months.',
      ],
    ],
    questions: [
      ['What must every production service have?', 0],
      ['How often are runbooks reviewed?', 1],
    ],
  },
  {
    id: 'dependencies',
    index:
      'how fast critical library vulnerabilities are patched, and when non-critical dependency upgrades are done',
    handbook: 'Dependency handbook',
    words: ['dependencies', 'library', 'upgrade', 'vulnerability'],
    answer: [
      'Vulnerability patch windows',
      [
        'Critical library vulnerabilities are patched within 72 hours.',
        'Other dependency upgrades are batched into the monthly upgrade day.',
      ],
    ],
    questions: [
      ['How fast are critical library vulnerabilities patched?', 0],
      ['When are non-critical dependency upgrades done?', 1],
    ],
  },
  {
    id: 'data-requests',
    index:
      'how long we have to answer a customer data export request, and how quickly deletion requests are completed',
    handbook: 'Data handbook',
    words: ['data', 'customer', 'request', 'export'],
    answer: [
      'Customer data requests',
      [
        'A customer data export request must be answered within 30 days.',
        'Deletion requests are completed within 14 days.',
      ],
    ],
    questions: [
      ['How long do we have to answer a customer data export request?', 0],
      ['How quickly are customer deletion requests completed?', 1],
    ],
  },
  {
    id: 'meetings',
    index:
      'which day has no meetings for engineers, and how long a standup may last',
    handbook: 'Meetings handbook',
    words: ['meetings', 'standup', 'calendar', 'focus'],
    answer: [
      'Focus time',
      [
        'Wednesdays are meeting-free for engineering teams.',
        'Standups last at most 15 minutes.',
      ],
    ],
    questions: [
      ['Which day has no meetings for engineers?', 0],
      ['How long may a standup last?', 1],
    ],
  },
  {
    id: 'travel',
    index:
      'whether a conference speaker can fly business class, and who approves conference talk proposals',
    handbook: 'Travel handbook',
    words: ['travel', 'conference', 'booking', 'approval'],
    answer: [
      'Conference talks',
      [
        'Engineers who give a conference talk can book business class for flights over six hours.',
        'Talk proposals need approval from the engineering director.',
      ],
    ],
    questions: [
      ['Can a conference speaker fly business class?', 0],
      ['Who approves conference talk proposals?', 1],
    ],
  },
];

/**
 * The handbook index every team copies: it names what the linked pages
 * cover, in the words people search with, but holds none of the answers.
 */
function handbook(topic) {
  return [
    `${topic.handbook} index for every team.`,
    `Linked pages explain ${topic.index}.`,
    'Each topic has its own page; ask in the team channel if a link is broken.',
  ];
}

/** A team's copy: the same page with a word or two changed. */
function copyFor(lines, team, index) {
  const edited = [...lines];
  if (index % 2 === 0) {
    edited[0] = edited[0].replace('for every team', `for the ${team} team`);
  } else {
    edited[2] = edited[2].replace(
      'at the bottom of the page',
      'in the sidebar',
    );
  }
  edited.push(`Copied by ${team}.`);
  return edited;
}

const docs = [];
const questions = [];
for (const topic of TOPICS) {
  const lines = handbook(topic);
  docs.push({
    id: `${topic.id}-handbook`,
    title: topic.handbook,
    text: lines.join(' '),
  });
  TEAMS.forEach((team, i) => {
    docs.push({
      id: `${topic.id}-handbook-${team.toLowerCase()}`,
      title: `${topic.handbook} (${team})`,
      text: copyFor(lines, team, i).join(' '),
    });
  });
  const [title, facts] = topic.answer;
  docs.push({ id: `${topic.id}-page`, title, text: facts.join(' ') });
  topic.questions.forEach(([question, sentence], i) => {
    questions.push({
      topic: topic.id,
      question,
      goldDocId: `${topic.id}-page`,
      goldSpan: facts[sentence].replace(/\.$/, ''),
      goldAnswer: facts[sentence].replace(/\.$/, ''),
      phrasing: i,
    });
  });
}

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
  console.error('team-wiki is out of date: re-run this script.');
  process.exit(1);
}
console.log(
  `team-wiki: ${docs.length} docs, ${questions.length} questions${CHECK ? ', up to date' : ''}`,
);
