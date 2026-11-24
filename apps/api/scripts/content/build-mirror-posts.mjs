#!/usr/bin/env node
/**
 * Builds content/corpora/mirror-posts.json: an intranet where every change is
 * announced once and then reposted by four or five teams, almost word for
 * word. The reposts repeat the topic's name ("the new expense tool") again and
 * again but explain nothing. The facts live in a handbook section whose title
 * says nothing about the topic ("Finance handbook, part 3").
 *
 * A keyword first stage fills the top five with reposts and pushes the
 * handbook section to sixth place or lower. A title boost makes it worse (the
 * reposts carry the topic in their titles). MMR keeps the best repost, then
 * passes over the others because they repeat it, and the handbook section
 * comes up second.
 *
 * Also writes content/corpora/mirror-posts.questions.json.
 *
 * Deterministic. Usage: node scripts/content/build-mirror-posts.mjs [--check]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { contentRoot } from './paths.mjs';

const CHECK = process.argv.includes('--check');
const OUT = path.join(contentRoot, 'corpora', 'mirror-posts.json');
const QUESTIONS_OUT = path.join(
  contentRoot,
  'corpora',
  'mirror-posts.questions.json',
);

const TEAMS = ['Sales', 'Finance', 'Support', 'Design', 'Legal'];

/**
 * Topic name, the handbook section that explains it, how many teams repost
 * the announcement, then [fact, question] pairs.
 */
