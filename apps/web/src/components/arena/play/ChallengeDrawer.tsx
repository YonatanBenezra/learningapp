"use client";

import { Clock, Copy, Terminal, X } from "lucide-react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Tag } from "@/components/arena/Tag";
import { routes } from "@/config/routes";
import { countdownParts, pad2 } from "@/features/contests/contest-countdown-parts";
import { remainingMs } from "@/features/contests/contest-clock";
import {
  ARENA_CATEGORIES,
  DIFFICULTY_TONE,
  avatarColorForName,
} from "@/lib/arena/categories";
import { launchSlug } from "@/lib/arena/play-mock";
import type { PlayBoardChallenge } from "@/lib/arena/play-types";
import type { ContestDetail } from "@/types/contest";
import { DifficultyHistogram } from "./DifficultyHistogram";
import { FlagCard } from "./FlagCard";
import "./challenge-drawer.css";

function resolveDeadline(contest: ContestDetail): string | null {
  if (contest.personalDeadlineAt) {
    return contest.personalDeadlineAt;
  }
  if (contest.startedAt) {
    const t = new Date(contest.startedAt).getTime();
    if (!Number.isNaN(t)) {
      return new Date(t + contest.timeBoxMinutes * 60_000).toISOString();
    }
  }
  return null;
}

function ClockFooter({ deadlineIso }: { deadlineIso: string | null }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  if (!deadlineIso) {
    return <>—</>;
  }
  const ms = Math.max(0, remainingMs(deadlineIso, now));
  const p = countdownParts(ms);
  if (ms <= 0) {
    return <>expired</>;
  }
  return (
    <>
      {pad2(p.hours)}:{pad2(p.minutes)}:{pad2(p.seconds)} left
    </>
  );
}

