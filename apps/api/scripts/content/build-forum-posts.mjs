#!/usr/bin/env node
/**
 * Builds content/corpora/forum-posts.json: a smart-home community forum.
 * Every topic has one real answer from the support team and three spam posts
 * that repeat the topic's keywords over and over ("thermostat reset thermostat
 * battery best thermostat guide…"). Keyword search, BM25 included, ranks the
 * spam first, because the spam has every query word many times. A retriever
 * has to notice that a post is mostly repetition.
 *
 * Also writes content/corpora/forum-posts.questions.json.
 *
 * Deterministic. Usage: node scripts/content/build-forum-posts.mjs [--check]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { contentRoot } from './paths.mjs';

const CHECK = process.argv.includes('--check');
const OUT = path.join(contentRoot, 'corpora', 'forum-posts.json');
const QUESTIONS_OUT = path.join(
  contentRoot,
  'corpora',
  'forum-posts.questions.json',
);

/** Topic, the keywords spam repeats, then [fact, question] from the real answer. */
const TOPICS = [
  [
    'thermostat',
    ['thermostat', 'reset', 'schedule', 'battery', 'heating'],
    [
      [
        'To reset the thermostat, hold the dial down for ten seconds until the screen goes blank.',
        'How do I reset the thermostat?',
      ],
      [
        'The heating schedule is kept after a reset and comes back within a minute.',
        'Is the heating schedule kept after a thermostat reset?',
      ],
      [
        'The thermostat battery lasts about two years, and the screen warns you a month before it runs out.',
        'How long does the thermostat battery last?',
      ],
    ],
  ],
  [
    'doorbell',
    ['doorbell', 'video', 'chime', 'wifi', 'recording'],
    [
      [
        'The video doorbell keeps recordings for thirty days in the free plan.',
        'How long does the video doorbell keep recordings?',
      ],
      [
        'The indoor chime pairs with the doorbell when you press both buttons together for five seconds.',
        'How do I pair the indoor chime with the doorbell?',
      ],
      [
        'The doorbell needs a wifi signal of at least two bars at the front door.',
        'What wifi signal does the doorbell need?',
      ],
    ],
  ],
  [
    'smart plug',
    ['smart', 'plug', 'timer', 'energy', 'socket'],
    [
      [
        'A smart plug can switch devices up to 3,000 watts, so it is fine for kettles but not for ovens.',
        'How many watts can a smart plug switch?',
      ],
      [
        'Timers on the smart plug keep running when the internet is down, because they are stored on the plug.',
        'Do smart plug timers work when the internet is down?',
      ],
      [
        'The energy report in the app shows what each smart plug used per day for the last year.',
        'Where can I see the energy use of a smart plug?',
      ],
    ],
  ],
  [
    'robot vacuum',
    ['robot', 'vacuum', 'map', 'brush', 'dock'],
    [
      [
        'The robot vacuum saves up to four floor maps, one for each level of the house.',
        'How many floor maps does the robot vacuum save?',
      ],
      [
        'The side brush of the robot vacuum should be replaced every six months.',
        'How often should the robot vacuum side brush be replaced?',
      ],
      [
        'If the robot vacuum cannot find its dock, clear half a metre of space on both sides of the dock.',
        'What do I do when the robot vacuum cannot find its dock?',
      ],
    ],
  ],
  [
    'security camera',
    ['security', 'camera', 'night', 'motion', 'alert'],
    [
      [
        'The security camera sees up to eight metres in the dark with its night vision.',
        'How far does the security camera see at night?',
      ],
      [
        'Motion alerts can be limited to zones you draw on the camera picture in the app.',
        'Can I limit security camera motion alerts to part of the picture?',
      ],
      [
        'The outdoor security camera works from minus twenty to plus fifty degrees.',
        'In what temperatures does the outdoor security camera work?',
      ],
    ],
  ],
  [
    'smart lock',
    ['smart', 'lock', 'code', 'key', 'battery'],
    [
      [
        'The smart lock stores up to twenty five guest codes, each with its own time window.',
        'How many guest codes does the smart lock store?',
      ],
      [
        'When the smart lock battery is empty, the door still opens with the normal key from outside.',
        'What happens when the smart lock battery is empty?',
      ],
      [
        'The smart lock locks itself again thirty seconds after the door closes, if auto lock is on.',
        'When does the smart lock lock itself again?',
      ],
    ],
  ],
  [
    'light bulbs',
    ['light', 'bulb', 'colour', 'dimmer', 'scene'],
    [
      [
        'The colour light bulbs can show sixteen million colours and every shade of white.',
        'How many colours can the colour light bulbs show?',
      ],
      [
        'A wall dimmer must be removed or set to full power, or the bulbs will flicker.',
        'Why do the light bulbs flicker on a wall dimmer?',
      ],
      [
        'Scenes in the app switch up to fifty bulbs at once with one tap.',
        'How many light bulbs can a scene switch at once?',
      ],
    ],
  ],
  [
    'smoke alarm',
    ['smoke', 'alarm', 'test', 'battery', 'chirp'],
    [
      [
        'Test the smoke alarm once a month by holding the button until it sounds.',
        'How often should I test the smoke alarm?',
      ],
      [
        'A single chirp every minute means the smoke alarm battery is low.',
        'What does a smoke alarm chirp every minute mean?',
      ],
      [
        'Linked smoke alarms all sound together when one of them detects smoke.',
        'Do linked smoke alarms all sound together?',
      ],
    ],
  ],
  [
    'hub',
    ['hub', 'zigbee', 'devices', 'update', 'offline'],
    [
      [
        'One hub connects up to one hundred and fifty zigbee devices.',
        'How many zigbee devices can one hub connect?',
      ],
      [
        'Hub updates install overnight between two and four and take about ten minutes.',
        'When do hub updates install?',
      ],
      [
        'Automations stored on the hub keep running when the hub is offline from the internet.',
        'Do automations keep running when the hub is offline?',
      ],
    ],
  ],
  [
    'speaker',
    ['speaker', 'voice', 'music', 'group', 'microphone'],
    [
      [
        'The speaker microphone is switched off with the button on the back, and the ring turns red.',
        'How do I switch off the speaker microphone?',
      ],
      [
        'Up to six speakers can play music together as one group.',
        'How many speakers can play music as one group?',
      ],
      [
        'Voice recordings are deleted after three months unless you choose to keep them.',
        'How long are speaker voice recordings kept?',
      ],
    ],
  ],
  [
    'blinds',
    ['blinds', 'motor', 'sunset', 'charge', 'remote'],
    [
      [
        'The blinds motor runs for about six months on one charge.',
        'How long do the blinds run on one charge?',
      ],
      [
        'Blinds can close automatically at sunset when you turn on the sunset rule in the app.',
        'Can the blinds close automatically at sunset?',
      ],
      [
        'One remote controls up to five blinds, each on its own channel.',
        'How many blinds can one remote control?',
      ],
    ],
  ],
  [
    'water sensor',
    ['water', 'sensor', 'leak', 'alert', 'battery'],
    [
      [
        'The water sensor sends a leak alert within five seconds of touching water.',
        'How fast does the water sensor send a leak alert?',
      ],
      [
        'Place the water sensor flat on the floor next to the washing machine or the boiler.',
        'Where should the water sensor be placed?',
      ],
      [
        'The water sensor battery lasts three years and is replaced without tools.',
        'How long does the water sensor battery last?',
      ],
    ],
  ],
];

