"use client";

import { motion } from "motion/react";
import { Droplet, Flag } from "lucide-react";
import {
  avatarColorForName,
  avatarInitialsForName,
} from "@/lib/arena/categories";
import type { ScoreRow as ScoreRowType } from "@/lib/arena/scoreboard";
import { formatRelativeTime } from "@/lib/arena/scoreboard";
import { CategoryBars } from "./CategoryBars";
import { cn } from "@/lib/utils";

function medalClass(rank: number, isYou?: boolean): string {
  if (isYou) {
    return "text-[var(--arena-lime-fg)]";
  }
  if (rank === 1) {
    return "text-[var(--arena-medal-gold)]";
  }
  if (rank === 2) {
    return "text-[var(--arena-medal-silver)]";
  }
  if (rank === 3) {
    return "text-[var(--arena-medal-bronze)]";
  }
  return "text-[var(--arena-text-2)]";
}

function OperatorCell({ row }: { row: ScoreRowType }) {
  const color = avatarColorForName(row.user);
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        className="flex size-[26px] shrink-0 items-center justify-center rounded-md border font-mono text-[9px] font-bold"
        style={{
          color,
          borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
          backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)`,
        }}
        aria-hidden
      >
        {avatarInitialsForName(row.user)}
      </span>
      <span
        className={cn(
          "truncate text-[13.5px]",
          row.isYou ? "font-bold" : "font-medium",
        )}
      >
        {row.user}
      </span>
      {row.isYou ? (
        <span className="shrink-0 rounded bg-[var(--arena-lime)] px-[7px] py-[3px] font-mono text-[10.5px] font-bold uppercase tracking-[0.08em] text-[var(--color-brand-on)]">
          YOU
        </span>
      ) : null}
    </div>
  );
}

export function ScoreTableRow({
  row,
  layoutId,
  pointsFlash,
  rowId,
  variant = "table",
}: {
  row: ScoreRowType;
  layoutId?: string;
  pointsFlash?: boolean;
  rowId?: string;
  variant?: "table" | "you";
}) {
  const rankLabel =
    row.rank === 1
      ? "1st place"
      : row.rank === 2
        ? "2nd place"
        : row.rank === 3
          ? "3rd place"
          : undefined;

  if (variant === "you" || row.isYou) {
    return (
      <motion.tr
        layout={layoutId ? "position" : false}
        layoutId={layoutId}
        id={rowId ?? "scoreboard-you-row"}
        className={cn("arena-scoreboard-you-row", row.isYou && "arena-scoreboard-you-row")}
      >
        <td className="col-rank">
          <span
            className="font-mono text-[13px] font-bold text-[var(--arena-lime-fg)]"
            aria-label={rankLabel}
          >
            {row.rank}
          </span>
        </td>
        <td className="col-operator min-w-[180px]">
          <OperatorCell row={row} />
        </td>
        <td className="col-points">
          <span
            className={cn(
              "font-mono text-[13.5px] font-bold text-[var(--arena-ink)]",
              pointsFlash && "arena-scoreboard-points-flash",
            )}
          >
            {row.points.toLocaleString()}
          </span>
        </td>
        <td className="col-flags">
          <FlagsCell row={row} />
        </td>
        <td className="col-bloods">
          <BloodsCell row={row} />
        </td>
        <td className="col-capture">
          <CaptureCell row={row} />
        </td>
        <td className="col-categories">
          <CategoryBars categories={row.categories} />
        </td>
      </motion.tr>
    );
  }

  return (
    <motion.tr layout={layoutId ? "position" : false} layoutId={layoutId}>
      <td className="col-rank">
        <span
          className={cn("font-mono text-[13px] font-bold", medalClass(row.rank))}
          aria-label={rankLabel}
        >
          {row.rank}
        </span>
      </td>
      <td className="col-operator min-w-[180px]">
        <OperatorCell row={row} />
      </td>
      <td className="col-points">
        <span
          className={cn(
            "font-mono text-[13.5px] font-bold text-[var(--arena-ink)]",
            pointsFlash && "arena-scoreboard-points-flash",
          )}
        >
          {row.points.toLocaleString()}
        </span>
      </td>
      <td className="col-flags">
        <FlagsCell row={row} />
      </td>
      <td className="col-bloods">
        <BloodsCell row={row} />
      </td>
      <td className="col-capture">
        <CaptureCell row={row} />
      </td>
      <td className="col-categories">
        <CategoryBars categories={row.categories} />
      </td>
    </motion.tr>
  );
}

function FlagsCell({ row }: { row: ScoreRowType }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Flag className="size-3 text-[var(--arena-lime-fg)]" aria-hidden />
      <span className="font-mono text-[12.5px] text-[var(--arena-text-2)]">
        {row.flags}/{row.totalFlags}
      </span>
    </span>
  );
}

function BloodsCell({ row }: { row: ScoreRowType }) {
  const active = row.firstBloods > 0;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Droplet
        className={cn("size-3", active ? "text-[var(--arena-red)]" : "text-[var(--arena-text-3)]")}
        aria-hidden
      />
      <span
        className={cn(
          "font-mono text-[12.5px]",
          active ? "text-[var(--arena-ink)]" : "text-[var(--arena-text-3)]",
        )}
      >
        {row.firstBloods}
      </span>
    </span>
  );
}

function CaptureCell({ row }: { row: ScoreRowType }) {
  const abs = new Date(row.lastCaptureAt).toLocaleString();
  return (
    <span className="font-mono text-xs text-[var(--arena-text-3)]" title={abs}>
      {formatRelativeTime(row.lastCaptureAt)}
    </span>
  );
}

export function ScoreMobileCard({
  row,
  pointsFlash,
}: {
  row: ScoreRowType;
  pointsFlash?: boolean;
}) {
  return (
    <article
      id={row.isYou ? "scoreboard-you-row" : undefined}
      className={cn(
        "border-t border-[var(--arena-line)] px-4 py-3",
        row.isYou && "arena-scoreboard-you-row bg-[color-mix(in_srgb,var(--arena-lime)_7%,var(--arena-surface))]",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "font-mono text-[13px] font-bold",
              medalClass(row.rank, row.isYou),
            )}
          >
            #{row.rank}
          </span>
          <OperatorCell row={row} />
        </div>
        <span
          className={cn(
            "shrink-0 font-mono text-[13.5px] font-bold",
            pointsFlash && "arena-scoreboard-points-flash",
          )}
        >
          {row.points.toLocaleString()}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[11px] text-[var(--arena-text-3)]">
        <FlagsCell row={row} />
        <BloodsCell row={row} />
        <CaptureCell row={row} />
      </div>
      <div className="mt-2">
        <CategoryBars categories={row.categories} />
      </div>
    </article>
  );
}
