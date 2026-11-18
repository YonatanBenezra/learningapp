#!/usr/bin/env node
/**
 * Builds content/corpora/bilingual-kb.json: the staff handbook of a company
 * with a London office (pages in English) and a Dhaka office (pages in
 * Bangla). Staff ask in whichever language they think in, so many questions
 * are in one language and answered by a page in the other. Keyword search
 * cannot cross that gap; an English-only embedding model reads Bangla
 * poorly; a multilingual model can.
 *
 * Also writes content/corpora/bilingual-kb.questions.json.
 *
 * Deterministic. Usage: node scripts/content/build-bilingual-kb.mjs [--check]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { contentRoot } from './paths.mjs';

const CHECK = process.argv.includes('--check');
const OUT = path.join(contentRoot, 'corpora', 'bilingual-kb.json');
const QUESTIONS_OUT = path.join(
  contentRoot,
  'corpora',
  'bilingual-kb.questions.json',
);

/** [id, title, [sentence, sentence]] */
const ENGLISH = [
  [
    'laptop-returns',
    'Laptop returns',
    [
      'Return your laptop to the IT desk on your last working day.',
      'A courier label is emailed to remote staff who cannot visit the office.',
    ],
  ],
  [
    'meal-allowance',
    'Late-work meals',
    [
      'Staff working past 9 pm can claim a dinner allowance of 15 pounds.',
      'Claims must include a photo of the receipt.',
    ],
  ],
  [
    'parking',
    'Parking permits',
    [
      'Parking permits for the London office cost 40 pounds a month.',
      'Permits are issued by the facilities team on the first Monday of each month.',
    ],
  ],
  [
    'training-days',
    'Training days',
    [
      'Each employee gets five paid training days per year.',
      'Unused training days do not carry over.',
    ],
  ],
  [
    'visitor-wifi',
    'Visitor Wi-Fi',
    [
      'Visitors get a Wi-Fi voucher from reception that lasts eight hours.',
      'Vouchers cannot be extended.',
    ],
  ],
  [
    'expense-deadline',
    'Expense deadline',
    [
      'Submit expense claims within 30 days of the purchase.',
      'Late claims need approval from the finance director.',
    ],
  ],
  [
    'sick-notes',
    'Sick notes',
    [
      "A doctor's note is required after three consecutive sick days.",
      'Upload the note in the HR portal.',
    ],
  ],
  [
    'mentoring',
    'Mentoring',
    [
      'New engineers are paired with a mentor for their first six months.',
      'Mentors meet their mentee every two weeks.',
    ],
  ],
  [
    'cycle-scheme',
    'Cycle to work',
    [
      'The cycle to work scheme covers bikes up to 1,000 pounds.',
      'Repayments are taken from salary over twelve months.',
    ],
  ],
  [
    'desk-booking',
    'Desk booking',
    [
      'Desks in the London office are booked through the workplace app.',
      'Bookings open seven days ahead.',
    ],
  ],
  [
    'referrals',
    'Referral bonus',
    [
      'Referring a candidate who is hired earns a bonus of 1,500 pounds.',
      'The bonus is paid after the new hire completes three months.',
    ],
  ],
  [
    'phone-allowance',
    'Phone allowance',
    [
      'Field staff receive 20 pounds a month toward their mobile phone bill.',
      'The allowance is added to the monthly payslip.',
    ],
  ],
  [
    'pension',
    'Pension',
    [
      'The company matches pension contributions up to 5 percent of salary.',
      'You can change your contribution once a quarter.',
    ],
  ],
  [
    'holiday-carry-over',
    'Holiday carry-over',
    [
      'Up to five unused holiday days can be carried into the next year.',
      'Carried days must be used by the end of March.',
    ],
  ],
  [
    'fire-drills',
    'Fire drills',
    [
      'Fire drills take place on the first Thursday of every quarter.',
      'Everyone gathers at the car park assembly point.',
    ],
  ],
  [
    'screen-lock',
    'Screen lock',
    [
      'Laptops must lock automatically after five minutes of inactivity.',
      'Never share your login with a colleague.',
    ],
  ],
];

