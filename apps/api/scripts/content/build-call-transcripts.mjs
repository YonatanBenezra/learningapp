#!/usr/bin/env node
/**
 * Builds content/corpora/call-transcripts.json: support calls as speech-to-
 * text writes them, lowercase with no punctuation and no line breaks. With no
 * sentences or paragraphs to split on, every strategy falls back to word
 * windows, and an answer (the agent's 110-140 character promise) is whole only
 * when the windows overlap by at least its length. Overlap is not free: every
 * extra window is another vector in the index, which has a size limit.
 *
 * Also writes content/corpora/call-transcripts.questions.json (gold = the
 * agent's words, exactly as transcribed).
 *
 * Deterministic. Usage: node scripts/content/build-call-transcripts.mjs [--check]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { contentRoot } from './paths.mjs';

const CHECK = process.argv.includes('--check');
const OUT = path.join(contentRoot, 'corpora', 'call-transcripts.json');
const QUESTIONS_OUT = path.join(
  contentRoot,
  'corpora',
  'call-transcripts.questions.json',
);

/** Talk that carries no answer: greetings, checks, hold music, small talk. */
const FILLER = [
  'hello you are through to customer support my name is sam how can i help you today',
  'hi yes thanks for picking up i have been waiting for a little while now',
  'sorry about the wait we are quite busy this morning let me pull up your account',
  'can you confirm the first line of your address and your date of birth for me please',
  'yes of course it is the one we have on file i think nothing has changed there',
  'perfect thank you that all matches what i can see here on my screen',
  'okay give me one moment while i read through the notes on this case',
  'i will just put you on a short hold while i check something with my colleague',
  'thanks for holding i really appreciate your patience with this today',
  'right i understand that must be frustrating especially when you need it this week',
  'is there anything else on the account you would like me to look at while you are here',
  'no i think that is everything for now but let me just write this down',
  'of course take your time there is no rush on my side',
  'i will also send you an email with a summary of what we discussed today',
  'great that would be really helpful because i will probably forget the details',
  'you should see that email in the next few minutes please check your spam folder too',
  'thank you for calling and have a lovely rest of your day',
  'you too thanks for sorting this out so quickly bye',
  'can i just check which phone number is the best one to reach you on',
  'it is the mobile number ending in the same digits as before',
  'let me just make a note of that on the case so the next person can see it',
  'the line is a bit quiet could you speak up a little for me',
  'is that better now i moved away from the window',
  'yes much better thank you so where were we',
];

