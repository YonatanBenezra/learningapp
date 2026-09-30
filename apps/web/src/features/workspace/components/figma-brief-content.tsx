"use client";

import {
  ChevronDown,
  ChevronRight,
  FileText,
  Lightbulb,
  Lock,
  ScrollText,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { routes } from "@/config/routes";
import { SIMULATOR_LABELS } from "@/config/simulators";
import type { Exercise } from "@/types/exercise";
import { cn } from "@/lib/utils";
import type { FigmaBriefContent } from "./brief-panel";

const DIFFICULTY_LABELS = { E: "Easy", M: "Medium", H: "Hard" } as const;

type FigmaBriefHeaderProps = {
  exercise: Exercise;
  content: FigmaBriefContent;
};

export function FigmaBriefHeader({ exercise, content }: FigmaBriefHeaderProps) {
  return (
    <div className="space-y-2.5 px-3.5 pt-1 pb-3">
      <nav
        className="flex flex-wrap items-center gap-1 text-[0.6875rem] font-medium text-lp-muted"
        aria-label="Breadcrumb"
      >
        <Link href={routes.problems} className="hover:text-lp-brand">
          Problems
        </Link>
        <span aria-hidden>/</span>
        <span>{SIMULATOR_LABELS[exercise.simulator]}</span>
        <span aria-hidden>/</span>
        <span className="text-lp-ink">{exercise.title}</span>
      </nav>
      <h1 className="text-[1.125rem] font-bold leading-tight tracking-tight text-lp-ink">
        {exercise.title}
      </h1>
      <div className="flex flex-wrap gap-1.5">
        <span className="rounded-md bg-lp-brand px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-lp-brand-on">
          {DIFFICULTY_LABELS[exercise.difficulty]}
        </span>
        {exercise.skillTags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="rounded-md border border-lp-brand/45 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-lp-brand"
          >
            {tag}
          </span>
        ))}
      </div>
      <p className="text-[0.6875rem] font-medium text-lp-muted">
        {content.meta.id}
        <span aria-hidden> · </span>
        {content.meta.duration}
        <span aria-hidden> · </span>
        {content.meta.solved}
      </p>
    </div>
  );
}

type FigmaBriefBodyProps = {
  content: FigmaBriefContent;
};

