"use client";

import { BarChart3, Calendar, Loader2, Share2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { routes, loginPath } from "@/config/routes";
import { formatEventDateTime } from "@/features/contests/event-details/format-event-datetime";
import type { EventDetailsData } from "@/features/contests/event-details/types";
import { useAuthSession } from "@/features/auth/use-auth-session";
import { contestsApi } from "@/features/contests/contests-api";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type EventHeaderProps = {
  event: EventDetailsData;
};

function DateBlock({ label, iso }: { label: string; iso: string }) {
  return (
    <div>
      <p className="text-[13px] text-[#6B7891]">{label}</p>
      <p
        className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-white"
        title="Based on your system's timezone"
      >
        <Calendar className="size-4 shrink-0 text-[#6B7891]" aria-hidden />
        {formatEventDateTime(iso)}
      </p>
    </div>
  );
}

const secondaryBtn =
  "inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#1E2636] px-5 text-sm font-semibold text-white transition-[background-color,transform,filter] duration-150 hover:bg-[#283246] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9FEF00]";

export function EventHeader({ event }: EventHeaderProps) {
  const router = useRouter();
  const { signedIn, resolved } = useAuthSession();
  const [pending, setPending] = useState(false);

  const playHref = routes.contestPlay(event.slug);
  const signInHref = loginPath(routes.ctfEvent(event.slug));

  const onEnroll = useCallback(async () => {
    if (pending) {
      return;
    }
    if (event.entered) {
      router.push(playHref);
      return;
    }
    if (!signedIn && resolved) {
      router.push(signInHref);
      return;
    }
    if (event.window === "closed" || (event.window === "open" && !event.canEnter)) {
      return;
    }
    setPending(true);
    try {
      await contestsApi.enter(event.slug);
      router.push(playHref);
    } catch (caught: unknown) {
      if (caught instanceof ApiError && caught.status === 401) {
        router.push(signInHref);
        return;
      }
    } finally {
      setPending(false);
    }
  }, [event, pending, playHref, resolved, router, signInHref, signedIn]);

  const primaryLabel = event.entered
    ? "Continue CTF"
    : event.window === "upcoming"
      ? "Notify me"
      : "Enroll CTF";

  const primaryDisabled =
    pending ||
    event.window === "closed" ||
    (event.window === "open" && !event.canEnter && !event.entered);

  async function onShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
    } catch {
      /* user cancelled */
    }
  }

  return (
    <header className="mt-5">
      <h1 className="text-[32px] font-semibold leading-tight tracking-tight text-white">{event.title}</h1>
      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:gap-10">
        <DateBlock label="Start date" iso={event.startAt} />
        <DateBlock label="End date" iso={event.endAt} />
      </div>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={primaryDisabled}
          onClick={() => void onEnroll()}
          className={cn(
            "inline-flex h-12 items-center justify-center gap-2 rounded-md px-6 text-sm font-semibold text-[#0F1520] transition-[filter,transform] duration-150",
            "bg-[#9FEF00] hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9FEF00]",
            "disabled:cursor-not-allowed disabled:opacity-45",
          )}
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {primaryLabel}
        </button>
        <Link href={routes.contestScoreboard(event.slug)} className={secondaryBtn}>
          <BarChart3 className="size-4" aria-hidden />
          View scoreboard
        </Link>
        <button type="button" className={secondaryBtn} onClick={() => void onShare()}>
          <Share2 className="size-4" aria-hidden />
          Share
        </button>
      </div>
    </header>
  );
}
