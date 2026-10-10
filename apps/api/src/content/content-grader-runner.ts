import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ModelGateway } from '../modules/grading/gateway/model.gateway';
import { gradeE1 } from '../modules/grading/harnesses/evaluation/e1.grade';
import { gradeE2 } from '../modules/grading/harnesses/evaluation/e2.grade';
import { gradeE3 } from '../modules/grading/harnesses/evaluation/e3.grade';
import type { EvalItem } from '../modules/grading/harnesses/evaluation/eval.types';
import { gradeG1 } from '../modules/grading/harnesses/guardrails/g1.grade';
import { gradeG2 } from '../modules/grading/harnesses/guardrails/g2.grade';
import { gradeG3 } from '../modules/grading/harnesses/guardrails/g3.grade';
import { gradeP1 } from '../modules/grading/harnesses/prompt-engineering/p1.grade';
import type { PeItem } from '../modules/grading/harnesses/prompt-engineering/pe.types';
import { gradeAgent } from '../modules/grading/harnesses/agent/a1.grade';
import { agentGradeOptions } from '../modules/grading/harnesses/agent/agent.options';
import { parseAgentPayload } from '../modules/grading/harnesses/agent/agent.payloads';
import type { AgentItem } from '../modules/grading/harnesses/agent/agent.types';
import { gradeB1 } from '../modules/grading/harnesses/benchmark/b1.grade';
import { gradeB2 } from '../modules/grading/harnesses/benchmark/b2.grade';
import { gradeB3 } from '../modules/grading/harnesses/benchmark/b3.grade';
import { gradeNeuralNetwork } from '../modules/grading/harnesses/neural-network/neural-network.grade';
import { gradeF1 } from '../modules/grading/harnesses/fine-tuning/f1.grade';
import { gradeF2 } from '../modules/grading/harnesses/fine-tuning/f2.grade';
import { gradeF3 } from '../modules/grading/harnesses/fine-tuning/f3.grade';
import { gradeF4 } from '../modules/grading/harnesses/fine-tuning/f4.grade';
import { gradeF5 } from '../modules/grading/harnesses/fine-tuning/f5.grade';
import type { CorpusDoc } from '../modules/grading/harnesses/rag/chunking';
import {
  parseR1Payload,
  parseR2Payload,
  parseR3Payload,
  parseR4Payload,
} from '../modules/grading/harnesses/rag/rag.payloads';
import type { HiddenItem } from '../modules/grading/harnesses/rag/rag.types';
import { gradeR1 } from '../modules/grading/harnesses/rag/r1.grade';
import { gradeR2 } from '../modules/grading/harnesses/rag/r2.grade';
import { gradeR3 } from '../modules/grading/harnesses/rag/r3.grade';
import { gradeR4 } from '../modules/grading/harnesses/rag/r4.grade';
import { gradeSandboxRetriever } from '../modules/grading/harnesses/sandbox/sandbox.grade';
import { parseSandboxPayload } from '../modules/grading/harnesses/sandbox/sandbox.payloads';
import { runLocalPython } from '../modules/sandbox/local-python';
import type { ExerciseContentBundle } from './content-loader';

export type GraderRunResult = {
  verdict: 'pass' | 'fail' | 'inconclusive';
};

