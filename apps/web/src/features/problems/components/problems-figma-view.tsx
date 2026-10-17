"use client";

import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
  type Transition,
} from "motion/react";
import {
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Layers,
  Search,
  Shield,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { routes } from "@/config/routes";
import {
  hrefForProblem,
  type CatalogProblem,
  type ProblemDifficulty,
  type ProblemStatus,
  type ProblemTrack,
} from "../problems-figma-catalog";
import {
  continueProblem,
  groupMetaForTrack,
  progressByTrack,
  trackCounts,
  useProblemsCatalog,
} from "../use-problems-catalog";
import { sortCatalogRecommended } from "../problems-figma-mapper";
import { ProblemsFigmaSkeleton } from "./problems-figma-skeleton";

const E: Transition["ease"] = [0.2, 0, 0, 1];
const PAGE_SIZE = 10;

type TrackFilter = ProblemTrack | "all";
type LevelFilter = ProblemDifficulty | "any";
type StatusFilter = ProblemStatus | "any";
type SortFilter = "recommended" | "rate" | "title";

const TRACK_SEGMENTS: {
  id: TrackFilter;
  label: string;
  icon?: typeof FileText;
}[] = [
  { id: "all", label: "All" },
  { id: "rag", label: "RAG", icon: FileText },
  { id: "guard", label: "Guard", icon: Shield },
  { id: "agent", label: "Agent", icon: Bot },
];

function FadeUp({
  delay,
  children,
  className,
}: {
  delay: number;
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduceMotion ? { duration: 0 } : { duration: 0.5, ease: E, delay, opacity: { ease: "easeOut" } }
      }
    >
      {children}
    </motion.div>
  );
}

function StatChip({ value, label, delay }: { value: string; label: string; delay: number }) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(reduceMotion ? value : "0");

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      return;
    }
    const num = parseFloat(value.replace("%", ""));
    if (Number.isNaN(num)) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const dur = 800;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const v = Math.round(num * t);
      setDisplay(value.includes("%") ? `${v}%` : String(v));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    const t0 = window.setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, delay * 1000);
    return () => {
      window.clearTimeout(t0);
      cancelAnimationFrame(raf);
    };
  }, [value, delay, reduceMotion]);

  return (
    <FadeUp delay={delay} className="lp-pfigma-stat-chip">
      <span className="lp-pfigma-stat-value">{display}</span>
      <span className="lp-pfigma-stat-label">{label}</span>
    </FadeUp>
  );
}

function SignalBars({ level }: { level: ProblemDifficulty }) {
  const heights = [6, 9, 12];
  const active = level === "easy" ? 1 : level === "medium" ? 2 : 3;
  return (
    <span className="lp-pfigma-signal" aria-hidden>
      {heights.map((h, i) => (
        <span key={h} style={{ height: h, opacity: i < active ? 1 : 0.25 }} />
      ))}
    </span>
  );
}

function highlightText(text: string, query: string) {
  if (!query.trim()) return text;
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  if (i === -1) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="lp-pfigma-mark">{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  );
}

function Dropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="lp-pfigma-select-wrap" ref={ref}>
      <button
        type="button"
        className="lp-pfigma-select-btn"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {label}: {options.find((o) => o.id === value)?.label ?? value}
        <ChevronDown size={14} aria-hidden />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            className="lp-pfigma-menu"
            initial={{ opacity: 0, scale: 0.97, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: reduceMotion ? 0 : 0.15 }}
          >
            {options.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={opt.id === value ? "is-active" : undefined}
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ProblemRow({
  problem,
  index,
  search,
}: {
  problem: CatalogProblem;
  index: number;
  search: string;
}) {
  const reduceMotion = useReducedMotion();
  const href = hrefForProblem(problem.slug);
  const actionLabel =
    problem.action === "review"
      ? "Review"
      : problem.action === "continue"
        ? "Continue"
        : "Start";

  return (
    <motion.div layout initial={false}>
      <Link
        href={href}
        className={`lp-pfigma-row${problem.current ? " is-current" : ""}`}
        style={{ animationDelay: `${index * 0.03}s` }}
      >
        {problem.current ? <span className="lp-pfigma-row-rail" aria-hidden /> : null}
        <span className="lp-pfigma-row-status" aria-hidden>
          {problem.status === "solved" ? (
            <span className="lp-pfigma-status--solved">
              <Check size={11} strokeWidth={3} />
            </span>
          ) : problem.status === "in_progress" ? (
            <span className="lp-pfigma-status--progress" />
          ) : (
            <span className="lp-pfigma-status--idle" />
          )}
        </span>
        <div className="lp-pfigma-problem">
          <div className="lp-pfigma-problem-top">
            <span className="lp-pfigma-id">{highlightText(problem.id, search)}</span>
            <span className="lp-pfigma-problem-title">{highlightText(problem.title, search)}</span>
          </div>
          <p className="lp-pfigma-problem-desc">{problem.description}</p>
          <div className="lp-pfigma-tags">
            {problem.tags.map((tag) => (
              <span key={tag} className="lp-pfigma-tag">
                {highlightText(tag, search)}
              </span>
            ))}
          </div>
        </div>
        <div className="lp-pfigma-row-meta">
          <div className="lp-pfigma-row-pills">
            <span className={`lp-pfigma-diff lp-pfigma-diff--${problem.difficulty}`}>
              <SignalBars level={problem.difficulty} />
              {problem.difficulty === "easy"
                ? "Easy"
                : problem.difficulty === "medium"
                  ? "Medium"
                  : "Hard"}
            </span>
            <span className={`lp-pfigma-mode lp-pfigma-mode--${problem.mode}`}>
              {problem.mode === "engineering" ? (
                <Layers size={12} aria-hidden />
              ) : (
                <Shield size={12} aria-hidden />
              )}
              {problem.mode === "engineering"
                ? "Engineering"
                : problem.mode === "red"
                  ? "Red team"
                  : "Blue team"}
            </span>
          </div>
          <div className="lp-pfigma-rate">
            <span className="lp-pfigma-rate-val">{problem.solveRate}%</span>
            <span className="lp-pfigma-rate-suffix">solve</span>
            <div className="lp-pfigma-rate-bar">
              <motion.span
                className="lp-pfigma-rate-fill"
                initial={{ scaleX: reduceMotion ? 1 : 0 }}
                animate={{ scaleX: 1 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.6,
                  ease: E,
                  delay: reduceMotion ? 0 : 0.08 + index * 0.03,
                }}
                style={{
                  width: `${problem.solveRate}%`,
                  transformOrigin: "left center",
                  background: problem.solveRate >= 50 ? "var(--teal)" : "var(--text-3)",
                }}
              />
            </div>
          </div>
          <span
            className={`lp-pfigma-action${
              problem.actionPrimary ? " lp-pfigma-action--primary" : " lp-pfigma-action--secondary"
            }`}
          >
            {actionLabel}
            <ArrowRight className="lp-pfigma-action-arrow" size={14} aria-hidden />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

export function ProblemsFigmaView() {
  const reduceMotion = useReducedMotion();
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const catalogState = useProblemsCatalog();

  const [track, setTrack] = useState<TrackFilter>("all");
  const [level, setLevel] = useState<LevelFilter>("any");
  const [status, setStatus] = useState<StatusFilter>("any");
  const [sort, setSort] = useState<SortFilter>("recommended");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [listKey, setListKey] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 120);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [track, level, status, sort, debouncedSearch]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        const input =
          searchRef.current ??
          document.querySelector<HTMLInputElement>(".lp-pfigma-search--desktop input");
        input?.focus();
      }
      if (e.key === "Escape") {
        if (filtersOpen) {
          setFiltersOpen(false);
          return;
        }
        setSearch("");
        searchRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtersOpen]);

  useEffect(() => {
    if (!filtersOpen) {
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [filtersOpen]);

  const catalog =
    catalogState.phase === "ready" ? catalogState.catalog : [];

  const filtered = useMemo(() => {
    let items = [...catalog];
    if (track !== "all") items = items.filter((p) => p.track === track);
    if (level !== "any") items = items.filter((p) => p.difficulty === level);
    if (status !== "any") items = items.filter((p) => p.status === status);
    const q = debouncedSearch.toLowerCase();
    if (q) {
      items = items.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (sort === "rate") items.sort((a, b) => b.solveRate - a.solveRate);
    else if (sort === "title") items.sort((a, b) => a.title.localeCompare(b.title));
    else items.sort(sortCatalogRecommended);
    return items;
  }, [catalog, track, level, status, sort, debouncedSearch]);

  const counts = useMemo(() => trackCounts(catalog), [catalog]);
  const trackProgress = useMemo(() => progressByTrack(catalog), [catalog]);
  const continueItem = useMemo(() => continueProblem(catalog), [catalog]);
  const solvedTotal = useMemo(
    () => catalog.filter((p) => p.status === "solved").length,
    [catalog],
  );
  const inProgressTotal = useMemo(
    () => catalog.filter((p) => p.status === "in_progress").length,
    [catalog],
  );
  const avgSolveRate = useMemo(() => {
    const withRate = catalog.filter((p) => p.solveRate > 0);
    if (withRate.length === 0) {
      return "—";
    }
    const avg =
      withRate.reduce((sum, p) => sum + p.solveRate, 0) / withRate.length;
    return `${Math.round(avg)}%`;
  }, [catalog]);

  if (catalogState.phase === "loading") {
    return <ProblemsFigmaSkeleton />;
  }

  if (catalogState.phase === "error") {
    return (
      <div className="lp-pfigma">
        <div className="lp-pfigma-inner">
          <div className="lp-pfigma-empty">
            <p>Could not load exercises</p>
            <p className="lp-pfigma-subtitle">Check that the API is running, then refresh.</p>
          </div>
        </div>
      </div>
    );
  }

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const grouped = useMemo(() => {
    const out: Array<
      | { kind: "group"; track: ProblemTrack }
      | { kind: "row"; problem: CatalogProblem; index: number }
    > = [];
    let last: ProblemTrack | null = null;
    let idx = 0;
    for (const p of pageItems) {
      if (p.track !== last) {
        out.push({ kind: "group", track: p.track });
        last = p.track;
      }
      out.push({ kind: "row", problem: p, index: idx });
      idx += 1;
    }
    return out;
  }, [pageItems]);

  const goPage = useCallback((p: number) => {
    setPage(p);
    setListKey((k) => k + 1);
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const clearFilters = () => {
    setTrack("all");
    setLevel("any");
    setStatus("any");
    setSort("recommended");
    setSearch("");
  };

  return (
    <div className="lp-pfigma">
      <div className="lp-pfigma-inner">
        <header className="lp-pfigma-head">
          <FadeUp delay={0} className="lp-pfigma-head-copy">
            <p className="lp-pfigma-eyebrow">PRACTICE · {counts.all} PROBLEMS</p>
            <div className="lp-pfigma-title-row">
              <h1 className="lp-pfigma-title">Problems</h1>
              <span className="lp-pfigma-title-accent">to train on</span>
            </div>
            <p className="lp-pfigma-subtitle">
              Short, graded exercises. Pick a track, work through the levels, and let the hidden
              eval move your score.
            </p>
          </FadeUp>
          <div className="lp-pfigma-stat-chips">
            <StatChip value={String(solvedTotal)} label="solved" delay={0.15} />
            <StatChip value={String(inProgressTotal)} label="in progress" delay={0.2} />
            <StatChip value={avgSolveRate} label="avg. solve rate" delay={0.25} />
          </div>
        </header>

        <FadeUp delay={0.25} className="lp-pfigma-toolbar">
          <LayoutGroup>
            <div className="lp-pfigma-segments" role="tablist" aria-label="Track">
              {TRACK_SEGMENTS.map((seg) => {
                const active = track === seg.id;
                const Icon = seg.icon;
                const count = counts[seg.id];
                return (
                  <button
                    key={seg.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={`lp-pfigma-segment${active ? " is-active" : ""}`}
                    onClick={() => setTrack(seg.id)}
                  >
                    {active ? (
                      <motion.span
                        layoutId="pfigma-track-pill"
                        className="lp-pfigma-segment-pill"
                        transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      />
                    ) : null}
                    <span className="lp-pfigma-segment-label">
                      {Icon ? <Icon size={14} aria-hidden /> : null}
                      {seg.label}
                      <span className="lp-pfigma-segment-count">{count}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>

          <div className="lp-pfigma-toolbar-row lp-pfigma-toolbar-row--desktop">
            <span className="lp-pfigma-toolbar-divider" aria-hidden />
            <div className="lp-pfigma-toolbar-extra">
              <Dropdown
                label="Level"
                value={level}
                options={[
                  { id: "any", label: "Any" },
                  { id: "easy", label: "Easy" },
                  { id: "medium", label: "Medium" },
                  { id: "hard", label: "Hard" },
                ]}
                onChange={(id) => setLevel(id as LevelFilter)}
              />
            </div>
            <div className="lp-pfigma-toolbar-filters">
              <Dropdown
                label="Status"
                value={status}
                options={[
                  { id: "any", label: "Any" },
                  { id: "solved", label: "Solved" },
                  { id: "in_progress", label: "In progress" },
                  { id: "not_started", label: "Not started" },
                ]}
                onChange={(id) => setStatus(id as StatusFilter)}
              />
              <Dropdown
                label="Sort"
                value={sort}
                options={[
                  { id: "recommended", label: "Recommended" },
                  { id: "rate", label: "Solve rate" },
                  { id: "title", label: "Title" },
                ]}
                onChange={(id) => setSort(id as SortFilter)}
              />
              <label className="lp-pfigma-search lp-pfigma-search--desktop">
                <Search size={15} aria-hidden className="lp-pfigma-search-icon" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search problems"
                  autoComplete="off"
                />
                <kbd className="lp-pfigma-kbd">/</kbd>
              </label>
            </div>
          </div>

          <div className="lp-pfigma-toolbar-row lp-pfigma-toolbar-row--mobile">
            <label className="lp-pfigma-search lp-pfigma-search--mobile">
              <Search size={15} aria-hidden className="lp-pfigma-search-icon" />
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search problems"
                autoComplete="off"
              />
            </label>
            <button
              type="button"
              className="lp-pfigma-filter-btn"
              aria-expanded={filtersOpen}
              aria-label="Filters and sort"
              onClick={() => setFiltersOpen(true)}
            >
              <Layers size={18} aria-hidden />
            </button>
          </div>
        </FadeUp>

        <AnimatePresence>
          {filtersOpen ? (
            <>
              <motion.button
                key="pfigma-filter-backdrop"
                type="button"
                className="lp-pfigma-filter-backdrop"
                aria-label="Close filters"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.2 }}
                onClick={() => setFiltersOpen(false)}
              />
              <motion.div
                key="pfigma-filter-sheet"
                className="lp-pfigma-filter-sheet"
                role="dialog"
                aria-modal="true"
                aria-labelledby="pfigma-filter-title"
                initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 24 }}
                transition={{ duration: reduceMotion ? 0 : 0.25, ease: E }}
              >
                <div className="lp-pfigma-filter-sheet-head">
                  <h2 id="pfigma-filter-title" className="lp-pfigma-filter-sheet-title">
                    Filters
                  </h2>
                  <button
                    type="button"
                    className="lp-pfigma-filter-sheet-close"
                    onClick={() => setFiltersOpen(false)}
                  >
                    Done
                  </button>
                </div>
                <div className="lp-pfigma-filter-sheet-body">
                  <Dropdown
                    label="Level"
                    value={level}
                    options={[
                      { id: "any", label: "Any" },
                      { id: "easy", label: "Easy" },
                      { id: "medium", label: "Medium" },
                      { id: "hard", label: "Hard" },
                    ]}
                    onChange={(id) => setLevel(id as LevelFilter)}
                  />
                  <Dropdown
                    label="Status"
                    value={status}
                    options={[
                      { id: "any", label: "Any" },
                      { id: "solved", label: "Solved" },
                      { id: "in_progress", label: "In progress" },
                      { id: "not_started", label: "Not started" },
                    ]}
                    onChange={(id) => setStatus(id as StatusFilter)}
                  />
                  <Dropdown
                    label="Sort"
                    value={sort}
                    options={[
                      { id: "recommended", label: "Recommended" },
                      { id: "rate", label: "Solve rate" },
                      { id: "title", label: "Title" },
                    ]}
                    onChange={(id) => setSort(id as SortFilter)}
                  />
                </div>
              </motion.div>
            </>
          ) : null}
        </AnimatePresence>

        <div className="lp-pfigma-body">
          <div className="lp-pfigma-list-wrap" ref={listRef}>
            <FadeUp delay={0.3}>
              <div className="lp-pfigma-list">
                <div className="lp-pfigma-list-head">
                  <span />
                  <span>Problem</span>
                  <span>Difficulty</span>
                  <span>Mode</span>
                  <span>Solve rate</span>
                  <span />
                </div>

                <AnimatePresence mode="popLayout">
                  {filtered.length === 0 ? (
                    <motion.div
                      key="empty"
                      className="lp-pfigma-empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <p>No problems match these filters</p>
                      <button type="button" onClick={clearFilters}>
                        Clear filters
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={listKey}
                      className="lp-pfigma-list-body"
                      initial={{ opacity: reduceMotion ? 1 : 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: reduceMotion ? 1 : 0, y: -6 }}
                      transition={{ duration: reduceMotion ? 0 : 0.2 }}
                    >
                      {grouped.map((entry) => {
                        if (entry.kind === "group") {
                          const visibleOnPage = pageItems.filter(
                            (p) => p.track === entry.track,
                          ).length;
                          const meta = groupMetaForTrack(
                            entry.track,
                            catalog,
                            visibleOnPage,
                          );
                          const Icon =
                            entry.track === "rag"
                              ? FileText
                              : entry.track === "guard"
                                ? Shield
                                : Bot;
                          return (
                            <div key={`g-${entry.track}`} className="lp-pfigma-group">
                              <span className="lp-pfigma-group-icon">
                                <Icon size={13} aria-hidden />
                              </span>
                              <span className="lp-pfigma-group-name">{meta.label}</span>
                              <span className="lp-pfigma-group-count">{meta.shownOf}</span>
                              <div className="lp-pfigma-group-right">
                                <div className="lp-pfigma-group-bar">
                                  <motion.span
                                    className="lp-pfigma-group-bar-fill"
                                    initial={{ scaleX: reduceMotion ? 1 : 0 }}
                                    animate={{ scaleX: meta.solvedFrac }}
                                    transition={{ duration: 0.6, ease: E }}
                                    style={{ width: "100%" }}
                                  />
                                </div>
                                <span className="lp-pfigma-group-solved">{meta.solvedLabel}</span>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <ProblemRow
                            key={entry.problem.id}
                            problem={entry.problem}
                            index={entry.index}
                            search={debouncedSearch}
                          />
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>

                {filtered.length > 0 ? (
                  <div className="lp-pfigma-pagination">
                    <span className="lp-pfigma-pagination-meta">
                      Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                      {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
                    </span>
                    <span className="lp-pfigma-pagination-spacer" />
                    <button
                      type="button"
                      className="lp-pfigma-page-btn"
                      disabled={currentPage <= 1}
                      aria-label="Previous page"
                      onClick={() => goPage(currentPage - 1)}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {[1, 2, 3].filter((p) => p <= pageCount).map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={`lp-pfigma-page-btn${p === currentPage ? " is-active" : ""}`}
                        onClick={() => goPage(p)}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="lp-pfigma-page-btn"
                      disabled={currentPage >= pageCount}
                      aria-label="Next page"
                      onClick={() => goPage(currentPage + 1)}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                ) : null}
              </div>
            </FadeUp>
          </div>

          <aside className="lp-pfigma-sidebar">
            {continueItem ? (
              <FadeUp delay={0.35}>
                <div className="lp-pfigma-card lp-pfigma-card--continue">
                  <p className="lp-pfigma-card-eyebrow">Continue</p>
                  <div className="lp-pfigma-problem-top">
                    <span className="lp-pfigma-id">{continueItem.id}</span>
                    <span className={`lp-pfigma-diff lp-pfigma-diff--${continueItem.difficulty}`}>
                      <SignalBars level={continueItem.difficulty} />
                      {continueItem.difficulty === "easy"
                        ? "Easy"
                        : continueItem.difficulty === "hard"
                          ? "Hard"
                          : "Medium"}
                    </span>
                  </div>
                  <h2 className="lp-pfigma-card-title">{continueItem.title}</h2>
                  <p className="lp-pfigma-problem-desc">{continueItem.description}</p>
                  <Link
                    href={hrefForProblem(continueItem.slug)}
                    className="lp-pfigma-btn-full lp-pfigma-btn-ember"
                  >
                    {continueItem.action === "review" ? "Review" : "Continue"}
                    <ArrowRight size={16} aria-hidden />
                  </Link>
                </div>
              </FadeUp>
            ) : null}

            <FadeUp delay={0.43}>
              <div className="lp-pfigma-card">
                <div className="lp-pfigma-progress-head">
                  <span className="lp-pfigma-progress-title">Your progress</span>
                  <span className="lp-pfigma-progress-total">
                    {solvedTotal} / {counts.all}
                  </span>
                </div>
                <div className="lp-pfigma-track-progress">
                  {trackProgress.map((row, ti) => (
                    <div key={row.track}>
                      <div className="lp-pfigma-track-row-head">
                        <span>
                          {row.track === "rag" ? (
                            <FileText size={14} className="inline mr-1" aria-hidden />
                          ) : null}
                          {row.label}
                        </span>
                        <span className="lp-pfigma-group-count">
                          {row.solved}/{row.total}
                        </span>
                      </div>
                      <div className="lp-pfigma-seg-bar">
                        {Array.from({ length: Math.min(row.total, 14) }, (_, i) => {
                          let cls = "";
                          if (i < row.solved) cls = "is-solved";
                          else if (i < row.solved + row.inProgress) cls = "is-progress";
                          return (
                            <motion.span
                              key={i}
                              className={cls}
                              initial={{ scaleX: reduceMotion ? 1 : 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{
                                delay: reduceMotion ? 0 : ti * 0.05 + i * 0.025,
                                duration: 0.3,
                              }}
                              style={{ transformOrigin: "left" }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>

            <FadeUp delay={0.51}>
              <div className="lp-pfigma-card">
                <div className="lp-pfigma-problem-top">
                  <span className="lp-pfigma-contest-icon">
                    <Sparkles size={18} aria-hidden />
                  </span>
                  <div>
                    <p className="lp-pfigma-problem-title" style={{ fontSize: 14 }}>
                      Core 15 Advanced Championship
                    </p>
                    <p className="lp-pfigma-group-count">15 advanced · 180 min time box</p>
                  </div>
                </div>
                <p className="lp-pfigma-problem-desc" style={{ whiteSpace: "normal" }}>
                  Timed sitting on the new Core 15 advanced set — live leaderboard on Contests.
                </p>
                <Link href={routes.contests} className="lp-pfigma-btn-full lp-pfigma-btn-ghost">
                  View contest
                </Link>
              </div>
            </FadeUp>
          </aside>
        </div>
      </div>
    </div>
  );
}
