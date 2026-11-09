"use client";

import { Check, Droplet, Users } from "lucide-react";
import { ARENA_CATEGORIES } from "@/features/contests/arena/lib/categories";
import type { PlayBoardChallenge } from "@/features/contests/arena/lib/play-types";
import { cn } from "@/lib/utils";

function DifficultyLabel({ difficulty }: { difficulty: string }) {
  return <span className="play-difficulty-label">{difficulty}</span>;
}

export function PlayChallengeCard({
  challenge,
  active,
  onSelect,
}: {
  challenge: PlayBoardChallenge;
  active?: boolean;
  onSelect: () => void;
}) {
  const meta = ARENA_CATEGORIES[challenge.categoryId];
  const Icon = meta.Icon;
  const solved = challenge.variant === "solved";

  return (
    <button
      type="button"
      onClick={onSelect}
      title={challenge.title}
      aria-pressed={active}
      className={cn(
        "group relative flex h-[172px] w-full flex-col rounded-sm border border-[#232C3D] bg-[#18202F] p-5 text-left transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FEF00]/40",
        solved && "border-[#9FEF00]/25 bg-[#9FEF00]/[0.02]",
        "hover:border-[#2F3A50] hover:bg-[#1C2537]",
        active && "border-[#2F3A50]",
      )}
    >
      {solved ? (
        <span
          className="absolute right-4 top-4 flex size-5 items-center justify-center rounded-full border border-[#9FEF00]/50 text-[#9FEF00]"
          aria-label="Solved"
        >
          <Check className="size-3" strokeWidth={3} />
        </span>
      ) : null}
      {!solved && challenge.firstBlood ? (
        <span
          className="absolute right-4 top-4 text-[#6B7891]"
          title={`First blood: ${challenge.firstBlood.user}`}
        >
          <Droplet className="size-3.5" aria-hidden />
          <span className="sr-only">First blood: {challenge.firstBlood.user}</span>
        </span>
      ) : null}

      <div className="flex gap-3">
        <span className="play-category-tile flex size-10 shrink-0 items-center justify-center rounded-sm">
          <Icon className="size-[18px]" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 pr-7">
          <p className="line-clamp-2 text-[15px] font-medium leading-snug text-white">
            {challenge.title}
          </p>
          <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-[#6B7891]">
            {meta.name}
          </p>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 pt-3">
        <DifficultyLabel difficulty={challenge.difficulty} />
        <span className="flex items-center gap-1 text-xs text-[#6B7891]">
          <span aria-hidden>·</span>
          <Users className="size-3 opacity-70" aria-hidden />
          {challenge.solves}
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between border-t border-[#232C3D] pt-3">
        <p className="text-xs text-[#6B7891]">
          {solved ? (
            challenge.solveTime ? (
              <span className="text-[#9FEF00]">Solved in {challenge.solveTime}</span>
            ) : (
              <span className="text-[#9FEF00]">Solved</span>
            )
          ) : challenge.attemptTries != null ? (
            `${challenge.attemptTries} tries`
          ) : (
            "Unsolved"
          )}
        </p>
        <p className="text-right">
          <span
            className={cn(
              "font-mono text-base tabular-nums",
              solved ? "text-[#9FEF00]" : "text-[#A4B1CD]",
            )}
          >
            {challenge.currentPoints}
          </span>
          <span className="ml-1 text-[11px] text-[#6B7891]">pts</span>
        </p>
      </div>
    </button>
  );
}

export function PlayChallengeListRow({
  challenge,
  active,
  onSelect,
}: {
  challenge: PlayBoardChallenge;
  active?: boolean;
  onSelect: () => void;
}) {
  const meta = ARENA_CATEGORIES[challenge.categoryId];
  const Icon = meta.Icon;
  const solved = challenge.variant === "solved";

  return (
    <button
      type="button"
      onClick={onSelect}
      title={challenge.title}
      className={cn(
        "grid h-12 w-full grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-3 border-b border-[#232C3D] px-2 text-left text-sm transition-colors",
        "hover:bg-[#1C2537] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FEF00]/40 focus-visible:ring-inset",
        active && "bg-[#18202F]",
      )}
    >
      <span className="play-category-tile flex size-8 items-center justify-center rounded-sm">
        <Icon className="size-3.5" aria-hidden />
      </span>
      <span className="min-w-0 truncate font-medium text-white">{challenge.title}</span>
      <span className="hidden text-xs uppercase tracking-wide text-[#6B7891] sm:inline">{meta.name}</span>
      <span className="hidden text-[11px] font-medium uppercase tracking-wide text-[#6B7891] sm:inline">
        {challenge.difficulty}
      </span>
      <span className="hidden font-mono text-xs tabular-nums text-[#6B7891] md:inline">{challenge.solves}</span>
      <span className={cn("font-mono text-sm tabular-nums", solved ? "text-[#9FEF00]" : "text-[#A4B1CD]")}>
        {challenge.currentPoints}
      </span>
    </button>
  );
}
