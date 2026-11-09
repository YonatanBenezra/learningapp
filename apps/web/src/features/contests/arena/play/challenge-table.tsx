"use client";

import { Check, ChevronDown, Frown, Search } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { ARENA_CATEGORIES } from "@/features/contests/arena/lib/categories";
import { HTB_DIFFICULTY } from "@/features/contests/arena/play/htb-tokens";
import type { PlayBoardChallenge } from "@/features/contests/arena/lib/play-types";
import { cn } from "@/lib/utils";
import { filterAndSortChallenges } from "./ChallengeGrid";
import type { PlayFilterState } from "./FilterSidebar";

function difficultyLabel(d: string) {
  return d.toLowerCase();
}

function ChallengeRow({
  challenge,
  active,
  onSelect,
}: {
  challenge: PlayBoardChallenge;
  active: boolean;
  onSelect: () => void;
}) {
  const solved = challenge.variant === "solved";
  const tone = HTB_DIFFICULTY[challenge.difficulty as keyof typeof HTB_DIFFICULTY];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "grid h-[38px] w-full grid-cols-[minmax(0,1fr)_80px_110px_1fr] items-center gap-2 border-b border-[#1A2232] px-4 text-left text-sm transition-colors hover:cursor-pointer hover:bg-[#1C2537] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FEF00]/40 focus-visible:ring-inset",
        active && "bg-[#1C2537]/80",
      )}
    >
      <span className="flex min-w-0 items-center gap-2 truncate text-white">
        {solved ? <Check className="size-3.5 shrink-0 text-[#9FEF00]" aria-hidden /> : null}
        <span className="truncate">{challenge.title}</span>
        {!solved && challenge.solves > 0 ? (
          <span className="shrink-0 text-xs text-[#6B7891]">{challenge.solves} solves</span>
        ) : null}
        {solved ? (
          <span className="shrink-0 text-xs text-[#6B7891]">
            {challenge.solveTime ? `Solved in ${challenge.solveTime}` : "Solved"}
          </span>
        ) : null}
      </span>
      <span className={cn("font-mono tabular-nums", solved ? "text-[#9FEF00]" : "text-white")}>
        {challenge.currentPoints}
      </span>
      <span className="text-sm lowercase" style={{ color: tone?.color ?? "#A4B1CD" }}>
        {difficultyLabel(challenge.difficulty)}
      </span>
      <span className="text-right text-xs text-[#6B7891]">
        {solved ? "Captured" : challenge.variant === "attempted" ? "In progress" : "Not started"}
      </span>
    </button>
  );
}

function TableSection({
  kind,
  title,
  challenges,
  activeId,
  onSelect,
}: {
  kind: "unsolved" | "solved";
  title: string;
  challenges: PlayBoardChallenge[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(true);
  const accent = kind === "unsolved" ? "#FFAF00" : "#9FEF00";

  return (
    <section className="mt-7 first:mt-0">
      <div className="flex h-9 items-end gap-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex h-9 w-28 items-center justify-center gap-1 rounded-t-sm text-xs font-bold uppercase tracking-wide text-[#0F1520]"
          style={{ backgroundColor: accent }}
          aria-expanded={open}
        >
          {kind}
          <ChevronDown
            className={cn("size-3.5 transition-transform", open && "rotate-180")}
            aria-hidden
          />
        </button>
        <p className="pb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-[#A4B1CD]">
          {title}
        </p>
      </div>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="body"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.22 }}
            className="overflow-hidden bg-[#151C2B]"
          >
            {challenges.length === 0 && kind === "solved" ? (
              <div className="flex h-[180px] flex-col items-center justify-center gap-2 text-center">
                <Frown className="size-6 text-[#A4B1CD]" aria-hidden />
                <p className="text-sm text-[#A4B1CD]">No challenges solved yet.</p>
                <p className="text-sm text-[#A4B1CD]">Start hacking!</p>
              </div>
            ) : null}
            {challenges.map((ch) => (
              <ChallengeRow
                key={ch.id}
                challenge={ch}
                active={activeId === ch.id}
                onSelect={() => onSelect(ch.id)}
              />
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

export function ChallengeBoardTable({
  board,
  filters,
  onFiltersChange,
  activeId,
  onSelect,
}: {
  board: PlayBoardChallenge[];
  filters: PlayFilterState;
  onFiltersChange: (f: PlayFilterState) => void;
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const filtered = useMemo(() => filterAndSortChallenges(board, filters), [board, filters]);
  const unsolved = filtered.filter((c) => c.variant !== "solved");
  const solved = filtered.filter((c) => c.variant === "solved");

  const sectionTitle =
    filters.category === "all"
      ? `${filtered.length} challenges`
      : `${filtered.length} ${ARENA_CATEGORIES[filters.category].name} challenges`.toUpperCase();

  return (
    <div className="min-w-0">
      <label className="relative mt-5 block w-full max-w-[420px]">
        <Search
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#6B7891]"
          aria-hidden
        />
        <input
          type="search"
          value={filters.query}
          onChange={(e) => onFiltersChange({ ...filters, query: e.target.value })}
          placeholder="Search challenges by name or category"
          className="h-10 w-full rounded-full border border-[#2A3446] bg-transparent py-0 pl-4 pr-10 text-sm text-white outline-none transition-colors placeholder:text-[#6B7891] focus:border-[#9FEF00] focus:ring-2 focus:ring-[#9FEF00]/20"
        />
      </label>

      <TableSection
        kind="unsolved"
        title={sectionTitle}
        challenges={unsolved}
        activeId={activeId}
        onSelect={onSelect}
      />
      <TableSection
        kind="solved"
        title={`${solved.length} solved`}
        challenges={solved}
        activeId={activeId}
        onSelect={onSelect}
      />
    </div>
  );
}