export function FigmaBriefBody({ content }: FigmaBriefBodyProps) {
  const [publicOpen, setPublicOpen] = useState(false);
  const unlockedHints = content.hints.filter((h) => h.unlocked).length;

  return (
    <div className="flex flex-col gap-4 px-3.5 pb-4">
      <section>
        <h2 className="mb-1.5 text-[0.625rem] font-bold uppercase tracking-[0.06em] text-lp-muted">
          Goal
        </h2>
        <p className="text-[0.8125rem] leading-relaxed text-lp-ink/90">{content.goal}</p>
      </section>

      <section>
        <h2 className="mb-2 text-[0.625rem] font-bold uppercase tracking-[0.06em] text-lp-muted">
          Constraints &amp; pass criteria
        </h2>
        <div className="rounded-lg border border-lp-brand/35 bg-[color-mix(in_srgb,var(--color-brand)_6%,var(--color-card))] px-3 py-2.5">
          <p className="text-[1.35rem] font-bold leading-none text-lp-brand">
            {content.constraint.metric} {content.constraint.threshold}
          </p>
          <p className="mt-1.5 text-[0.6875rem] text-lp-muted">{content.constraint.footnote}</p>
          <p className="mt-1 font-mono text-[0.6875rem] text-lp-muted">
            {content.constraint.fields}
          </p>
        </div>
      </section>

      <section className="rounded-lg border border-lp-border bg-[color-mix(in_srgb,var(--color-ink)_4%,var(--color-card))]">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
          aria-expanded={publicOpen}
          onClick={() => setPublicOpen((v) => !v)}
        >
          <span className="text-[0.625rem] font-bold uppercase tracking-[0.05em] text-lp-muted">
            Public sample
            <span className="ml-1.5 font-semibold normal-case tracking-normal text-lp-muted/80">
              — not used for grading
            </span>
          </span>
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-lp-muted transition-transform",
              publicOpen && "rotate-180",
            )}
            aria-hidden
          />
        </button>
        {publicOpen ? (
          <ul className="border-t border-lp-border/80">
            {content.publicRows.map((row) => (
              <li
                key={row.file}
                className="flex items-center justify-between gap-2 border-b border-lp-border/60 bg-[color-mix(in_srgb,var(--color-ink)_3%,var(--color-card))] px-3 py-2 last:border-b-0"
              >
                <span className="min-w-0 truncate text-[0.75rem] text-lp-ink">{row.question}</span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <span className="font-mono text-[0.6875rem] text-lp-brand">{row.file}</span>
                  {row.tag ? (
                    <span className="rounded border border-lp-border px-1 py-px text-[0.5625rem] font-bold uppercase tracking-wide text-lp-muted">
                      {row.tag}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h2 className="text-[0.625rem] font-bold uppercase tracking-[0.06em] text-lp-muted">
            Hints
          </h2>
          <span className="text-[0.625rem] font-medium text-lp-muted">
            {unlockedHints} of {content.hints.length} unlocked
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {content.hints.map((hint) =>
            hint.unlocked ? (
              <div
                key={hint.n}
                className="rounded-lg border border-lp-brand/40 bg-[color-mix(in_srgb,var(--color-brand)_5%,var(--color-card))] px-3 py-2.5"
              >
                <div className="mb-1 flex items-center gap-1.5 text-[0.5625rem] font-bold uppercase tracking-wide text-lp-brand">
                  <Lightbulb className="size-3.5 text-amber-400" aria-hidden />
                  Hint {hint.n}
                </div>
                <p className="text-[0.8125rem] leading-relaxed text-lp-muted">{hint.text}</p>
              </div>
            ) : (
              <div
                key={hint.n}
                className="rounded-lg border border-dashed border-lp-border bg-[color-mix(in_srgb,var(--color-ink)_3%,transparent)] px-3 py-2.5 opacity-75"
              >
                <div className="mb-1 flex items-center gap-1.5 text-[0.6875rem] font-semibold text-lp-muted">
                  <Lock className="size-3.5" aria-hidden />
                  Hint {hint.n}
                </div>
                <p className="text-[0.75rem] text-lp-muted">
                  Hint {hint.n} unlocks after {hint.unlockAfter} more attempts.
                </p>
              </div>
            ),
          )}
        </div>
      </section>
    </div>
  );
}

type FigmaBriefTabsProps = {
  pane: "brief" | "submissions";
  submissionCount: number;
  onPaneChange: (pane: "brief" | "submissions") => void;
  onCollapse: () => void;
};

export function FigmaBriefTabs({
  pane,
  submissionCount,
  onPaneChange,
  onCollapse,
}: FigmaBriefTabsProps) {
  return (
    <div className="flex w-full min-w-0 max-w-full shrink-0 items-center gap-2 overflow-hidden border-b border-lp-border px-2.5 py-2">
      <div
        className="flex min-w-0 max-w-full flex-1 gap-0.5 overflow-hidden rounded-lg bg-[color-mix(in_srgb,var(--color-ink)_6%,var(--color-card))] p-0.5"
        role="tablist"
        aria-label="Brief panels"
      >
        <button
          type="button"
          role="tab"
          aria-selected={pane === "brief"}
          className={cn(
            "inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 truncate rounded-md px-2 py-1 text-[0.75rem] font-semibold transition-colors",
            pane === "brief"
              ? "bg-lp-elevated text-lp-ink shadow-sm"
              : "text-lp-muted hover:text-lp-ink",
          )}
          onClick={() => onPaneChange("brief")}
        >
          <FileText className="size-3.5 shrink-0 opacity-80" aria-hidden />
          Brief
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={pane === "submissions"}
          className={cn(
            "inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 truncate rounded-md px-2 py-1 text-[0.75rem] font-semibold transition-colors",
            pane === "submissions"
              ? "bg-lp-elevated text-lp-ink shadow-sm"
              : "text-lp-muted hover:text-lp-ink",
          )}
          onClick={() => onPaneChange("submissions")}
        >
          <ScrollText className="size-3.5 shrink-0 opacity-80" aria-hidden />
          Submissions · {submissionCount}
        </button>
      </div>
      <button
        type="button"
        className="grid size-7 shrink-0 place-items-center rounded-md border border-lp-border text-lp-muted hover:bg-[color-mix(in_srgb,var(--color-ink)_6%,transparent)] hover:text-lp-ink"
        aria-label="Minimize problem panel"
        title="Minimize"
        onClick={onCollapse}
      >
        <span aria-hidden>‹</span>
      </button>
    </div>
  );
}

const FIGMA_RAIL_ITEMS = [
  { id: "brief" as const, railLabel: "Brief", tone: "blue", Icon: FileText },
  { id: "submissions" as const, railLabel: "Submission", tone: "green", Icon: ScrollText },
] as const;

type FigmaBriefCollapsedRailProps = {
  pane: "brief" | "submissions";
  onSelectPane: (pane: "brief" | "submissions") => void;
  onExpand: () => void;
};

export function FigmaBriefCollapsedRail({
  pane,
  onSelectPane,
  onExpand,
}: FigmaBriefCollapsedRailProps) {
  return (
    <aside className="lp-ws-pane lp-ws-pane--brief is-collapsed">
      <div className="lp-ws-rail lp-ws-rail--figma">
        <button
          type="button"
          className="lp-ws-rail-expand"
          aria-label="Expand problem panel"
          title="Expand problem panel"
          onClick={onExpand}
        >
          <ChevronRight className="size-3.5" aria-hidden />
        </button>
        <nav className="lp-ws-rail-nav" aria-label="Brief panels">
          {FIGMA_RAIL_ITEMS.map((item) => {
            const Icon = item.Icon;
            return (
              <button
                key={item.id}
                type="button"
                className={cn(
                  `lp-ws-rail-btn lp-ws-rail-btn--${item.tone}`,
                  pane === item.id && "is-active",
                )}
                aria-label={item.railLabel}
                title={item.railLabel}
                onClick={() => {
                  onSelectPane(item.id);
                  onExpand();
                }}
              >
                <span className="lp-ws-rail-icon">
                  <Icon size={17} strokeWidth={2} aria-hidden />
                </span>
                <span className="lp-ws-rail-label">{item.railLabel}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

export function FigmaBriefSubmissions({ count }: { count: number }) {
  return (
    <div className="flex flex-col gap-3 px-3.5 py-3">
      <p className="text-[0.8125rem] text-lp-muted">
        {count} graded attempts on the hidden set (demo).
      </p>
      <ul className="m-0 list-none space-y-2 p-0 text-[0.8125rem] text-lp-ink">
        <li className="rounded-md border border-lp-border px-3 py-2">
          <strong>Attempt 3</strong>
          <span className="text-lp-muted"> · fail · recall@5 0.41</span>
        </li>
        <li className="rounded-md border border-lp-border px-3 py-2">
          <strong>Attempt 2</strong>
          <span className="text-lp-muted"> · fail · recall@5 0.38</span>
        </li>
      </ul>
    </div>
  );
}
