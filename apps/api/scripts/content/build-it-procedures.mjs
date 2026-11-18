#!/usr/bin/env node
/**
 * Builds content/corpora/it-procedures.json: IT how-to pages where every
 * answer takes two consecutive sentences: the step, then what follows from
 * it ("Open the badge app and choose Reset PIN. The new PIN arrives by text
 * within five minutes."). Chunk boundaries that fall between the two cut the
 * answer in half, wherever the boundaries land; carrying the last sentence of
 * one chunk into the next (overlap) keeps every pair together somewhere.
 *
 * Also writes content/corpora/it-procedures.questions.json (gold = both
 * sentences).
 *
 * Deterministic. Usage: node scripts/content/build-it-procedures.mjs [--check]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { contentRoot } from './paths.mjs';

const CHECK = process.argv.includes('--check');
const OUT = path.join(contentRoot, 'corpora', 'it-procedures.json');
const QUESTIONS_OUT = path.join(
  contentRoot,
  'corpora',
  'it-procedures.questions.json',
);

/** title, then three [step, follow-up, question] pairs. */
const PROCEDURES = [
  [
    'Badge PIN reset',
    [
      [
        'Open the badge app and choose Reset PIN.',
        'The new PIN arrives by text message within five minutes.',
        'How do I reset my badge PIN, and when does the new one arrive?',
      ],
      [
        'A badge locks after three wrong PIN attempts.',
        'Reception can unlock it once you show photo ID.',
        'What happens after three wrong badge PIN attempts, and who unlocks it?',
      ],
      [
        'Lost badges are blocked as soon as you report them in the app.',
        'A replacement badge is ready at reception the next working day.',
        'When is a replacement for a lost badge ready?',
      ],
    ],
  ],
  [
    'Printer setup',
    [
      [
        'Add printers from the Self Service app, not from system settings.',
        'The app installs the right driver and the badge release queue.',
        'Where do I add a printer from, and what does that install?',
      ],
      [
        'Colour printing is off by default for every account.',
        'Ask your manager to approve colour in the service portal.',
        'Why can I not print in colour, and who can turn it on?',
      ],
      [
        'Print jobs wait in the queue for twelve hours.',
        'Jobs that nobody releases are deleted after that.',
        'How long do unreleased print jobs stay in the queue?',
      ],
    ],
  ],
  [
    'Laptop encryption',
    [
      [
        'Disk encryption turns on automatically at the first sign-in.',
        'The first encryption pass can take up to two hours.',
        'When does laptop disk encryption start, and how long does it take?',
      ],
      [
        'Keep the laptop plugged in while encryption runs.',
        'Closing the lid pauses it until the next start.',
        'Should I keep my laptop plugged in during encryption, and what pauses it?',
      ],
      [
        'The recovery key is stored in your device record.',
        'Only the service desk can read it after checking your identity.',
        'Where is the laptop recovery key kept, and who can read it?',
      ],
    ],
  ],
  [
    'VPN access',
    [
      [
        'Install the VPN client from Self Service and sign in with your work account.',
        'The client connects on its own whenever you leave the office network.',
        'How do I set up the VPN, and when does it connect?',
      ],
      [
        'Split tunnelling sends video calls outside the VPN.',
        'Everything else goes through the company network.',
        'Do video calls go through the VPN?',
      ],
      [
        'VPN sessions end after ten hours.',
        'Sign in again to start a new session.',
        'How long does a VPN session last?',
      ],
    ],
  ],
  [
    'Shared mailboxes',
    [
      [
        'Request a shared mailbox through the service portal and name two owners.',
        'The owners approve every new member from then on.',
        'How do I get a shared mailbox, and who approves new members?',
      ],
      [
        'Messages sent from a shared mailbox show its name, not yours.',
        'Sent copies are stored in the shared mailbox, not in your own.',
        'Whose name appears when I send from a shared mailbox, and where are sent copies kept?',
      ],
      [
        'Shared mailboxes have a 50 GB quota.',
        'Owners get a warning email at 45 GB.',
        'What is the shared mailbox quota, and when do owners get warned?',
      ],
    ],
  ],
  [
    'Software requests',
    [
      [
        'Request software that is not in Self Service through the service portal.',
        'Security reviews the request within three working days.',
        'How do I request software that is not in Self Service, and how long does the review take?',
      ],
      [
        'Free trials still need a request.',
        'Trials that skip the review are removed during the weekly scan.',
        'Do free trials need a request, and what happens to trials that skip review?',
      ],
      [
        'Browser extensions come from the approved list only.',
        'Other extensions are switched off at the next policy refresh.',
        'Which browser extensions can I install?',
      ],
    ],
  ],
  [
    'Phone setup',
    [
      [
        'Enrol a work phone by scanning the code on the setup page.',
        'Email and the chat app install themselves afterwards.',
        'How do I enrol a work phone, and what installs afterwards?',
      ],
      [
        'A phone that is not updated for 30 days loses access to email.',
        'Access comes back as soon as the update is installed.',
        'What happens if I do not update my phone for 30 days?',
      ],
      [
        'Report a lost phone in the service portal so it can be wiped.',
        'Personal photos on an enrolled personal phone are not touched by the wipe.',
        'How do I report a lost phone, and does the wipe touch personal photos?',
      ],
    ],
  ],
  [
    'Password changes',
    [
      [
        'Change your password at the self-service password page.',
        'The new password reaches every system within fifteen minutes.',
        'Where do I change my password, and when does it reach every system?',
      ],
      [
        'Passwords expire every 180 days.',
        'You get reminder emails during the last two weeks.',
        'How often do passwords expire, and when do reminders start?',
      ],
      [
        'The last ten passwords cannot be reused.',
        'A password from a known leak list is rejected straight away.',
        'Can I reuse an old password?',
      ],
    ],
  ],
  [
    'Video conferencing rooms',
    [
      [
        'Book a video room in the calendar and add the room as a guest.',
        'The room screen shows the meeting five minutes before it starts.',
        'How do I book a video room, and when does the screen show my meeting?',
      ],
      [
        'Press the green button on the table panel to join.',
        'The camera turns on only after you press the camera icon.',
        'How do I join from a video room, and when does the camera turn on?',
      ],
      [
        'Rooms that nobody checks into are released after ten minutes.',
        'Released rooms can then be booked by anyone.',
        'What happens to a booked room nobody checks into?',
      ],
    ],
  ],
  [
    'File sharing',
    [
      [
        'Share files from the company drive with a link, not as attachments.',
        'Links to people outside the company expire after 30 days.',
        'How should I share files, and when do external links expire?',
      ],
      [
        'Folders marked confidential cannot be shared outside the company.',
        'The share button stays grey for them.',
        'Can a confidential folder be shared with a supplier?',
      ],
      [
        'Deleted files stay in the drive bin for 60 days.',
        'After that only the service desk can restore them, within another 30 days.',
        'How long can deleted drive files be recovered?',
      ],
    ],
  ],
  [
    'Monitor and dock issues',
    [
      [
        'If a second monitor stays black, unplug the dock for ten seconds.',
        'Most screens come back after the dock restarts.',
        'What do I do when my second monitor stays black?',
      ],
      [
        'Docks need the firmware pushed every quarter.',
        'The update runs overnight while the laptop is connected.',
        'How are dock firmware updates installed?',
      ],
      [
        'Report a faulty dock in the service portal.',
        'A swap is left at reception within two working days.',
        'How do I get a faulty dock replaced, and how fast?',
      ],
    ],
  ],
  [
    'New starter accounts',
    [
      [
        'Managers request accounts for new starters at least five working days before day one.',
        'Late requests are handled the same day only for urgent cases.',
        'How early should managers request accounts for a new starter?',
      ],
      [
        'The new starter gets a temporary password by text on day one.',
        'It must be changed at the first sign-in.',
        'How does a new starter get their first password?',
      ],
      [
        'Access to finance systems needs a separate request.',
        'The finance owner approves it within two working days.',
        'How does a new starter get finance system access?',
      ],
    ],
  ],
];

const docs = [];
const questions = [];
PROCEDURES.forEach(([title, facts]) => {
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const text = facts.flatMap(([step, follow]) => [step, follow]).join(' ');
  docs.push({ id, title, text });
  facts.forEach(([step, follow, question], i) => {
    questions.push({
      topic: id,
      question,
      goldDocId: id,
      goldSpan: `${step} ${follow}`,
      goldAnswer: `${step} ${follow}`,
      position: i,
    });
  });
});

for (const doc of docs) {
  if (doc.text.length > 600) {
    throw new Error(`${doc.id} is ${doc.text.length} chars (max 600)`);
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
  console.error('it-procedures is out of date: re-run this script.');
  process.exit(1);
}
console.log(
  `it-procedures: ${docs.length} docs, ${questions.length} questions${CHECK ? ', up to date' : ''}`,
);