export function ChallengeDrawer({
  open,
  challenge,
  contest,
  contestSlug,
  onClose,
  clockExpired,
}: {
  open: boolean;
  challenge: PlayBoardChallenge | null;
  contest: ContestDetail;
  contestSlug: string;
  onClose: () => void;
  clockExpired: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const reduce = useReducedMotion();
  const deadline = resolveDeadline(contest);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    if (open && challenge && !el.open) {
      el.showModal();
    }
    if ((!open || !challenge) && el.open) {
      el.close();
    }
  }, [open, challenge]);

  if (!challenge) {
    return (
      <dialog ref={ref} className="challenge-drawer-dialog" onClose={onClose} aria-hidden />
    );
  }

  const meta = ARENA_CATEGORIES[challenge.categoryId];
  const Icon = meta.Icon;
  const tone = DIFFICULTY_TONE[challenge.difficulty];
  const solved = challenge.variant === "solved";
  const problemSlug = launchSlug(challenge, contest);
  const launchHref = routes.contestProblem(contestSlug, problemSlug);

  const panelVariants = reduce
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : { hidden: { x: "100%" }, visible: { x: 0 } };

  return (
    <dialog
      ref={ref}
      className="challenge-drawer-dialog"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClose={onClose}
      aria-labelledby="challenge-drawer-title"
    >
      <motion.div
        className="challenge-drawer-panel"
        initial="hidden"
        animate="visible"
        variants={panelVariants}
        transition={reduce ? { duration: 0.2 } : { type: "spring", stiffness: 320, damping: 34 }}
      >
        <div className="challenge-drawer-scroll">
          <header className="flex items-start gap-3.5">
            <span
              className="flex size-12 shrink-0 items-center justify-center rounded-lg border"
              style={{
                backgroundColor: `color-mix(in srgb, ${meta.colorVar} 12%, transparent)`,
                borderColor: `color-mix(in srgb, ${meta.colorVar} 35%, transparent)`,
              }}
            >
              <Icon className="size-[23px]" style={{ color: meta.colorVar }} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-1.5">
                <Tag tone={tone}>{challenge.difficulty}</Tag>
                <Tag tone="cyan">{meta.name.toUpperCase()}</Tag>
                <Tag tone="solo">{challenge.code}</Tag>
              </div>
              <h2
                id="challenge-drawer-title"
                className="mt-2 text-[22px] font-bold leading-snug tracking-[-0.015em] text-[var(--arena-ink)]"
              >
                {challenge.title}
              </h2>
            </div>
            <button
              type="button"
              className="flex size-8 shrink-0 items-center justify-center rounded-md border border-[var(--arena-line-2)] text-[var(--arena-text-2)] hover:bg-[color-mix(in_srgb,var(--arena-ink)_5%,transparent)]"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="size-[15px]" />
            </button>
          </header>

          <div className="mt-5 grid grid-cols-3 overflow-hidden rounded-lg border border-[var(--arena-line)] bg-[color-mix(in_srgb,var(--arena-ink)_2.5%,transparent)]">
            {[
              {
                label: "Points",
                value: (
                  <>
                    <span className="text-[var(--arena-lime-fg)]">{challenge.currentPoints}</span>
                    <span className="text-[11px] font-medium text-[var(--arena-text-3)]">
                      {" "}
                      / {challenge.base}
                    </span>
                  </>
                ),
              },
              { label: "Solves", value: challenge.solves },
              { label: "Your tries", value: challenge.attemptTries ?? 0 },
            ].map((cell, i) => (
              <div
                key={cell.label}
                className="px-3.5 py-3"
                style={
                  i > 0 ? { borderLeft: "1px solid var(--arena-line)" } : undefined
                }
              >
                <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[var(--arena-text-3)]">
                  {cell.label}
                </p>
                <p className="mt-1 font-mono text-xl font-bold text-[var(--arena-ink)]">
                  {cell.value}
                </p>
              </div>
            ))}
          </div>

          {challenge.firstBlood ? (
            <div className="mt-4 flex flex-wrap items-center gap-2.5 rounded-lg border border-[color-mix(in_srgb,var(--arena-red)_30%,var(--arena-line))] bg-[color-mix(in_srgb,var(--arena-red)_7%,transparent)] px-3.5 py-3">
              <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.1em] text-[var(--arena-red)]">
                First blood
              </span>
              <span
                className="flex size-[22px] items-center justify-center rounded-md font-mono text-[9px] font-bold"
                style={{
                  color: avatarColorForName(challenge.firstBlood.user),
                  backgroundColor: `color-mix(in srgb, ${avatarColorForName(challenge.firstBlood.user)} 16%, transparent)`,
                }}
              >
                {challenge.firstBlood.user.slice(0, 2).toUpperCase()}
              </span>
              <span className="text-[13px] font-semibold text-[var(--arena-ink)]">
                {challenge.firstBlood.user}
              </span>
              <span className="ml-auto font-mono text-[11.5px] text-[var(--arena-text-2)]">
                +{Math.floor(challenge.firstBlood.afterSec / 60)}:
                {pad2(challenge.firstBlood.afterSec % 60)} after start
              </span>
            </div>
          ) : (
            <p className="mt-4 rounded-lg border border-dashed border-[color-mix(in_srgb,var(--arena-red)_35%,var(--arena-line))] px-3.5 py-3 text-[13px] text-[var(--arena-red)]">
              No first blood yet — be the first
            </p>
          )}

          <section className="mt-5">
            <h3 className="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-[var(--arena-text-3)]">
              Objective
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--arena-ink)]">
              {challenge.objective}
            </p>
          </section>

          <div className="mt-4 rounded-lg border border-[var(--arena-line)] bg-[var(--arena-terminal)] p-4">
            <p className="font-mono text-xs text-[var(--arena-text-3)]">$ grader --hidden-set</p>
            <div className="mt-2 flex flex-wrap items-end gap-2.5">
              <p className="font-mono text-[22px] font-bold text-[var(--arena-lime-fg)]">
                {challenge.passCriteria.threshold}
              </p>
              <p className="font-mono text-[12.5px] text-[var(--arena-text-2)]">
                {challenge.passCriteria.budget}
              </p>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {challenge.knobs.map((k) => (
                <span
                  key={k}
                  className="rounded-md border border-[color-mix(in_srgb,var(--arena-cyan)_30%,var(--arena-line))] bg-[color-mix(in_srgb,var(--arena-cyan)_8%,transparent)] px-2 py-0.5 font-mono text-[10px] text-[var(--arena-cyan)]"
                >
                  {k}
                </span>
              ))}
            </div>
          </div>

          <section className="mt-5">
            <h3 className="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-[var(--arena-text-3)]">
              Difficulty rating · {challenge.solves} votes
            </h3>
            <div className="mt-2">
              <DifficultyHistogram votes={challenge.ratingVotes} animate={open} />
            </div>
          </section>

          <section className="mt-5">
            <h3 className="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-[var(--arena-text-3)]">
              Flag
            </h3>
            <div className="mt-2">
              <FlagCard
                solved={solved}
                solveTime={challenge.solveTime}
                points={challenge.currentPoints}
              />
            </div>
          </section>

          <section className="mt-5">
            <h3 className="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-[var(--arena-text-3)]">
              Recent captures
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {["NA", "RA", "TA", "SA", "NE"].map((initials, i) => (
                <span
                  key={initials}
                  className="flex size-7 items-center justify-center rounded-full border-2 border-[var(--arena-panel,var(--arena-surface))] bg-[color-mix(in_srgb,var(--arena-ink)_8%,transparent)] font-mono text-[9px] font-bold text-[var(--arena-text-2)]"
                  style={{ marginLeft: i > 0 ? -6 : 0 }}
                >
                  {initials}
                </span>
              ))}
              <span className="font-mono text-xs text-[var(--arena-text-2)]">
                +33 operators · last 3m ago
              </span>
            </div>
          </section>
        </div>

        <footer className="challenge-drawer-footer">
          <div className="flex gap-2.5">
            {clockExpired ? (
              <span className="flex flex-1 items-center justify-center rounded-md bg-[color-mix(in_srgb,var(--arena-red)_15%,transparent)] py-3 font-mono text-[12.5px] font-bold uppercase text-[var(--arena-red)]">
                Clock expired
              </span>
            ) : solved ? (
              <Link
                href={launchHref}
                className="flex flex-1 items-center justify-center gap-2 rounded-md border border-[var(--arena-line-2)] py-3 font-mono text-[12.5px] font-bold uppercase text-[var(--arena-ink)] hover:bg-[color-mix(in_srgb,var(--arena-ink)_5%,transparent)]"
              >
                Review lab
              </Link>
            ) : (
              <Link
                href={launchHref}
                className="flex flex-1 items-center justify-center gap-2 rounded-md bg-[#a6f23b] py-3 font-mono text-[12.5px] font-bold uppercase text-[#070b12] shadow-[0_0_18px_rgba(166,242,59,0.25)] hover:opacity-95"
              >
                <Terminal className="size-[15px]" aria-hidden />
                Launch lab
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(challenge.id);
                toast.success("Copied");
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--arena-line-2)] px-3.5 py-3 font-mono text-[10.5px] font-bold uppercase text-[var(--arena-text-2)]"
            >
              <Copy className="size-3.5" aria-hidden />
              Copy id
            </button>
          </div>
          <p className="mt-2.5 flex items-center gap-1.5 font-mono text-xs text-[var(--arena-text-2)]">
            <Clock className="size-[13px] text-[var(--arena-cyan)]" aria-hidden />
            Operation clock: <ClockFooter deadlineIso={deadline} />
          </p>
        </footer>
      </motion.div>
    </dialog>
  );
}
