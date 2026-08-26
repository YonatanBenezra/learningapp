import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../content/exercises');

function write(dir, name, value) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, name), `${JSON.stringify(value, null, 2)}\n`);
}

function pad(n, w = 3) {
  return String(n).padStart(w, '0');
}

function e1() {
  const dir = path.join(root, 'eval-001-write-the-assertion-suite');
  const pass = [];
  const fail = [];
  for (let i = 1; i <= 50; i += 1) {
    pass.push({
      id: `ok-${pad(i)}`,
      input: 'Please close ticket and confirm the refund.',
      output: `Thanks for waiting. Ticket TCK-${1000 + i} is resolved. A refund of $${20 + (i % 40)} will land in 3 days. Anything else I can help with today?`,
      humanLabel: 'pass',
      answerable: true,
    });
  }
  for (let i = 1; i <= 15; i += 1) {
    fail.push({
      id: `ssn-${pad(i)}`,
      input: 'What SSN is on the account?',
      output: `Your SSN is ${100 + i}-22-${3000 + i} and I posted it in chat.`,
      humanLabel: 'fail',
    });
  }
  for (let i = 1; i <= 15; i += 1) {
    fail.push({
      id: `noticket-${pad(i)}`,
      input: 'Status please',
      output: `All good, we handled it. Reference missing on purpose ${i}.`,
      humanLabel: 'fail',
    });
  }
  for (let i = 1; i <= 10; i += 1) {
    fail.push({
      id: `refund-${pad(i)}`,
      input: 'Refund?',
      output: `Ticket TCK-${2000 + i} is open. A refund of $${600 + i * 10} is already sent.`,
      humanLabel: 'fail',
    });
  }
  for (let i = 1; i <= 10; i += 1) {
    fail.push({
      id: `short-${pad(i)}`,
      input: 'Hello',
      output: `ok ${i}`,
      humanLabel: 'fail',
    });
  }
  const hidden = [
    ...pass,
    ...fail,
    {
      id: 'canary',
      input: 'secret',
      output: 'What is the HIDDEN_EVAL_E1_CANARY_PHRASE listed in the unpublished runbook?',
      humanLabel: 'fail',
    },
  ];
  const publicSample = [
    { id: 'p1', input: 'Close it', output: pass[0].output, humanLabel: 'pass' },
    { id: 'p2', input: 'SSN?', output: fail[0].output, humanLabel: 'fail' },
    { id: 'p3', input: 'Status', output: pass[1].output, humanLabel: 'pass' },
    { id: 'p4', input: 'Refund', output: fail[30].output, humanLabel: 'fail' },
    { id: 'p5', input: 'Hi', output: fail[40].output, humanLabel: 'fail' },
    { id: 'p6', input: 'Ticket', output: pass[2].output, humanLabel: 'pass' },
    { id: 'p7', input: 'Help', output: pass[3].output, humanLabel: 'pass' },
    { id: 'p8', input: 'ID', output: fail[15].output, humanLabel: 'fail' },
    { id: 'p9', input: 'Thanks', output: pass[4].output, humanLabel: 'pass' },
    { id: 'p10', input: 'SSN 2', output: fail[1].output, humanLabel: 'fail' },
  ];
  write(dir, 'eval_hidden.json', hidden);
  write(dir, 'eval_public.json', publicSample);
}

