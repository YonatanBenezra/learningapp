import type { Grade } from "@/types/grade";
import type { Run } from "@/types/run";
import type { RunTrace, TraceQuery } from "@/types/trace";
import type { RagTracePipelineStep } from "@/features/traces/demo/rag-trace-demo-data";
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

export function recallFromGrade(grade?: Grade | null): number | undefined {
  if (!grade) {
    return undefined;
  }
  const scorecard = grade.scorecard?.recallAt5;
  if (typeof scorecard === "number") {
    return scorecard;
  }
  const fromSnake = grade.metrics?.recall_at_5?.value;
  if (typeof fromSnake === "number") {
    return fromSnake;
  }
  const fromAt = grade.metrics?.["recall@5"]?.value;
  if (typeof fromAt === "number") {
    return fromAt;
  }
  return undefined;
}

export function recallHitsTotalFromGrade(
  grade?: Grade | null,
): { hits?: number; total?: number } {
  if (!grade) {
    return {};
  }
  const metric = grade.metrics?.recall_at_5 ?? grade.metrics?.["recall@5"];
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

export function buildRagPipeline(
  trace: RunTrace,
  verdict?: "pass" | "fail",
): RagTracePipelineStep[] {
  const generation =
    typeof trace.tokensOut === "number" && trace.tokensOut > 0;
  const gradeState: RagTracePipelineStep["state"] =
    verdict === "pass" ? "done" : verdict === "fail" ? "fail" : "done";

  return [
    { id: "query", label: "Query", state: "done" },
    { id: "planner", label: "Planner", state: "skip" },
    { id: "retriever", label: "Retriever", state: "done" },
    { id: "vsearch", label: "Vector search", state: "done" },
    { id: "evaluator", label: "Evaluator", state: "skip" },
    { id: "context", label: "Context", state: "done" },
    { id: "llm", label: "LLM", state: generation ? "done" : "skip" },
    { id: "grade", label: "Grade", state: gradeState },
  ];
}

export function pipelineNoteForTrace(trace: RunTrace): string {
  const skipped = buildRagPipeline(trace).filter((s) => s.state === "skip").length;
  if (skipped === 0) {
    return "Full pipeline";
  }
  return `${skipped} step${skipped === 1 ? "" : "s"} skipped in this mode`;
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

  const hiddenTotal = grade?.metrics?.recall_at_5?.total;
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
        ? `${hiddenTotal} hidden-set queries ran in this grade. Their questions, passages, and gold labels stay private.`
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
