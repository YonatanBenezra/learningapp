"use client";

import { Lock, X } from "lucide-react";
import Link from "next/link";
import { routes } from "@/config/routes";
import type { FailingCase, Grade } from "@/types/grade";
import type { Run } from "@/types/run";
import { cn } from "@/lib/utils";

const FAIL_IDS = ["q_h_07", "q_h_12", "q_h_19"] as const;

const DEFAULT_FAILURE_DETAIL =
  "Chunks average 1,184 tokens and cross headings, so the relevant sentence is diluted and ranks below 5.";

type FigmaRagScorecardProps = {
  run: Run;
  grade: Grade;
};

export function FigmaRagScorecard({ run, grade }: FigmaRagScorecardProps) {
  const recall = grade.metrics?.["recall@5"];
  const threshold =
    typeof grade.scorecard?.threshold === "number" ? grade.scorecard.threshold : 0.8;
  const yours = recall ? recall.value : 0;
  const failing = grade.failingCases ?? [];
  const failCount =
    typeof grade.scorecard?.failingCount === "number"
      ? grade.scorecard.failingCount
      : failing.length;
  const totalCases =
    typeof grade.scorecard?.totalCases === "number" ? grade.scorecard.totalCases : 24;
  const failureClass = grade.failureClasses?.[0] ?? "retrieval:chunk-too-large";
  const failureDetail =
    typeof grade.scorecard?.failureDetail === "string"
      ? grade.scorecard.failureDetail
      : DEFAULT_FAILURE_DETAIL;
  const headline =
    typeof grade.scorecard?.headline === "string"
      ? grade.scorecard.headline
      : "Below threshold";
  const meanTokens = grade.metrics?.meanTokens?.value;

  return (
    <div className="flex flex-col gap-3.5 px-3.5 pb-4 pt-1">
      <div className="rounded-lg border border-rose-500/35 bg-[color-mix(in_srgb,#881337_22%,var(--color-card))] px-3 py-2.5">
        <span className="inline-flex items-center gap-1.5 rounded-sm bg-rose-600 px-1.5 py-0.5 text-[0.625rem] font-extrabold uppercase tracking-wide text-white">
          <span className="size-1.5 shrink-0 rounded-full bg-white" aria-hidden />
          {grade.verdict}
        </span>
        <p className="mt-2 text-[1.0625rem] font-extrabold leading-tight text-lp-ink">
          {headline}
        </p>
        <p className="mt-1 text-[0.6875rem] font-semibold text-lp-muted">
          Run succeeded · Grade complete · 2.4s
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-3 text-[0.75rem] font-semibold">
          <Link href={routes.run(run.id)} className="text-lp-brand hover:underline">
            Run
          </Link>
          <Link href={routes.trace(run.id)} className="text-lp-brand hover:underline">
            Trace →
          </Link>
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[15rem] border-collapse text-[0.75rem]">
          <thead>
            <tr className="border-b border-lp-border text-left text-[0.5625rem] font-bold uppercase tracking-[0.06em] text-lp-muted">
              <th scope="col" className="pb-2 pr-2 font-bold">
                Metric
              </th>
              <th scope="col" className="pb-2 pr-2 font-bold">
                Yours
              </th>
              <th scope="col" className="pb-2 pr-2 font-bold">
                Threshold
              </th>
              <th scope="col" className="pb-2 text-right font-bold">
                <span className="sr-only">Status</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-lp-border/70">
              <td className="py-2 pr-2 font-mono text-[0.6875rem] text-lp-ink">recall@5</td>
              <td className="py-2 pr-2 font-bold text-rose-400">{yours.toFixed(2)}</td>
              <td className="py-2 pr-2 text-lp-muted">≥ {threshold.toFixed(2)}</td>
              <td className="py-2 text-right">
                <StatusPill tone="fail">fail</StatusPill>
              </td>
            </tr>
            {meanTokens != null ? (
              <tr className="border-b border-lp-border/70">
                <td className="py-2 pr-2 font-mono text-[0.6875rem] text-lp-ink">mean tokens</td>
                <td className="py-2 pr-2 font-semibold text-lp-ink">{Math.round(meanTokens)}</td>
                <td className="py-2 pr-2 text-lp-muted">—</td>
                <td className="py-2 text-right">
                  <StatusPill tone="info">info</StatusPill>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div>
        <div
          className="relative h-1.5 overflow-visible rounded-full bg-[color-mix(in_srgb,var(--color-ink)_10%,var(--color-card))]"
          aria-hidden
        >
          <span
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-rose-400/90 via-rose-300/70 to-teal-400/85"
            style={{ width: `${Math.min(100, Math.max(0, yours * 100))}%` }}
          />
          <span
            className="absolute top-[-3px] h-[calc(100%+6px)] w-0.5 -translate-x-1/2 bg-lp-ink"
            style={{ left: `${threshold * 100}%` }}
          />
        </div>
        <div className="relative mt-1 h-3 text-[0.5625rem] font-semibold text-lp-muted">
          <span className="absolute left-0">0</span>
          <span
            className="absolute -translate-x-1/2"
            style={{ left: `${threshold * 100}%` }}
          >
            {threshold.toFixed(2)}
          </span>
          <span className="absolute right-0">1.0</span>
        </div>
      </div>

      <section className="rounded-lg border border-lp-border bg-[color-mix(in_srgb,var(--color-ink)_5%,var(--color-card))] px-3 py-2.5">
        <h3 className="text-[0.5625rem] font-bold uppercase tracking-[0.07em] text-lp-muted">
          Failure class
        </h3>
        <p className="mt-2 inline-block rounded-md bg-[color-mix(in_srgb,#881337_35%,var(--color-card))] px-2 py-0.5 font-mono text-[0.8125rem] font-semibold text-lp-ink">
          {failureClass}
        </p>
        <p className="mt-2 text-[0.75rem] leading-relaxed text-lp-muted">{failureDetail}</p>
      </section>

      <section>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h3 className="text-[0.5625rem] font-bold uppercase tracking-[0.07em] text-lp-muted">
            Failing cases
          </h3>
          <span className="text-[0.6875rem] font-semibold text-lp-muted">
            {failCount} of {totalCases} missed
          </span>
        </div>
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {failing.map((item, index) => (
            <FailingCaseCard
              key={`${item.question}-${index}`}
              item={item}
              id={FAIL_IDS[index] ?? `q_h_${index}`}
            />
          ))}
        </ul>
      </section>
    </div>
  );
}

function StatusPill({
  tone,
  children,
}: {
  tone: "fail" | "info";
  children: string;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2 py-0.5 text-[0.5625rem] font-extrabold uppercase tracking-wide",
        tone === "fail" &&
          "bg-[color-mix(in_srgb,#ef4444_18%,transparent)] text-rose-400",
        tone === "info" &&
          "bg-[color-mix(in_srgb,var(--color-ink)_8%,transparent)] text-lp-muted",
      )}
    >
      {children}
    </span>
  );
}

function FailingCaseCard({ item, id }: { item: FailingCase; id: string }) {
  return (
    <li className="rounded-lg border border-lp-border bg-[color-mix(in_srgb,var(--color-ink)_4%,var(--color-card))] px-2.5 py-2">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="font-mono text-[0.625rem] font-bold text-lp-muted">{id}</span>
        <span className="inline-flex items-center gap-1 text-[0.5625rem] font-semibold uppercase tracking-wide text-lp-muted">
          <Lock className="size-3 shrink-0 opacity-80" aria-hidden />
          gold hidden
        </span>
      </div>
      <p className="text-[0.75rem] font-semibold leading-snug text-lp-ink">{item.question}</p>
      {item.note ? (
        <p className="mt-1.5 flex items-start gap-1.5 text-[0.6875rem] leading-snug text-rose-400/95">
          <X className="mt-0.5 size-3.5 shrink-0 stroke-[2.5]" aria-hidden />
          <span>{item.note}</span>
        </p>
      ) : null}
    </li>
  );
}
