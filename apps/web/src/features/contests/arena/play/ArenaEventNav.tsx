"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { BarChart3, Bell, Flag, HelpCircle } from "lucide-react";
import { routes } from "@/config/routes";
import { ctfEventDisplayTitle } from "@/features/contests/arena/lib/ctf-event-title";
import { contestsApi } from "@/features/contests/contests-api";
import { globalEventEnded } from "@/features/contests/arena/play/play-contest-phase";
import { CountdownPill } from "@/features/contests/arena/play/countdown-pill";
import type { ContestDetail } from "@/types/contest";
import { cn } from "@/lib/utils";
import "./arena-event-nav.css";
import "./play-htb.css";

function slugFromContestPath(pathname: string): string | null {
  const match = pathname.match(/^\/contests\/([^/]+)\/(arena|scoreboard)\/?$/);
  return match?.[1] ?? null;
}

function activeTabId(pathname: string): "arena" | "scoreboard" {
  return pathname.includes("/scoreboard") ? "scoreboard" : "arena";
}

const TABS = (slug: string) =>
  [
    {
      id: "arena" as const,
      label: "Scenarios",
      href: routes.contestArena(slug),
      Icon: Flag,
    },
    {
      id: "scoreboard" as const,
      label: "Scoreboard",
      href: routes.contestScoreboard(slug),
      Icon: BarChart3,
    },
  ] as const;

export function ArenaEventNav() {
  const pathname = usePathname();
  const slug = slugFromContestPath(pathname);
  const tabActive = activeTabId(pathname);
  const [contest, setContest] = useState<ContestDetail | null>(null);

  useLayoutEffect(() => {
    document.documentElement.dataset.workspace = "catalog";
    document.documentElement.dataset.arenaNav = "1";
    return () => {
      delete document.documentElement.dataset.arenaNav;
    };
  }, []);

  const tabs = useMemo(() => (slug ? TABS(slug) : []), [slug]);

  useEffect(() => {
    if (!slug) {
      setContest(null);
      return;
    }
    let cancelled = false;
    void contestsApi
      .getBySlug(slug)
      .then((c) => {
        if (!cancelled) {
          setContest(c);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setContest(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!slug) {
    return null;
  }

  const title = contest ? ctfEventDisplayTitle(contest.title) : slug;
  const ended = contest ? globalEventEnded(contest) : false;
  const windowEnd = contest?.windowDeadlineAt ?? contest?.endsAt ?? null;

  return (
    <header className="arena-event-nav lp-play-bleed">
      <div className="arena-event-nav__bar">
        <div className="lp-play-container arena-event-nav__inner px-4 sm:px-6">
          <div className="arena-event-nav__left">
            <Link href={routes.ctfEvent(slug)} className="arena-event-nav__title truncate">
              {title}
            </Link>
            <nav className="arena-event-nav__tabs" aria-label="Contest sections">
              {tabs.map((tab) => {
                const active = tab.id === tabActive;
                const Icon = tab.Icon;
                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    className={cn("arena-event-nav__tab", active && "is-active")}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon
                      className="arena-event-nav__tab-icon size-4 shrink-0"
                      fill={active && tab.id === "arena" ? "currentColor" : "none"}
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <span>{tab.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="arena-event-nav__actions">
            <CountdownPill
              endsAt={windowEnd}
              ended={ended}
              className="arena-event-nav__countdown max-md:hidden"
            />
            <CountdownPill
              endsAt={windowEnd}
              ended={ended}
              compact
              className="md:hidden"
            />
            <button type="button" className="arena-event-nav__icon-btn" aria-label="Help">
              <HelpCircle className="size-[18px] stroke-[1.75]" aria-hidden />
            </button>
            <button
              type="button"
              className="arena-event-nav__icon-btn"
              aria-label="Notifications"
            >
              <Bell className="size-[18px] stroke-[1.75]" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