/** Each call: title, then the agent's four promises and the questions they answer. */
const CALLS = [
  [
    'Call about a broken blender',
    [
      [
        'the refund for the broken blender will reach your card within five working days after the courier has collected the parcel',
        'When will the refund for the broken blender reach the card?',
      ],
      [
        'the courier will collect the blender from your front door on thursday between eight in the morning and one in the afternoon',
        'When will the courier collect the broken blender?',
      ],
      [
        'you do not need the original box for the blender any sturdy box will do as long as the jug is wrapped in paper',
        'Does the blender have to go back in its original box?',
      ],
      [
        'as a thank you for your patience i have added a voucher for fifteen euros to your account for your next order',
        'What voucher was added to the account after the blender call?',
      ],
    ],
  ],
  [
    'Call about a late sofa delivery',
    [
      [
        'the new delivery date for the corner sofa is the fourteenth and the driver will call you thirty minutes before arriving',
        'What is the new delivery date for the corner sofa?',
      ],
      [
        'because the sofa delivery was late we will refund the delivery charge of forty nine euros to your original payment card',
        'Is the delivery charge refunded because the sofa was late?',
      ],
      [
        'the two delivery drivers can carry the sofa up to the third floor but they cannot remove the old sofa for you',
        'Can the sofa drivers take the old sofa away?',
      ],
      [
        'if the corner sofa does not fit through the door the drivers will take it back and the full price is refunded',
        'What happens if the corner sofa does not fit through the door?',
      ],
    ],
  ],
  [
    'Call about a double charge',
    [
      [
        'the second payment of eighty two euros was a duplicate and it has been reversed so it will disappear within three days',
        'When will the duplicate payment of eighty two euros disappear?',
      ],
      [
        'your bank may show the reversed payment as pending for a while but you do not need to contact them about it',
        'Do I need to contact my bank about the reversed duplicate payment?',
      ],
      [
        'to stop it happening again please only press the pay button once and wait for the confirmation page to load fully',
        'How do I avoid being charged twice again?',
      ],
      [
        'the order itself is fine and the headphones have already left our warehouse and should arrive with you tomorrow',
        'When should the headphones from the double charged order arrive?',
      ],
    ],
  ],
  [
    'Call about a password reset',
    [
      [
        'the reset link we send by email only works for thirty minutes so please open it straight away on the same device',
        'How long does the password reset link work?',
      ],
      [
        'your account was locked after five wrong passwords and it unlocks by itself after one hour if you do nothing',
        'When does a locked account unlock by itself?',
      ],
      [
        'i have turned on the text message code for you so every new sign in will ask for a six digit code from now on',
        'What extra sign in step was turned on during the password call?',
      ],
      [
        'we never ask for your password on the phone so if anyone calls and asks for it please hang up and report it',
        'Will support ever ask for my password on the phone?',
      ],
    ],
  ],
  [
    'Call about a damaged parcel',
    [
      [
        'please send us two photos of the damaged parcel one of the outside of the box and one of the broken lamp inside',
        'Which photos are needed for the damaged parcel claim?',
      ],
      [
        'once we have the photos a replacement lamp is sent the same day and you can keep or recycle the broken one',
        'Does the broken lamp have to be returned before a replacement is sent?',
      ],
      [
        'damage claims for parcels have to be made within seven days of delivery so you are well within the time limit',
        'How long after delivery can a damage claim be made?',
      ],
      [
        'if the replacement lamp is also damaged we will refund you in full instead of sending a third one',
        'What happens if the replacement lamp also arrives damaged?',
      ],
    ],
  ],
  [
    'Call about a subscription cancellation',
    [
      [
        'your coffee subscription is cancelled now but the last bag that was already packed will still arrive next week',
        'Will another bag arrive after the coffee subscription is cancelled?',
      ],
      [
        'you can restart the coffee subscription at any time in the app and your old grind and roast settings are kept',
        'Are the coffee settings kept if I restart the subscription?',
      ],
      [
        'the free grinder you got with the subscription is yours to keep because you stayed for more than six months',
        'Can I keep the free grinder after cancelling?',
      ],
      [
        'there is no cancellation fee because you gave us notice before the next payment date on the first of the month',
        'Is there a fee for cancelling the coffee subscription?',
      ],
    ],
  ],
  [
    'Call about a warranty repair',
    [
      [
        'the washing machine is still under the two year warranty so the repair and the engineer visit are free of charge',
        'Is the washing machine repair free?',
      ],
      [
        'the engineer will visit on monday morning and the visit usually takes about an hour including the test wash',
        'When will the engineer visit for the washing machine repair?',
      ],
      [
        'please make sure the drum is empty and the machine can be pulled out from the wall before the engineer arrives',
        'How should I prepare the washing machine for the engineer?',
      ],
      [
        'if the same fault comes back within ninety days of the repair we replace the whole washing machine instead',
        'What happens if the washing machine fault comes back after the repair?',
      ],
    ],
  ],
  [
    'Call about a missing item',
    [
      [
        'the missing pillow case was packed in a separate parcel and the tracking shows it arriving on saturday',
        'When will the missing pillow case arrive?',
      ],
      [
        'the second parcel with the pillow case does not need a signature so the courier can leave it in a safe place',
        'Does the parcel with the pillow case need a signature?',
      ],
      [
        'if the pillow case has not arrived by monday evening please call us again and we will send a new one by express',
        'What should I do if the pillow case has not arrived by Monday?',
      ],
      [
        'the rest of your bedding order is complete so you can already wash the sheets before the first use',
        'Is the rest of the bedding order complete?',
      ],
    ],
  ],
  [
    'Call about a price drop',
    [
      [
        'the television dropped in price eleven days after you bought it so you get the difference of sixty euros back',
        'How much of the television price drop is paid back?',
      ],
      [
        'price drops are only matched within fourteen days of purchase and only for the exact same model in our own shop',
        'Within how many days are price drops matched?',
      ],
      [
        'the sixty euros will go back to the gift card you used and not to your bank card because that is how you paid',
        'Where will the price drop refund for the television go?',
      ],
      [
        'the free wall bracket offer does not apply to your order because it started after the day of your purchase',
        'Does the free wall bracket offer apply to my television order?',
      ],
    ],
  ],
  [
    'Call about a gift order',
    [
      [
        'the gift wrapping was added to the order for three euros and a handwritten card with your message is included',
        'What does gift wrapping cost, and is the message included?',
      ],
      [
        'prices are never shown in a gift parcel and the receipt is sent only to your email address and not to the receiver',
        'Will the receiver of the gift see the price?',
      ],
      [
        'the receiver can exchange the scarf for another colour within sixty days using the gift code on the card',
        'How can the receiver exchange the gift scarf?',
      ],
      [
        'the gift will arrive on the twentieth which is two days before the birthday so there is a little time to spare',
        'When will the birthday gift arrive?',
      ],
    ],
  ],
];

/** Small deterministic generator, so the filler differs per call without Math.random. */
function lcg(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

const random = lcg(2026_11_19);
const docs = [];
const questions = [];
for (const [title, promises] of CALLS) {
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const pieces = [];
  const filler = () => FILLER[Math.floor(random() * FILLER.length)];
  pieces.push(FILLER[0], FILLER[1], FILLER[2]);
  for (const [promise] of promises) {
    if (promise.length < 90 || promise.length > 145) {
      throw new Error(`promise is ${promise.length} chars (keep 90-145)`);
    }
    if (/[^a-z ]/.test(promise)) {
      throw new Error(
        `transcripts have no punctuation or capitals: ${promise}`,
      );
    }
    const before = 2 + Math.floor(random() * 3);
    for (let i = 0; i < before; i += 1) {
      pieces.push(filler());
    }
    pieces.push(promise);
  }
  pieces.push(filler(), FILLER[16], FILLER[17]);
  const text = pieces.join(' ');
  for (const [promise] of promises) {
    if (text.split(promise).length !== 2) {
      throw new Error(`promise must appear exactly once: ${promise}`);
    }
  }
  docs.push({ id, title, text });
  for (const [promise, question] of promises) {
    questions.push({
      question,
      goldDocId: id,
      goldSpan: promise,
      goldAnswer: promise,
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
  console.error('call-transcripts is out of date: re-run this script.');
  process.exit(1);
}
const sizes = docs.map((doc) => doc.text.length);
console.log(
  `call-transcripts: ${docs.length} calls (${Math.min(...sizes)}-${Math.max(...sizes)} chars), ${questions.length} questions${CHECK ? ', up to date' : ''}`,
);
