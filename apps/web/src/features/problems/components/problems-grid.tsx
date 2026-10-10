"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Database, ShieldCheck } from "lucide-react";
import {
  SIMULATOR_LABELS,
  isActiveSimulator,
  type SimulatorSlug,
} from "@/config/simulators";
import {
  ensureAuthSession,
  getAuthSnapshot,
} from "@/features/auth/auth-session";
import {
  problemsApi,
  type UserExerciseSolveStat,
} from "@/features/problems/problems-api";
import type { Difficulty, Exercise } from "@/types/exercise";
import {
  figmaMetaForSlug,
  problemFigmaMetaForExercise,
  RAG_PROBLEMS_ORDER,
} from "../problems-figma-meta";
import { ProblemsRagTrackPanel } from "./problems-rag-track-panel";
import { ProblemsFigmaRow } from "./problems-figma-row";
import { ProblemsGenericRow } from "./problems-generic-row";
import { ProblemsSkeleton } from "./problems-skeleton";
import { ProblemsTrackPanel } from "./problems-track-panel";

const PAGE_SIZE = 10;

const GUARDRAILS_ORDER = [
  "grd-001-break-the-concierge",
  "grd-004-polite-boundary",
  "grd-002-the-indirect-payload",
  "grd-005-encoding-trick",
  "grd-011-bcc-smuggle",
  "grd-007-hex-extract",
  "grd-014-wilson-gate",
  "grd-013-filter-stack",
  "grd-016-policy-window",
  "grd-010-page-inject",
  "grd-015-benign-pass",
];

function buildPageItems(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, total, current]);
  for (let offset = 1; offset <= 1; offset += 1) {
    pages.add(current - offset);
    pages.add(current + offset);
  }
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (current >= total - 2) {
    pages.add(total - 1);
    pages.add(total - 2);
    pages.add(total - 3);
  }

  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const out: Array<number | "ellipsis"> = [];
  for (const page of sorted) {
    const last = out[out.length - 1];
    if (typeof last === "number" && page - last > 1) {
      out.push("ellipsis");
    }
    out.push(page);
  }
  return out;
}

