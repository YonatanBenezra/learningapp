import { Injectable } from '@nestjs/common';
import { parseSimpleYaml } from './yaml-lite';

export type SliceWhere =
  | { type: 'cmp'; path: string; op: CmpOp; value: string | number | boolean }
  | { type: 'and'; left: SliceWhere; right: SliceWhere }
  | { type: 'or'; left: SliceWhere; right: SliceWhere }
  | { type: 'literal'; value: boolean };

export type CmpOp = '==' | '!=' | '>' | '<' | '>=' | '<=';

export type ParsedSlice = {
  name: string;
  where: SliceWhere;
  source: string;
};

export type SliceSpec = {
  version: number;
  slices: ParsedSlice[];
  metric: 'pass_rate';
  test: 'two_proportion_z' | 'bootstrap_diff';
  alpha: number;
  correction: 'bonferroni' | 'benjamini_hochberg';
  minSliceN: number;
};

@Injectable()
export class SliceSpecParser {
  parse(yaml: string): SliceSpec {
    const doc = parseSimpleYaml(yaml);
    if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
      throw new Error('Slice spec must be a mapping');
    }
    const record = doc as Record<string, unknown>;
    const correction = record.correction;
    if (correction !== 'bonferroni' && correction !== 'benjamini_hochberg') {
      throw new Error('correction must be bonferroni or benjamini_hochberg');
    }
    const slicesRaw = record.slices;
    if (!Array.isArray(slicesRaw) || slicesRaw.length === 0) {
      throw new Error('slices must be a non-empty list');
    }
    const slices = slicesRaw.map((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        throw new Error(`slice ${index} must be a mapping`);
      }
      const row = item as Record<string, unknown>;
      const name = typeof row.name === 'string' ? row.name : `slice-${index}`;
      const where = typeof row.where === 'string' ? row.where : '';
      if (!where) {
        throw new Error(`slice ${name} is missing where`);
      }
      return { name, where: parseWhere(where), source: where };
    });
    const test = record.test === 'bootstrap_diff' ? 'bootstrap_diff' : 'two_proportion_z';
    return {
      version: Number(record.version ?? 1),
      slices,
      metric: 'pass_rate',
      test,
      alpha: typeof record.alpha === 'number' ? record.alpha : 0.05,
      correction,
      minSliceN: typeof record.min_slice_n === 'number' ? record.min_slice_n : 20,
    };
  }
}

export function evalWhere(
  expr: SliceWhere,
  meta: Record<string, unknown>,
): boolean {
  if (expr.type === 'literal') {
    return expr.value;
  }
  if (expr.type === 'and') {
    return evalWhere(expr.left, meta) && evalWhere(expr.right, meta);
  }
  if (expr.type === 'or') {
    return evalWhere(expr.left, meta) || evalWhere(expr.right, meta);
  }
  const left = lookup(meta, expr.path);
  return compare(left, expr.op, expr.value);
}

export function parseWhere(input: string): SliceWhere {
  const tokens = tokenizeWhere(input);
  let i = 0;

  function peek(): string | undefined {
    return tokens[i];
  }
  function next(): string {
    const token = tokens[i];
    if (token === undefined) {
      throw new Error('unexpected end of where expression');
    }
    i += 1;
    return token;
  }

  function parseOr(): SliceWhere {
    let left = parseAnd();
    while (peek() === '||') {
      next();
      left = { type: 'or', left, right: parseAnd() };
    }
    return left;
  }

  function parseAnd(): SliceWhere {
    let left = parseCmp();
    while (peek() === '&&') {
      next();
      left = { type: 'and', left, right: parseCmp() };
    }
    return left;
  }

  function parseCmp(): SliceWhere {
    if (peek() === '(') {
      next();
      const inner = parseOr();
      if (next() !== ')') {
        throw new Error('expected )');
      }
      return inner;
    }
    if (peek() === 'true' || peek() === 'false') {
      return { type: 'literal', value: next() === 'true' };
    }
    const path = next();
    if (!path.startsWith('meta.')) {
      throw new Error(`where path must start with meta.: ${path}`);
    }
    if (path.includes('(') || path.split('.').length !== 2) {
      throw new Error(`illegal where path: ${path}`);
    }
    const op = next() as CmpOp;
    if (!['==', '!=', '>', '<', '>=', '<='].includes(op)) {
      throw new Error(`illegal operator: ${op}`);
    }
    const raw = next();
    return { type: 'cmp', path: path.slice('meta.'.length), op, value: parseValue(raw) };
  }

  const expr = parseOr();
  if (i !== tokens.length) {
    throw new Error(`unexpected token ${peek()}`);
  }
  return expr;
}

function tokenizeWhere(input: string): string[] {
  if (/\bfunction\b|\b=>\b|\beval\b/.test(input)) {
    throw new Error('function calls are not allowed in where');
  }
  const tokens: string[] = [];
  const re =
    /\s*(\|\||&&|==|!=|>=|<=|>|<|\(|\)|'[^']*'|"[^"]*"|-?\d+(?:\.\d+)?|[A-Za-z_][\w.]*)/g;
  let match: RegExpExecArray | null;
  let consumed = 0;
  while ((match = re.exec(input))) {
    if (match.index !== consumed) {
      const gap = input.slice(consumed, match.index).trim();
      if (gap) {
        throw new Error(`illegal token in where: ${gap}`);
      }
    }
    tokens.push(match[1] as string);
    consumed = match.index + match[0].length;
  }
  if (input.slice(consumed).trim()) {
    throw new Error('illegal token in where');
  }
  return tokens;
}

function parseValue(raw: string): string | number | boolean {
  if (raw === 'true') {
    return true;
  }
  if (raw === 'false') {
    return false;
  }
  if (
    (raw.startsWith("'") && raw.endsWith("'")) ||
    (raw.startsWith('"') && raw.endsWith('"'))
  ) {
    return raw.slice(1, -1);
  }
  if (/^-?\d+(\.\d+)?$/.test(raw)) {
    return Number(raw);
  }
  throw new Error(`illegal value: ${raw}`);
}

function lookup(meta: Record<string, unknown>, field: string): unknown {
  return meta[field];
}

function compare(left: unknown, op: CmpOp, right: string | number | boolean): boolean {
  if (op === '==') {
    return left === right;
  }
  if (op === '!=') {
    return left !== right;
  }
  const l = Number(left);
  const r = Number(right);
  if (!Number.isFinite(l) || !Number.isFinite(r)) {
    return false;
  }
  if (op === '>') {
    return l > r;
  }
  if (op === '<') {
    return l < r;
  }
  if (op === '>=') {
    return l >= r;
  }
  return l <= r;
}
