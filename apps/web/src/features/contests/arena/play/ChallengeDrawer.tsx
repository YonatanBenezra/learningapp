"use client";

import { Droplet, Terminal, Users, X } from "lucide-react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { routes } from "@/config/routes";
import { ARENA_CATEGORIES, avatarColorForName } from "@/features/contests/arena/lib/categories";
import { exerciseBriefSnippet } from "@/features/contests/arena/lib/exercise-brief";
import { launchSlug } from "@/features/contests/arena/lib/play-mock";
import type { PlayBoardChallenge } from "@/features/contests/arena/lib/play-types";
import { contestsApi } from "@/features/contests/contests-api";
import type { ContestDetail } from "@/types/contest";
import { cn } from "@/lib/utils";
import { pad2 } from "@/features/contests/contest-countdown-parts";
import { drawerScoringMessage } from "./play-contest-phase";
import { DifficultyHistogram } from "./DifficultyHistogram";
import { FlagSubmit } from "./FlagSubmit";
import "./challenge-drawer.css";
import "./play-htb.css";

type DrawerTab = "challenge" | "solves";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#6B7891]">{children}</h3>
  );
}

export function ChallengeDrawer({
  open,
  challenge,
  contest,
  contestSlug,
  onClose,
  scoringClosed,
}: {
  open: boolean;
  challenge: PlayBoardChallenge | null;
  contest: ContestDetail;
  contestSlug: string;
  onClose: () => void;
  scoringClosed: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const reduce = useReducedMotion();
  const [tab, setTab] = useState<DrawerTab>("challenge");
  const [description, setDescription] = useState<string | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);

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

  useEffect(() => {
    if (open) {
      setTab("challenge");
    }
  }, [open, challenge?.id]);

  useEffect(() => {
    if (!open || !challenge) {
      setDescription(null);
      return;
    }
    const slug = launchSlug(challenge);
    let cancelled = false;
    setBriefLoading(true);
    void contestsApi
      .getExercise(contestSlug, slug)
      .then((exercise) => {
        if (!cancelled) {
          setDescription(exerciseBriefSnippet(exercise.briefMd));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDescription(
            challenge.objective ??
              "Open the lab for the full brief and hidden grader criteria.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setBriefLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, challenge, contestSlug]);

  if (!challenge) {
    return (
      <dialog ref={ref} className="challenge-drawer-dialog" onClose={onClose} aria-hidden />
    );
  }

  const meta = ARENA_CATEGORIES[challenge.categoryId];
  const Icon = meta.Icon;
  const solved = challenge.variant === "solved";
  const problemSlug = launchSlug(challenge);
  const launchHref = routes.contestProblem(contestSlug, problemSlug);
  const hasDocker = challenge.knobs?.some((k) => /docker|instance|sandbox/i.test(k)) ?? false;

  const panelVariants = reduce
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, x: -24 },
        visible: { opacity: 1, x: 0 },
      };

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
        transition={
          reduce
            ? { duration: 0.2 }
            : { type: "spring", stiffness: 420, damping: 32, mass: 0.85 }
        }
      >
        <div className="challenge-drawer-scroll">
          <header className="flex items-start gap-3">
            <span className="play-category-tile flex size-11 shrink-0 items-center justify-center rounded-sm">
              <Icon className="size-6" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="play-difficulty-label">{challenge.difficulty}</span>
                <span className="text-[11px] font-medium uppercase tracking-wide text-[#6B7891]">
                  {meta.name}
                </span>
                <span className="font-mono text-[11px] text-[#6B7891]">{challenge.code}</span>
              </div>
              <h2
                id="challenge-drawer-title"
                className="mt-2 text-xl font-semibold leading-snug text-white"
              >
                {challenge.title}
              </h2>
              <p className="mt-1 text-xs text-[#6B7891]">
                Author{" "}
                <span className="text-[#A4B1CD]">LabPath · {challenge.code}</span>
              </p>
            </div>
            <button
              type="button"
              className="flex size-8 shrink-0 items-center justify-center rounded-sm border border-[#2A3446] text-[#A4B1CD] transition-colors hover:border-[#9FEF00]/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FEF00]/40"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </header>

          <div className="challenge-drawer-tabs" role="tablist">
            {(
              [
                { id: "challenge" as const, label: "Overview" },
                { id: "solves" as const, label: "Solves" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={cn("challenge-drawer-tab", tab === t.id && "is-active")}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "challenge" ? (
            <div role="tabpanel">
              <div className="grid grid-cols-3 overflow-hidden rounded-sm border border-[#232C3D] bg-[#18202F]">
                {[
                  {
                    label: "Points",
                    value: (
                      <>
                        <span className={solved ? "text-[#9FEF00]" : "text-white"}>
                          {challenge.currentPoints}
                        </span>
                        <span className="text-xs text-[#6B7891]"> / {challenge.base}</span>
                      </>
                    ),
                  },
                  { label: "Solves", value: challenge.solves },
                  { label: "Your tries", value: challenge.attemptTries ?? 0 },
                ].map((cell, i) => (
                  <div
                    key={cell.label}
                    className={cn("px-3 py-3", i > 0 && "border-l border-[#232C3D]")}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7891]">
                      {cell.label}
                    </p>
                    <p className="mt-1 font-mono text-lg tabular-nums text-white">{cell.value}</p>
                  </div>
                ))}
              </div>

              {challenge.firstBlood ? (
                <div className="mt-4 flex flex-wrap items-center gap-2 rounded-sm border border-[#FF5A5F]/25 bg-[#FF5A5F]/5 px-3 py-2.5">
                  <Droplet className="size-3.5 text-[#FF5A5F]" aria-hidden />
                  <span className="text-[11px] font-semibold uppercase text-[#FF5A5F]">
                    First blood
                  </span>
                  <span
                    className="flex size-6 items-center justify-center rounded-full text-[9px] font-bold"
                    style={{
                      color: avatarColorForName(challenge.firstBlood.user),
                      backgroundColor: `color-mix(in srgb, ${avatarColorForName(challenge.firstBlood.user)} 22%, #151C2B)`,
                    }}
                  >
                    {challenge.firstBlood.user.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="text-sm font-medium text-white">{challenge.firstBlood.user}</span>
                  <span className="ml-auto font-mono text-xs text-[#6B7891]">
                    {Math.floor(challenge.firstBlood.afterSec / 60)}:
                    {pad2(challenge.firstBlood.afterSec % 60)} after start
                  </span>
                </div>
              ) : (
                <p className="mt-4 rounded-sm border border-dashed border-[#2A3446] px-3 py-2.5 text-sm text-[#6B7891]">
                  No first blood yet — be the first.
                </p>
              )}

              <section className="mt-5 space-y-2">
                <SectionTitle>Description</SectionTitle>
                <p className="text-sm leading-relaxed text-[#A4B1CD]">
                  {briefLoading
                    ? "Loading brief…"
                    : (description ??
                      "Open the lab for the full brief and hidden grader criteria.")}
                </p>
                {challenge.passCriteria ? (
                  <div className="mt-3 rounded-sm border border-[#232C3D] bg-[#0F1520] p-4">
                    <p className="font-mono text-xs text-[#6B7891]">Pass criteria</p>
                    <p className="mt-1 font-mono text-base font-semibold text-[#9FEF00]">
                      {challenge.passCriteria.threshold}
                    </p>
                    <p className="mt-1 font-mono text-xs text-[#A4B1CD]">
                      {challenge.passCriteria.budget}
                    </p>
                    {challenge.knobs?.length ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {challenge.knobs.map((k) => (
                          <span
                            key={k}
                            className="rounded border border-[#2A3446] bg-[#18202F] px-2 py-0.5 font-mono text-[10px] text-[#A4B1CD]"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-[#6B7891]">
                    Pass criteria are enforced by the hidden grader in the lab.
                  </p>
                )}
              </section>

              {challenge.ratingVotes?.length ? (
                <section className="mt-5 space-y-2">
                  <SectionTitle>Community rating</SectionTitle>
                  <DifficultyHistogram votes={challenge.ratingVotes} animate={open} />
                </section>
              ) : null}

              <section className="mt-5">
                <FlagSubmit scoringClosed={scoringClosed} solved={solved} />
              </section>
            </div>
          ) : (
            <div role="tabpanel">
              <p className="mb-3 flex items-center gap-2 text-sm text-[#6B7891]">
                <Users className="size-4" aria-hidden />
                Per-challenge solve log is not published yet.
              </p>
              <p className="rounded-sm border border-dashed border-[#2A3446] px-4 py-6 text-center text-sm text-[#6B7891]">
                Pass the hidden grader in the lab — your capture counts toward the live
                scoreboard.
              </p>
            </div>
          )}
        </div>

        <footer className="challenge-drawer-footer">
          {scoringClosed && drawerScoringMessage(contest) ? (
            <p className="mb-3 text-center text-xs text-[#6B7891]">
              {drawerScoringMessage(contest)}
            </p>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            {solved ? (
              <Link
                href={launchHref}
                className="flex h-10 flex-1 items-center justify-center rounded-sm border border-[#2A3446] text-sm font-semibold text-white transition-colors hover:border-[#9FEF00]/50"
              >
                Review lab
              </Link>
            ) : (
              <Link
                href={launchHref}
                className="flex h-10 flex-1 items-center justify-center gap-2 rounded-sm bg-[#9FEF00] text-sm font-semibold text-[#0F1520] transition-opacity hover:opacity-95"
              >
                <Terminal className="size-4" aria-hidden />
                {hasDocker ? "Start instance" : "Open lab"}
              </Link>
            )}
            {scoringClosed && contest.virtualPracticeAvailable ? (
              <Link
                href={routes.contestPracticeProblem(contestSlug, problemSlug)}
                className="flex h-10 flex-1 items-center justify-center rounded-sm border border-[#2A3446] text-sm font-semibold text-[#A4B1CD] transition-colors hover:border-[#9FEF00]/50 hover:text-white"
              >
                Virtual practice
              </Link>
            ) : null}
          </div>
        </footer>
      </motion.div>
    </dialog>
  );
}
