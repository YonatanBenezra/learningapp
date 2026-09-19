import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { BadRequestException, Injectable } from '@nestjs/common';
import { loadExerciseBundle } from '../../content/content-loader';
import { exercisesRoot } from '../../content/content-paths';
import { gradeE1 } from '../grading/harnesses/evaluation/e1.grade';
import type { EvalItem } from '../grading/harnesses/evaluation/eval.types';
import { gradeF1 } from '../grading/harnesses/fine-tuning/f1.grade';
import type { CorpusDoc } from '../grading/harnesses/rag/chunking';
import { parseR1Payload } from '../grading/harnesses/rag/rag.payloads';
import type { HiddenItem } from '../grading/harnesses/rag/rag.types';
import { gradeR1 } from '../grading/harnesses/rag/r1.grade';
import { gradeNeuralNetwork } from '../grading/harnesses/neural-network/neural-network.grade';
import { OpenRouterService } from '../llm/openrouter.service';
import type {
  SimulationPreviewId,
  SimulationPreviewTab,
} from './dto/simulator-preview.dto';

const PREVIEW_SLUGS: Record<SimulationPreviewId, string> = {
  rag: 'rag-001-chunk-it-right',
  'neural-network': 'nn-003-regularise-or-rethink',
  evaluation: 'eval-001-write-the-assertion-suite',
  agent: 'agt-001-call-the-right-tool',
  'fine-tuning': 'ft-001-tune-or-prompt',
};

export type SimulatorPreviewResult = {
  output: string;
  verdict: 'pass' | 'fail' | 'preview';
  source: 'harness' | 'ai';
};

@Injectable()
export class SimulatorPreviewService {
  constructor(private readonly openRouter: OpenRouterService) {}

  async grade(input: {
    simulationId: SimulationPreviewId;
    tabId: SimulationPreviewTab;
    code: string;
    slug: string;
  }): Promise<SimulatorPreviewResult> {
    const expectedSlug = PREVIEW_SLUGS[input.simulationId];
    if (input.slug !== expectedSlug) {
      throw new BadRequestException('Unknown simulation slug');
    }

    const harness = await this.tryHarness(input.simulationId, input.slug, input.code, input.tabId);
    if (harness) {
      return harness;
    }

    const bundle = await loadExerciseBundle(path.join(exercisesRoot, input.slug));
    const briefMd = await readBriefMd(bundle.dir);
    const aiOutput = await this.openRouter.chat([
      {
        role: 'system',
        content:
          'You are LabPath\'s landing-page grader preview. Reply with 1-3 short terminal lines only — no markdown, no code fences. Use ✓ for pass and ✗ for fail when applicable. Be concrete about metrics or mistakes.',
      },
      {
        role: 'user',
        content: [
          `Problem: ${bundle.meta.title}`,
          `Difficulty: ${bundle.meta.difficulty}`,
          briefMd ? `Brief:\n${briefMd}` : '',
          `Submission (${input.tabId}):\n${input.code}`,
          'Grade this preview submission and suggest the most important fix if it fails.',
        ]
          .filter(Boolean)
          .join('\n\n'),
      },
    ]);

    return {
      output: normalizeLines(aiOutput),
      verdict: aiOutput.includes('✓') || /\bpass\b/i.test(aiOutput) ? 'pass' : 'preview',
      source: 'ai',
    };
  }

  private async tryHarness(
    simulationId: SimulationPreviewId,
    slug: string,
    code: string,
    tabId: SimulationPreviewTab,
  ): Promise<SimulatorPreviewResult | null> {
    if (simulationId === 'agent') {
      return null;
    }

    const dir = path.join(exercisesRoot, slug);
    const hiddenRaw = JSON.parse(
      await readFile(path.join(dir, 'eval_hidden.json'), 'utf8'),
    ) as unknown;
    const publicRaw = JSON.parse(
      await readFile(path.join(dir, 'eval_public.json'), 'utf8'),
    ) as unknown;

    try {
      switch (simulationId) {
        case 'evaluation': {
          if (tabId !== 'yaml') {
            return null;
          }
          const result = gradeE1(code, hiddenRaw as EvalItem[], publicRaw as EvalItem[]);
          const passed = result.verdict === 'pass';
          const f1 = result.metrics.f1?.value;
          return {
            output:
              typeof f1 === 'number'
                ? `F1 = ${f1.toFixed(2)}  ${passed ? '✓ pass' : '✗ fail'}`
                : passed
                  ? 'Assertion suite accepted  ✓ pass'
                  : 'Assertion suite needs work  ✗ fail',
            verdict: passed ? 'pass' : 'fail',
            source: 'harness',
          };
        }
        case 'rag': {
          const payload = extractPayload(code, tabId);
          if (!payload) {
            return null;
          }
          const docs = JSON.parse(
            await readFile(path.join(dir, 'corpus.json'), 'utf8'),
          ) as CorpusDoc[];
          const result = gradeR1(
            parseR1Payload(payload),
            docs,
            hiddenRaw as HiddenItem[],
            publicItems(publicRaw),
          );
          const recall = result.metrics.recall_at_5.value;
          const passed = result.verdict === 'pass';
          return {
            output: `recall@5 = ${recall.toFixed(2)}  ${passed ? '✓ pass' : '✗ fail'} (threshold 0.80)`,
            verdict: passed ? 'pass' : 'fail',
            source: 'harness',
          };
        }
        case 'neural-network': {
          const payload = extractPayload(code, tabId);
          if (!payload) {
            return null;
          }
          const result = gradeNeuralNetwork(payload, hiddenRaw, publicItems(publicRaw));
          const passed = result.verdict === 'pass';
          return {
            output: passed
              ? 'Diagnosis accepted  ✓ pass'
              : `${result.failureClasses[0] ?? 'Check overfitRun / diagnosis / nextKnob'}  ✗ fail`,
            verdict: passed ? 'pass' : 'fail',
            source: 'harness',
          };
        }
        case 'fine-tuning': {
          const payload = extractPayload(code, tabId);
          if (!payload) {
            return null;
          }
          const result = gradeF1(payload, hiddenRaw, publicItems(publicRaw));
          const passed = result.verdict === 'pass';
          return {
            output: passed
              ? 'Economics verified · approach aligned  ✓ pass'
              : 'Economics or approach call mismatch  ✗ fail',
            verdict: passed ? 'pass' : 'fail',
            source: 'harness',
          };
        }
        default:
          return null;
      }
    } catch {
      return null;
    }
  }
}