function LightbulbFootnoteIcon() {
  return (
    <svg className="lp-prob-footnote-icon" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M10 2.5a4.5 4.5 0 0 0-2.2 8.4V13h4.4v-2.1A4.5 4.5 0 0 0 10 2.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M8.2 15h3.6M9 17h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

const DIFFICULTY_FILTERS: { id: Difficulty | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "E", label: "Easy" },
  { id: "M", label: "Medium" },
  { id: "H", label: "Hard" },
];


function sortExercises(items: Exercise[], track: SimulatorSlug | "all"): Exercise[] {
  const ragOrder = RAG_PROBLEMS_ORDER;
  return [...items].sort((a, b) => {
    if (track === "guardrails" || track === "all") {
      const ai = GUARDRAILS_ORDER.indexOf(a.slug);
      const bi = GUARDRAILS_ORDER.indexOf(b.slug);
      if (ai !== -1 && bi !== -1) {
        return ai - bi;
      }
      if (track === "guardrails") {
        if (ai !== -1) {
          return -1;
        }
        if (bi !== -1) {
          return 1;
        }
      }
    }
    if (track === "rag" || track === "all") {
      const ai = ragOrder.indexOf(a.slug);
      const bi = ragOrder.indexOf(b.slug);
      if (ai !== -1 && bi !== -1) {
        return ai - bi;
      }
      if (track === "rag") {
        if (ai !== -1) {
          return -1;
        }
        if (bi !== -1) {
          return 1;
        }
      }
    }
    return a.title.localeCompare(b.title);
  });
}

export function ProblemsGrid() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Exercise[] | null>(null);
  const [error, setError] = useState<"load" | null>(null);
  const [track, setTrack] = useState<SimulatorSlug | "all">("all");
  const [difficulty, setDifficulty] = useState<Difficulty | "all">("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [signedIn, setSignedIn] = useState(
    () =>
      getAuthSnapshot().status === "authenticated" ||
      getAuthSnapshot().status === "soft",
  );
  const [userStatsBySlug, setUserStatsBySlug] = useState<
    Record<string, UserExerciseSolveStat>
  >({});
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    ensureAuthSession().then((session) => {
      if (!cancelled) {
        setSignedIn(
          session.status === "authenticated" || session.status === "soft",
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const fromUrl = searchParams.get("track");
    if (fromUrl && isActiveSimulator(fromUrl)) {
      setTrack(fromUrl);
    } else if (fromUrl === "all") {
      setTrack("all");
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    problemsApi
      .list()
      .then((result) => {
        if (!cancelled) {
          setItems(result.items);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("load");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  useEffect(() => {
    if (!signedIn) {
      setUserStatsBySlug({});
      return;
    }
    let cancelled = false;
    problemsApi
      .exerciseProgress()
      .then((result) => {
        if (!cancelled) {
          setUserStatsBySlug(result.bySlug ?? {});
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUserStatsBySlug({});
        }
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn, reloadToken]);

  useEffect(() => {
    const onFocus = () => setReloadToken((n) => n + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [track, difficulty, query]);

  const visible = useMemo(() => {
    if (!items) {
      return [];
    }
    const needle = query.trim().toLowerCase();
    const filtered = items.filter((exercise) => {
      if (!isActiveSimulator(exercise.simulator)) {
        return false;
      }
      const trackOk = track === "all" || exercise.simulator === track;
      const levelOk = difficulty === "all" || exercise.difficulty === difficulty;
      if (!trackOk || !levelOk) {
        return false;
      }
      if (!needle) {
        return true;
      }
      const haystack = [
        exercise.title,
        SIMULATOR_LABELS[exercise.simulator],
        ...exercise.skillTags,
        figmaMetaForSlug(exercise.slug)?.code ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
    return sortExercises(filtered, track);
  }, [difficulty, items, query, track]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return visible.slice(start, start + PAGE_SIZE);
  }, [currentPage, visible]);

  const showGuardrailsChrome = track === "guardrails";
  const showRagChrome = track === "rag";

  const searchPlaceholder =
    track === "guardrails"
      ? "Search guardrails problems"
      : track === "rag"
        ? "Search RAG problems"
        : "Search problems";

  if (error === "load") {
    return (
      <div className="lp-cat-empty">
        <strong>Could not load exercises</strong>
        <p>Check that the API is running, then refresh this page.</p>
      </div>
    );
  }

  if (!items) {
    return <ProblemsSkeleton />;
  }

  return (
    <div className="lp-prob">
      <header className="lp-prob-header">
        <h1 className="lp-prob-title">Problems</h1>
        <p className="lp-prob-lead">
          Short, graded exercises. Pick a track and work through the levels.
        </p>
      </header>

      <div className="lp-prob-filters">
        <div className="lp-prob-filter-toolbar">
          <div className="lp-prob-filter-left">
            <div className="lp-prob-track-pills" role="tablist" aria-label="Track">
              <button
                type="button"
                role="tab"
                aria-selected={track === "all"}
                className={track === "all" ? "is-active" : undefined}
                onClick={() => setTrack("all")}
              >
                All tracks
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={track === "rag"}
                className={track === "rag" ? "is-active" : undefined}
                onClick={() => setTrack("rag")}
              >
                <Database className="size-3.5" strokeWidth={2} aria-hidden /> RAG
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={track === "guardrails"}
                className={track === "guardrails" ? "is-active" : undefined}
                onClick={() => setTrack("guardrails")}
              >
                <ShieldCheck className="size-3.5" strokeWidth={2} aria-hidden /> Guardrails
              </button>
            </div>

            <span className="lp-prob-filter-divider" aria-hidden />

            <div className="lp-prob-diff-segment" role="group" aria-label="Difficulty">
              {DIFFICULTY_FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={difficulty === item.id}
                  className={difficulty === item.id ? "is-active" : undefined}
                  onClick={() => setDifficulty(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <label className="lp-prob-search">
            <span className="sr-only">{searchPlaceholder}</span>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="M16.2 16.2 20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              autoComplete="off"
            />
          </label>
        </div>
      </div>

      <div
        className={`lp-prob-main${showGuardrailsChrome || showRagChrome ? " has-sidebar" : ""}`}
      >
        <div className="lp-prob-table-wrap">
          {visible.length === 0 ? (
            <div className="lp-cat-empty">
              <strong>No matches</strong>
              <p>Try another track, level, or search.</p>
            </div>
          ) : (
            <table className="lp-prob-table">
              <thead>
                <tr>
                  <th scope="col">Problem</th>
                  <th scope="col">Difficulty</th>
                  <th scope="col">Mode</th>
                  <th scope="col">Solve rate</th>
                  <th scope="col">
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((exercise) => {
                  const userStat = signedIn ? userStatsBySlug[exercise.slug] : undefined;
                  const showUserRate =
                    signedIn &&
                    userStat &&
                    userStat.gradedAttempts > 0;
                  const meta = problemFigmaMetaForExercise(exercise.slug, {
                    solveRate: showUserRate ? userStat.solveRate : undefined,
                    cleared: Boolean(userStat?.cleared),
                  });
                  if (meta) {
                    return (
                      <ProblemsFigmaRow
                        key={exercise.slug}
                        exercise={exercise}
                        meta={meta}
                        signedIn={signedIn}
                      />
                    );
                  }
                  return (
                    <ProblemsGenericRow
                      key={exercise.slug}
                      exercise={exercise}
                      signedIn={signedIn}
                      cleared={Boolean(userStat?.cleared)}
                      solveRate={showUserRate ? userStat!.solveRate : undefined}
                    />
                  );
                })}
              </tbody>
            </table>
          )}

          {showGuardrailsChrome ? (
            <p className="lp-prob-footnote">
              <LightbulbFootnoteIcon />
              Red-team (G1-style) and blue-team (G3-style) problems open in the figma simulator
              workspace. Contest mode reuses the same graders with a timer.
            </p>
          ) : null}
          {showRagChrome ? (
            <p className="lp-prob-footnote">
              <LightbulbFootnoteIcon />
              Config problems include Simulation Lab (corpus, chunks, query). Sandbox problems use
              the Python retriever editor only.
            </p>
          ) : null}
        </div>

        {showGuardrailsChrome ? <ProblemsTrackPanel /> : null}
        {showRagChrome ? <ProblemsRagTrackPanel /> : null}
      </div>

      {visible.length > PAGE_SIZE ? (
        <nav className="lp-cat-pager" aria-label="Problem pages">
          <button
            type="button"
            className="lp-cat-page"
            disabled={currentPage <= 1}
            aria-label="Previous page"
            onClick={() => {
              setPage((value) => Math.max(1, value - 1));
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M10 3.5L5.5 8 10 12.5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {buildPageItems(currentPage, pageCount).map((item, index) =>
            item === "ellipsis" ? (
              <span key={`e-${index}`} className="lp-cat-page-ellipsis" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                className={`lp-cat-page${item === currentPage ? " is-active" : ""}`}
                aria-label={`Page ${item}`}
                aria-current={item === currentPage ? "page" : undefined}
                onClick={() => {
                  setPage(item);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                {item}
              </button>
            ),
          )}

          <button
            type="button"
            className="lp-cat-page"
            disabled={currentPage >= pageCount}
            aria-label="Next page"
            onClick={() => {
              setPage((value) => Math.min(pageCount, value + 1));
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M6 3.5L10.5 8 6 12.5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </nav>
      ) : null}
    </div>
  );
}
