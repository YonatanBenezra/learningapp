import { Injectable } from '@nestjs/common';
import { estimateTokens } from '../gateway/pricing';
import { compileRe2, re2Test } from './re2-lite';
import { parseSimpleYaml } from './yaml-lite';

export const MAX_ASSERTIONS = 40;
export const SUITE_TIMEOUT_MS = 5000;
export const ASSERTION_TIMEOUT_MS = 50;

export type FailIf = 'any' | 'all' | { countGte: number };

export type AssertionCheck =
  | 'matches'
  | 'not_matches'
  | 'contains_any'
  | 'contains_none'
  | 'json_schema'
  | 'length_between'
  | 'numeric_extract_compare'
  | 'token_count_lte'
  | 'language_is'
  | 'sentiment_not';

export type Assertion = {
  id: string;
  when: 'always' | 'matches' | 'not_matches';
  whenPattern?: string;
  check: AssertionCheck;
  pattern?: string;
  flavor?: 're2';
  values?: string[];
  min?: number;
  max?: number;
  op?: 'lte' | 'gte' | 'eq';
  value?: number;
  schema?: Record<string, unknown>;
  language?: string;
};

export type AssertionSuite = {
  version: number;
  assertions: Assertion[];
  failIf: FailIf;
};

export type AssertionEval = {
  flagged: boolean;
  failedIds: string[];
};

const CHECKS: AssertionCheck[] = [
  'matches',
  'not_matches',
  'contains_any',
  'contains_none',
  'json_schema',
  'length_between',
  'numeric_extract_compare',
  'token_count_lte',
  'language_is',
  'sentiment_not',
];

@Injectable()
export class AssertionDsl {
  parse(yaml: string): AssertionSuite {
    const doc = parseSimpleYaml(yaml);
    if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
      throw new Error('Assertion suite must be a mapping');
    }
    const record = doc as Record<string, unknown>;
    const assertionsRaw = record.assertions;
    const assertionsList = Array.isArray(assertionsRaw)
      ? assertionsRaw
      : assertionsRaw == null
        ? []
        : null;
    if (!assertionsList) {
      throw new Error('assertions must be a list');
    }
    if (assertionsList.length > MAX_ASSERTIONS) {
      throw new Error(`at most ${MAX_ASSERTIONS} assertions`);
    }
    const assertions = assertionsList.map((item, index) =>
      parseAssertion(item, index),
    );
    return {
      version: Number(record.version ?? 1),
      assertions,
      failIf: parseFailIf(record.verdict),
    };
  }

  evaluate(suite: AssertionSuite, output: string): AssertionEval {
    const started = Date.now();
    const failedIds: string[] = [];
    for (const assertion of suite.assertions) {
      if (Date.now() - started > SUITE_TIMEOUT_MS) {
        throw new Error('assertion suite exceeded 5s');
      }
      if (!whenApplies(assertion, output)) {
        continue;
      }
      const t0 = Date.now();
      const ok = runCheck(assertion, output);
      if (Date.now() - t0 > ASSERTION_TIMEOUT_MS) {
        throw new Error(`assertion ${assertion.id} exceeded 50ms`);
      }
      if (!ok) {
        failedIds.push(assertion.id);
      }
    }
    return { flagged: verdictFlags(suite.failIf, failedIds, suite.assertions.length), failedIds };
  }
}

