"use client";

import { BarChart3, ChevronRight, Copy, Loader2, Share2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { loginPath, routes } from "@/config/routes";
import type { EventDetailsData } from "@/features/contests/event-details/types";
import { useAuthSession } from "@/features/auth/use-auth-session";
import { contestsApi } from "@/features/contests/contests-api";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type EventHeroActionsProps = {
  event: EventDetailsData;
};

export function EventHeroActions({ event }: EventHeroActionsProps) {
  const router = useRouter();
  const { signedIn, resolved } = useAuthSession();
  const [pending, setPending] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

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

  async function copyLink() {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setShareOpen(false);
  }

  return (
    <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
      <button
        type="button"
        disabled={primaryDisabled}
        onClick={() => void onEnroll()}
        className={cn(
          "inline-flex h-[46px] items-center justify-center gap-1 rounded-md px-6 text-sm font-semibold text-[#0F1520] transition-opacity duration-150",
          "bg-[#9FEF00] hover:opacity-92 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9FEF00]",
          "disabled:cursor-not-allowed disabled:opacity-45",
        )}
      >
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {primaryLabel}
        <ChevronRight className="size-4" aria-hidden />
      </button>
      <Link
        href={routes.contestScoreboard(event.slug)}
        className="inline-flex h-[46px] items-center justify-center gap-2 rounded-md bg-[#1E2636] px-5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#283246] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9FEF00]"
      >
        <BarChart3 className="size-4" aria-hidden />
        View scoreboard
      </Link>
      <div className="relative" ref={shareRef}>
        <button
          type="button"
          className="inline-flex size-[46px] items-center justify-center rounded-md border border-[#2A3446] text-[#A4B1CD] transition-colors duration-150 hover:border-[#9FEF00]/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9FEF00]"
          aria-label="Share event"
          aria-expanded={shareOpen}
          onClick={() => setShareOpen((v) => !v)}
        >
          <Share2 className="size-4" aria-hidden />
        </button>
        {shareOpen ? (
            <div className="absolute left-0 top-full z-20 mt-2 min-w-[160px] overflow-hidden rounded-md border border-[#232C3D] bg-[#151C2B] py-1 shadow-xl sm:left-auto sm:right-0">
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#A4B1CD] hover:bg-[#1B2434] hover:text-white"
                onClick={() => void copyLink()}
              >
                <Copy className="size-3.5" aria-hidden />
                Copy link
              </button>
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#A4B1CD] hover:bg-[#1B2434] hover:text-white"
              >
                X
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[#A4B1CD] hover:bg-[#1B2434] hover:text-white"
              >
                LinkedIn
              </a>
            </div>
        ) : null}
      </div>
    </div>
  );
}