const BANGLA = [
  [
    'eid-bonus',
    'ঈদ বোনাস',
    [
      'প্রত্যেক কর্মী বছরে দুটি ঈদ বোনাস পান, প্রতিটি মূল বেতনের সমান।',
      'বোনাস ঈদের অন্তত সাত দিন আগে দেওয়া হয়।',
    ],
  ],
  [
    'office-hours',
    'অফিসের সময়',
    [
      'ঢাকা অফিস রবিবার থেকে বৃহস্পতিবার সকাল নয়টা থেকে বিকেল ছয়টা পর্যন্ত খোলা থাকে।',
      'শুক্রবার ও শনিবার অফিস বন্ধ থাকে।',
    ],
  ],
  [
    'transport',
    'যাতায়াত ভাতা',
    [
      'ঢাকা অফিসের কর্মীরা মাসে তিন হাজার টাকা যাতায়াত ভাতা পান।',
      'ভাতাটি মাসিক বেতনের সঙ্গে যোগ হয়।',
    ],
  ],
  [
    'lunch',
    'দুপুরের খাবার',
    [
      'অফিসের ক্যান্টিনে কর্মীদের দুপুরের খাবার বিনামূল্যে দেওয়া হয়।',
      'খাবার দুপুর একটা থেকে আড়াইটা পর্যন্ত পাওয়া যায়।',
    ],
  ],
  [
    'maternity',
    'মাতৃত্বকালীন ছুটি',
    [
      'নারী কর্মীরা পূর্ণ বেতনে ছয় মাসের মাতৃত্বকালীন ছুটি পান।',
      'ছুটি শুরুর অন্তত এক মাস আগে মানবসম্পদ বিভাগকে জানাতে হয়।',
    ],
  ],
  [
    'generator',
    'বিদ্যুৎ বিভ্রাট',
    [
      'বিদ্যুৎ চলে গেলে অফিসের জেনারেটর দুই মিনিটের মধ্যে চালু হয়।',
      'জেনারেটর টানা আট ঘণ্টা চলতে পারে।',
    ],
  ],
  [
    'home-internet',
    'বাসার ইন্টারনেট',
    [
      'বাসা থেকে কাজ করা কর্মীরা মাসে এক হাজার পাঁচশো টাকা ইন্টারনেট ভাতা পান।',
      'ভাতা পেতে বিলের ছবি জমা দিতে হয়।',
    ],
  ],
  [
    'prayer-rooms',
    'নামাজের ঘর',
    [
      'অফিসের পাঁচ তলায় নারী ও পুরুষদের জন্য আলাদা নামাজের ঘর আছে।',
      'শুক্রবার জুমার নামাজের জন্য দুপুরে এক ঘণ্টার বিরতি দেওয়া হয়।',
    ],
  ],
  [
    'medical',
    'চিকিৎসা ভাতা',
    [
      'প্রত্যেক কর্মী বছরে বিশ হাজার টাকা পর্যন্ত চিকিৎসা খরচ ফেরত পেতে পারেন।',
      'দাবির সঙ্গে ডাক্তারের প্রেসক্রিপশন জমা দিতে হয়।',
    ],
  ],
  [
    'id-card',
    'পরিচয়পত্র',
    [
      'হারানো পরিচয়পত্র নতুন করে পেতে পাঁচশো টাকা ফি দিতে হয়।',
      'নতুন কার্ড তিন কর্মদিবসের মধ্যে তৈরি হয়।',
    ],
  ],
  [
    'overtime',
    'ওভারটাইম',
    [
      'সপ্তাহে চল্লিশ ঘণ্টার বেশি কাজ করলে ঘণ্টাপ্রতি দেড় গুণ হারে ওভারটাইম দেওয়া হয়।',
      'ওভারটাইমের জন্য ম্যানেজারের আগাম অনুমোদন লাগে।',
    ],
  ],
  [
    'festival-leave',
    'উৎসবের ছুটি',
    [
      'পূজা ও বড়দিনে কর্মীরা দুই দিনের অতিরিক্ত ছুটি নিতে পারেন।',
      'এই ছুটি বার্ষিক ছুটি থেকে কাটা হয় না।',
    ],
  ],
  [
    'provident-fund',
    'প্রভিডেন্ট ফান্ড',
    [
      'প্রভিডেন্ট ফান্ডে কর্মী মূল বেতনের দশ শতাংশ জমা দেন, আর কোম্পানিও সমপরিমাণ জমা দেয়।',
      'তিন বছর চাকরি পূর্ণ হলে কোম্পানির অংশ পুরোপুরি পাওয়া যায়।',
    ],
  ],
  [
    'fire-safety',
    'অগ্নি নিরাপত্তা',
    [
      'প্রতিটি তলায় দুটি অগ্নিনির্বাপক যন্ত্র রাখা আছে।',
      'আগুন লাগলে লিফট ব্যবহার না করে সিঁড়ি দিয়ে নামতে হবে।',
    ],
  ],
  [
    'laptop-repair',
    'ল্যাপটপ মেরামত',
    [
      'নষ্ট ল্যাপটপ আইটি ডেস্কে জমা দিলে দুই কর্মদিবসের মধ্যে বদলি ল্যাপটপ দেওয়া হয়।',
      'ব্যক্তিগত ফাইলের ব্যাকআপ আগে থেকে রাখতে হবে।',
    ],
  ],
  [
    'dress-code',
    'পোশাক',
    [
      'সোমবার থেকে বৃহস্পতিবার অফিসে ফরমাল পোশাক পরতে হয়।',
      'রবিবার ক্যাজুয়াল পোশাক পরা যায়।',
    ],
  ],
];