function publicItems(raw: unknown): { question: string }[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .filter((item): item is { question: string } =>
      Boolean(item && typeof item === 'object' && typeof (item as { question?: unknown }).question === 'string'),
    )
    .map((item) => ({ question: item.question }));
}

function extractPayload(code: string, tabId: SimulationPreviewTab): unknown | null {
  if (tabId === 'json') {
    try {
      return JSON.parse(code);
    } catch {
      return null;
    }
  }

  if (tabId === 'yaml') {
    return extractYamlObject(code);
  }

  const assignedObject =
    code.match(/(?:config|decision|diagnosis)\s*=\s*(\{[\s\S]*?\})/i)?.[1] ??
    code.match(/\{[\s\S]*\}/)?.[0];
  if (assignedObject) {
    const asJson = pythonDictToJson(assignedObject);
    if (asJson) {
      try {
        return JSON.parse(asJson);
      } catch {
        // fall through
      }
    }
  }

  const fields = extractPythonFields(code);
  return Object.keys(fields).length > 0 ? fields : null;
}

function extractYamlObject(code: string): unknown | null {
  const lines = code.split('\n');
  const root: Record<string, unknown> = {};
  let currentList: Record<string, unknown>[] | null = null;
  let currentListKey = '';

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim() || line.trim().startsWith('#')) {
      continue;
    }

    const listItem = line.match(/^\s*-\s+(\w+):\s*(.+)$/);
    if (listItem && currentList) {
      const item: Record<string, unknown> = {};
      item[listItem[1]] = parseScalar(listItem[2].trim());
      currentList.push(item);
      continue;
    }

    const keyVal = line.match(/^(\w+):\s*(.*)$/);
    if (!keyVal) {
      continue;
    }

    const [, key, rawValue] = keyVal;
    if (!rawValue) {
      currentListKey = key;
      currentList = [];
      root[key] = currentList;
      continue;
    }

    currentList = null;
    root[key] = parseScalar(rawValue.trim());
  }

  return Object.keys(root).length > 0 ? root : null;
}

function parseScalar(value: string): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function pythonDictToJson(source: string): string | null {
  try {
    const normalized = source
      .replace(/'/g, '"')
      .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":')
      .replace(/,\s*}/g, '}');
    JSON.parse(normalized);
    return normalized;
  } catch {
    return null;
  }
}

function extractPythonFields(code: string): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  const patterns: [string, 'string' | 'number'][] = [
    ['chunkSize', 'number'],
    ['overlap', 'number'],
    ['splitStrategy', 'string'],
    ['overfitRun', 'string'],
    ['diagnosis', 'string'],
    ['nextKnob', 'string'],
    ['approachCall', 'string'],
    ['economicsCall', 'string'],
  ];

  for (const [key, kind] of patterns) {
    const match = code.match(new RegExp(`${key}\\s*[:=]\\s*("([^"]+)"|'([^']+)'|([^,\\n}]+))`));
    if (!match) {
      continue;
    }
    const raw = (match[2] ?? match[3] ?? match[4] ?? '').trim();
    fields[key] = kind === 'number' ? Number(raw) : raw.replace(/^["']|["']$/g, '');
  }

  return fields;
}

async function readBriefMd(dir: string): Promise<string> {
  try {
    const meta = JSON.parse(
      await readFile(path.join(dir, 'meta.json'), 'utf8'),
    ) as { briefMd?: string };
    return meta.briefMd?.trim() ?? '';
  } catch {
    return '';
  }
}

function normalizeLines(text: string): string {
  return text
    .replace(/^```[\s\S]*?\n?/gm, '')
    .replace(/```$/gm, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4)
    .join('\n');
}
