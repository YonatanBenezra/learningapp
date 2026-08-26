"use client";

import { useEffect, useState } from "react";
import type { Exercise, PublicSampleItem } from "@/types/exercise";
import type { HintList } from "@/types/hint";
import { hintsApi } from "../hints-api";

type BriefPanelProps = {
  exercise: Exercise | null;
};

export function BriefPanel({ exercise }: BriefPanelProps) {
  if (!exercise) {
    return (
      <aside className="border-r p-4">
        <h2 className="font-medium">Brief</h2>
        <p className="mt-2 text-sm opacity-70">Loading…</p>
      </aside>
    );
  }

  const samples = publicSamples(exercise.publicSample);

  return (
    <aside className="overflow-y-auto border-r p-4">
      <p className="text-xs uppercase tracking-wide opacity-70">
        {exercise.simulator} · {exercise.difficulty}
      </p>
      <h2 className="mt-1 font-medium">{exercise.title}</h2>
      <div className="mt-3">
        <BriefMarkdown text={exercise.briefMd ?? ""} />
      </div>
      {samples.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-sm font-medium">Public sample</h3>
          <ol className="mt-2 list-decimal space-y-2 pl-4 text-sm">
            {samples.map((item) => (
              <li key={item.id ?? item.question}>
                <p>{item.question}</p>
                {item.goldAnswer ? (
                  <p className="opacity-70">{item.goldAnswer}</p>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      <HintsBlock slug={exercise.slug} />
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
    <div className="space-y-2 text-sm">
      {blocks.map((block, index) => {
        const heading = block.match(/^#+\s+(.*)$/);
        if (heading) {
          return (
            <h3 key={index} className="font-medium">
              {inline(heading[1] ?? "")}
            </h3>
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
    <div className="mt-6">
      <h3 className="text-sm font-medium">Hints</h3>
      {!hints ? (
        <p className="mt-2 text-sm opacity-70">Loading…</p>
      ) : (
        <>
          {hints.unlocked.length === 0 ? (
            <p className="mt-2 text-sm opacity-70">No hints unlocked yet.</p>
          ) : (
            <ol className="mt-2 list-decimal space-y-2 pl-4 text-sm">
              {hints.unlocked.map((item) => (
                <li key={item.index}>{item.text}</li>
              ))}
            </ol>
          )}
          {hints.remaining > 0 ? (
            <button
              type="button"
              onClick={() => void unlock()}
              disabled={pending}
              className="mt-3 border px-3 py-1 text-sm"
            >
              {pending ? "Unlocking…" : "Unlock next hint"}
            </button>
          ) : (
            <p className="mt-2 text-sm opacity-70">All hints unlocked.</p>
          )}
          {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
        </>
      )}
    </div>
  );
}