/** [page id, sentence index, question]: Bangla questions about English pages... */
const QUESTIONS = [
  ['en-laptop-returns', 0, 'শেষ কর্মদিবসে ল্যাপটপ কোথায় ফেরত দিতে হবে?'],
  [
    'en-meal-allowance',
    0,
    'রাত নয়টার পরে কাজ করলে রাতের খাবারের জন্য কত ভাতা পাওয়া যায়?',
  ],
  ['en-parking', 0, 'লন্ডন অফিসে পার্কিং পারমিটের খরচ মাসে কত?'],
  ['en-training-days', 0, 'বছরে কত দিন বেতনসহ প্রশিক্ষণ নেওয়া যায়?'],
  ['en-visitor-wifi', 0, 'অতিথিদের ওয়াই-ফাই ভাউচার কত ঘণ্টা চলে?'],
  [
    'en-expense-deadline',
    0,
    'কেনাকাটার কত দিনের মধ্যে খরচের দাবি জমা দিতে হয়?',
  ],
  ['en-sick-notes', 0, 'টানা কত দিন অসুস্থ থাকলে ডাক্তারের সনদ লাগে?'],
  ['en-mentoring', 0, 'নতুন ইঞ্জিনিয়াররা কত মাস একজন মেন্টর পান?'],
  ['en-cycle-scheme', 0, 'সাইকেল স্কিমে সর্বোচ্চ কত দামের সাইকেল কেনা যায়?'],
  ['en-desk-booking', 1, 'লন্ডন অফিসে ডেস্ক কত দিন আগে বুক করা যায়?'],
  ['en-referrals', 0, 'কাউকে রেফার করে চাকরি হলে কত বোনাস পাওয়া যায়?'],
  ['en-phone-allowance', 0, 'মাঠকর্মীরা মোবাইল বিলের জন্য মাসে কত পান?'],
  ['en-pension', 0, 'কোম্পানি পেনশনে বেতনের কত শতাংশ পর্যন্ত মিলিয়ে দেয়?'],
  ['en-holiday-carry-over', 0, 'অব্যবহৃত কত দিনের ছুটি পরের বছরে নেওয়া যায়?'],
  ['en-fire-drills', 0, 'অগ্নি মহড়া কখন হয়?'],
  ['en-screen-lock', 0, 'কতক্ষণ কিছু না করলে ল্যাপটপ নিজে থেকে লক হতে হবে?'],
  // ...English questions about Bangla pages...
  ['bn-eid-bonus', 0, 'How many Eid bonuses do employees get each year?'],
  ['bn-office-hours', 0, 'What days and hours is the Dhaka office open?'],
  [
    'bn-transport',
    0,
    'How much transport allowance do Dhaka staff receive per month?',
  ],
  ['bn-lunch', 0, 'Is lunch in the office canteen free?'],
  ['bn-maternity', 0, 'How long is maternity leave, and is it paid?'],
  [
    'bn-generator',
    0,
    'How quickly does the office generator start during a power cut?',
  ],
  [
    'bn-home-internet',
    0,
    'How much internet allowance do people working from home get?',
  ],
  ['bn-prayer-rooms', 0, 'Which floor has the prayer rooms?'],
  ['bn-medical', 0, 'How much of my medical costs can I claim back each year?'],
  ['bn-id-card', 0, 'What is the fee for replacing a lost ID card?'],
  ['bn-overtime', 0, 'At what rate is overtime paid?'],
  [
    'bn-festival-leave',
    0,
    'How many extra days off are given for Puja and Christmas?',
  ],
  [
    'bn-provident-fund',
    0,
    'What share of basic salary goes into the provident fund?',
  ],
  ['bn-fire-safety', 1, 'Should I use the lift if there is a fire?'],
  [
    'bn-laptop-repair',
    0,
    'How soon do I get a replacement when my laptop breaks?',
  ],
  ['bn-dress-code', 0, 'On which days is formal dress required?'],
  // ...and some in the same language as their page.
  ['en-holiday-carry-over', 1, 'When must carried-over holiday days be used?'],
  ['en-mentoring', 1, 'How often do mentors meet their mentee?'],
  ['en-parking', 1, 'Who issues parking permits for the London office?'],
  ['en-visitor-wifi', 1, 'Can visitor Wi-Fi vouchers be extended?'],
  ['bn-id-card', 1, 'নতুন পরিচয়পত্র তৈরি হতে কত দিন লাগে?'],
  ['bn-generator', 1, 'জেনারেটর টানা কত ঘণ্টা চলতে পারে?'],
  [
    'bn-maternity',
    1,
    'মাতৃত্বকালীন ছুটির কত আগে মানবসম্পদ বিভাগকে জানাতে হয়?',
  ],
  ['bn-medical', 1, 'চিকিৎসা খরচের দাবির সঙ্গে কী জমা দিতে হয়?'],
];

