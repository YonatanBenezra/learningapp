"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { routes } from "@/config/routes";
import { SIMULATOR_LABELS } from "@/config/simulators";
import type { Exercise, PublicSampleItem } from "@/types/exercise";
import type { HintList } from "@/types/hint";
import { hintsApi } from "../hints-api";
import { buildExerciseGuide } from "../exercise-brief-sections";
import {
  IconChevronLeft,
  IconChevronRight,
  IconDescription,
  IconExamples,
  IconHints,
  IconSteps,
  IconSubmitDoc,
} from "./workspace-icons";

const DIFFICULTY_LABELS: Record<Exercise["difficulty"], string> = {
  E: "Easy",
  M: "Medium",
  H: "Hard",
};

export const BRIEF_TABS = [
  {
    id: "description",
    label: "Description",
    railLabel: "Description",
    tone: "blue",
    Icon: IconDescription,
  },
  {
    id: "how",
    label: "How to solve",
    railLabel: "How to solve",
    tone: "violet",
    Icon: IconSteps,
  },
  {
    id: "submit",
    label: "What to submit",
    railLabel: "Submit",
    tone: "green",
    Icon: IconSubmitDoc,
  },
  {
    id: "examples",
    label: "Examples",
    railLabel: "Examples",
    tone: "amber",
    Icon: IconExamples,
  },
  {
    id: "hints",
    label: "Hints",
    railLabel: "Hints",
    tone: "rose",
    Icon: IconHints,
  },
] as const;

export type BriefTab = (typeof BRIEF_TABS)[number]["id"];

type BriefPanelProps = {
  exercise: Exercise | null;
  onboarding?: boolean;
  pathSlug?: string;
  backHref?: string;
  backLabel?: string;
  hintsDisabled?: boolean;
  collapsed?: boolean;
  tab: BriefTab;
  onTabChange: (tab: BriefTab) => void;
  onToggleCollapse: () => void;
};

