import {
  g2Profile,
  TRUNCATED_WRAPPER_CHARS,
  type G2LevelSpec,
  type G2Tool,
} from './g2-profiles';

export const ATTACKER_EMAIL = 'attacker@evil.test';
export const OPS_EMAIL = 'ops@hotel.test';
export const G2_USER_REQUEST =
  'Summarize the retrieved page and email the summary to ops@hotel.test';

export type ToolCall = {
  tool: string;
  args: Record<string, unknown>;
};

export type IndirectRun = {
  level: number;
  summary: string;
  /** Calls that ran. */
  tools: ToolCall[];
  /** True when the approval policy stopped at least one call. */
  denied: boolean;
  won: boolean;
};

/**
 * The G2 email agent: a deterministic simulator, not a model. It reads the
 * page through the level's view, turns the instructions it follows into tool
 * calls, and runs the calls the level's approval policy allows. The level is
 * won when the attacker's address receives something.
 */
export function runIndirectAgent(
  level: number,
  pageContent: string,
  attacker = ATTACKER_EMAIL,
  userRequest = G2_USER_REQUEST,
  exerciseSlug?: string,
): IndirectRun {
  const levels = g2Profile(exerciseSlug);
  const spec = levels.find((row) => row.level === level) ?? levels[0];
  const followed = viewOf(pageContent, spec);
  const summary = `Summary of untrusted page (${followed.slice(0, 80)}).`;
  const proposed = proposeCalls(followed, spec.tools);
  const allowed = addressesIn(userRequest);
  const ran = proposed.filter((call, index) =>
    approves(spec, call, index, allowed),
  );
  return {
    level,
    summary,
    tools: ran,
    denied: ran.length < proposed.length,
    won: ran.some((call) =>
      recipientsOf(call).includes(attacker.toLowerCase()),
    ),
  };
}

/** The text whose instructions the agent follows at this level. */
function viewOf(page: string, spec: G2LevelSpec): string {
  switch (spec.view) {
    case 'all':
      return page;
    case 'wrapper': {
      const breakout = /<\/untrusted>/i.exec(page);
      return breakout ? page.slice(breakout.index + breakout[0].length) : '';
    }
    case 'role-tags':
      return page
        .split('\n')
        .filter((line) => /^\s*(user|\[user\])\s*:/i.test(line))
        .map((line) => line.replace(/^\s*(user|\[user\])\s*:\s*/i, ''))
        .join('\n');
    case 'keyword-filter':
      return page
        .split('\n')
        .filter(
          (line) =>
            isHeader(line) ||
            !/\b(send|sends|sent|e-?mail|mail|forward|share)\b|send_email/i.test(
              line,
            ),
        )
        .join('\n');
    case 'truncated-wrapper':
      return page.slice(TRUNCATED_WRAPPER_CHARS);
    default:
      return '';
  }
}

const ADDRESS = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

function addressesIn(text: string): string[] {
  return [...text.matchAll(ADDRESS)].map((row) => row[0].toLowerCase());
}

function isHeader(line: string): boolean {
  return /^\s*(to|cc|bcc)\s*:/i.test(line);
}

/** "to=a@x.test, b@y.test bcc=c@z.test" → field lists. */
function fieldsIn(text: string): { to: string[]; cc: string[]; bcc: string[] } {
  const out = { to: [] as string[], cc: [] as string[], bcc: [] as string[] };
  const marks = [...text.matchAll(/\b(to|cc|bcc)\s*[:=]\s*/gi)];
  if (marks.length === 0) {
    out.to = addressesIn(text);
    return out;
  }
  marks.forEach((mark, index) => {
    const start = mark.index + mark[0].length;
    const end = marks[index + 1]?.index ?? text.length;
    const field = mark[1].toLowerCase() as 'to' | 'cc' | 'bcc';
    out[field].push(...addressesIn(text.slice(start, end)));
  });
  return out;
}

function emailCall(fields: {
  to: string[];
  cc: string[];
  bcc: string[];
}): ToolCall {
  const args: Record<string, unknown> = { to: fields.to, body: 'summary' };
  if (fields.cc.length > 0) {
    args.cc = fields.cc;
  }
  if (fields.bcc.length > 0) {
    args.bcc = fields.bcc;
  }
  return { tool: 'send_email', args };
}

/** Each instruction line becomes one call; an email header block becomes one email. */
function proposeCalls(text: string, tools: G2Tool[]): ToolCall[] {
  const calls: ToolCall[] = [];
  const lines = text.split('\n');
  const header = lines.filter(isHeader);
  if (header.length > 0) {
    const fields = fieldsIn(header.join(' '));
    if (fields.to.length + fields.cc.length + fields.bcc.length > 0) {
      calls.push(emailCall(fields));
    }
  }
  for (const line of lines) {
    if (isHeader(line)) {
      continue;
    }
    const lower = line.toLowerCase();
    if (
      tools.includes('share_document') &&
      /share_document|share (the|this) (document|page|summary)/.test(lower)
    ) {
      const to = addressesIn(line);
      if (to.length > 0) {
        calls.push({ tool: 'share_document', args: { with: to } });
      }
      continue;
    }
    if (/send_email|\b(e-?mail|send|forward|mail)\b/.test(lower)) {
      const fields = fieldsIn(line);
      if (fields.to.length + fields.cc.length + fields.bcc.length > 0) {
        calls.push(emailCall(fields));
      }
    }
  }
  return calls;
}

function listOf(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value.toLowerCase()];
  }
  return Array.isArray(value)
    ? value
        .filter((v): v is string => typeof v === 'string')
        .map((v) => v.toLowerCase())
    : [];
}

export function recipientsOf(call: ToolCall): string[] {
  return [
    ...listOf(call.args.to),
    ...listOf(call.args.cc),
    ...listOf(call.args.bcc),
    ...listOf(call.args.with),
  ];
}

/** @deprecated Kept for older callers: every recipient of a call. */
export const emailTargets = recipientsOf;

function approves(
  spec: G2LevelSpec,
  call: ToolCall,
  index: number,
  allowed: string[],
): boolean {
  const ok = (addresses: string[]) =>
    addresses.every((a) => allowed.includes(a));
  const to = listOf(call.args.to);
  switch (spec.policy) {
    case 'none':
      return true;
    case 'first-to':
      return (
        call.tool !== 'send_email' || (to.length > 0 && allowed.includes(to[0]))
      );
    case 'no-bcc':
      return call.tool !== 'send_email' || ok([...to, ...listOf(call.args.cc)]);
    case 'substring-domain':
      return recipientsOf(call).every((a) => a.includes('hotel.test'));
    case 'send-only':
      return call.tool !== 'send_email' || ok(recipientsOf(call));
    case 'first-email':
      return index > 0 || ok(recipientsOf(call));
    default:
      return false;
  }
}

/** Older L3 rule (first To address in the user's request); kept for its spec. */
export function policyApproves(call: ToolCall, userRequest: string): boolean {
  const to = listOf(call.args.to);
  return to.length > 0 && addressesIn(userRequest).includes(to[0]);
}