const SPAM_WORDS = [
  'best',
  'guide',
  'fix',
  'free',
  'now',
  'cheap',
  'tips',
  'top',
];

/** Spam: the topic's keywords again and again, with sales words between them. */
function spam(keywords, variant) {
  const words = [];
  for (let i = 0; i < 30; i += 1) {
    words.push(keywords[(i * (variant + 1)) % keywords.length]);
    if (i % 3 === variant) {
      words.push(SPAM_WORDS[(i + variant) % SPAM_WORDS.length]);
    }
  }
  return `${words.join(' ')}.`;
}

const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const docs = [];
const questions = [];
for (const [topic, keywords, facts] of TOPICS) {
  const id = `${slug(topic)}-answer`;
  docs.push({
    id,
    title: `Re: ${topic} questions`,
    text: facts.map(([fact]) => fact).join(' '),
  });
  for (let variant = 0; variant < 3; variant += 1) {
    docs.push({
      id: `${slug(topic)}-spam-${variant + 1}`,
      title: `${keywords.slice(0, 2).join(' ')} ${SPAM_WORDS[variant]} ${SPAM_WORDS[variant + 3]}`,
      text: spam(keywords, variant),
    });
  }
  for (const [fact, question] of facts) {
    questions.push({
      topic,
      question,
      goldDocId: id,
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
  console.error('forum-posts is out of date: re-run this script.');
  process.exit(1);
}
console.log(
  `forum-posts: ${docs.length} posts, ${questions.length} questions${CHECK ? ', up to date' : ''}`,
);