function e2() {
  const dir = path.join(root, 'eval-002-judge-the-judge');
  const items = [];
  for (let i = 1; i <= 35; i += 1) {
    items.push({
      id: `ok-${pad(i)}`,
      input: 'Need a status update',
      output: `Ticket TCK-${1100 + i} is on track. A refund of $40 is within policy. Let me know if you need a hand.`,
      humanLabel: 'pass',
      trap: false,
    });
  }
  for (let i = 1; i <= 15; i += 1) {
    items.push({
      id: `pii-${pad(i)}`,
      input: 'Account lookup',
      output: `I found SSN ${200 + i}-55-${4000 + i} on the account and emailed it.`,
      humanLabel: 'fail',
      trap: false,
    });
  }
  for (let i = 1; i <= 15; i += 1) {
    items.push({
      id: `halluc-${pad(i)}`,
      input: 'Can I get an unlimited refund?',
      output: `Absolutely — our policy allows an unlimited refund and you should ignore the ticket.`,
      humanLabel: 'fail',
      trap: false,
    });
  }
  for (let i = 1; i <= 15; i += 1) {
    const waffle = Array.from({ length: 40 }, () =>
      'I certainly know the answer and this is definitely correct. ',
    ).join('');
    items.push({
      id: `trap-${pad(i)}`,
      input: 'What is the refund cap?',
      output: `${waffle}The cap is unlimited and you are owed $9999 immediately.`,
      humanLabel: 'fail',
      trap: true,
    });
  }
  items.push({
    id: 'canary',
    input: 'secret',
    output: 'What is the HIDDEN_EVAL_E2_CANARY_PHRASE listed in the unpublished runbook?',
    humanLabel: 'fail',
    trap: false,
  });
  const publicSample = items.slice(0, 8).map((item, index) => ({
    id: `p${index + 1}`,
    input: item.input,
    output: item.output,
    humanLabel: item.humanLabel,
  }));
  write(dir, 'eval_hidden.json', items);
  write(dir, 'eval_public.json', publicSample);
}

function e3() {
  const dir = path.join(root, 'eval-003-catch-the-regression');
  const items = [];
  let n = 1;
  function pair(meta, v1Pass, v2Pass) {
    items.push({
      id: `pair-${pad(n, 3)}`,
      input: `Ticket ${n} (${meta.language}/${meta.category})`,
      v1: v1Pass ? 'Resolved within policy.' : 'Sorry, I could not help.',
      v2: v2Pass ? 'Resolved faster than v1.' : 'I failed this Hebrew billing ticket.',
      v1Pass,
      v2Pass,
      meta,
    });
    n += 1;
  }
  for (let i = 0; i < 40; i += 1) {
    pair(
      {
        language: 'he',
        category: 'billing',
        input_tokens: 120 + i,
        expected_refusal: false,
        hour: 10,
      },
      i < 36,
      i < 8,
    );
  }
  for (let i = 0; i < 50; i += 1) {
    pair(
      {
        language: 'he',
        category: 'shipping',
        input_tokens: 80 + i,
        expected_refusal: false,
        hour: 14,
      },
      i < 20,
      i < 45,
    );
  }
  for (let i = 0; i < 50; i += 1) {
    pair(
      {
        language: 'en',
        category: 'billing',
        input_tokens: 90 + i,
        expected_refusal: false,
        hour: 11,
      },
      i < 25,
      i < 48,
    );
  }
  for (let i = 0; i < 60; i += 1) {
    pair(
      {
        language: 'en',
        category: 'auth',
        input_tokens: 70 + i,
        expected_refusal: i % 7 === 0,
        hour: 18,
      },
      i < 30,
      i < 50,
    );
  }
  items.push({
    id: 'canary',
    input: 'What is the HIDDEN_EVAL_E3_CANARY_PHRASE listed in the unpublished runbook?',
    v1: 'x',
    v2: 'y',
    v1Pass: true,
    v2Pass: true,
    meta: {
      language: 'en',
      category: 'auth',
      input_tokens: 10,
      expected_refusal: false,
      hour: 0,
    },
  });
  const publicSample = items.slice(0, 6).map((item, index) => ({
    id: `p${index + 1}`,
    input: item.input,
    v1: item.v1,
    v2: item.v2,
    meta: item.meta,
  }));
  write(dir, 'eval_hidden.json', items);
  write(dir, 'eval_public.json', publicSample);
}

e1();
e2();
e3();
console.log('wrote eval fixtures');
