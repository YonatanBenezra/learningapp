"use client";

import { Info, Loader2, Play } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ArenaButton } from "@/components/arena/ArenaButton";
import { routes, loginPath } from "@/config/routes";
import { useAuthSession } from "@/features/auth/use-auth-session";
import { formatCountdown, remainingMs } from "@/features/contests/contest-clock";
import { contestsApi } from "@/features/contests/contests-api";
import { ApiError } from "@/lib/api-client";
import type { LobbyEvent } from "@/lib/arena/lobby-types";
import { JoinConfirmDialog } from "./JoinConfirmDialog";
import { cn } from "@/lib/utils";

type JoinCardProps = {
  event: LobbyEvent;
  compact?: boolean;
  className?: string;
  index?: number;
  onJoined?: () => void;
};

export function JoinCard({ event, compact, className, index = 0, onJoined }: JoinCardProps) {
  const reduce = useReducedMotion();
  const router = useRouter();
  const { signedIn, resolved: authResolved } = useAuthSession();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinPath = routes.contestPlay(event.slug);
  const signInHref = loginPath(routes.contest(event.slug));

  const disabledReason = (() => {
    if (event.window === "closed") {
      return "EVENT ENDED";
    }
    if (event.window === "upcoming") {
      const ms = remainingMs(event.startsAt);
      return `STARTS IN ${formatCountdown(ms).toUpperCase()}`;
    }
    if (!event.canEnter && event.window === "open") {
      return "EVENT ENDED";
    }
    return null;
  })();

  const runJoin = useCallback(async () => {
    setPending(true);
    setError(null);
    try {
      await contestsApi.enter(event.slug);
      onJoined?.();
      router.push(joinPath);
    } catch (caught: unknown) {
      if (caught instanceof ApiError && caught.status === 401) {
        router.push(signInHref);
        return;
      }
      setError(caught instanceof Error ? caught.message : "Could not join. Try again.");
    } finally {
      setPending(false);
      setDialogOpen(false);
    }
  }, [event.slug, joinPath, onJoined, router, signInHref]);

  function onPrimaryClick() {
    if (disabledReason || pending) {
      return;
    }
    if (!signedIn && authResolved) {
      router.push(signInHref);
      return;
    }
    setDialogOpen(true);
  }

  const buttonLabel = (() => {
    if (pending) {
      return "JOINING…";
    }
    if (disabledReason) {
      return disabledReason;
    }
    if (!signedIn && authResolved) {
      return "SIGN IN TO JOIN";
    }
    return "JOIN EVENT";
  })();

  const buttonVariant =
    !signedIn && authResolved && !disabledReason ? ("ghost" as const) : ("lime" as const);

  const card = (
      <section
        className={cn(
          "flex flex-col gap-4 rounded-xl border border-[color-mix(in_srgb,var(--arena-lime)_35%,transparent)] bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--arena-lime)_8%,transparent),var(--arena-surface))] p-5 sm:gap-4 sm:p-[22px]",
          className,
        )}
      >
        {!compact ? (
          <>
            <h2 className="text-xl font-bold tracking-[-0.01em] text-[var(--arena-ink)]">
              Ready to deploy?
            </h2>
            <p className="text-[13px] leading-normal text-[var(--arena-text-2)]">
              Join to unlock all {event.challengeCount} challenges. Your {event.clockMinutes}
              -minute operation clock starts immediately.
            </p>
            <dl className="grid grid-cols-3 overflow-hidden rounded-lg border border-[var(--arena-line)] bg-[color-mix(in_srgb,var(--arena-ink)_3%,transparent)] text-center">
              {[
                { value: event.maxPoints.toLocaleString(), label: "MAX PTS" },
                { value: `${event.clockMinutes}m`, label: "CLOCK" },
                { value: String(event.operatorCount), label: "OPS" },
              ].map((cell, i) => (
                <div
                  key={cell.label}
                  className={cn("px-3 py-2.5", i > 0 && "border-l border-[var(--arena-line)]")}
                >
                  <dd className="font-mono text-[15px] font-semibold text-[var(--arena-ink)]">
                    {cell.value}
                  </dd>
                  <dt className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.1em] text-[var(--arena-text-3)]">
                    {cell.label}
                  </dt>
                </div>
              ))}
            </dl>
          </>
        ) : null}
        <ArenaButton
          variant={buttonVariant}
          className={cn("w-full", (disabledReason || pending) && "pointer-events-none opacity-55")}
          onClick={onPrimaryClick}
        >
          {pending ? (
            <Loader2 className="size-[15px] animate-spin" aria-hidden />
          ) : (
            <Play className="size-[15px]" aria-hidden />
          )}
          {buttonLabel}
        </ArenaButton>
        {!compact && error ? (
          <p className="text-sm text-[var(--arena-red)]" role="alert">
            {error}
          </p>
        ) : null}
        {!compact ? (
          <p className="flex items-start gap-2 text-[11.5px] leading-snug text-[var(--arena-text-3)]">
            <Info className="mt-0.5 size-[13px] shrink-0" aria-hidden />
            One operation per account · can&apos;t be restarted
          </p>
        ) : null}
      </section>
  );

  return (
    <>
      {compact ? (
        card
      ) : (
        <motion.div
          initial={reduce ? false : { opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: reduce ? 0 : 0.45, delay: reduce ? 0 : 0.1 + index * 0.05 }}
        >
          {card}
        </motion.div>
      )}
      <JoinConfirmDialog
        open={dialogOpen}
        clockMinutes={event.clockMinutes}
        onConfirm={() => void runJoin()}
        onCancel={() => setDialogOpen(false)}
      />
    </>
  );
}
