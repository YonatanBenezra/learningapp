#!/usr/bin/env node
/**
 * Builds content/corpora/benefits-faq.json: an employee benefits FAQ. Every
 * answer is one paragraph of two sentences (the rule, then its condition),
 * and a question counts only when both sit in one chunk. Paragraph lengths
 * vary a lot (about 230 to 450 characters), so no sentence-packing size lines
 * up with them: some boundary always falls inside an answer. Overlap fixes
 * that by storing every sentence twice, which doubles the index. Splitting on
 * paragraphs first (recursive) keeps every answer whole at one chunk each.
 *
 * Also writes content/corpora/benefits-faq.questions.json (gold = both
 * sentences).
 *
 * Deterministic. Usage: node scripts/content/build-benefits-faq.mjs [--check]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { contentRoot } from './paths.mjs';

const CHECK = process.argv.includes('--check');
const OUT = path.join(contentRoot, 'corpora', 'benefits-faq.json');
const QUESTIONS_OUT = path.join(
  contentRoot,
  'corpora',
  'benefits-faq.questions.json',
);

/** Page title, then [rule, condition, question] per answer. */
const PAGES = [
  [
    'Pension and savings',
    [
      [
        'The company pays six percent of your gross salary into the pension plan every month.',
        'You can add up to ten percent yourself through the payroll portal.',
        'How much does the company pay into my pension, and how much can I add myself?',
      ],
      [
        'The pension plan invests your savings in a default fund that slowly moves to safer investments as you get closer to the retirement age that you chose when you joined the plan.',
        'You can switch to one of the four other funds at any time, but every switch after the second one in the same calendar year costs a fee of twenty-five euros, which is taken from your savings.',
        'Where is my pension invested, and what does it cost to switch funds?',
      ],
      [
        'The share purchase plan lets you buy company shares at a fifteen percent discount.',
        'Shares bought through the plan must be held for at least twelve months.',
        'What discount does the share purchase plan give, and how long must I keep the shares?',
      ],
      [
        'When you leave the company, your pension savings stay in the plan and keep growing, and you continue to receive the yearly statement at the home address that you gave to the people team.',
        'You can also move the savings to the pension plan of your new employer, and the transfer is free of charge as long as you request it within two years after your last working day.',
        'What happens to my pension savings when I leave, and when is a transfer free?',
      ],
    ],
  ],
  [
    'Health and insurance',
    [
      [
        'Private health insurance covers you and your children up to the age of eighteen.',
        'A partner can be added for forty euros a month through the benefits portal.',
        'Who does the health insurance cover, and what does it cost to add a partner?',
      ],
      [
        'The dental plan pays for two check-ups and two cleanings a year at any dentist in the national network, and it also pays half of the cost of fillings and other basic treatment.',
        'Orthodontic treatment such as braces is only covered for children, and the plan pays at most one thousand five hundred euros per child over the whole time they are insured.',
        'What does the dental plan pay for, and is orthodontic treatment covered?',
      ],
      [
        'Life insurance pays out three times your yearly salary to the people you name.',
        'You can change the names at any time in the benefits portal.',
        'How much does the life insurance pay out, and can I change who receives it?',
      ],
      [
        'Income protection insurance pays seventy percent of your salary if you cannot work because of a long illness, and the payments start after you have been ill for more than six months in a row.',
        'The payments continue until you are able to work again or until you reach the state pension age, and they are reduced by any payments that you receive from the state for the same illness.',
        'When does income protection start paying, and for how long does it pay?',
      ],
    ],
  ],
  [
    'Time off',
    [
      [
        'Full-time staff receive twenty-eight days of paid holiday each year.',
        'Up to five unused days can be carried over to the first quarter of the next year.',
        'How many holiday days do I get, and how many can I carry over?',
      ],
      [
        'You can buy up to five extra days of holiday each year in the benefits window in November, and the cost is spread over the twelve monthly salary payments of the following year.',
        'Bought days are always used before your normal holiday days, and any bought days that are left unused at the end of the year are paid back to you with the January salary.',
        'How many extra holiday days can I buy, and what happens to bought days I do not use?',
      ],
      [
        'Volunteering leave gives you two paid days a year to work for a registered charity.',
        'Your manager approves the days in the absence tool at least a week ahead.',
        'How much volunteering leave do I get, and how is it approved?',
      ],
      [
        'After five years with the company you can take a sabbatical of up to three months, and during the sabbatical your job, your pension contributions and your health insurance are kept for you.',
        'A sabbatical is unpaid, but you can spread the lost salary over the twelve months before it starts, and you must ask your manager at least six months before the date you want to leave.',
        'When can I take a sabbatical, and how far ahead must I ask for it?',
      ],
    ],
  ],
  [
    'Family',
    [
      [
        'Parents receive sixteen weeks of fully paid leave after the birth or adoption of a child.',
        'The leave can be taken in up to three blocks within the first year.',
        'How much paid parental leave do I get, and can I split it up?',
      ],
      [
        'The childcare allowance pays two hundred euros a month for each child under the age of four who goes to a registered nursery or a registered childminder near your home or the office.',
        'The allowance is paid with your salary from the month after you send the contract with the nursery to the people team, and it stops automatically in the month that the child turns four.',
        'How much is the childcare allowance, and when does it start and stop?',
      ],
      [
        'Carers leave gives you ten paid days a year to look after a family member who is ill.',
        'You only need to tell your manager on the first day of the leave.',
        'How many days of carers leave do I get, and how do I ask for them?',
      ],
      [
        'Fertility treatment is supported with up to three paid days of leave for each round of treatment, and the health insurance pays for up to three rounds over the whole time you work here.',
        'The days can be taken at short notice, and you only need to tell the people team in confidence, because your manager is told that you are on paid leave without being told the reason.',
        'How much leave is there for fertility treatment, and who is told about it?',
      ],
    ],
  ],
  [
    'Getting around',
    [
      [
        'The bike lease lets you lease a bike of up to three thousand euros through your salary.',
        'The lease runs for three years, and you can buy the bike for ten percent at the end.',
        'What bike can I lease, and can I buy it when the lease ends?',
      ],
      [
        'If you leave the company before the bike lease has ended, the remaining monthly payments are taken from your last salary, and the bike then becomes yours without any further payment to the leasing company.',
        'If the bike is stolen during the lease, the insurance that comes with every lease pays for a new bike of the same value, but you pay the first one hundred euros of the cost yourself.',
        'What happens to my leased bike if I leave early, and what if it is stolen?',
      ],
      [
        'Public transport for travel to work is paid in full for every member of staff.',
        'The yearly pass is ordered through the travel desk before the first of the month.',
        'Is my public transport to work paid, and how do I order the pass?',
      ],
      [
        'Staff who drive to work can rent a parking space in the office garage for sixty euros a month, and the cost is taken from the salary before tax, which makes it cheaper than it sounds.',
        'There are fewer spaces than people who ask for them, so new requests go on a waiting list, and staff with a disability or with children at the nursery next door are always placed first.',
        'What does a parking space at the office cost, and who gets one first?',
      ],
    ],
  ],
  [
    'Learning',
    [
      [
        'Every member of staff has a learning budget of one thousand euros a year.',
        'The budget can be spent on courses, books, conferences and exam fees.',
        'How big is my learning budget, and what can I spend it on?',
      ],
      [
        'A degree or a long professional qualification can be paid by the company up to eight thousand euros a year, on top of the normal learning budget, when it is useful for your current role or your next one.',
        'If you leave within two years after the course ends, you pay back part of the cost: everything in the first year, and half of it in the second year, taken from your last salary.',
        'How much does the company pay for a degree, and what if I leave soon after?',
      ],
      [
        'Study leave gives you five paid days a year to prepare for exams.',
        'The days are booked in the absence tool like holiday days.',
        'How much study leave is there, and how do I book it?',
      ],
      [
        'Language lessons in the language of the country you work in are free for new staff during their first two years, and the lessons take place during working hours in small groups at the office.',
        'Staff who move to another country with the company receive the same lessons for the new language, and their partners can join the evening groups for free during the first year after the move.',
        'Who gets free language lessons, and can my partner join them?',
      ],
    ],
  ],
  [
    'Health at work',
    [
      [
        'The gym subsidy pays half of any gym membership up to thirty euros a month.',
        'Send the membership contract once, and the subsidy runs with your salary.',
        'How much of my gym membership is paid, and how do I claim it?',
      ],
      [
        'The employee assistance line offers free and confidential advice on money, legal questions and personal problems, by phone or video, at any time of the day and on every day of the year.',
        'Up to six sessions with a counsellor per problem are free, and nothing about the calls is shared with the company, which only receives a yearly report on how many people used the service.',
        'What does the employee assistance line offer, and what does the company find out?',
      ],
      [
        'A yearly health check at the office measures blood pressure, cholesterol and weight.',
        'The results go only to you and to your doctor if you ask for it.',
        'What does the yearly health check measure, and who sees the results?',
      ],
      [
        'Glasses for screen work are paid up to one hundred and fifty euros every two years when an optician confirms that you need them, and this applies to both normal glasses and lenses.',
        'The optician test itself is free at the opticians in the company network, and a test at another optician is paid back up to forty euros when you send the invoice to the people team.',
        'How much is paid for glasses for screen work, and who pays for the eye test?',
      ],
    ],
  ],
  [
    'Money and extras',
    [
      [
        'The yearly bonus is paid in March and depends on company results and your review.',
        'You must work here on the first of March to receive it.',
        'When is the yearly bonus paid, and who receives it?',
      ],
      [
        'Staff who recommend a new colleague receive a referral bonus of two thousand euros, paid in two parts: one half when the new colleague starts and the other half after their trial period.',
        'The bonus is not paid for people who report to you, for former staff who come back within a year, or when the role was filled through an agency that already had the same candidate.',
        'How is the referral bonus paid, and when is it not paid?',
      ],
      [
        'The company gives every member of staff a phone and a laptop to use for work.',
        'Both may be used privately within reason, and both stay company property.',
        'Which devices do I get, and may I use them privately?',
      ],
      [
        'Staff discounts give you up to thirty percent off at more than two hundred shops, gyms and restaurants, and the list of partners is updated every month in the benefits portal on the intranet.',
        'The discount is shown as a code or a card in the benefits app, and it may also be used by the people you live with, but it may never be sold or shared with anyone outside your household.',
        'How big are the staff discounts, and who else may use them?',
      ],
    ],
  ],
];

const docs = [];
const questions = [];
const lengths = [];
for (const [title, answers] of PAGES) {
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const paragraphs = answers.map(([rule, condition]) => `${rule} ${condition}`);
  for (const paragraph of paragraphs) {
    lengths.push(paragraph.length);
    if (paragraph.length < 110 || paragraph.length > 460) {
      throw new Error(
        `answer is ${paragraph.length} chars (keep 110-460): ${paragraph}`,
      );
    }
  }
  docs.push({ id, title, text: paragraphs.join('\n\n') });
  for (const [rule, condition, question] of answers) {
    questions.push({
      question,
      goldDocId: id,
      goldSpan: `${rule} ${condition}`,
      goldAnswer: `${rule} ${condition}`,
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
  console.error('benefits-faq is out of date: re-run this script.');
  process.exit(1);
}
console.log(
  `benefits-faq: ${docs.length} docs, ${questions.length} questions, answers ${Math.min(...lengths)}-${Math.max(...lengths)} chars${CHECK ? ', up to date' : ''}`,
);
