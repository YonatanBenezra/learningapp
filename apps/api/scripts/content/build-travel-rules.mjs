#!/usr/bin/env node
/**
 * Builds content/corpora/travel-rules.json: travel and expense rules where
 * every rule is one long sentence (140-220 characters) and the answer is the
 * whole rule: its condition and its limit ("Hotel rooms are booked ... and a
 * room may cost up to 160 euros a night ..."). Fixed word windows cut most
 * rules somewhere, whatever their size; splitting on sentences never does.
 *
 * Also writes content/corpora/travel-rules.questions.json (gold = the rule).
 *
 * Deterministic. Usage: node scripts/content/build-travel-rules.mjs [--check]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { contentRoot } from './paths.mjs';

const CHECK = process.argv.includes('--check');
const OUT = path.join(contentRoot, 'corpora', 'travel-rules.json');
const QUESTIONS_OUT = path.join(
  contentRoot,
  'corpora',
  'travel-rules.questions.json',
);

/** Page title, then [rule, question] pairs. */
const PAGES = [
  [
    'Booking travel',
    [
      [
        'Flights for trips shorter than four hours must be booked in economy class through the travel portal, and business class is only allowed when the flight leaves before six in the morning.',
        'When is business class allowed on a flight shorter than four hours?',
      ],
      [
        'Train travel is the default for every trip under five hours door to door, and first class may be booked whenever the second class fare is less than twenty euros cheaper.',
        'When may I book first class on a train?',
      ],
      [
        'Hotel rooms are booked by the travel desk at least ten days before arrival, and a room may cost up to 160 euros a night in capital cities and 120 euros a night elsewhere.',
        'How much may a hotel room cost per night outside capital cities?',
      ],
      [
        'Rental cars are only allowed when no train or bus reaches the destination within two hours, and the car must be from the compact class unless four or more colleagues share it.',
        'When am I allowed to rent a car, and which class must it be?',
      ],
      [
        'Taxi rides are refunded between the station or airport and the hotel, but rides inside the same city during the day are only refunded when public transport has stopped.',
        'Which taxi rides inside the city are refunded?',
      ],
      [
        'Travel insurance is arranged automatically for every booked trip, and private extensions of the trip are covered for a maximum of three days before or after the work dates.',
        'How many days of private travel around a work trip does the travel insurance cover?',
      ],
    ],
  ],
  [
    'Meals and allowances',
    [
      [
        'The daily meal allowance on business trips abroad is fifty euros, and it drops to thirty euros on days when the hotel or the client already provides both lunch and dinner.',
        'What is the daily meal allowance abroad when lunch and dinner are already provided?',
      ],
      [
        'Client dinners are paid by the most senior colleague at the table, and the bill may reach seventy euros per guest including drinks when the guest list is sent in advance.',
        'How much may a client dinner cost per guest?',
      ],
      [
        'Alcohol is never refunded on its own receipt, and it is only accepted as part of a client dinner where it stays below a quarter of the total bill for the evening.',
        'When is alcohol refunded?',
      ],
      [
        'Breakfast on a trip is refunded up to fifteen euros a day when the hotel rate does not include it, and the receipt must show the date and the name of the hotel.',
        'How much breakfast is refunded when the hotel rate does not include it?',
      ],
      [
        'Coffee and snacks bought while travelling are covered by the daily allowance and cannot be claimed separately, even when the receipt lists a client meeting as the reason.',
        'Can I claim coffee and snacks bought while travelling separately?',
      ],
      [
        'Team lunches at the office are paid from the team budget once every quarter, with a limit of twenty-five euros per person and a maximum of twelve people at each lunch.',
        'How often are team lunches at the office paid, and what is the limit per person?',
      ],
    ],
  ],
  [
    'Claiming expenses',
    [
      [
        'Expense claims must be filed in the finance app within thirty days of the purchase, and claims filed later than ninety days are rejected without any further review.',
        'What is the deadline for filing an expense claim?',
      ],
      [
        'Every expense above twenty-five euros needs a photo of the original receipt, and a card statement alone is accepted only when the shop refuses to print a receipt.',
        'When is a card statement accepted instead of a receipt?',
      ],
      [
        'Lost receipts can be replaced by a signed statement twice a year per person, and each statement covers a single purchase of no more than one hundred and fifty euros.',
        'How often can a lost receipt be replaced by a signed statement?',
      ],
      [
        'Foreign currency expenses are converted at the exchange rate on the day of payment, and card fees charged by the bank for the conversion are refunded on the same claim.',
        'Which exchange rate is used for expenses paid in a foreign currency?',
      ],
      [
        'Refunds are paid with the next salary when the claim is approved before the twentieth of the month, and otherwise they are paid with the salary of the following month.',
        'When is my expense refund paid out?',
      ],
      [
        'Managers approve the expense claims of their own team members within five working days, and a claim that waits longer is approved by the finance controller instead.',
        'Who approves my expense claim when my manager has not done so within five working days?',
      ],
    ],
  ],
  [
    'Company cards',
    [
      [
        'Company credit cards are issued to colleagues who travel more than six times a year, and the monthly spending limit on a new card starts at three thousand euros.',
        'What is the monthly spending limit on a new company credit card?',
      ],
      [
        'Cash withdrawals with the company card are only allowed abroad, they are limited to two hundred euros per trip, and every withdrawal needs a note in the finance app.',
        'How much cash may I withdraw with the company card on a trip?',
      ],
      [
        'A lost or stolen company card must be blocked within one hour by calling the bank hotline, and the replacement card is sent to the office within five working days.',
        'How quickly must a lost company card be blocked?',
      ],
      [
        'Private purchases on the company card must be paid back within fourteen days, and a second private purchase in the same year means the card is taken away for six months.',
        'What happens after a second private purchase on the company card?',
      ],
      [
        'Subscriptions such as software licences may never be paid with a company card, because the procurement team buys every recurring service through a central contract.',
        'Can I pay a software subscription with the company card?',
      ],
      [
        'The company card statement is reconciled on the first working day of each month, and every line without a matching receipt is deducted from the next salary payment.',
        'What happens to company card lines without a matching receipt?',
      ],
    ],
  ],
  [
    'Working away from home',
    [
      [
        'Working from another country is allowed for up to twenty working days a year, and each stay must be approved by the manager and the tax team two weeks before travel.',
        'How many days a year may I work from another country?',
      ],
      [
        'Home office equipment is paid once every three years up to four hundred euros, which covers a chair, a desk or a screen bought from the approved list of suppliers.',
        'How much is paid for home office equipment, and how often?',
      ],
      [
        'Internet costs at home are refunded at twenty euros a month for colleagues who work at home at least two days a week, without needing to send in any monthly bills.',
        'How much is refunded for internet costs at home?',
      ],
      [
        'Coworking spaces may be used when the nearest office is more than fifty kilometres away, and the company pays a flexible desk of up to two hundred euros a month.',
        'When may I use a coworking space, and how much does the company pay?',
      ],
      [
        'Mileage for driving your own car on business is refunded at thirty cents a kilometre, and the trip must start from the office unless it starts from home before eight.',
        'What is the mileage rate for driving my own car on business?',
      ],
      [
        'Parking at airports and stations is refunded for business trips of up to five days, and longer trips need the cheaper long-stay car park booked online in advance.',
        'For how long a trip is parking at the airport refunded?',
      ],
    ],
  ],
  [
    'Events and gifts',
    [
      [
        'Gifts from suppliers may be accepted when they are worth less than fifty euros, and any gift above that value must be reported to the compliance team within a week.',
        'What value of gift from a supplier may I accept?',
      ],
      [
        'Gifts to clients are bought from the approved catalogue and are limited to one gift per client contact each year with a value of no more than seventy-five euros.',
        'How much may a gift to a client be worth?',
      ],
      [
        'Conference fees are paid from the team learning budget when the conference is booked at least six weeks ahead, which usually gives the early booking discount.',
        'How far ahead must a conference be booked for the team to pay the fee?',
      ],
      [
        'Team building events are paid once a year with up to eighty euros per person, and the event has to take place within the region unless the director signs off.',
        'How much is paid per person for a team building event?',
      ],
      [
        'Farewell gifts for leaving colleagues come from the team budget, and the company adds up to forty euros when the colleague has worked here for more than five years.',
        'How much does the company add to a farewell gift?',
      ],
      [
        'Charity donations are never paid from team budgets, but the company matches personal donations of colleagues up to two hundred and fifty euros each calendar year.',
        'How much of my personal charity donations does the company match?',
      ],
    ],
  ],
  [
    'Phones and devices',
    [
      [
        'Mobile phones are provided to colleagues who are on call or travel often, and the phone is replaced every three years or earlier when the repair costs more than half.',
        'How often is a company mobile phone replaced?',
      ],
      [
        'Roaming data abroad is included up to ten gigabytes a month on company phone plans, and extra data must be requested from the service desk before the trip begins.',
        'How much roaming data is included on a company phone plan?',
      ],
      [
        'Private use of the company phone is allowed within the monthly plan, but calls to premium numbers and in-app purchases are taken from the next salary payment.',
        'What happens with calls to premium numbers on the company phone?',
      ],
      [
        'Personal phones used for work get a fixed allowance of fifteen euros a month, and the colleague then installs the work profile from the device management portal.',
        'What allowance do I get for using my personal phone for work?',
      ],
      [
        'Laptop accessories such as a mouse, a keyboard or a bag are ordered from the service desk catalogue, with a limit of one hundred euros per colleague every two years.',
        'What is the spending limit for laptop accessories like a mouse or a keyboard?',
      ],
      [
        'Damaged devices must be reported in the service portal within three days, and the first repair each year is free while later repairs cost the team fifty euros.',
        'What does a device repair cost after the first one each year?',
      ],
    ],
  ],
];

const docs = [];
const questions = [];
for (const [title, rules] of PAGES) {
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  for (const [rule] of rules) {
    if (rule.length < 140 || rule.length > 220) {
      throw new Error(`rule is ${rule.length} chars (keep 140-220): ${rule}`);
    }
    if (/[.!?]\s/.test(rule.slice(0, -1))) {
      throw new Error(`rule must be one sentence: ${rule}`);
    }
  }
  docs.push({ id, title, text: rules.map(([rule]) => rule).join(' ') });
  for (const [rule, question] of rules) {
    questions.push({
      question,
      goldDocId: id,
      goldSpan: rule,
      goldAnswer: rule,
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
  console.error('travel-rules is out of date: re-run this script.');
  process.exit(1);
}
console.log(
  `travel-rules: ${docs.length} docs, ${questions.length} questions${CHECK ? ', up to date' : ''}`,
);
