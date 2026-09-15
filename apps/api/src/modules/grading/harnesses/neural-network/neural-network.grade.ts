import { parseNeuralNetworkPayload } from './neural-network.payloads';
import {
  isNeuralNetworkCanary,
  type NeuralNetworkDiagnosis,
  type NeuralNetworkGradeResult,
  type NeuralNetworkHidden,
  type NeuralNetworkRun,
} from './neural-network.types';

export function parseNeuralNetworkHidden(raw: unknown): NeuralNetworkHidden {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Neural network hidden eval must be an object');
  }
  const record = raw as Record<string, unknown>;
  const targetRun =
    typeof record.targetRun === 'string'
      ? record.targetRun
      : typeof record.overfitRun === 'string'
        ? record.overfitRun
        : null;
  if (!targetRun) {
    throw new Error('Neural network hidden eval is missing targetRun');
  }
  if (typeof record.expectedDiagnosis !== 'string') {
    throw new Error('Neural network hidden eval is missing expectedDiagnosis');
  }
  if (!Array.isArray(record.runs)) {
    throw new Error('Neural network hidden eval is missing runs');
  }
  if (!Array.isArray(record.acceptedKnobs)) {
    throw new Error('Neural network hidden eval is missing acceptedKnobs');
  }
  return {
    targetRun,
    expectedDiagnosis: record.expectedDiagnosis as NeuralNetworkDiagnosis,
    acceptedKnobs: record.acceptedKnobs as NeuralNetworkHidden['acceptedKnobs'],
    runs: record.runs as NeuralNetworkRun[],
    canary: record.canary as NeuralNetworkHidden['canary'],
  };
}

export function gradeNeuralNetwork(
  payload: unknown,
  hiddenRaw: unknown,
  publicItems: { question: string }[] = [],
): NeuralNetworkGradeResult {
  const leaked = JSON.stringify(payload).includes('HIDDEN_EVAL');
  const parsed = parseNeuralNetworkPayload(payload);
  const hidden = parseNeuralNetworkHidden(hiddenRaw);
  const runs = hidden.runs.filter((run) => !isNeuralNetworkCanary(run));
  const started = Date.now();

  const runPass = parsed.overfitRun === hidden.targetRun;
  const diagnosisPass = parsed.diagnosis === hidden.expectedDiagnosis;
  const knobPass = hidden.acceptedKnobs.includes(parsed.nextKnob);
  const canaryPass = !leaked;
  const passed = runPass && diagnosisPass && knobPass && canaryPass;
  const durationMs = Math.max(1, Date.now() - started);

  const result: NeuralNetworkGradeResult = {
    verdict: passed ? 'pass' : 'fail',
    metrics: {
      target_run: { value: runPass ? 1 : 0 },
      diagnosis_ok: { value: diagnosisPass ? 1 : 0 },
      knob_ok: { value: knobPass ? 1 : 0 },
      no_canary: { value: canaryPass ? 1 : 0 },
    },
    gateResults: [
      gate('target-run', 'target_run', runPass ? 1 : 0, runPass),
      gate('diagnosis-ok', 'diagnosis_ok', diagnosisPass ? 1 : 0, diagnosisPass),
      gate('knob-ok', 'knob_ok', knobPass ? 1 : 0, knobPass),
      gate('no-canary', 'no_canary', canaryPass ? 1 : 0, canaryPass),
    ],
    failureClasses: passed
      ? []
      : [
          ...(runPass ? [] : ['wrong-run']),
          ...(diagnosisPass ? [] : ['wrong-diagnosis']),
          ...(knobPass ? [] : ['wrong-knob']),
          ...(canaryPass ? [] : ['canary-leak']),
        ],
    scorecard: {
      selectedRun: parsed.overfitRun,
      targetRun: hidden.targetRun,
      diagnosis: parsed.diagnosis,
      expectedDiagnosis: hidden.expectedDiagnosis,
      nextKnob: parsed.nextKnob,
      runs: runs.map(summarizeRun),
      wallClock: 'information',
      durationMs,
      ...(passed
        ? {}
        : {
            message: runPass
              ? diagnosisPass
                ? 'Pick a knob that matches the diagnosed failure mode.'
                : `Expected ${hidden.expectedDiagnosis} on the selected run.`
              : 'Re-read the train/val curves for the run that matches the brief.',
          }),
    },
    failingCases: leaked
      ? [{ question: 'canary', note: 'canary-leak' }]
      : passed
        ? []
        : [
            {
              question: parsed.overfitRun,
              note: runPass
                ? diagnosisPass
                  ? 'Knob does not fix the diagnosed issue.'
                  : `Call ${hidden.expectedDiagnosis}, not ${parsed.diagnosis}.`
                : `Target run is ${hidden.targetRun}.`,
            },
          ],
    trace: {
      simulator: 'neural_network',
      payload: parsed,
      sandbox: { durationMs, wallClock: 'information' },
      k: 0,
      chunkCount: 0,
      tokensIn: 0,
      tokensOut: 0,
      costEurMicros: 0,
      queries: [
        ...runs.map((run) => ({
          source: 'public' as const,
          question: run.config,
          retrieved: [
            {
              chunkId: run.id,
              docId: run.id,
              score: lastValAcc(run),
              text: curveSummary(run),
            },
          ],
        })),
        ...publicItems.slice(0, 2).map((item, index) => ({
          source: 'public' as const,
          question: item.question,
          retrieved: [
            {
              chunkId: `public-${index}`,
              docId: 'brief',
              score: 1,
              text: item.question.slice(0, 160),
            },
          ],
        })),
      ],
    },
  };

  if (JSON.stringify(result).includes('HIDDEN_EVAL')) {
    return {
      ...result,
      verdict: 'fail',
      failureClasses: [...new Set([...result.failureClasses, 'canary-leak'])],
      failingCases: [{ question: 'canary', note: 'canary-leak' }],
      metrics: { ...result.metrics, no_canary: { value: 0 } },
    };
  }
  return result;
}

function summarizeRun(run: NeuralNetworkRun) {
  const last = run.epochs[run.epochs.length - 1];
  const bestVal = run.epochs.reduce(
    (best, row) => (row.valAcc > best ? row.valAcc : best),
    0,
  );
  return {
    id: run.id,
    config: run.config,
    finalTrainAcc: last?.trainAcc ?? 0,
    finalValAcc: last?.valAcc ?? 0,
    bestValAcc: bestVal,
  };
}

function lastValAcc(run: NeuralNetworkRun): number {
  return run.epochs[run.epochs.length - 1]?.valAcc ?? 0;
}

function curveSummary(run: NeuralNetworkRun): string {
  const first = run.epochs[0];
  const last = run.epochs[run.epochs.length - 1];
  if (!first || !last) {
    return run.config;
  }
  return `train ${round4(first.trainAcc)}→${round4(last.trainAcc)} · val ${round4(first.valAcc)}→${round4(last.valAcc)}`;
}

function gate(
  id: string,
  metric: string,
  actual: number,
  passed: boolean,
): NeuralNetworkGradeResult['gateResults'][number] {
  return {
    id,
    class: 'A',
    metric,
    op: 'eq',
    value: 1,
    actual,
    passed,
  };
}

function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
