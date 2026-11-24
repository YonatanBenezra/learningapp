#!/usr/bin/env node
/**
 * Builds content/corpora/help-center.json: the customer help center of a
 * task-management app. Every topic has one article that actually answers
 * (plain title, specific facts) and two "bait" articles whose titles and
 * text repeat the words customers ask with but never say anything concrete
 * (blog teasers, webinar promos). Keyword counts and title matches favour the
 * bait; a reranker that reads the question and the passage together should
 * not.
 *
 * Also writes content/corpora/help-center.questions.json: two questions per
 * topic, with the answering article as gold.
 *
 * Deterministic. Usage: node scripts/content/build-help-center.mjs [--check]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { contentRoot } from './paths.mjs';

const CHECK = process.argv.includes('--check');
const OUT = path.join(contentRoot, 'corpora', 'help-center.json');
const QUESTIONS_OUT = path.join(
  contentRoot,
  'corpora',
  'help-center.questions.json',
);

/**
 * [topic, answer title, answer text, gold sentence index, keywords people
 * use, bait titles, questions [question, gold sentence index]].
 */
const TOPICS = [
  {
    id: 'refunds',
    title: 'Plan changes and money back',
    text: [
      'If you downgrade or cancel within 14 days of a charge, the unused part is returned to the original card.',
      'The money reaches the card within 5 to 7 business days.',
      'Charges older than 14 days are not returned, but the plan stays active until the end of the period.',
    ],
    words: ['refund', 'money back', 'cancel', 'charge'],
    baits: [
      'Refund questions answered',
      'Cancel anytime: our money-back promise',
    ],
    questions: [
      ['If I cancel right after being charged, do I get my money back?', 0],
      ['How long does it take for refunded money to reach my card?', 1],
    ],
  },
  {
    id: 'proration',
    title: 'Adding people mid-cycle',
    text: [
      'When you add a member partway through a billing month, you pay only for the remaining days.',
      'That partial amount appears as a separate line on the next invoice.',
    ],
    words: ['invite', 'teammate', 'month', 'pay', 'billing'],
    baits: [
      'Inviting teammates: everything about billing',
      'Pay for what you use every month',
    ],
    questions: [
      [
        'If I invite a new teammate halfway through the month, do I pay for the whole month?',
        0,
      ],
      ['Where does the charge for a member added mid-month show up?', 1],
    ],
  },
  {
    id: 'export',
    title: 'Taking your data with you',
    text: [
      'Workspace owners can download every project as a ZIP of CSV files from Settings, then Data.',
      'Exports over 2 GB are emailed as a link that stays valid for 72 hours.',
    ],
    words: ['export', 'download', 'projects', 'data'],
    baits: ['Export your projects in one click', 'Your data, your download'],
    questions: [
      ['How can I get all my projects out of the app?', 0],
      ['How long does the download link for a large export keep working?', 1],
    ],
  },
  {
    id: 'trash',
    title: 'Trash and restoring',
    text: [
      'Deleted tasks stay in the trash for 30 days, and any project member can restore them.',
      'After 30 days they are erased for good and support cannot recover them.',
    ],
    words: ['deleted', 'task', 'recover', 'mistake'],
    baits: [
      'Deleted a task by mistake? Read this',
      'Recover from mistakes with confidence',
    ],
    questions: [
      ['I removed a task by mistake, can I bring it back?', 0],
      ['How long do deleted tasks stay recoverable?', 0],
    ],
  },
  {
    id: 'backup-codes',
    title: 'Sign-in protection',
    text: [
      'You can turn on a second sign-in step with an authenticator app.',
      'If you lose your phone, use one of the ten backup codes shown when you set it up.',
    ],
    words: ['phone', 'log in', 'code', 'lost'],
    baits: ['Lost your phone? Log in tips', 'Codes, phones and logging in'],
    questions: [
      ['I lost my phone and cannot log in with the code, what now?', 1],
      ['How many backup codes do I get for two-step sign-in?', 1],
    ],
  },
  {
    id: 'guests',
    title: 'People outside your company',
    text: [
      'Guests can see only the projects they are invited to and cannot create new projects.',
      'Guests are free and do not count as paid seats.',
    ],
    words: ['client', 'external', 'collaborator', 'seat', 'invite'],
    baits: [
      'Collaborate with clients and external partners',
      'Seats, clients and collaborators',
    ],
    questions: [
      ['Do external collaborators cost a seat?', 1],
      ['What can a client I invite actually see?', 0],
    ],
  },
  {
    id: 'attachments',
    title: 'Attachments',
    text: [
      'Each file attached to a task can be up to 250 MB on paid plans.',
      'On the free plan the limit is 10 MB per file.',
    ],
    words: ['file', 'upload', 'free plan', 'big'],
    baits: ['Upload big files with ease', 'Files on the free plan'],
    questions: [
      ['What is the biggest file I can attach on the free plan?', 1],
      ['How large can one upload be on a paid plan?', 0],
    ],
  },
  {
    id: 'repeating',
    title: 'Repeating work',
    text: [
      'Set a task to repeat daily, weekly or monthly from its due date menu.',
      'The next copy is created when the current one is marked complete, not on a fixed date.',
    ],
    words: ['task', 'every week', 'automatically', 'repeat'],
    baits: [
      'Automate every week with repeating tasks',
      'Tasks that come back automatically',
    ],
    questions: [
      ['Can a task come back every week automatically?', 0],
      ['When is the next copy of a repeating task created?', 1],
    ],
  },
  {
    id: 'time-zones',
    title: 'Dates across time zones',
    text: [
      "Due dates follow each viewer's own time zone.",
      'Due times are stored in the time zone of the person who set them.',
    ],
    words: ['deadline', 'colleague', 'abroad', 'time'],
    baits: [
      'Deadlines for colleagues abroad',
      'Time and deadline tips for global teams',
    ],
    questions: [
      ['My colleague abroad sees a different deadline time, why?', 1],
      ['Whose time zone decides a due time?', 1],
    ],
  },
  {
    id: 'digest',
    title: 'Staying informed without the noise',
    text: [
      'Choose a daily digest to receive one email at 8:00 local time instead of an email for every change.',
      'Mentions and assignments are still sent right away.',
    ],
    words: ['emails', 'summary', 'too many', 'day'],
    baits: [
      'Too many emails? A summary of our email features',
      'Your day, your emails',
    ],
    questions: [
      ['I get too many emails, can I get one summary per day?', 0],
      ['Are mentions delayed when I switch to the daily summary?', 1],
    ],
  },
  {
    id: 'rate-limits',
    title: 'Building on the platform',
    text: [
      'Each API token may make 100 requests per minute.',
      'Extra requests receive status 429 and should be retried after the time in the Retry-After header.',
    ],
    words: ['calls', 'integration', 'script', 'requests'],
    baits: [
      'Integrations and scripts: make more calls',
      'Requests, integrations and you',
    ],
    questions: [
      ['How many calls per minute can my integration make?', 0],
      ['What happens when my script sends too many requests?', 1],
    ],
  },
  {
    id: 'sso',
    title: 'Signing in with your company account',
    text: [
      'Single sign-on with SAML is available on the Enterprise plan.',
      'Once single sign-on is enforced, passwords stop working for members.',
    ],
    words: ['corporate', 'identity provider', 'passwords', 'log in', 'plan'],
    baits: [
      'Log in with your corporate identity provider',
      'Passwords and plans explained',
    ],
    questions: [
      ['Which plan lets us log in with our corporate identity provider?', 0],
      ['Do passwords still work after we enforce single sign-on?', 1],
    ],
  },
  {
    id: 'closing',
    title: 'Closing a workspace',
    text: [
      'Only the owner can close a workspace.',
      'Everything is kept for 14 days in case you change your mind, then permanently removed.',
    ],
    words: ['account', 'shut down', 'delete', 'reopen'],
    baits: [
      'Shut down or delete your account',
      'Account deletion: what to know',
    ],
    questions: [
      ['Who is allowed to shut down our whole account?', 0],
      ['Can a closed workspace be reopened, and for how long?', 1],
    ],
  },
  {
    id: 'offline',
    title: 'Working on the go',
    text: [
      'The phone app keeps the last 7 days of your tasks available without a connection.',
      'Edits made offline sync when you are back online.',
    ],
    words: ['plane', 'internet', 'offline', 'phone', 'tasks'],
    baits: [
      'Tasks on a plane: offline and internet tips',
      'Your phone, your tasks, anywhere',
    ],
    questions: [
      ['Can I see my tasks on a plane without internet?', 0],
      ['How much of my work is available offline on the phone?', 0],
    ],
  },
  {
    id: 'csv-import',
    title: 'Bringing in existing work',
    text: [
      'Upload a CSV with one row per task; the first row must hold the column names.',
      'Up to 5,000 rows are imported at once.',
    ],
    words: ['excel', 'spreadsheet', 'list', 'import', 'rows'],
    baits: ['Move from Excel and spreadsheets', 'Import your to-do list'],
    questions: [
      ['How do I move my to-do list from Excel into the app?', 0],
      ['How many rows can one CSV import have?', 1],
    ],
  },
  {
    id: 'roles',
    title: 'Who can do what',
    text: [
      'Admins manage billing and members, and editors can change any task.',
      'Viewers can only read and comment.',
    ],
    words: ['read-only', 'rights', 'comments', 'payment', 'role'],
    baits: ['Read-only rights and comments', 'Roles and payment settings'],
    questions: [
      ['Can someone with read-only rights leave comments?', 1],
      ['Which role can change the payment details?', 0],
    ],
  },
  {
    id: 'storage',
    title: 'Space for your files',
    text: [
      'Each paid seat adds 10 GB of shared storage.',
      'The free plan has 2 GB for the whole workspace.',
    ],
    words: ['room', 'files', 'person', 'storage', 'free plan'],
    baits: ['Room for all your files', 'Storage on the free plan and beyond'],
    questions: [
      ['How much room for files do we get per person on a paid plan?', 0],
      ['What is the storage limit on the free plan?', 1],
    ],
  },
  {
    id: 'vat',
    title: 'Paperwork for finance',
    text: [
      'Add your VAT number in Billing settings and it appears on every future invoice.',
      'Invoices already issued cannot be changed.',
    ],
    words: ['accountant', 'tax', 'bill', 'invoices'],
    baits: [
      'A guide to bills for your accountant',
      'Tax season and your invoices',
    ],
    questions: [
      ['Our accountant needs the tax ID on the bill, how do we add it?', 0],
      ['Can a VAT number be added to invoices already issued?', 1],
    ],
  },
  {
    id: 'calendar',
    title: 'Seeing tasks in your calendar',
    text: [
      'Subscribe to your personal calendar feed link to see due dates in Google or Outlook.',
      'The feed refreshes about once an hour.',
    ],
    words: ['deadlines', 'outlook', 'calendar', 'update'],
    baits: [
      'Deadlines in Outlook and your calendar',
      'Calendar updates you will love',
    ],
    questions: [
      ['Can my deadlines show up in Outlook?', 0],
      ['How often does the calendar feed update?', 1],
    ],
  },
  {
    id: 'free-plan',
    title: 'What the free plan includes',
    text: [
      'The free plan allows up to 3 projects and 5 members.',
      'History older than 90 days is hidden until you upgrade.',
    ],
    words: ['projects', 'paying', 'history', 'free'],
    baits: [
      'Projects without paying: free forever',
      'History of our free plan',
    ],
    questions: [
      ['How many projects can I make without paying?', 0],
      ['How far back can I see history on the free plan?', 1],
    ],
  },
  {
    id: 'login-email',
    title: 'Updating your login',
    text: [
      'Change the address you sign in with under Profile, and we send a confirmation link to the new address.',
      'The old address keeps working until the link is clicked.',
    ],
    words: ['new work address', 'login', 'switch', 'email'],
    baits: [
      'Switch your login email in seconds',
      'New work address? Login help',
    ],
    questions: [
      ['I have a new work address, how do I switch my login to it?', 0],
      ['Does my old sign-in address stop working right away?', 1],
    ],
  },
  {
    id: 'automation',
    title: 'Letting the app do the busywork',
    text: [
      'Rules can move, assign or tag tasks when a status changes.',
      'Each workspace can have 50 active rules on the Business plan.',
    ],
    words: ['assigned automatically', 'automations', 'column', 'tasks'],
    baits: [
      'Automations: tasks assigned automatically',
      'Columns, tasks and automations',
    ],
    questions: [
      ['Can tasks be assigned automatically when they reach a column?', 0],
      ['How many automations can be switched on at once?', 1],
    ],
  },
  {
    id: 'audit-log',
    title: 'Seeing who changed what',
    text: [
      'Enterprise workspaces keep a log of member actions for 12 months.',
      'Admins can download the log as a CSV file.',
    ],
    words: ['colleague', 'deleted', 'project', 'record'],
    baits: [
      'Which colleague deleted that project?',
      'Project records made simple',
    ],
    questions: [
      ['Can I find out which colleague deleted a project last month?', 0],
      ['How long is the record of member actions kept?', 0],
    ],
  },
  {
    id: 'data-region',
    title: 'Where your data lives',
    text: [
      'Workspaces created in Europe are stored in Frankfurt and copied to Dublin for backup.',
      'A workspace cannot be moved between regions after it is created.',
    ],
    words: ['information', 'EU', 'country', 'move'],
    baits: [
      'Your information in the EU',
      'Moving country? Information for travellers',
    ],
    questions: [
      ['Is our information kept inside the EU?', 0],
      ['Can we move our workspace to another country after creating it?', 1],
    ],
  },
];

