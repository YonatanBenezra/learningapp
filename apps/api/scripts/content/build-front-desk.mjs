#!/usr/bin/env node
/**
 * Builds content/corpora/front-desk.json: a hotel front-desk handbook. Every
 * answer is two sentences in a row: the action, then what follows from it,
 * which only says "it" or "they" ("Guests leave a card deposit of 100 euros at
 * check-in. It is released three days after check-out."). The second sentence
 * shares almost no words with the question, so it only reaches the context
 * next to the first one.
 *
 * Pages are long (five answers each), so whole pages blow the token budget.
 * Sentence lengths vary a lot, so no chunk size keeps every pair together.
 * Small chunks find the first sentence; a window of neighbouring chunks
 * brings the second one along.
 *
 * Also writes content/corpora/front-desk.questions.json (gold = both
 * sentences).
 *
 * Deterministic. Usage: node scripts/content/build-front-desk.mjs [--check]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { contentRoot } from './paths.mjs';

const CHECK = process.argv.includes('--check');
const OUT = path.join(contentRoot, 'corpora', 'front-desk.json');
const QUESTIONS_OUT = path.join(
  contentRoot,
  'corpora',
  'front-desk.questions.json',
);

/** Page title, then [action, what follows, question] per answer. */
const PAGES = [
  [
    'Check-in',
    [
      [
        'Guests leave a card deposit of 100 euros at check-in, taken from the card they booked with or from another card they show at the desk.',
        'It is released three days after check-out, when the room has been checked for damage and the minibar has been counted.',
        'How much is the check-in deposit, and when is it released?',
      ],
      [
        'Early check-in before noon is offered only when housekeeping has marked the room as clean in the room system and the guest booked the flexible rate.',
        'It costs 30 euros.',
        'When is early check-in possible, and what does it cost?',
      ],
      [
        'Ask every guest for a passport or national identity card at the desk.',
        'The number goes into the guest register.',
        'Which identity document do I ask for at check-in, and what happens with it?',
      ],
      [
        'Group check-ins of ten guests or more are prepared the evening before by the night manager, who prints every key card and welcome letter in advance.',
        'They are handed out at the side desk.',
        'How are group check-ins prepared, and where are they handed out?',
      ],
      [
        'A guest who arrives after midnight checks in with the night porter.',
        'He can only offer the rooms already blocked for late arrivals.',
        'Who checks in a guest arriving after midnight, and which rooms can be offered?',
      ],
    ],
  ],
  [
    'Check-out',
    [
      [
        'Late check-out until two in the afternoon is free for loyalty members, who ask for it at the desk or in the app on the evening before they leave.',
        'For everyone else it costs 15 euros an hour, charged to the room before the final invoice is printed and paid.',
        'Who gets free late check-out, and what does everyone else pay?',
      ],
      [
        'Express check-out lets guests leave their key cards in the box at the main door without queueing at the desk on the morning they leave.',
        'The invoice follows by email.',
        'How does express check-out work, and how does the guest get the invoice?',
      ],
      [
        'Disputed minibar charges below 20 euros are removed at once.',
        'Higher amounts go to the duty manager.',
        'What do I do with a disputed minibar charge, and when does the duty manager decide?',
      ],
      [
        'Invoices made out to a company need the company name, address and tax number before the guest leaves.',
        'They cannot be changed later, because the accounting system locks every invoice once it has been sent out at the end of the day.',
        'What does a company invoice need, and can it be changed after the guest leaves?',
      ],
      [
        'Guests who leave without checking out are charged for one extra night.',
        'The charge is reversed if they call within a day.',
        'What happens when guests leave without checking out, and can the charge be reversed?',
      ],
    ],
  ],
  [
    'Room keys',
    [
      [
        'Key cards are coded for the length of the stay plus four hours, using the encoder on the desk and the booking number on the guest confirmation.',
        'They stop working at four in the afternoon on the day of departure, even when late check-out was booked for the room.',
        'How long are key cards coded for, and when do they stop working?',
      ],
      [
        'A lost key card is replaced only after the guest has shown photo identification and the name has been checked against the guest register on the screen.',
        'The old card is cancelled at once.',
        'How do I replace a lost key card, and what happens to the old one?',
      ],
      [
        'Spa and gym access is coded onto the key card at check-in.',
        'It is free for suites and ten euros a day for other rooms.',
        'How is spa access added to a key card, and who pays for it?',
      ],
      [
        'Physical master keys are kept in the safe behind the desk and are signed out in the key book by name, time and reason.',
        'They must be back within the hour.',
        'Where are the master keys kept, and how long may they be signed out?',
      ],
      [
        'If a key card stops working, recode it at the desk encoder.',
        'Demagnetised cards are often the cause, usually from being kept next to a phone in the same pocket or bag for a while.',
        'What do I do when a key card stops working, and what usually causes it?',
      ],
    ],
  ],
  [
    'Luggage',
    [
      [
        'Luggage is stored for free on the day of arrival and the day of departure, in the locked luggage room behind the concierge desk on the ground floor.',
        'Each bag gets a numbered tag, and the guest keeps the matching half of the tag until the bag is picked up again.',
        'When is luggage stored for free, and how are the bags tagged?',
      ],
      [
        'Bags left in storage for more than seven days after a guest has left the hotel are moved to the lost property room in the basement.',
        'They are kept there for three months.',
        'What happens to bags left in storage for more than a week?',
      ],
      [
        'Porters carry bags to the room on request at any hour.',
        'Tips never go on the room bill.',
        'Do porters carry bags at night, and can tips go on the room bill?',
      ],
      [
        'Valuables such as jewellery, laptops and cash are never taken into the luggage room, however small or well packed they are.',
        'They go into the room safe instead.',
        'Can valuables be left in the luggage room, and where do they go instead?',
      ],
      [
        'Oversized items such as bikes and skis go to the garage store.',
        'The garage store is opened by the night porter, who keeps its key and logs every item that goes in or comes out.',
        'Where do bikes and skis go, and who opens that store?',
      ],
    ],
  ],
  [
    'Breakfast',
    [
      [
        'Breakfast is served from half past six until ten on weekdays in the garden restaurant on the ground floor, and the hot buffet opens at seven.',
        'At weekends it runs until half past eleven, and the last guests are seated until a quarter past eleven.',
        'When is breakfast served on weekdays, and how late at weekends?',
      ],
      [
        'Guests who did not book breakfast can add it at the desk the evening before for 22 euros per person, or at the restaurant door on the morning itself.',
        'Children under six eat for free.',
        'How much does breakfast cost if it was not booked, and do young children pay?',
      ],
      [
        'Room service breakfast must be ordered on the door card by two in the morning.',
        'A tray charge of five euros is added.',
        'How is room service breakfast ordered, and what extra is charged?',
      ],
      [
        'Allergies and special diets are entered in the guest profile when the booking is made or at check-in, so that the kitchen sees them on the morning list.',
        'The chef confirms them by phone.',
        'Where are allergies recorded, and who confirms them with the guest?',
      ],
      [
        'Early departures before half past six get a breakfast bag.',
        'It is ordered at the desk by ten the evening before and picked up from the night porter on the way out of the hotel.',
        'What do guests leaving very early get for breakfast, and how is it ordered?',
      ],
    ],
  ],
  [
    'Parking',
    [
      [
        'The hotel garage costs 25 euros a night, paid at check-out together with the room, and guests take a ticket at the barrier when they drive in.',
        'Its height limit is two metres, so vans and cars with roof boxes are sent to the public car park across the street.',
        'What does the hotel garage cost, and what is its height limit?',
      ],
      [
        'Valet parking is available from seven in the morning until eleven at night, and the valet brings the car to the main door within fifteen minutes.',
        'It costs ten euros on top of the garage.',
        'When is valet parking available, and what does it cost?',
      ],
      [
        'Electric cars can charge at the four bays on level minus one.',
        'Charging is billed per kilowatt hour on the room.',
        'Where do electric cars charge, and how is charging billed?',
      ],
      [
        'Coaches and minibuses drop guests at the side entrance on the quiet street, because the main entrance is too narrow for them to turn.',
        'They park at the coach park.',
        'Where do coaches drop guests, and where do they park?',
      ],
      [
        'Parking tickets for the garage are validated at the desk.',
        'A validated ticket opens the exit barrier for thirty minutes, which is enough time to load the car and pay nothing more.',
        'Where are garage tickets validated, and how long does a validated ticket work?',
      ],
    ],
  ],
  [
    'Housekeeping requests',
    [
      [
        'Extra towels and pillows are brought to the room within twenty minutes of the call, by the floor attendant on duty or by the night porter after ten.',
        'They are logged in the housekeeping tablet so that the room is not charged when the inventory is checked after departure.',
        'How fast are extra towels brought, and why are they logged?',
      ],
      [
        'Guests who want no cleaning during the stay hang the green card on the outside of the door before nine in the morning.',
        'They receive a drinks voucher for each day.',
        'How does a guest skip cleaning, and what do they receive for it?',
      ],
      [
        'Baby cots are free and are set up before the guests arrive.',
        'They must be requested a day ahead.',
        'Do baby cots cost anything, and how far ahead must they be requested?',
      ],
      [
        'Laundry handed in at the desk before nine in the morning is washed, ironed and returned to the room by six in the evening the same day.',
        'Prices are on the laundry bag.',
        'When does laundry come back, and where are the prices listed?',
      ],
      [
        'A stain or damage found after departure is photographed by housekeeping.',
        'The duty manager decides within two days whether the guest is charged, and the photos are attached to the invoice.',
        'What happens when damage is found after departure, and who decides about charging?',
      ],
    ],
  ],
  [
    'Lost and found',
    [
      [
        'Items found in rooms are logged in the lost property book with the room number and date, and a photo of each item goes on the online lost property list.',
        'They are kept for three months, and food, drinks and opened toiletries are thrown away on the same day they are found.',
        'How are items found in rooms logged, and how long are they kept?',
      ],
      [
        'Items are posted back only after the guest has paid the postage by card on the phone or through the payment link that we send by email.',
        'They are sent by tracked mail.',
        'When are lost items posted back, and how are they sent?',
      ],
      [
        'Phones and wallets go straight into the desk safe.',
        'Guests collect them in person.',
        'Where do found phones and wallets go, and how are they returned?',
      ],
      [
        'Unclaimed items of value are handed to the city lost property office after three months, together with a copy of the page from the lost property book.',
        'Clothing goes to charity.',
        'What happens to unclaimed valuable items and clothing?',
      ],
      [
        'Guests asking about a lost item fill in the online form.',
        'It is answered within two working days, even when nothing matching the description has been found in the hotel.',
        'How do guests ask about a lost item, and how fast is it answered?',
      ],
    ],
  ],
];

