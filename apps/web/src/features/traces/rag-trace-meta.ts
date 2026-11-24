import type { Grade } from "@/types/grade";
import type { Run } from "@/types/run";
import type { RunTrace, TraceQuery } from "@/types/trace";
import type { RagTracePipelineStep } from "@/features/traces/demo/rag-trace-demo-data";
import {
  pipelineForMode,
  ragFlowModeLabel,
  ragModeFromKeys,
} from "@/features/workspace/rag/rag-flow-pipeline";
export type RagTraceViewMeta = {
  exerciseSlug?: string;
  exerciseTitle?: string;
  verdict?: "pass" | "fail";
  recallAt5?: number;
  runIdDisplay?: string;
  configDisplay?: string;
  createdDisplay?: string;
  hiddenQueryCount?: number;
  publicSampleCount?: number;
  pipelineNote?: string;
  statFootnotes?: {
    chunks?: string;
    topK?: string;
    tokens?: string;
    cost?: string;
  };
  hiddenFooter?: string;
};

type ChunkingPayload = {
  chunkSize?: number;
  overlap?: number;
  splitStrategy?: string;
};

type DemoPayload = {
  exercise?: string;
  chunking?: ChunkingPayload;
  corpus?: { docs?: number; avgTokens?: number };
  grading?: { recallAt5?: number; verdict?: "pass" | "fail" };
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function chunkingFromPayload(payload: unknown): ChunkingPayload | null {
  const root = asRecord(payload);
  if (!root) {
    return null;
  }
  if (root.chunkSize != null || root.overlap != null || root.splitStrategy != null) {
    return {
      chunkSize: typeof root.chunkSize === "number" ? root.chunkSize : undefined,
      overlap: typeof root.overlap === "number" ? root.overlap : undefined,
      splitStrategy:
        typeof root.splitStrategy === "string" ? root.splitStrategy : undefined,
    };
  }
  const demo = root as DemoPayload;
  if (demo.chunking) {
    return demo.chunking;
  }
  return null;
}

export function truncateRunId(runId: string, head = 12, tail = 4): string {
  if (runId.length <= head + tail + 1) {
    return runId;
  }
  return `${runId.slice(0, head)}…${runId.slice(-tail)}`;
}

export function formatRagConfigDisplay(payload: unknown): string | undefined {
  const root = asRecord(payload);
  // Real submissions: show every submitted field (long prompts by length).
  if (root && !("chunking" in root) && Object.keys(root).length > 0) {
    return Object.entries(root)
      .map(([key, value]) =>
        typeof value === "string" && value.length > 24
          ? `${key} (${value.length} chars)`
          : `${key} ${typeof value === "string" ? value || "—" : JSON.stringify(value)}`,
      )
      .join(" · ");
  }
  const chunking = chunkingFromPayload(payload);
  if (!chunking) {
    return undefined;
  }
  const parts = [
    chunking.chunkSize ?? "—",
    chunking.overlap ?? "—",
    chunking.splitStrategy ?? "—",
  ];
  return parts.join(" · ");
}

/** R1 grades recall@5; R2 grades recall@k (k = the learner's topK). */
const RECALL_METRIC_KEYS = ["recall_at_5", "recall@5", "recall_at_k", "recall@k"] as const;

function recallMetric(grade: Grade) {
  for (const key of RECALL_METRIC_KEYS) {
    const metric = grade.metrics?.[key];
    if (metric) {
      return metric;
    }
  }
  return undefined;
}

export function recallFromGrade(grade?: Grade | null): number | undefined {
  if (!grade) {
    return undefined;
  }
  for (const key of ["recallAt5", "recallAtK"] as const) {
    const scorecard = grade.scorecard?.[key];
    if (typeof scorecard === "number") {
      return scorecard;
    }
  }
  const value = recallMetric(grade)?.value;
  return typeof value === "number" ? value : undefined;
}

export function recallHitsTotalFromGrade(
  grade?: Grade | null,
): { hits?: number; total?: number } {
  if (!grade) {
    return {};
  }
  const metric = recallMetric(grade);
  if (metric && typeof metric.hits === "number" && typeof metric.total === "number") {
    return { hits: metric.hits, total: metric.total };
  }
  const recall = recallFromGrade(grade);
  const total =
    typeof grade.scorecard?.totalCases === "number"
      ? grade.scorecard.totalCases
      : undefined;
  if (recall != null && total != null) {
    return { hits: Math.round(recall * total), total };
  }
  return {};
}

export function recallFromTraceAndGrade(
  trace: RunTrace,
  grade?: Grade | null,
): number | undefined {
  const demoGrading = asRecord(trace.payload)?.grading as DemoPayload["grading"];
  if (typeof demoGrading?.recallAt5 === "number") {
    return demoGrading.recallAt5;
  }
  return recallFromGrade(grade);
}

export function verdictFromTraceAndGrade(
  trace: RunTrace,
  grade?: Grade | null,
): "pass" | "fail" | undefined {
  const demoGrading = asRecord(trace.payload)?.grading as DemoPayload["grading"];
  if (demoGrading?.verdict === "pass" || demoGrading?.verdict === "fail") {
    return demoGrading.verdict;
  }
  if (grade?.verdict === "pass" || grade?.verdict === "fail") {
    return grade.verdict;
  }
  return undefined;
}

function traceMode(trace: RunTrace) {
  return ragModeFromKeys(Object.keys(asRecord(trace.payload) ?? {}));
}

/** The stages the grader actually ran for this run's exercise type. */
export function buildRagPipeline(
  trace: RunTrace,
  verdict?: "pass" | "fail",
): RagTracePipelineStep[] {
  return pipelineForMode(traceMode(trace)).map((stage) => ({
    id: stage.id,
    label: stage.title,
    state: stage.id === "grade" && verdict === "fail" ? "fail" : "done",
  }));
}

export function pipelineNoteForTrace(trace: RunTrace): string {
  return ragFlowModeLabel(traceMode(trace));
}

/** "recall@5" for R1/sandbox grades, "recall@k" for R2. */
export function recallLabelFromGrade(grade?: Grade | null): string {
  return grade?.metrics?.recall_at_k || grade?.metrics?.["recall@k"]
    ? "recall@k"
    : "recall@5";
}

function statFootnotesFromTrace(trace: RunTrace): RagTraceViewMeta["statFootnotes"] {
  const demo = asRecord(trace.payload) as DemoPayload | null;
  const corpus = demo?.corpus;
  const chunksFoot =
    corpus?.docs != null
      ? `${corpus.docs} docs${corpus.avgTokens != null ? ` · avg ${formatInt(corpus.avgTokens)} tok` : ""}`
      : trace.chunkCount != null
        ? "indexed for this run"
        : undefined;

  const topKFoot = trace.k != null ? `fixed at k=${trace.k} for this run` : undefined;

  const tokensFoot =
    (trace.tokensOut ?? 0) === 0 ? "no generation in this mode" : "retrieval + generation";

  const costFoot =
    (trace.costEurMicros ?? 0) > 0 ? "embeddings + search + model" : "search-only estimate";

  return {
    chunks: chunksFoot,
    topK: topKFoot,
    tokens: tokensFoot,
    cost: costFoot,
  };
}

function countPublicQueries(queries: TraceQuery[]): number {
  return queries.filter(
    (q) =>
      q.source === "public" ||
      q.source === "public sample" ||
      String(q.source).toLowerCase().includes("public"),
  ).length;
}

export function buildRagTraceMeta(
  trace: RunTrace,
  options?: {
    run?: Run | null;
    grade?: Grade | null;
    overrides?: Partial<RagTraceViewMeta>;
  },
): RagTraceViewMeta {
  const { run, grade, overrides } = options ?? {};
  const queries = trace.queries ?? [];
  const payload = trace.payload;
  const demo = asRecord(payload) as DemoPayload | null;

  const exerciseSlug =
    overrides?.exerciseSlug ??
    run?.exerciseSlug ??
    (typeof demo?.exercise === "string" ? demo.exercise : undefined);

  const verdict = overrides?.verdict ?? verdictFromTraceAndGrade(trace, grade);
  const recallAt5 = overrides?.recallAt5 ?? recallFromTraceAndGrade(trace, grade);

  const hiddenTotal = grade ? recallHitsTotalFromGrade(grade).total : undefined;
  const publicCount =
    overrides?.publicSampleCount ??
    (countPublicQueries(queries) || queries.length);

  return {
    exerciseSlug,
    exerciseTitle: overrides?.exerciseTitle ?? run?.title,
    verdict,
    recallAt5,
    runIdDisplay: overrides?.runIdDisplay ?? truncateRunId(trace.runId),
    configDisplay: overrides?.configDisplay ?? formatRagConfigDisplay(payload),
    createdDisplay: overrides?.createdDisplay,
    hiddenQueryCount:
      overrides?.hiddenQueryCount ??
      (typeof hiddenTotal === "number" ? hiddenTotal : undefined),
    publicSampleCount: publicCount,
    pipelineNote: overrides?.pipelineNote ?? pipelineNoteForTrace(trace),
    statFootnotes: overrides?.statFootnotes ?? statFootnotesFromTrace(trace),
    hiddenFooter:
      overrides?.hiddenFooter ??
      (typeof hiddenTotal === "number"
        ? `${hiddenTotal} hidden-set queries ran in this grade. Gold labels stay private; only a few missed questions are shown as feedback.`
        : undefined),
  };
}

function formatInt(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function enrichTraceQueries(trace: RunTrace): TraceQuery[] {
  return (trace.queries ?? []).map((query) => {
    if (query.timingLabel) {
      return query;
    }
    const n = query.retrieved.length;
    return {
      ...query,
      timingLabel: `${n} passage${n === 1 ? "" : "s"}`,
    };
  });
}
