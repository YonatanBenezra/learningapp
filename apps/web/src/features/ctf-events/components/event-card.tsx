"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, type MouseEvent } from "react";
import { routes, loginPath } from "@/config/routes";
import { useAuthSession } from "@/features/auth/use-auth-session";
import { CtfBadge } from "@/features/ctf-events/components/badge";
import { BannerPlaceholder } from "@/features/ctf-events/components/banner-placeholder";
import { formatEventDateRange } from "@/features/ctf-events/format-event-date";
import type { CtfEvent } from "@/features/ctf-events/types";
import { contestsApi } from "@/features/contests/contests-api";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

function playersLabel(event: CtfEvent) {
  if (event.capacity != null && event.capacity > 0) {
    return `${event.players}/${event.capacity} players`;
  }
  return `${event.players.toLocaleString()} players`;
}

export function EventCard({ event }: { event: CtfEvent }) {
  const router = useRouter();
  const { signedIn, resolved: authResolved } = useAuthSession();
  const [pending, setPending] = useState(false);
  const isLive = event.status === "live";
  const showEnrollHover = isLive && !event.joined;

  const lobbyHref = routes.contest(event.id);
  const playHref = routes.contestPlay(event.id);
  const signInHref = loginPath(lobbyHref);

  const onEnroll = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (pending) {
        return;
      }
      if (!signedIn && authResolved) {
        router.push(signInHref);
        return;
      }
      setPending(true);
      try {
        await contestsApi.enter(event.id);
        router.push(playHref);
      } catch (caught: unknown) {
        if (caught instanceof ApiError && caught.status === 401) {
          router.push(signInHref);
          return;
        }
        router.push(lobbyHref);
      } finally {
        setPending(false);
      }
    },
    [authResolved, event.id, lobbyHref, pending, playHref, router, signInHref, signedIn],
  );

  return (
    <article
      className={cn(
        "group relative flex h-[388px] flex-col rounded-sm bg-platform-card p-3 transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-platform-card-hover",
      )}
    >
      <Link href={lobbyHref} className="absolute inset-0 z-0 rounded-sm" aria-label={event.title} />
      <div className="relative z-[1] shrink-0 pointer-events-none">
        <BannerPlaceholder
          title={event.title}
          variant={event.bannerVariant}
          className="rounded-sm"
        />
        {event.badges.length > 0 ? (
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {event.badges.map((b) => (
              <CtfBadge key={b} kind={b} />
            ))}
          </div>
        ) : null}
      </div>
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col px-2.5 pb-2.5 pt-[18px] pointer-events-none">
        <h2 className="truncate text-xl font-medium text-platform-text">{event.title}</h2>
        <p className="mt-1.5 text-sm font-normal text-platform-text">
          {formatEventDateRange(event.start, event.end)}
        </p>
        <div className="mt-auto pt-4">
          <p className="text-sm font-medium text-platform-text">{playersLabel(event)}</p>
          {event.joined ? (
            <p className="mt-1 text-sm text-platform-text/80">Joined this event</p>
          ) : null}
        </div>
      </div>
      {showEnrollHover ? (
        <button
          type="button"
          disabled={pending}
          onClick={onEnroll}
          className="pointer-events-auto absolute bottom-1.5 right-3 z-[2] inline-flex h-10 min-w-[120px] items-center justify-center gap-2 rounded-sm bg-platform-accent px-5 text-sm font-medium text-platform-accent-on opacity-0 shadow-md transition-[opacity,transform] duration-150 hover:opacity-90 group-hover:opacity-100 group-focus-within:opacity-100 disabled:opacity-70"
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Enrolling…
            </>
          ) : (
            "Enroll"
          )}
        </button>
      ) : null}
    </article>
  );
}
