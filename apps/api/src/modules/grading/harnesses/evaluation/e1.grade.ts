import { isHiddenCanary } from '../../../catalogue/exercises/exercises.constants';
import { AssertionDsl } from '../../dsl/assertion.dsl';
import { MetricsLibrary } from '../../metrics/metrics.library';
import type { EvalItem, HarnessGradeResult } from './eval.types';
import { isEvalCanary } from './eval.types';

const dsl = new AssertionDsl();
const metrics = new MetricsLibrary();
const F1 = 0.7;
const PRECISION = 0.65;
const RECALL = 0.6;

export function gradeE1(
  suiteYaml: string,
  hidden: EvalItem[],
  publicItems: EvalItem[] = [],
): HarnessGradeResult {
  const suite = dsl.parse(suiteYaml);
  const usable = hidden.filter((item) => !isEvalCanary(item) && item.output);
  const flagged = usable.map((item) => dsl.evaluate(suite, item.output as string).flagged);
  const rate = usable.length === 0 ? 0 : flagged.filter(Boolean).length / usable.length;
  if (rate > 0.9 || rate < 0.1) {
    return result({
      verdict: 'fail',
      precision: 0,
      recall: 0,
      f1: 0,
      tp: 0,
      fp: 0,
      fn: 0,
      rate,
      failureClasses: ['degenerate-suite'],
      failingCases: [],
      suiteYaml,
      publicItems,
      extra: { flaggedRate: rate },
    });
  }

  let tp = 0;
  let fp = 0;
  let fn = 0;
  const fps: HarnessGradeResult['failingCases'] = [];
  const fns: HarnessGradeResult['failingCases'] = [];
  usable.forEach((item, index) => {
    const humanFail = item.humanLabel === 'fail';
    const predFail = flagged[index] === true;
    if (predFail && humanFail) {
      tp += 1;
    } else if (predFail && !humanFail) {
      fp += 1;
      if (fps.length < 3) {
        fps.push({
          question: item.input,
          output: item.output,
          note: 'false_positive',
        });
      }
    } else if (!predFail && humanFail) {
      fn += 1;
      if (fns.length < 3) {
        fns.push({
          question: item.input,
          output: item.output,
          note: 'false_negative',
        });
      }
    }
  });
  const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
  const f1 = metrics.f1(precision, recall);
  const f1Pass = f1 >= F1;
  const pPass = precision >= PRECISION;
  const rPass = recall >= RECALL;
  const passed = f1Pass && pPass && rPass;
  return result({
    verdict: passed ? 'pass' : 'fail',
    precision,
    recall,
    f1,
    tp,
    fp,
    fn,
    rate,
    failureClasses: passed ? [] : e1Failures(suiteYaml, precision, recall),
    failingCases: [...fps, ...fns],
    suiteYaml,
    publicItems,
    extra: { flaggedRate: rate },
  });
}

function result(input: {
  verdict: 'pass' | 'fail';
  precision: number;
  recall: number;
  f1: number;
  tp: number;
  fp: number;
  fn: number;
  rate: number;
  failureClasses: string[];
  failingCases: HarnessGradeResult['failingCases'];
  suiteYaml: string;
  publicItems: EvalItem[];
  extra: Record<string, unknown>;
}): HarnessGradeResult {
  const f1Pass = input.f1 >= F1;
  const pPass = input.precision >= PRECISION;
  const rPass = input.recall >= RECALL;
  return {
    verdict: input.verdict,
    metrics: {
      f1: { value: input.f1 },
      precision: { value: input.precision },
      recall: { value: input.recall },
      flagged_rate: { value: input.rate },
    },
    gateResults: [
      {
        id: 'f1',
        class: 'A',
        metric: 'f1',
        op: 'gte',
        value: F1,
        actual: input.f1,
        passed: f1Pass && input.verdict === 'pass',
      },
      {
        id: 'precision',
        class: 'A',
        metric: 'precision',
        op: 'gte',
        value: PRECISION,
        actual: input.precision,
        passed: pPass && input.verdict === 'pass',
      },
      {
        id: 'recall',
        class: 'A',
        metric: 'recall',
        op: 'gte',
        value: RECALL,
        actual: input.recall,
        passed: rPass && input.verdict === 'pass',
      },
    ],
    failureClasses: input.failureClasses,
    scorecard: {
      f1: input.f1,
      precision: input.precision,
      recall: input.recall,
      tp: input.tp,
      fp: input.fp,
      fn: input.fn,
      ...input.extra,
    },
    failingCases: input.failingCases,
    trace: emptyTrace(input.suiteYaml, input.publicItems),
  };
}

function e1Failures(yaml: string, precision: number, recall: number): string[] {
  const classes: string[] = [];
  if (/\\.\*|\\.\\+|\\[\\s\\S\\]/.test(yaml) || yaml.includes('length_between') && yaml.includes('max: 100000')) {
    classes.push('assertion-too-broad');
  }
  if (recall < RECALL && !yaml.includes('TCK-')) {
    classes.push('missing-format-check');
  }
  if (precision < PRECISION) {
    classes.push('over-strict-regex');
  }
  return classes.length > 0 ? classes : ['eval-design'];
}

function emptyTrace(
  payload: unknown,
  publicItems: EvalItem[],
): HarnessGradeResult['trace'] {
  return {
    simulator: 'evaluation',
    payload,
    k: 0,
    chunkCount: 0,
    tokensIn: 0,
    tokensOut: 0,
    costEurMicros: 0,
    queries: publicItems
      .filter((item) => !isHiddenCanary(item.output ?? item.input ?? ''))
      .slice(0, 5)
      .map((item) => ({
        source: 'public' as const,
        question: item.input ?? item.id,
        retrieved: [
          {
            chunkId: item.id,
            docId: item.id,
            score: 1,
            text: (item.output ?? '').slice(0, 400),
          },
        ],
      })),
  };
}
