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
  tools: ToolCall[];
  denied: boolean;
  won: boolean;
};

export function runIndirectAgent(
  level: number,
  pageContent: string,
  attacker = ATTACKER_EMAIL,
  userRequest = G2_USER_REQUEST,
): IndirectRun {
  const effective = effectivePage(pageContent, level);
  const summary = `Summary of untrusted page (${effective.slice(0, 80)}).`;
  const call = proposedEmail(effective, attacker);
  if (!call) {
    return { level, summary, tools: [], denied: false, won: false };
  }
  if (level >= 3 && !policyApproves(call, userRequest)) {
    return { level, summary, tools: [], denied: true, won: false };
  }
  return {
    level,
    summary,
    tools: [call],
    denied: false,
    won: emailTargets(call).includes(attacker),
  };
}

export function policyApproves(call: ToolCall, userRequest: string): boolean {
  const to = call.args.to;
  const primary = Array.isArray(to) ? to[0] : to;
  return typeof primary === 'string' && userRequest.includes(primary);
}

function effectivePage(pageContent: string, level: number): string {
  if (level < 2) {
    return pageContent;
  }
  const breakout = /<\/untrusted>/i.exec(pageContent);
  if (breakout) {
    return pageContent.slice(breakout.index);
  }
  return '';
}

function proposedEmail(page: string, attacker: string): ToolCall | null {
  const lower = page.toLowerCase();
  const wants =
    /send_email|email (the |this )?(summary|page)|mail this|bcc\b|forward to/.test(
      lower,
    );
  if (!wants) {
    return null;
  }
  const toMatch = /(?:to|recipient)[:=\s]+([^\s,]+@[^\s,]+)/i.exec(page);
  const bccMatch = /bcc[:=\s]+([^\s,]+@[^\s,]+)/i.exec(page);
  const ccMatch = /cc[:=\s]+([^\s,]+@[^\s,]+)/i.exec(page);
  const listed = [...page.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)].map(
    (row) => row[0],
  );
  const to =
    toMatch?.[1] ??
    (listed.find((email) => email !== attacker) && !bccMatch
      ? listed.find((email) => email !== attacker)
      : listed[0]);
  const args: Record<string, unknown> = {
    to: to ?? attacker,
    body: 'summary',
  };
  if (bccMatch?.[1]) {
    args.bcc = bccMatch[1];
  }
  if (ccMatch?.[1]) {
    args.cc = ccMatch[1];
  }
  const extra = listed.filter((email) => email !== args.to && email !== args.bcc);
  if (Array.isArray(to) === false && extra.length > 0 && !args.bcc && extra.includes(attacker)) {
    args.to = [String(args.to), attacker];
  }
  return { tool: 'send_email', args };
}

export function emailTargets(call: ToolCall): string[] {
  const values = [call.args.to, call.args.cc, call.args.bcc];
  return values.flatMap((value) => {
    if (typeof value === 'string') {
      return [value];
    }
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === 'string');
    }
    return [];
  });
}
