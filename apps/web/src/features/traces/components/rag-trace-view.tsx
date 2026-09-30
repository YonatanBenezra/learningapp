"use client";

import {
  Activity,
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  Lock,
  PiggyBank,
  Scissors,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { routes } from "@/config/routes";
import {
  DEMO_RAG_PIPELINE,
  DEMO_RAG_TRACE_META,
  type RagTracePipelineStep,
} from "@/features/traces/demo/rag-trace-demo-data";
import {
  buildRagPipeline,
  buildRagTraceMeta,
  enrichTraceQueries,
  recallFromTraceAndGrade,
  verdictFromTraceAndGrade,
  type RagTraceViewMeta,
} from "@/features/traces/rag-trace-meta";
import type { Grade } from "@/types/grade";
import type { Run } from "@/types/run";
import type { RunTrace, TraceHit, TraceQuery } from "@/types/trace";
import { cn } from "@/lib/utils";
import "@/features/traces/trace-page.css";

export type { RagTraceViewMeta };

type RagTraceViewProps = {
  runId: string;
  trace: RunTrace;
  meta?: Partial<RagTraceViewMeta>;
  run?: Run | null;
  grade?: Grade | null;
  pipeline?: RagTracePipelineStep[];
  /** Demo-only: use fixed Figma meta + pipeline when true */
  demoPresentation?: boolean;
};

export function RagTraceView({
  runId,
  trace,
  meta: metaOverrides,
  run = null,
  grade = null,
  pipeline: pipelineOverride,
  demoPresentation = false,
}: RagTraceViewProps) {
  const [payloadOpen, setPayloadOpen] = useState(false);
  const [openQueries, setOpenQueries] = useState<Record<number, boolean>>({ 0: true });

  const meta = useMemo(() => {
    if (demoPresentation) {
      return { ...DEMO_RAG_TRACE_META, ...metaOverrides };
    }
    return buildRagTraceMeta(trace, { run, grade, overrides: metaOverrides });
  }, [demoPresentation, metaOverrides, trace, run, grade]);

  const pipeline = useMemo(() => {
    if (demoPresentation && !pipelineOverride) {
      return DEMO_RAG_PIPELINE;
    }
    if (pipelineOverride) {
      return pipelineOverride;
    }
    const verdict = meta.verdict ?? verdictFromTraceAndGrade(trace, grade);
    return buildRagPipeline(trace, verdict);
  }, [demoPresentation, pipelineOverride, trace, grade, meta.verdict]);

  const payloadPretty = useMemo(
    () => (trace.payload ? JSON.stringify(trace.payload, null, 2) : "{}"),
    [trace.payload],
  );
  const payloadKb = useMemo(
    () => (new Blob([payloadPretty]).size / 1024).toFixed(1),
    [payloadPretty],
  );

  const queries = useMemo(() => enrichTraceQueries(trace), [trace]);
  const recall = meta.recallAt5 ?? recallFromTraceAndGrade(trace, grade);
  const verdict = meta.verdict ?? verdictFromTraceAndGrade(trace, grade);

  const created =
    meta.createdDisplay ??
    (trace.createdAt ? formatWhen(trace.createdAt) : "—");
  const exerciseSlug = meta.exerciseSlug;
  const exerciseLabel =
    meta.exerciseTitle ?? exerciseSlug ?? "—";
  const hiddenBadgeCount = meta.hiddenQueryCount ?? "—";

  return (
    <div className="lp-page lp-page-catalogue lp-page-trace lp-trace-studio">
      <header className="lp-trace-hero">
        <div className="lp-trace-hero-main">
          <p className="lp-trace-kicker">Inspection</p>
          <h1 className="lp-trace-title">Trace</h1>
          <p className="lp-trace-lead">Retrieval steps for this run (RAG)</p>
          <div className="lp-trace-crumb-row">
            <nav className="lp-trace-crumb" aria-label="Trace links">
              <Link href={routes.problems} className="text-lp-brand hover:underline">
                Problems
              </Link>
              {exerciseSlug ? (
                <>
                  <span aria-hidden> · </span>
                  <Link
                    href={routes.exercise(exerciseSlug)}
                    className="text-lp-brand hover:underline"
                  >
                    {exerciseLabel}
                  </Link>
                </>
              ) : null}
              <span aria-hidden> · </span>
              <Link href={routes.run(runId)} className="text-lp-brand hover:underline">
                Run
              </Link>
              <span aria-hidden> · </span>
              <Link href={routes.dashboard} className="text-lp-brand hover:underline">
                Dashboard
              </Link>
            </nav>
            {verdict ? (
              <span
                className={cn(
                  "lp-trace-status-pill",
                  verdict === "pass"
                    ? "lp-trace-status-pill--pass"
                    : "lp-trace-status-pill--fail",
                )}
              >
                <span className="lp-trace-status-pill-dot" aria-hidden />
                {recall != null
                  ? `${verdict} · recall@5 ${recall.toFixed(2)}`
                  : verdict}
              </span>
            ) : null}
          </div>
        </div>

        <div className="lp-trace-run-path">
          <div className="lp-trace-run-path-head">
            <span className="lp-trace-run-path-label">Run path</span>
            <span className="lp-trace-run-path-note">{meta.pipelineNote}</span>
          </div>
          <TracePipeline steps={pipeline} />
        </div>
      </header>

      <div className="lp-trace-stats-grid">
        <StatCard
          icon={Scissors}
          label="Chunks"
          value={String(trace.chunkCount ?? "—")}
          foot={meta.statFootnotes?.chunks}
        />
        <StatCard
          icon={Search}
          label="Top-k"
          value={String(trace.k ?? "—")}
          foot={meta.statFootnotes?.topK}
        />
        <StatCard
          icon={Activity}
          label="Tokens in / out"
          value={`${trace.tokensIn ?? 0} / ${trace.tokensOut ?? 0}`}
          foot={meta.statFootnotes?.tokens}
        />
        <StatCard
          icon={PiggyBank}
          label="Cost"
          value={formatCost(trace.costEurMicros)}
          foot={meta.statFootnotes?.cost}
        />
      </div>

      <div className="lp-trace-body-grid">
        <div className="flex flex-col gap-3">
          <section className="lp-trace-panel lp-trace-run-overview">
            <div className="lp-trace-run-overview-head">
              <p className="lp-trace-run-overview-kicker">Run</p>
              <h2 className="lp-trace-run-overview-title">Overview</h2>
            </div>
            <dl className="lp-trace-overview">
              <OverviewRow label="Run ID" value={meta.runIdDisplay ?? trace.runId} mono />
              <OverviewRow label="Simulator" value={trace.simulator ?? "rag"} />
              <OverviewRow
                label="Exercise"
                value={exerciseLabel}
                mono={!meta.exerciseTitle}
                href={exerciseSlug ? routes.exercise(exerciseSlug) : undefined}
              />
              <OverviewRow label="Created" value={created} mono />
              <OverviewRow
                label="Config"
                value={meta.configDisplay ?? "—"}
                mono
              />
            </dl>

            <div className="lp-trace-payload-wrap">
              <button
                type="button"
                className="lp-trace-payload-toggle"
                aria-expanded={payloadOpen}
                onClick={() => setPayloadOpen((v) => !v)}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Code2 className="size-3.5 shrink-0 text-lp-muted" aria-hidden />
                  <span className="lp-trace-payload-toggle-label">Raw payload</span>
                  <span className="lp-trace-payload-toggle-size">{payloadKb} KB</span>
                </span>
                {payloadOpen ? (
                  <ChevronDown className="size-4 shrink-0 text-lp-muted" aria-hidden />
                ) : (
                  <ChevronRight className="size-4 shrink-0 text-lp-muted" aria-hidden />
                )}
              </button>
              <div
                className={cn(
                  "lp-trace-payload-box",
                  payloadOpen && "lp-trace-payload-box--open",
                )}
              >
                <pre className="lp-trace-payload">
                  <HighlightedJson text={payloadPretty} />
                </pre>
              </div>
            </div>
          </section>
        </div>

        <section className="lp-trace-panel lp-trace-queries min-w-0">
          <div className="lp-trace-queries-head">
            <div>
              <p className="lp-trace-queries-kicker">Retrieval</p>
              <h2 className="lp-trace-queries-title">Queries</h2>
            </div>
            <div className="lp-trace-queries-badges">
              <span className="lp-trace-queries-badge lp-trace-queries-badge--public">
                public sample • {meta.publicSampleCount ?? queries.length}
              </span>
              <span className="lp-trace-queries-badge">
                hidden • {hiddenBadgeCount} redacted
              </span>
            </div>
          </div>

          <ul className="lp-trace-query-list m-0 list-none p-0">
            {queries.map((query, index) => (
              <QueryAccordion
                key={query.queryId ?? query.question}
                query={query}
                open={Boolean(openQueries[index])}
                onToggle={() =>
                  setOpenQueries((prev) => ({ ...prev, [index]: !prev[index] }))
                }
              />
            ))}
          </ul>

          <div className="lp-trace-queries-footer">
            <Lock className="shrink-0 opacity-75" aria-hidden />
            <p className="m-0">
              {meta.hiddenFooter ??
                "Hidden-set queries are redacted in this view until grading policy allows full inspection."}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function TracePipeline({ steps }: { steps: RagTracePipelineStep[] }) {
  return (
    <div className="lp-trace-pipeline" aria-label="Run pipeline">
      {steps.map((step, index) => (
        <span key={step.id} className="inline-flex items-center gap-1">
          <PipelinePill step={step} />
          {index < steps.length - 1 ? (
            <ChevronRight className="lp-trace-pipeline-chevron" aria-hidden />
          ) : null}
        </span>
      ))}
    </div>
  );
}

function PipelinePill({ step }: { step: RagTracePipelineStep }) {
  return (
    <span
      className={cn(
        "lp-trace-pipeline-pill",
        step.state === "done" &&
          "border border-lp-brand/55 text-lp-brand bg-[color-mix(in_srgb,var(--color-brand)_8%,transparent)]",
        step.state === "skip" &&
          "border border-dashed border-lp-muted/45 text-lp-muted/90",
        step.state === "fail" &&
          "border border-rose-700 bg-rose-600 text-white",
        step.id === "grade" &&
          step.state === "done" &&
          "border border-emerald-600/70 text-emerald-200 bg-emerald-900/35",
      )}
    >
      {step.state === "done" ? (
        <Check className="size-3 shrink-0" strokeWidth={2.5} aria-hidden />
      ) : null}
      {step.state === "fail" ? (
        <X className="size-3 shrink-0" strokeWidth={2.5} aria-hidden />
      ) : null}
      {step.label}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  foot,
}: {
  icon: typeof Scissors;
  label: string;
  value: string;
  foot?: string;
}) {
  return (
    <div className="lp-trace-stat">
      <div className="flex items-center justify-between gap-2">
        <span className="lp-trace-stat-label">{label}</span>
        <Icon className="size-3.5 text-lp-muted/75" aria-hidden />
      </div>
      <p className="lp-trace-stat-value">{value}</p>
      {foot ? <p className="lp-trace-stat-foot">{foot}</p> : null}
    </div>
  );
}

function OverviewRow({
  label,
  value,
  mono,
  href,
}: {
  label: string;
  value: string;
  mono?: boolean;
  href?: string;
}) {
  return (
    <div className="lp-trace-overview-row">
      <dt>{label}</dt>
      <dd className={mono ? "font-mono text-[0.75rem]" : undefined}>
        {href ? (
          <Link href={href} className="text-lp-brand hover:underline">
            {value}
          </Link>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function QueryAccordion({
  query,
  open,
  onToggle,
}: {
  query: TraceQuery;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="lp-trace-query-item">
      <button
        type="button"
        className="lp-trace-query-trigger"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="flex min-w-0 flex-1 items-start gap-2">
          {open ? (
            <ChevronDown className="mt-1 size-4 shrink-0 text-lp-muted" aria-hidden />
          ) : (
            <ChevronRight className="mt-1 size-4 shrink-0 text-lp-muted" aria-hidden />
          )}
          <span className="min-w-0">
            <span className="lp-trace-query-source">{query.source}</span>
            <span className="lp-trace-query-question">{query.question}</span>
          </span>
        </span>
        {query.timingLabel ? (
          <span className="lp-trace-query-timing">{query.timingLabel}</span>
        ) : null}
      </button>
      {open ? (
        <ul className="lp-trace-hit-list m-0 list-none p-0">
          {query.retrieved.map((hit, index) => (
            <HitRow key={`${hit.chunkId}-${hit.docId}`} hit={hit} topHit={index === 0} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function HitRow({ hit, topHit }: { hit: TraceHit; topHit?: boolean }) {
  const pct = Math.min(100, Math.max(0, hit.score * 100));
  const chunkLabel = `${hit.docId} · ${hit.chunkId}`;
  return (
    <li className={cn("lp-trace-hit-row", topHit && "lp-trace-hit-row--top")}>
      <div className="lp-trace-hit-meta">
        <div className="lp-trace-hit-meta-start">
          <span
            className={cn(
              "lp-trace-hit-id",
              topHit ? "lp-trace-hit-id--top" : "lp-trace-hit-id--dim",
            )}
            title={chunkLabel}
          >
            {chunkLabel}
          </span>
          {topHit ? <span className="lp-trace-hit-badge">top hit</span> : null}
        </div>
        <div className="lp-trace-hit-score-group" aria-label={`Similarity ${hit.score.toFixed(2)}`}>
          <span
            className={cn(
              "lp-trace-hit-score-val",
              topHit ? "lp-trace-hit-score-val--top" : "lp-trace-hit-score-val--dim",
            )}
          >
            {hit.score.toFixed(2)}
          </span>
          <span className="lp-trace-hit-track">
            <span
              className={cn("lp-trace-hit-fill", topHit && "lp-trace-hit-fill--top")}
              style={{ width: `${pct}%` }}
            />
          </span>
        </div>
      </div>
      <p className="lp-trace-hit-text">{hit.text}</p>
    </li>
  );
}

function formatCost(micros?: number) {
  if (typeof micros !== "number") {
    return "—";
  }
  return `€${(micros / 1_000_000).toFixed(4)}`;
}

function HighlightedJson({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, lineIndex) => (
        <span key={lineIndex} className="block">
          {tokenizeJsonLine(line).map((part, partIndex) => (
            <span key={partIndex} className={part.className}>
              {part.text}
            </span>
          ))}
          {lineIndex < lines.length - 1 ? "\n" : null}
        </span>
      ))}
    </>
  );
}

type JsonToken = { text: string; className?: string };

function tokenizeJsonLine(line: string): JsonToken[] {
  const tokens: JsonToken[] = [];
  const re =
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)\b|(\{|\}|\[|\]|,)/gi;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(line)) !== null) {
    if (match.index > last) {
      tokens.push({ text: line.slice(last, match.index) });
    }
    if (match[1] != null) {
      const isKey = Boolean(match[2]);
      tokens.push({
        text: match[1] + (match[2] ?? ""),
        className: isKey ? "lp-json-key" : "lp-json-string",
      });
    } else if (match[3] != null) {
      tokens.push({ text: match[3], className: "lp-json-number" });
    } else if (match[4] != null) {
      tokens.push({ text: match[4], className: "lp-json-punct" });
    }
    last = match.index + match[0].length;
  }
  if (last < line.length) {
    tokens.push({ text: line.slice(last) });
  }
  if (tokens.length === 0) {
    tokens.push({ text: line });
  }
  return tokens;
}

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "shortOffset",
  })
    .format(date)
    .replace(",", "");
}
