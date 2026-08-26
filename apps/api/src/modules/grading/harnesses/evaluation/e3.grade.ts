import { SliceSpecParser, evalWhere } from '../../dsl/slice-spec.parser';
import { adjustPValues, twoProportionZ } from '../../metrics/proportion';
import type { EvalItem, HarnessGradeResult } from './eval.types';
import { isEvalCanary } from './eval.types';

const parser = new SliceSpecParser();
const GOLD = {
  language: 'he',
  category: 'billing',
};

export function gradeE3(
  sliceSpecYaml: string,
  hidden: EvalItem[],
  publicItems: EvalItem[] = [],
): HarnessGradeResult {
  const spec = parser.parse(sliceSpecYaml);
  const usable = hidden.filter(
    (item) => !isEvalCanary(item) && item.meta && typeof item.v1Pass === 'boolean',
  );
  const goldIds = new Set(
    usable
      .filter(
        (item) =>
          item.meta?.language === GOLD.language &&
          item.meta?.category === GOLD.category,
      )
      .map((item) => item.id),
  );

  const tested: {
    name: string;
    n: number;
    p: number;
    diff: number;
    ids: Set<string>;
    underpowered: boolean;
  }[] = [];

  for (const slice of spec.slices) {
    const rows = usable.filter((item) =>
      evalWhere(slice.where, item.meta as Record<string, unknown>),
    );
    if (rows.length < spec.minSliceN) {
      tested.push({
        name: slice.name,
        n: rows.length,
        p: 1,
        diff: 0,
        ids: new Set(rows.map((row) => row.id)),
        underpowered: true,
      });
      continue;
    }
    const v1Pass = rows.filter((row) => row.v1Pass).length;
    const v2Pass = rows.filter((row) => row.v2Pass).length;
    const test = twoProportionZ(v1Pass, rows.length, v2Pass, rows.length);
    tested.push({
      name: slice.name,
      n: rows.length,
      p: test.p,
      diff: test.diff,
      ids: new Set(rows.map((row) => row.id)),
      underpowered: false,
    });
  }

  const powered = tested.filter((row) => !row.underpowered);
  const adjusted = adjustPValues(
    powered.map((row) => row.p),
    spec.correction,
    spec.alpha,
  );

  let goldFlagged = false;
  let falsePositives = 0;
  const flaggedNames: string[] = [];
  powered.forEach((row, index) => {
    const adj = adjusted[index];
    const regression = row.diff < 0 && Boolean(adj?.significant);
    if (!regression) {
      return;
    }
    flaggedNames.push(row.name);
    const overlap = jaccard(row.ids, goldIds);
    if (overlap >= 0.7) {
      goldFlagged = true;
    } else {
      falsePositives += 1;
    }
  });

  const goldPass = goldFlagged;
  const fpPass = falsePositives === 0;
  const passed = goldPass && fpPass && spec.slices.length > 0;
  const onlyTrue = spec.slices.every((slice) => slice.source.trim() === 'true');

  return {
    verdict: passed ? 'pass' : 'fail',
    metrics: {
      gold_slice_flagged: { value: goldFlagged ? 1 : 0 },
      false_positive_slices: { value: falsePositives },
    },
    gateResults: [
      {
        id: 'gold-slice',
        class: 'A',
        metric: 'gold_slice_flagged',
        op: 'eq',
        value: 1,
        actual: goldFlagged ? 1 : 0,
        passed: goldPass,
      },
      {
        id: 'false-positives',
        class: 'A',
        metric: 'false_positive_slices',
        op: 'eq',
        value: 0,
        actual: falsePositives,
        passed: fpPass,
      },
    ],
    failureClasses: passed ? [] : e3Failures(onlyTrue, goldFlagged, spec.slices.length),
    scorecard: {
      flagged: flaggedNames,
      underpowered: tested.filter((row) => row.underpowered).map((row) => row.name),
      correction: spec.correction,
      test: spec.test,
    },
    failingCases: [],
    trace: {
      simulator: 'evaluation',
      payload: sliceSpecYaml,
      k: 0,
      chunkCount: 0,
      tokensIn: 0,
      tokensOut: 0,
      costEurMicros: 0,
      queries: publicItems
        .filter((item) => !isEvalCanary(item))
        .slice(0, 5)
        .map((item) => ({
          source: 'public' as const,
          question: item.input ?? item.id,
          retrieved: [
            {
              chunkId: item.id,
              docId: item.id,
              score: 1,
              text: `${item.v1 ?? ''} / ${item.v2 ?? ''}`.slice(0, 400),
            },
          ],
        })),
    },
  };
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) {
    return 1;
  }
  let inter = 0;
  for (const id of a) {
    if (b.has(id)) {
      inter += 1;
    }
  }
  return inter / (a.size + b.size - inter);
}

function e3Failures(
  onlyTrue: boolean,
  goldFlagged: boolean,
  sliceCount: number,
): string[] {
  const classes: string[] = [];
  if (onlyTrue || sliceCount === 0) {
    classes.push('aggregate-only');
  }
  if (!goldFlagged && !onlyTrue) {
    classes.push('slice-too-coarse');
  }
  return classes.length > 0 ? classes : ['regression-detection'];
}