/**
 * Two notes per page, between answers: a short one after the second answer
 * and a long one after the fourth. They answer nothing; they make chunk
 * boundaries land less predictably.
 */
const NOTES = {
  'Check-in': [
    'Welcome the guest by name.',
    'Offer a glass of water to guests who arrive after a long journey, and point out the lifts, the breakfast room and the bar on the way past the lobby.',
  ],
  'Check-out': [
    'Thank the guest and ask about the stay.',
    'If a taxi is needed, call the company on the card at the desk, which knows the hotel and charges a fixed price to the airport and to the station.',
  ],
  'Room keys': [
    'Never say a room number out loud.',
    'Keep blank key cards in the locked drawer under the encoder, and count them at the end of every shift with the colleague who takes over the desk.',
  ],
  Luggage: [
    'Use a trolley for more than two bags.',
    'Check that every tag is attached firmly, because tags that come off in the luggage room are the most common reason for a bag going to the wrong guest.',
  ],
  Breakfast: [
    'Coffee to go is free for guests.',
    'Tell guests about the pastry of the day, which the pastry chef bakes fresh every morning and which is usually gone by nine on weekend mornings.',
  ],
  Parking: [
    'Never move a guest car yourself.',
    'When the garage is full, give guests the map to the public car park across the street, which charges about the same and is open around the clock.',
  ],
  'Housekeeping requests': [
    'Log every request in the tablet.',
    'Housekeeping starts with the rooms of guests who have already checked out, so the rooms of staying guests are usually cleaned after eleven in the morning.',
  ],
  'Lost and found': [
    'Never promise that an item was found.',
    'Describe items in the book in plain words such as colour, brand and size, because guests often describe their things differently from how we would.',
  ],
};

const docs = [];
const questions = [];
for (const [title, answers] of PAGES) {
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  for (const [action, follow] of answers) {
    for (const sentence of [action, follow]) {
      if (/[.!?]\s/.test(sentence.slice(0, -1))) {
        throw new Error(`one sentence each: ${sentence}`);
      }
    }
  }
  const [shortNote, longNote] = NOTES[title];
  const parts = answers.map(([action, follow]) => `${action} ${follow}`);
  parts.splice(4, 0, longNote);
  parts.splice(2, 0, shortNote);
  docs.push({ id, title, text: parts.join(' ') });
  for (const [action, follow, question] of answers) {
    questions.push({
      question,
      goldDocId: id,
      goldSpan: `${action} ${follow}`,
      goldAnswer: `${action} ${follow}`,
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
  console.error('front-desk is out of date: re-run this script.');
  process.exit(1);
}
const sizes = docs.map((doc) => doc.text.length);
console.log(
  `front-desk: ${docs.length} pages (${Math.min(...sizes)}-${Math.max(...sizes)} chars), ${questions.length} questions${CHECK ? ', up to date' : ''}`,
);
