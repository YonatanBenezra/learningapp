"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { routes } from "@/config/routes";
import { SIMULATOR_LABELS } from "@/config/simulators";
import type { Exercise, PublicSampleItem } from "@/types/exercise";
import type { HintList } from "@/types/hint";
import { ApiError } from "@/lib/api-client";
import { hintsApi } from "../hints-api";

const DIFFICULTY_LABELS: Record<Exercise["difficulty"], string> = {
  E: "Easy",
  M: "Medium",
  H: "Hard",
};

type BriefPanelProps = {
  exercise: Exercise | null;
  onboarding?: boolean;
  pathSlug?: string;
  backHref?: string;
  backLabel?: string;
  hintsDisabled?: boolean;
};

export function BriefPanel({
  exercise,
  onboarding = false,
  pathSlug,
  backHref,
  backLabel,
  hintsDisabled = false,
}: BriefPanelProps) {
  const navHref =
    backHref ??
    (pathSlug ? routes.path(pathSlug) : onboarding ? routes.onboarding : routes.catalogue);
  const navLabel =
    backLabel ?? (pathSlug ? "Path" : onboarding ? "First solve" : "Catalogue");
  if (!exercise) {
    return (
      <aside className="lp-ws-pane lp-ws-pane--brief">
        <div className="lp-ws-pane-head">
        <Link href={navHref} className="lp-ws-kicker">
          {navLabel}
        </Link>
        <h2 className="lp-ws-pane-title">Brief</h2>
          <p className="lp-ws-pane-lead">Loading…</p>
        </div>
      </aside>
    );
  }

  const samples = publicSamples(exercise.publicSample);

  return (
    <aside className="lp-ws-pane lp-ws-pane--brief">
      <div className="lp-ws-pane-head">
        <Link href={navHref} className="lp-ws-kicker">
          {navLabel}
        </Link>
        <div className="lp-ws-meta">
          <span className="lp-badge">{SIMULATOR_LABELS[exercise.simulator]}</span>
          <span className="lp-badge lp-badge--muted">
            {DIFFICULTY_LABELS[exercise.difficulty]}
          </span>
        </div>
        <h2 className="lp-ws-pane-title">{exercise.title}</h2>
      </div>
      <div className="lp-ws-pane-body">
        <BriefMarkdown text={exercise.briefMd ?? ""} />
        {samples.length > 0 ? (
          <div className="lp-ws-section">
            <h3 className="lp-ws-section-title">Public sample</h3>
            <ol className="lp-ws-samples">
              {samples.map((item) => (
                <li key={item.id ?? item.question} className="lp-ws-sample">
                  <p className="lp-ws-sample-q">{item.question}</p>
                  {item.goldAnswer ? (
                    <p className="lp-ws-sample-a">{item.goldAnswer}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>
        ) : null}
        {hintsDisabled ? (
          <p className="lp-ws-pane-lead">Hints are off for contest attempts.</p>
        ) : (
          <HintsBlock slug={exercise.slug} />
        )}
      </div>
    </aside>
  );
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
  const blocks = text.trim().split(/\n\n+/);
  return (
    <div className="lp-ws-brief">
      {blocks.map((block, index) => {
        const heading = block.match(/^#+\s+(.*)$/);
        if (heading) {
          return <h3 key={index}>{inline(heading[1] ?? "")}</h3>;
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
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}

function HintsBlock({ slug }: { slug: string }) {
  const [hints, setHints] = useState<HintList | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgrade, setUpgrade] = useState(false);

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
    setUpgrade(false);
    try {
      setHints(await hintsApi.unlockNext(slug));
    } catch (caught: unknown) {
      if (caught instanceof ApiError && caught.status === 403) {
        setUpgrade(true);
      }
      setError(caught instanceof Error ? caught.message : "Could not unlock");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="lp-ws-section">
      <h3 className="lp-ws-section-title">Hints</h3>
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
          {error ? (
            <p className="lp-ws-error">
              {error}
              {upgrade ? (
                <>
                  {" "}
                  <Link href={routes.billing} className="lp-link">
                    Upgrade
                  </Link>
                </>
              ) : null}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