export function BriefPanel({
  exercise,
  onboarding = false,
  pathSlug,
  backHref,
  backLabel,
  hintsDisabled = false,
  collapsed = false,
  tab,
  onTabChange,
  onToggleCollapse,
}: BriefPanelProps) {
  const navHref =
    backHref ??
    (pathSlug ? routes.path(pathSlug) : onboarding ? routes.onboarding : routes.problems);
  const navLabel =
    backLabel ?? (pathSlug ? "Path" : onboarding ? "First solve" : "Problem List");

  const guide = useMemo(
    () => (exercise ? buildExerciseGuide(exercise) : null),
    [exercise],
  );
  const samples = exercise ? publicSamples(exercise.publicSample) : [];

  const visibleTabs = BRIEF_TABS.filter(
    (item) => !(item.id === "hints" && hintsDisabled),
  );

  function selectTab(next: BriefTab) {
    onTabChange(next);
    if (collapsed) {
      onToggleCollapse();
    }
  }

  if (collapsed) {
    return (
      <aside className="lp-ws-pane lp-ws-pane--brief is-collapsed">
        <div className="lp-ws-rail">
          <button
            type="button"
            className="lp-ws-rail-expand"
            aria-label="Expand problem panel"
            title="Expand problem panel"
            onClick={onToggleCollapse}
          >
            <IconChevronRight size={14} />
          </button>
          <nav className="lp-ws-rail-nav" aria-label="Problem sections">
            {visibleTabs.map((item) => {
              const Icon = item.Icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`lp-ws-rail-btn lp-ws-rail-btn--${item.tone}${tab === item.id ? " is-active" : ""}`}
                  aria-label={item.label}
                  title={item.label}
                  onClick={() => selectTab(item.id)}
                >
                  <span className="lp-ws-rail-icon">
                    <Icon size={17} />
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

  return (
    <aside className="lp-ws-pane lp-ws-pane--brief">
      <div className="lp-ws-brief-top">
        <div className="lp-ws-brief-nav-row">
          <Link href={navHref} className="lp-ws-kicker">
            ← {navLabel}
          </Link>
          <button
            type="button"
            className="lp-ws-icon-btn"
            aria-label="Minimize problem panel"
            title="Minimize"
            onClick={onToggleCollapse}
          >
            <IconChevronLeft size={14} />
          </button>
        </div>
        {exercise ? (
          <div className="lp-ws-brief-title-row">
            <h1 className="lp-ws-problem-title">{exercise.title}</h1>
            <div className="lp-ws-meta">
              <span
                className={`lp-badge lp-badge--diff lp-badge--${exercise.difficulty.toLowerCase()}`}
              >
                {DIFFICULTY_LABELS[exercise.difficulty]}
              </span>
              <span className="lp-badge lp-badge--sim">
                {SIMULATOR_LABELS[exercise.simulator]}
              </span>
            </div>
          </div>
        ) : (
          <h1 className="lp-ws-problem-title">Loading…</h1>
        )}
      </div>
      <nav className="lp-ws-tabs" aria-label="Problem sections">
        {visibleTabs.map((item) => {
          const Icon = item.Icon;
          return (
            <button
              key={item.id}
              type="button"
              className={`lp-ws-tab lp-ws-tab--${item.tone}${tab === item.id ? " is-active" : ""}`}
              onClick={() => onTabChange(item.id)}
            >
              <span className="lp-ws-tab-icon">
                <Icon size={15} />
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="lp-ws-pane-body">
        {!exercise ? (
          <p className="lp-ws-pane-lead">Loading exercise…</p>
        ) : null}
        {exercise && tab === "description" ? (
          <DescriptionTab exercise={exercise} goal={guide?.goal ?? ""} />
        ) : null}
        {exercise && tab === "how" && guide ? <HowTab guide={guide} /> : null}
        {exercise && tab === "submit" && guide ? <SubmitTab guide={guide} /> : null}
        {exercise && tab === "examples" ? (
          <ExamplesTab samples={samples} guide={guide} />
        ) : null}
        {exercise && tab === "hints" ? (
          hintsDisabled ? (
            <p className="lp-ws-pane-lead">Hints are off for contest attempts.</p>
          ) : (
            <HintsBlock slug={exercise.slug} />
          )
        ) : null}
      </div>
    </aside>
  );
}

function DescriptionTab({ exercise, goal }: { exercise: Exercise; goal: string }) {
  return (
    <div className="lp-ws-tab-panel">
      <section className="lp-ws-info-block lp-ws-info-block--goal">
        <h2 className="lp-ws-info-label">
          <span className="lp-ws-info-dot lp-ws-info-dot--blue" />
          Goal
        </h2>
        <p className="lp-ws-info-text">{goal}</p>
      </section>
      <BriefMarkdown text={stripLeadingTitle(exercise.briefMd ?? "")} />
    </div>
  );
}

function HowTab({
  guide,
}: {
  guide: ReturnType<typeof buildExerciseGuide>;
}) {
  return (
    <div className="lp-ws-tab-panel">
      <section className="lp-ws-info-block">
        <h2 className="lp-ws-info-label">
          <span className="lp-ws-info-dot lp-ws-info-dot--violet" />
          What you will receive
        </h2>
        <ul className="lp-ws-steps">
          {guide.whatYouReceive.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section className="lp-ws-info-block">
        <h2 className="lp-ws-info-label">
          <span className="lp-ws-info-dot lp-ws-info-dot--green" />
          How to solve
        </h2>
        <ol className="lp-ws-steps is-numbered">
          {guide.howToSolve.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>
      <section className="lp-ws-info-block">
        <h2 className="lp-ws-info-label">
          <span className="lp-ws-info-dot lp-ws-info-dot--amber" />
          Constraints
        </h2>
        <ul className="lp-ws-steps">
          {guide.constraints.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function SubmitTab({
  guide,
}: {
  guide: ReturnType<typeof buildExerciseGuide>;
}) {
  return (
    <div className="lp-ws-tab-panel">
      <p className="lp-ws-info-text">
        Fill these fields in the editor on the right, then click{" "}
        <strong>Submit</strong> to grade against the hidden set.
      </p>
      <ul className="lp-ws-submit-list">
        {guide.submitFields.map((field) => (
          <li key={field.key} className="lp-ws-submit-item">
            <div className="lp-ws-submit-item-head">
              <strong>{field.label}</strong>
              <span className="lp-ws-submit-tag">{field.type}</span>
              {field.required ? (
                <span className="lp-ws-submit-tag is-required">required</span>
              ) : null}
            </div>
            <p>{field.description}</p>
            {field.constraints ? (
              <p className="lp-ws-submit-constraint">{field.constraints}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExamplesTab({
  samples,
  guide,
}: {
  samples: PublicSampleItem[];
  guide: ReturnType<typeof buildExerciseGuide> | null;
}) {
  if (samples.length === 0) {
    return (
      <div className="lp-ws-tab-panel">
        <p className="lp-ws-pane-lead">
          No public examples for this exercise. Use the description and submit
          fields, then submit once to see failing samples in the results panel.
        </p>
        {guide && guide.submitFields.length > 0 ? (
          <div className="lp-lc-example">
            <p className="lp-lc-example-label">Example submission shape</p>
            <pre className="lp-lc-example-code">
              {JSON.stringify(
                Object.fromEntries(
                  guide.submitFields.map((field) => [field.key, `…${field.type}…`]),
                ),
                null,
                2,
              )}
            </pre>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="lp-ws-tab-panel">
      {samples.map((item, index) => (
        <div key={item.id ?? item.question} className="lp-lc-example">
          <p className="lp-lc-example-label">Example {index + 1}</p>
          <p className="lp-lc-example-row">
            <strong>Input:</strong> {item.question}
          </p>
          {item.goldAnswer ? (
            <p className="lp-lc-example-row">
              <strong>Output:</strong> {item.goldAnswer}
            </p>
          ) : null}
          <p className="lp-lc-example-note">
            Public samples are illustrative. Grading uses a separate hidden set.
          </p>
        </div>
      ))}
    </div>
  );
}

function stripLeadingTitle(text: string) {
  const blocks = text.trim().split(/\n\n+/);
  if (blocks.length === 0) {
    return text;
  }
  if (/^#\s/.test(blocks[0] ?? "")) {
    return blocks.slice(1).join("\n\n").trim();
  }
  return text.trim();
}

function publicSamples(value: Exercise["publicSample"]): PublicSampleItem[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const samples: PublicSampleItem[] = [];
  for (const item of value) {
    const sample = asSample(item);
    if (sample) {
      samples.push(sample);
    }
  }
  return samples;
}

function asSample(item: unknown): PublicSampleItem | null {
  if (!item || typeof item !== "object") {
    return null;
  }
  const row = item as Record<string, unknown>;
  const question =
    typeof row.question === "string"
      ? row.question
      : typeof row.input === "string"
        ? row.input
        : null;
  if (!question) {
    return null;
  }
  const goldAnswer =
    typeof row.goldAnswer === "string"
      ? row.goldAnswer
      : typeof row.output === "string"
        ? row.output
        : typeof row.v1 === "string" && typeof row.v2 === "string"
          ? `v1: ${row.v1}\nv2: ${row.v2}`
          : typeof row.v1 === "string"
            ? row.v1
            : null;
  return {
    id: typeof row.id === "string" ? row.id : undefined,
    question,
    goldAnswer,
  };
}

function BriefMarkdown({ text }: { text: string }) {
  if (!text.trim()) {
    return null;
  }
  const blocks = text.trim().split(/\n\n+/);
  return (
    <div className="lp-ws-brief">
      {blocks.map((block, index) => {
        const heading = block.match(/^(#{1,3})\s+(.*)$/);
        if (heading) {
          const level = heading[1]?.length ?? 2;
          const content = heading[2] ?? "";
          if (level <= 2) {
            return <h3 key={index}>{inline(content)}</h3>;
          }
          return <h4 key={index}>{inline(content)}</h4>;
        }
        if (block.startsWith(">")) {
          return (
            <blockquote key={index} className="lp-ws-quote">
              {inline(block.replace(/^>\s?/gm, ""))}
            </blockquote>
          );
        }
        if (/^[-*]\s/m.test(block)) {
          const items = block.split(/\n/).filter((line) => /^[-*]\s/.test(line));
          return (
            <ul key={index} className="lp-ws-steps">
              {items.map((line, itemIndex) => (
                <li key={itemIndex}>{inline(line.replace(/^[-*]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index} className="whitespace-pre-wrap">
            {inline(block)}
          </p>
        );
      })}
    </div>
  );
}

function inline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="lp-ws-inline-code">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function HintsBlock({ slug }: { slug: string }) {
  const [hints, setHints] = useState<HintList | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    hintsApi
      .list(slug)
      .then((result) => {
        if (!cancelled) {
          setHints(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHints({ unlocked: [], remaining: 0 });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function unlock() {
    setPending(true);
    setError(null);
    try {
      setHints(await hintsApi.unlockNext(slug));
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Could not unlock");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="lp-ws-tab-panel">
      {!hints ? (
        <p className="lp-ws-pane-lead">Loading…</p>
      ) : (
        <>
          {hints.unlocked.length === 0 ? (
            <p className="lp-ws-pane-lead">No hints unlocked yet.</p>
          ) : (
            <ol className="lp-ws-hints">
              {hints.unlocked.map((item) => (
                <li key={item.index} className="lp-ws-hint">
                  {item.text}
                </li>
              ))}
            </ol>
          )}
          {hints.remaining > 0 ? (
            <button
              type="button"
              onClick={() => void unlock()}
              disabled={pending}
              className="lp-btn lp-btn-ghost lp-ws-hint-btn"
            >
              {pending ? "Unlocking…" : "Unlock next hint"}
            </button>
          ) : (
            <p className="lp-ws-pane-lead">All hints unlocked.</p>
          )}
          {error ? <p className="lp-ws-error">{error}</p> : null}
        </>
      )}
    </div>
  );
}