/** Promo copy: the customer's words, repeated, with nothing concrete. */
const BAIT_BODIES = [
  (w) =>
    `${cap(w[0])} and ${w[1]} questions are among the most common we get. We know ${w[0]} matters to you, so our team is always happy to talk about ${w[1]} and ${w[2]}. Watch this space for more on ${w[0]}.`,
  (w) =>
    `Join our next webinar about ${w[0]}, ${w[1]} and ${w[2]}. Product experts share tips on ${w[0]} and answer live questions about ${w[3] ?? w[1]}. Seats are limited, so sign up today.`,
];
const cap = (s) => s[0].toUpperCase() + s.slice(1);

const FILLER = [
  [
    'shortcuts',
    'Keyboard shortcuts',
    'Press ? anywhere in the app to see every shortcut. Press N to create a task and / to search.',
  ],
  [
    'dark-mode',
    'Dark mode',
    'Switch between light and dark themes under Profile, then Appearance. The setting follows each device.',
  ],
  [
    'avatar',
    'Changing your picture',
    'Upload a square image of at least 200 by 200 pixels under Profile.',
  ],
  [
    'labels',
    'Labels',
    'Labels are shared by every project in a workspace. Rename a label once and it changes everywhere.',
  ],
  [
    'templates',
    'Project templates',
    'Save any project as a template from its menu. Templates copy tasks and sections, not comments.',
  ],
  [
    'search',
    'Search tips',
    'Put a phrase in quotes to search for it exactly. Search covers tasks, comments and file names.',
  ],
  [
    'subtasks',
    'Subtasks',
    'A task can hold up to 100 subtasks, and subtasks can have their own assignee.',
  ],
  [
    'board-view',
    'Board view',
    'Drag tasks between columns to change their status. Columns can be renamed by the project admin.',
  ],
  [
    'mentions',
    'Mentions',
    'Type @ and a name to mention someone in a comment. They get a notification straight away.',
  ],
  [
    'favorites',
    'Favorites',
    'Star a project to pin it to the top of the sidebar.',
  ],
  [
    'languages',
    'Languages',
    'The app is available in twelve languages. Change yours under Profile, then Language.',
  ],
  [
    'accessibility',
    'Accessibility',
    'Every view works with a screen reader, and motion can be reduced under Appearance.',
  ],
  [
    'status-page',
    'Service status',
    'Live service status and past incidents are listed on the status page.',
  ],
  [
    'browser',
    'Supported browsers',
    'Use the latest two versions of Chrome, Firefox, Safari or Edge.',
  ],
  [
    'desktop',
    'Desktop app',
    'The desktop app for Windows and macOS updates itself in the background.',
  ],
  [
    'comments-edit',
    'Editing comments',
    'You can edit your own comments for 24 hours after posting them.',
  ],
];

const docs = [];
const questions = [];
for (const topic of TOPICS) {
  docs.push({
    id: `${topic.id}-answer`,
    title: topic.title,
    text: topic.text.join(' '),
  });
  topic.baits.forEach((title, i) => {
    docs.push({
      id: `${topic.id}-promo-${i + 1}`,
      title,
      text: BAIT_BODIES[i](topic.words),
    });
  });
  topic.questions.forEach(([question, sentence], i) => {
    questions.push({
      topic: topic.id,
      question,
      goldDocId: `${topic.id}-answer`,
      goldSpan: topic.text[sentence].replace(/\.$/, ''),
      goldAnswer: topic.text[sentence].replace(/\.$/, ''),
      phrasing: i,
    });
  });
}
for (const [id, title, text] of FILLER) {
  docs.push({ id: `help-${id}`, title, text });
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
  console.error('help-center is out of date: re-run this script.');
  process.exit(1);
}
console.log(
  `help-center: ${docs.length} docs, ${questions.length} questions${CHECK ? ', up to date' : ''}`,
);