function parseAssertion(item: unknown, index: number): Assertion {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    throw new Error(`assertion ${index} must be a mapping`);
  }
  const record = item as Record<string, unknown>;
  const id = typeof record.id === 'string' ? record.id : `a${index}`;
  const check = record.check;
  if (typeof check !== 'string' || !CHECKS.includes(check as AssertionCheck)) {
    throw new Error(`assertion ${id} has an unknown check`);
  }
  if (typeof record.pattern === 'string') {
    compileRe2(record.pattern);
  }
  const when =
    record.when === 'matches' || record.when === 'not_matches'
      ? record.when
      : 'always';
  return {
    id,
    when,
    whenPattern: typeof record.when_pattern === 'string' ? record.when_pattern : undefined,
    check: check as AssertionCheck,
    pattern: typeof record.pattern === 'string' ? record.pattern : undefined,
    flavor: record.flavor === 're2' ? 're2' : undefined,
    values: Array.isArray(record.values)
      ? record.values.filter((value): value is string => typeof value === 'string')
      : undefined,
    min: typeof record.min === 'number' ? record.min : undefined,
    max: typeof record.max === 'number' ? record.max : undefined,
    op:
      record.op === 'lte' || record.op === 'gte' || record.op === 'eq'
        ? record.op
        : undefined,
    value: typeof record.value === 'number' ? record.value : undefined,
    schema:
      record.schema && typeof record.schema === 'object' && !Array.isArray(record.schema)
        ? (record.schema as Record<string, unknown>)
        : undefined,
    language: typeof record.language === 'string' ? record.language : undefined,
  };
}

function parseFailIf(verdict: unknown): FailIf {
  const record =
    verdict && typeof verdict === 'object' && !Array.isArray(verdict)
      ? (verdict as Record<string, unknown>)
      : {};
  const failIf = record.fail_if;
  if (failIf === 'all') {
    return 'all';
  }
  if (typeof failIf === 'string' && failIf.startsWith('count_gte:')) {
    return { countGte: Number(failIf.slice('count_gte:'.length)) };
  }
  return 'any';
}

function whenApplies(assertion: Assertion, output: string): boolean {
  if (assertion.when === 'always') {
    return true;
  }
  const pattern = assertion.whenPattern ?? assertion.pattern;
  if (!pattern) {
    return true;
  }
  const hit = re2Test(pattern, output);
  return assertion.when === 'matches' ? hit : !hit;
}

function runCheck(assertion: Assertion, output: string): boolean {
  switch (assertion.check) {
    case 'matches':
      return Boolean(assertion.pattern && re2Test(assertion.pattern, output));
    case 'not_matches':
      return !assertion.pattern || !re2Test(assertion.pattern, output);
    case 'contains_any':
      return (assertion.values ?? []).some((value) => output.includes(value));
    case 'contains_none':
      return (assertion.values ?? []).every((value) => !output.includes(value));
    case 'length_between': {
      const min = assertion.min ?? 0;
      const max = assertion.max ?? Number.POSITIVE_INFINITY;
      return output.length >= min && output.length <= max;
    }
    case 'numeric_extract_compare': {
      if (!assertion.pattern) {
        return true;
      }
      const match = compileRe2(assertion.pattern).exec(output);
      if (!match?.[1]) {
        return true;
      }
      const extracted = Number(match[1]);
      const target = assertion.value ?? 0;
      if (assertion.op === 'gte') {
        return extracted >= target;
      }
      if (assertion.op === 'eq') {
        return extracted === target;
      }
      return extracted <= target;
    }
    case 'token_count_lte':
      return estimateTokens(output) <= (assertion.value ?? assertion.max ?? 0);
    case 'json_schema':
      return jsonLooksValid(output);
    case 'language_is':
      return assertion.language === 'he'
        ? /[\u0590-\u05FF]/.test(output)
        : !/[\u0590-\u05FF]/.test(output);
    case 'sentiment_not':
      return true;
    default:
      return true;
  }
}

function jsonLooksValid(output: string): boolean {
  try {
    JSON.parse(output);
    return true;
  } catch {
    return false;
  }
}

function verdictFlags(
  failIf: FailIf,
  failedIds: string[],
  total: number,
): boolean {
  if (failIf === 'all') {
    return total > 0 && failedIds.length === total;
  }
  if (typeof failIf === 'object') {
    return failedIds.length >= failIf.countGte;
  }
  return failedIds.length > 0;
}