export async function runContentGrader(
  bundle: ExerciseContentBundle,
  payload: Record<string, unknown>,
): Promise<GraderRunResult> {
  const hiddenRaw = JSON.parse(
    await readFile(path.join(bundle.dir, 'eval_hidden.json'), 'utf8'),
  ) as unknown;
  const publicRaw = JSON.parse(
    await readFile(path.join(bundle.dir, 'eval_public.json'), 'utf8'),
  ) as unknown;

  switch (bundle.meta.graderArchetype) {
    case 'rag-r1': {
      const docs = await loadCorpus(bundle.dir, bundle.meta);
      return gradeR1(
        parseR1Payload(payload),
        docs,
        hiddenRaw as HiddenItem[],
        publicQuestions(publicRaw),
      );
    }
    case 'rag-r2': {
      const docs = await loadCorpus(bundle.dir, bundle.meta);
      return gradeR2(
        parseR2Payload(payload),
        docs,
        hiddenRaw as HiddenItem[],
        publicQuestions(publicRaw),
      );
    }
    case 'rag-r3': {
      const docs = await loadCorpus(bundle.dir, bundle.meta);
      return gradeR3(
        parseR3Payload(payload),
        docs,
        hiddenRaw as HiddenItem[],
        publicQuestions(publicRaw),
        contentPipelineGateway(),
        contentRunId(bundle),
      );
    }
    case 'rag-r4': {
      const docs = await loadCorpus(bundle.dir, bundle.meta);
      return gradeR4(
        parseR4Payload(payload),
        docs,
        hiddenRaw as HiddenItem[],
        publicQuestions(publicRaw),
        undefined,
        contentRunId(bundle),
      );
    }
    case 'rag-sandbox': {
      const docs = await loadCorpus(bundle.dir, bundle.meta);
      return gradeSandboxRetriever(
        parseSandboxPayload(payload),
        docs,
        hiddenRaw as HiddenItem[],
        publicQuestions(publicRaw),
        runLocalPython,
      );
    }
    case 'pe-p1':
      return gradeP1(
        {
          systemPrompt: payloadText(payload, 'systemPrompt'),
          fewShotBlock: payloadText(payload, 'fewShotBlock'),
        },
        hiddenRaw as PeItem[],
        publicQuestions(publicRaw),
      );
    case 'agent-a1':
    case 'agent-a2':
    case 'agent-a3':
    case 'agent-a4':
      return gradeAgent(
        parseAgentPayload(payload),
        hiddenRaw as AgentItem[],
        publicQuestions(publicRaw),
        runLocalPython,
        undefined,
        agentGradeOptions(bundle.meta.slug),
      );
    case 'bench-b1':
      return gradeB1(payload, hiddenRaw, publicQuestions(publicRaw));
    case 'bench-b2':
      return gradeB2(payload, hiddenRaw, publicQuestions(publicRaw));
    case 'bench-b3':
      return gradeB3(payload, hiddenRaw, publicQuestions(publicRaw));
    case 'nn-n1':
      return gradeNeuralNetwork(payload, hiddenRaw, publicQuestions(publicRaw));
    case 'ft-f1':
      return gradeF1(payload, hiddenRaw, publicQuestions(publicRaw));
    case 'ft-f2':
      return gradeF2(payload, hiddenRaw, publicQuestions(publicRaw));
    case 'ft-f3':
      return gradeF3(payload, hiddenRaw, publicQuestions(publicRaw));
    case 'ft-f4':
      return gradeF4(payload, hiddenRaw, publicQuestions(publicRaw));
    case 'ft-f5':
      return gradeF5(payload, hiddenRaw, publicQuestions(publicRaw));
    case 'eval-e1':
      return gradeE1(
        payloadText(payload, 'suiteYaml'),
        hiddenRaw as EvalItem[],
      );
    case 'eval-e2':
      return gradeE2(
        {
          judgeRubric: payloadText(payload, 'judgeRubric'),
          judgePrompt: payloadText(payload, 'judgePrompt'),
        },
        hiddenRaw as EvalItem[],
        publicRaw as EvalItem[],
        contentPipelineGateway(),
        contentRunId(bundle),
      );
    case 'eval-e3':
      return gradeE3(
        payloadText(payload, 'sliceSpecYaml'),
        hiddenRaw as EvalItem[],
        publicRaw as EvalItem[],
      );
    case 'guard-g1':
      return gradeG1(
        payloadText(payload, 'attackPrompt'),
        hiddenRaw,
        Array.isArray(publicRaw) ? publicRaw : [],
        undefined,
        contentRunId(bundle),
        bundle.meta.slug,
      );
    case 'guard-g2':
      return gradeG2(
        payloadText(payload, 'pageContent'),
        hiddenRaw,
        Array.isArray(publicRaw) ? publicRaw : [],
        undefined,
        contentRunId(bundle),
        bundle.meta.slug,
      );
    case 'guard-g3':
      return gradeG3(
        {
          systemPrompt: payloadText(payload, 'systemPrompt'),
          inputFilterYaml: payloadText(payload, 'inputFilterYaml'),
          outputFilterYaml: payloadText(payload, 'outputFilterYaml'),
        },
        hiddenRaw,
        Array.isArray(publicRaw) ? publicRaw : [],
      );
    default: {
      const archetype: string = bundle.meta.graderArchetype;
      throw new Error(`Unsupported grader archetype: ${archetype}`);
    }
  }
}

async function loadCorpus(
  dir: string,
  meta: { corpusFile?: string },
): Promise<CorpusDoc[]> {
  const corpusPath =
    meta.corpusFile === 'shared'
      ? path.join(process.cwd(), 'content/corpora/internal-policy.json')
      : path.join(dir, 'corpus.json');
  return JSON.parse(await readFile(corpusPath, 'utf8')) as CorpusDoc[];
}

function contentRunId(bundle: ExerciseContentBundle): string {
  return `content-${bundle.meta.slug}`;
}

function contentPipelineGateway(): ModelGateway {
  return {
    complete: (input: { prompt: string }) =>
      Promise.resolve({
        text: `FAKE:deadbeef:${input.prompt.length}`,
        modelVersion: 'labpath-fake-v1',
        tokensIn: 1,
        tokensOut: 1,
        costEurMicros: 4,
        cacheHit: false,
      }),
    judge: () =>
      Promise.resolve({
        text: 'FAKE_JUDGE:deadbeef',
        modelVersion: 'labpath-fake-judge-v1',
        tokensIn: 1,
        tokensOut: 1,
        costEurMicros: 4,
        cacheHit: false,
      }),
  } as unknown as ModelGateway;
}

function payloadText(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  if (typeof value === 'string') {
    return value;
  }
  if (value == null) {
    return '';
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
}

function publicQuestions(value: unknown): { question: string }[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const questions: { question: string }[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    const row = item as Record<string, unknown>;
    const question =
      typeof row.question === 'string'
        ? row.question
        : typeof row.input === 'string'
          ? row.input
          : null;
    if (question) {
      questions.push({ question });
    }
  }
  return questions;
}
