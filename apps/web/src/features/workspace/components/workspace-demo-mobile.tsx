"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { routes } from "@/config/routes";
import { SIMULATOR_LABELS } from "@/config/simulators";
import type { Grade } from "@/types/grade";
import type { Run } from "@/types/run";
import type { Exercise } from "@/types/exercise";
import { cn } from "@/lib/utils";
import { RagFlowGraph } from "./rag-flow-graph";
import { RunPanel } from "./run-panel";
import { SubmissionSurface } from "./submission-surface";
import type { FigmaBriefContent } from "./brief-panel";

export type WorkspaceMobileStep = "brief" | "submit" | "results";

const MOBILE_STEPS: ReadonlyArray<{
  id: WorkspaceMobileStep;
  label: string;
  index: number;
}> = [
  { id: "brief", label: "Brief", index: 1 },
  { id: "submit", label: "Submit", index: 2 },
  { id: "results", label: "Results", index: 3 },
];

const DIFFICULTY_LABELS = { E: "Easy", M: "Medium", H: "Hard" } as const;

type WorkspaceDemoMobileProps = {
  exercise: Exercise;
  figmaBrief: FigmaBriefContent;
  step: WorkspaceMobileStep;
  onStepChange: (step: WorkspaceMobileStep) => void;
  run: Run | null;
  grade: Grade | null;
  pending: boolean;
  submitError: string | null;
  initialValues: Record<string, unknown>;
  onSubmit: (payload: Record<string, unknown>) => void;
};

export function WorkspaceDemoMobile({
  exercise,
  figmaBrief,
  step,
  onStepChange,
  run,
  grade,
  pending,
  submitError,
  initialValues,
  onSubmit,
}: WorkspaceDemoMobileProps) {
  const activeMeta = MOBILE_STEPS.find((s) => s.id === step) ?? MOBILE_STEPS[0];

  return (
    <div className="lp-ws-mobile">
      <div className="lp-ws-mobile-top">
        <span className="lp-ws-mobile-step" aria-live="polite">
          {activeMeta.index} · {activeMeta.label}
        </span>
      </div>

      <div className="lp-ws-mobile-segments" role="tablist" aria-label="Workspace steps">
        {MOBILE_STEPS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={step === item.id}
            className={cn("lp-ws-mobile-segment", step === item.id && "is-active")}
            onClick={() => onStepChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="lp-ws-mobile-body">
        {step === "brief" ? (
          <MobileBriefPane
            exercise={exercise}
            content={figmaBrief}
            onNext={() => onStepChange("submit")}
          />
        ) : null}
        {step === "submit" ? (
          <div className="lp-ws-mobile-submit flex min-h-0 flex-1 flex-col">
            <div className="lp-ws-mobile-flow shrink-0">
              <RagFlowGraph
                className="lp-rag-graph--fill lp-rag-graph--mobile"
                schema={exercise.submissionSchema}
                pending={pending}
                graded={Boolean(grade)}
                verdict={grade?.verdict ?? null}
              />
            </div>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <SubmissionSurface
                schema={exercise.submissionSchema}
                simulator={exercise.simulator}
                disabled={pending}
                pending={pending}
                error={submitError}
                initialValues={initialValues}
                title="Chunking config"
                onSubmit={onSubmit}
                figmaLayout
                figmaGrade={grade}
                figmaAttempt={3}
              />
            </div>
          </div>
        ) : null}
        {step === "results" ? (
          <RunPanel
            run={run}
            grade={grade}
            simulator="rag"
            collapsed={false}
            figmaScorecard
            mobileChrome
          />
        ) : null}
      </div>
    </div>
  );
}

function MobileBriefPane({
  exercise,
  content,
  onNext,
}: {
  exercise: Exercise;
  content: FigmaBriefContent;
  onNext: () => void;
}) {
  const [publicOpen, setPublicOpen] = useState(false);
  const [hintsOpen, setHintsOpen] = useState(false);
  const unlockedHints = content.hints.filter((h) => h.unlocked).length;

  return (
    <div className="lp-ws-mobile-brief flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-3.5 py-2">
        <nav
          className="mb-2 flex flex-wrap items-center gap-1 text-[0.6875rem] font-medium text-lp-muted"
          aria-label="Breadcrumb"
        >
          <Link href={routes.problems} className="hover:text-lp-brand">
            Problems
          </Link>
          <span aria-hidden>/</span>
          <span>{SIMULATOR_LABELS[exercise.simulator]}</span>
        </nav>
        <h1 className="text-[1.35rem] font-bold leading-tight text-lp-ink">{exercise.title}</h1>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-md bg-lp-brand px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wide text-lp-brand-on">
            {DIFFICULTY_LABELS[exercise.difficulty]}
          </span>
          {exercise.skillTags.slice(0, 1).map((tag) => (
            <span
              key={tag}
              className="rounded-md border border-lp-brand/45 px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-lp-brand"
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="mt-3 text-[0.8125rem] leading-relaxed text-lp-muted">{content.goal}</p>
        <div className="mt-4 rounded-lg border border-lp-brand/35 bg-[color-mix(in_srgb,var(--color-brand)_6%,var(--color-card))] px-3 py-3">
          <p className="text-[1.5rem] font-bold leading-none text-lp-brand">
            {content.constraint.metric} {content.constraint.threshold}
          </p>
          <p className="mt-1.5 text-[0.6875rem] text-lp-muted">{content.constraint.footnote}</p>
        </div>

        <button
          type="button"
          className="lp-ws-mobile-row mt-4"
          aria-expanded={publicOpen}
          onClick={() => setPublicOpen((v) => !v)}
        >
          <span className="text-[0.8125rem] font-semibold text-lp-ink">Public sample</span>
          <ChevronRight
            className={cn("size-4 text-lp-muted transition-transform", publicOpen && "rotate-90")}
            aria-hidden
          />
        </button>
        {publicOpen ? (
          <ul className="mb-2 rounded-lg border border-lp-border/80">
            {content.publicRows.map((row) => (
              <li
                key={row.file}
                className="border-b border-lp-border/60 px-3 py-2 text-[0.75rem] last:border-b-0"
              >
                {row.question}
              </li>
            ))}
          </ul>
        ) : null}

        <button
          type="button"
          className="lp-ws-mobile-row"
          aria-expanded={hintsOpen}
          onClick={() => setHintsOpen((v) => !v)}
        >
          <span className="text-[0.8125rem] font-semibold text-lp-ink">
            Hints · {unlockedHints} unlocked
          </span>
          <ChevronRight
            className={cn("size-4 text-lp-muted transition-transform", hintsOpen && "rotate-90")}
            aria-hidden
          />
        </button>
        {hintsOpen ? (
          <div className="mt-2 space-y-2 pb-2">
            {content.hints.map((hint) =>
              hint.unlocked ? (
                <p
                  key={hint.n}
                  className="rounded-lg border border-lp-brand/35 bg-[color-mix(in_srgb,var(--color-brand)_5%,transparent)] px-3 py-2 text-[0.8125rem] text-lp-muted"
                >
                  {hint.text}
                </p>
              ) : null,
            )}
          </div>
        ) : null}
      </div>
      <footer className="lp-ws-mobile-footer">
        <button type="button" className="lp-ws-mobile-footer-btn lp-ws-mobile-footer-btn--ghost" onClick={onNext}>
          Next: Submit →
        </button>
      </footer>
    </div>
  );
}