const TOPICS = [
  [
    'expense tool',
    'Finance handbook, part 3',
    5,
    [
      [
        'Expense claims are submitted with a photo of every receipt in the expense tool.',
        'How do I submit expense claims in the new expense tool?',
      ],
      [
        'Your manager approves expense claims in the tool within three working days.',
        'Who approves expense claims in the new expense tool, and how fast?',
      ],
      [
        'Approved expense refunds are paid with the next salary.',
        'When are refunds from the new expense tool paid?',
      ],
    ],
  ],
  [
    'travel booking site',
    'Travel handbook, part 2',
    5,
    [
      [
        'Flights and trains on the booking site are booked at least seven days before the trip.',
        'How far ahead do I book trips on the new travel booking site?',
      ],
      [
        'The booking site sends every booking to your manager for approval first.',
        'Does the new travel booking site need approval for a booking?',
      ],
      [
        'Changes to a booking on the site are free until one day before departure.',
        'Until when are changes free on the new travel booking site?',
      ],
    ],
  ],
  [
    'holiday planner',
    'People handbook, part 5',
    4,
    [
      [
        'Holiday requests in the planner need two weeks notice for anything over three days.',
        'How much notice does the new holiday planner need for longer holidays?',
      ],
      [
        'The planner shows the remaining days of the year at the top of every request.',
        'Where does the new holiday planner show my remaining days?',
      ],
      [
        'Requests in the planner are approved or refused by the team lead within five days.',
        'Who answers requests in the new holiday planner, and how fast?',
      ],
    ],
  ],
  [
    'laptop refresh',
    'IT handbook, part 1',
    5,
    [
      [
        'Laptops are replaced every four years, or earlier when a repair costs more than half.',
        'How often are laptops replaced in the new laptop refresh?',
      ],
      [
        'The old laptop is returned to the service desk within a week of the new one arriving.',
        'When do I return my old laptop in the new laptop refresh?',
      ],
      [
        'Files are copied to the new laptop by the service desk during a one hour appointment.',
        'Who copies my files in the new laptop refresh?',
      ],
    ],
  ],
  [
    'desk booking app',
    'Office handbook, part 4',
    4,
    [
      [
        'Desks in the app can be booked up to two weeks ahead.',
        'How far ahead can I book a desk in the new desk booking app?',
      ],
      [
        'A desk booking in the app is released at ten if you have not checked in.',
        'What happens to a desk booking in the new desk booking app if I do not check in?',
      ],
      [
        'Standing desks in the app are marked with a small arrow next to the desk number.',
        'How are standing desks shown in the new desk booking app?',
      ],
    ],
  ],
  [
    'payslip portal',
    'Payroll handbook, part 2',
    5,
    [
      [
        'Payslips appear in the portal two days before the salary is paid.',
        'When do payslips appear in the new payslip portal?',
      ],
      [
        'The yearly tax statement is in the portal from the first week of March.',
        'When is the yearly tax statement in the new payslip portal?',
      ],
      [
        'Bank details are changed in the portal before the fifteenth to apply to that month.',
        'By when must bank details be changed in the new payslip portal?',
      ],
    ],
  ],
  [
    'training catalogue',
    'Learning handbook, part 1',
    4,
    [
      [
        'Courses in the catalogue are booked with the learning budget and need no approval below 500 euros.',
        'Which courses in the new training catalogue need approval?',
      ],
      [
        'A booked course in the catalogue can be cancelled for free until two weeks before it starts.',
        'Until when can a course from the new training catalogue be cancelled for free?',
      ],
      [
        'Certificates from catalogue courses are saved to your profile automatically.',
        'Where are certificates from the new training catalogue saved?',
      ],
    ],
  ],
  [
    'visitor registration',
    'Reception handbook, part 2',
    5,
    [
      [
        'Visitors are registered by their host at least one day before the visit.',
        'Who registers visitors in the new visitor registration, and when?',
      ],
      [
        'Registered visitors receive a QR code by email that opens the front gate.',
        'How do visitors get through the gate with the new visitor registration?',
      ],
      [
        'Visitor badges must be returned at reception before leaving the building.',
        'Where do visitor badges go after a visit with the new visitor registration?',
      ],
    ],
  ],
  [
    'service desk portal',
    'IT handbook, part 4',
    4,
    [
      [
        'Tickets in the portal are answered within four working hours.',
        'How fast are tickets answered in the new service desk portal?',
      ],
      [
        'Urgent problems are reported by phone and logged in the portal afterwards.',
        'How do I report an urgent problem with the new service desk portal?',
      ],
      [
        'A closed ticket in the portal can be reopened for ten days.',
        'For how long can a closed ticket be reopened in the new service desk portal?',
      ],
    ],
  ],
  [
    'phone plan',
    'IT handbook, part 6',
    5,
    [
      [
        'The plan includes ten gigabytes of data abroad every month.',
        'How much data abroad does the new phone plan include?',
      ],
      [
        'Calls to premium numbers on the plan are taken from your salary.',
        'Who pays for premium number calls on the new phone plan?',
      ],
      [
        'Extra data on the plan is requested in the service portal before you travel.',
        'How do I get extra data on the new phone plan?',
      ],
    ],
  ],
  [
    'meeting room screens',
    'Office handbook, part 7',
    4,
    [
      [
        'The screens outside every room show the bookings for the rest of the day.',
        'What do the new meeting room screens show?',
      ],
      [
        'A room booked on the screens is released after fifteen minutes without check-in.',
        'When is a room released on the new meeting room screens?',
      ],
      [
        'Rooms can be booked on the screens for at most two hours at a time.',
        'How long can I book a room on the new meeting room screens?',
      ],
    ],
  ],
  [
    'parking permit system',
    'Facilities handbook, part 3',
    5,
    [
      [
        'Permits in the system are renewed every year in January.',
        'When are permits renewed in the new parking permit system?',
      ],
      [
        'The system sends a warning when a car without a permit is parked for more than an hour.',
        'What happens to cars without a permit in the new parking permit system?',
      ],
      [
        'Electric cars get a permit in the system that includes the charging bays.',
        'Do electric cars get anything extra in the new parking permit system?',
      ],
    ],
  ],
];

function capital(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const docs = [];
const questions = [];
for (const [topic, section, reposts, facts] of TOPICS) {
  const sectionId = slug(section);
  // The handbook section: the topic is named, then the facts.
  docs.push({
    id: sectionId,
    title: section,
    text: [
      `This section covers the ${topic}.`,
      ...facts.map(([fact]) => fact),
    ].join(' '),
  });
  for (let i = 0; i < reposts; i += 1) {
    const team = TEAMS[i];
    docs.push({
      id: `${slug(topic)}-${slug(team)}`,
      title: `New ${topic} (${team})`,
      text: `The new ${topic} is live for the ${team} team and replaces the old system for everyone. Please read about the new ${topic} before you use it, and ask your ${team} contact if the ${topic} raises questions.`,
    });
  }
  for (const [fact, question] of facts) {
    questions.push({
      topic,
      question,
      goldDocId: sectionId,
      goldSpan: fact,
      goldAnswer: fact,
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
  console.error('mirror-posts is out of date: re-run this script.');
  process.exit(1);
}
console.log(
  `mirror-posts: ${docs.length} pages, ${questions.length} questions${CHECK ? ', up to date' : ''}`,
);
