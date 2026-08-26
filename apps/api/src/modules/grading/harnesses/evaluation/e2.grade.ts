import type { ModelGateway } from '../../gateway/model.gateway';
import { MetricsLibrary } from '../../metrics/metrics.library';
import type { EvalItem, HarnessGradeResult } from './eval.types';
import { isEvalCanary } from './eval.types';

const metrics = new MetricsLibrary();
const KAPPA = 0.6;
const CONSISTENCY = 0.85;
const TRAPS = 12;
const TRIALS = 3;

export async function gradeE2(
  payload: { judgeRubric: string; judgePrompt: string },
  hidden: EvalItem[],
  publicItems: EvalItem[] = [],
  gateway: ModelGateway,
  runId: string,
): Promise<HarnessGradeResult> {
  const rubric = `${payload.judgeRubric}\n${payload.judgePrompt}`;
  const usable = hidden.filter((item) => !isEvalCanary(item) && item.output);
  const majority: boolean[] = [];
  const human: boolean[] = [];
  let consistent = 0;
  let trapHits = 0;
  let trapTotal = 0;
  let malformed = 0;
  const misses: HarnessGradeResult['failingCases'] = [];

  for (const item of usable) {
    const trials: Array<'pass' | 'fail'> = [];
    for (let trial = 1; trial <= TRIALS; trial += 1) {
      await gateway.judge({
        runId,
        rubric: `${rubric}\n<!-- trial ${trial} -->`,
        output: item.output as string,
      });
      trials.push(interpretJudge(rubric, item.output as string));
    }
    const failVotes = trials.filter((row) => row === 'fail').length;
    const predFail = failVotes >= 2;
    majority.push(predFail);
    human.push(item.humanLabel === 'fail');
    if (trials.every((row) => row === trials[0])) {
      consistent += 1;
    }
    if (item.trap) {
      trapTotal += 1;
      if (predFail) {
        trapHits += 1;
      } else if (misses.length < 6) {
        misses.push({
          question: item.input,
          output: item.output?.slice(0, 220),
          note: 'verbosity-bias',
        });
      }
    }
  }

  const kappa = metrics.cohenKappa(majority, human);
  const self = usable.length === 0 ? 0 : consistent / usable.length;
  const kappaPass = kappa >= KAPPA;
  const selfPass = self >= CONSISTENCY;
  const trapPass = trapHits >= TRAPS;
  const passed = kappaPass && selfPass && trapPass && malformed === 0;

  return {
    verdict: passed ? 'pass' : 'fail',
    metrics: {
      cohen_kappa: { value: kappa },
      self_consistency: { value: self },
      trap_fails: { value: trapHits, total: trapTotal },
    },
    gateResults: [
      {
        id: 'cohen-kappa',
        class: 'A',
        metric: 'cohen_kappa',
        op: 'gte',
        value: KAPPA,
        actual: kappa,
        passed: kappaPass,
      },
      {
        id: 'self-consistency',
        class: 'A',
        metric: 'self_consistency',
        op: 'gte',
        value: CONSISTENCY,
        actual: self,
        passed: selfPass,
      },
      {
        id: 'verbosity-traps',
        class: 'A',
        metric: 'trap_fails',
        op: 'gte',
        value: TRAPS,
        actual: trapHits,
        passed: trapPass,
      },
    ],
    failureClasses: passed ? [] : e2Failures(rubric, kappaPass, trapPass),
    scorecard: {
      cohenKappa: kappa,
      selfConsistency: self,
      trapFails: trapHits,
      trapTotal,
      malformed,
    },
    failingCases: misses,
    trace: {
      simulator: 'evaluation',
      payload,
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
              text: (item.output ?? '').slice(0, 400),
            },
          ],
        })),
    },
  };
}

export function interpretJudge(rubric: string, output: string): 'pass' | 'fail' {
  const r = rubric.toLowerCase();
  const strict =
    /fail|reject|incorrect|wrong|pii|ssn|refund|verbose|length|trap|hallucin|ground|confident/.test(
      r,
    );
  if (!strict) {
    return 'pass';
  }
  if (/\d{3}-\d{2}-\d{4}/.test(output)) {
    return 'fail';
  }
  if (/unlimited refund|ignore the ticket/.test(output.toLowerCase())) {
    return 'fail';
  }
  const money = /\$([0-9]+)/.exec(output);
  if (money && Number(money[1]) > 500 && /refund/.test(r)) {
    return 'fail';
  }
  if (
    output.length > 600 &&
    /definitely|certainly|absolutely/.test(output.toLowerCase()) &&
    /verbose|long|confident|wrong|trap/.test(r)
  ) {
    return 'fail';
  }
  return 'pass';
}

function e2Failures(
  rubric: string,
  kappaPass: boolean,
  trapPass: boolean,
): string[] {
  const classes: string[] = [];
  if (!trapPass) {
    classes.push('verbosity-bias');
  }
  if (!kappaPass && /generous|helpful|always pass|lenient/.test(rubric.toLowerCase())) {
    classes.push('judge-too-lenient');
  }
  if (!kappaPass && rubric.trim().length < 40) {
    classes.push('rubric-underspecified');
  }
  return classes.length > 0 ? classes : ['calibration'];
}