const strip = (sentence) => sentence.replace(/[.।]$/u, '');
const docs = [
  ...ENGLISH.map(([id, title, text]) => ({
    id: `en-${id}`,
    title,
    text: text.join(' '),
    meta: { language: 'en' },
  })),
  ...BANGLA.map(([id, title, text]) => ({
    id: `bn-${id}`,
    title,
    text: text.join(' '),
    meta: { language: 'bn' },
  })),
];
const sentencesOf = new Map([
  ...ENGLISH.map(([id, , text]) => [`en-${id}`, text]),
  ...BANGLA.map(([id, , text]) => [`bn-${id}`, text]),
]);
const questions = QUESTIONS.map(([docId, index, question]) => {
  const span = strip(sentencesOf.get(docId)[index]);
  return {
    topic: docId,
    question,
    goldDocId: docId,
    goldSpan: span,
    goldAnswer: span,
  };
});
for (const q of questions) {
  if (!docs.find((d) => d.id === q.goldDocId).text.includes(q.goldSpan)) {
    throw new Error(`gold span missing for ${q.question}`);
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
  console.error('bilingual-kb is out of date: re-run this script.');
  process.exit(1);
}
console.log(
  `bilingual-kb: ${docs.length} docs, ${questions.length} questions${CHECK ? ', up to date' : ''}`,
);
