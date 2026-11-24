import { compileRe2 } from '../../dsl/re2-lite';
import { parseSimpleYaml } from '../../dsl/yaml-lite';
import {
  isNormalizeStep,
  normalize,
  type NormalizeStep,
} from '../../normaliser/text-views';

/**
 * The G3 tool-call policy: which tools the concierge may run, and with which
 * arguments. It sits between the model's tool call and the tool, so it holds
 * even when the system prompt does not.
 *
 *   version: 1
 *   default: deny            # tools not listed (allow when omitted)
 *   tools:
 *     book_room: allow
 *     send_email:
 *       recipients: ['*@hotel.test']      # every to/cc/bcc must match one
 *       normalize: [decode_hex]
 *       args_must_not_match: ['OVERRIDE']
 *       strip_args: [cc, bcc]     # removed before the call runs
 *       max_recipients: 1         # to + cc + bcc after stripping
 *
 * An empty policy runs every tool call, like an agent with no policy.
 */

export type ToolCall = { tool: string; args: Record<string, unknown> };

type ToolRule =
  | { kind: 'allow' }
  | { kind: 'deny' }
  | {
      kind: 'check';
      recipients: string[] | null;
      normalize: NormalizeStep[];
      mustNotMatch: string[];
      strip: string[];
      maxRecipients: number | null;
    };

export type ToolPolicy = {
  default: 'allow' | 'deny';
  tools: Record<string, ToolRule>;
};

export type ToolDecision = {
  /** The call as it runs (after strip_args), or as it was asked for if denied. */
  call: ToolCall;
  allowed: boolean;
  reason: string;
  /** Arguments that had a value and were removed by strip_args. */
  stripped: string[];
};

const OPEN: ToolPolicy = { default: 'allow', tools: {} };

export function parseToolPolicy(yaml: string | undefined): ToolPolicy {
  const trimmed = (yaml ?? '').trim();
  if (!trimmed) {
    return OPEN;
  }
  const doc = parseSimpleYaml(trimmed);
  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    throw new Error('tool policy must be a mapping');
  }
  const record = doc as Record<string, unknown>;
  const fallback = record.default ?? 'allow';
  if (fallback !== 'allow' && fallback !== 'deny') {
    throw new Error('tool policy default must be allow or deny');
  }
  const tools: Record<string, ToolRule> = {};
  const raw = record.tools ?? {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('tool policy tools must be a mapping of tool name to rule');
  }
  for (const [name, rule] of Object.entries(raw as Record<string, unknown>)) {
    tools[name] = parseRule(name, rule);
  }
  return { default: fallback, tools };
}

function parseRule(name: string, rule: unknown): ToolRule {
  if (rule === 'allow' || rule === true) {
    return { kind: 'allow' };
  }
  if (rule === 'deny' || rule === false) {
    return { kind: 'deny' };
  }
  if (!rule || typeof rule !== 'object' || Array.isArray(rule)) {
    throw new Error(`tool ${name}: use allow, deny or a mapping of checks`);
  }
  const record = rule as Record<string, unknown>;
  const list = (value: unknown, key: string): string[] => {
    if (value == null) {
      return [];
    }
    if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) {
      throw new Error(`tool ${name}: ${key} must be a list of strings`);
    }
    return value as string[];
  };
  const mustNotMatch = list(record.args_must_not_match, 'args_must_not_match');
  mustNotMatch.forEach((pattern) => compileRe2(pattern));
  const steps = list(record.normalize, 'normalize');
  const bad = steps.find((step) => !isNormalizeStep(step));
  if (bad) {
    throw new Error(`tool ${name}: unknown normalize step ${bad}`);
  }
  const max = record.max_recipients;
  if (
    max != null &&
    (typeof max !== 'number' || max < 1 || !Number.isInteger(max))
  ) {
    throw new Error(`tool ${name}: max_recipients must be a whole number ≥ 1`);
  }
  return {
    kind: 'check',
    recipients:
      record.recipients == null ? null : list(record.recipients, 'recipients'),
    normalize: steps as NormalizeStep[],
    mustNotMatch,
    strip: list(record.strip_args, 'strip_args'),
    maxRecipients: typeof max === 'number' ? max : null,
  };
}

function globMatch(pattern: string, value: string): boolean {
  const escaped = pattern
    .toLowerCase()
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`).test(value.toLowerCase());
}

function recipientsOf(args: Record<string, unknown>): string[] {
  const out: string[] = [];
  for (const key of ['to', 'cc', 'bcc']) {
    const value = args[key];
    if (typeof value === 'string') {
      out.push(...value.split(/[,;]\s*/).filter(Boolean));
    } else if (Array.isArray(value)) {
      out.push(...value.filter((v): v is string => typeof v === 'string'));
    }
  }
  return out;
}

export function decideToolCall(
  policy: ToolPolicy,
  call: ToolCall,
): ToolDecision {
  const rule: ToolRule = policy.tools[call.tool] ?? {
    kind: policy.default,
  };
  if (rule.kind === 'allow') {
    return { call, allowed: true, reason: 'allowed', stripped: [] };
  }
  if (rule.kind === 'deny') {
    return {
      call,
      allowed: false,
      reason: policy.tools[call.tool] ? 'tool denied' : 'tool not listed',
      stripped: [],
    };
  }
  const stripped = rule.strip.filter((key) => {
    const value = call.args[key];
    return (
      value != null &&
      value !== '' &&
      !(Array.isArray(value) && value.length === 0)
    );
  });
  if (rule.strip.length > 0) {
    const args = { ...call.args };
    rule.strip.forEach((key) => delete args[key]);
    call = { ...call, args };
  }
  const deny = (reason: string): ToolDecision => ({
    call,
    allowed: false,
    reason,
    stripped,
  });
  if (
    rule.maxRecipients !== null &&
    recipientsOf(call.args).length > rule.maxRecipients
  ) {
    return deny('too many recipients');
  }
  if (rule.recipients) {
    const outside = recipientsOf(call.args).find(
      (address) => !rule.recipients!.some((glob) => globMatch(glob, address)),
    );
    if (outside) {
      return deny('recipient not allowed');
    }
  }
  if (rule.mustNotMatch.length > 0) {
    const text = normalize(
      Object.values(call.args)
        .map((value) =>
          typeof value === 'string' ? value : JSON.stringify(value),
        )
        .join('\n'),
      rule.normalize,
    ).text;
    if (rule.mustNotMatch.some((pattern) => compileRe2(pattern).test(text))) {
      return deny('arguments matched a blocked pattern');
    }
  }
  return { call, allowed: true, reason: 'passed checks', stripped };
}
