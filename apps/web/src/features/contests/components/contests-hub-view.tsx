"use client";

import {
  Bell,
  Clock,
  Droplets,
  Flag,
  LineChart,
  ListChecks,
  Play,
  Search,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { routes } from "@/config/routes";
import {
  countdownParts,
  pad2,
} from "@/features/contests/contest-countdown-parts";
import {
  formatCountdown,
  useDeadlineCountdown,
} from "@/features/contests/contest-clock";
import type { ContestLeaderboard } from "@/types/contest";
import type { ContestListItem, ContestWindow } from "@/types/contest";
import { contestsApi } from "../contests-api";

type HubTab = "open" | "upcoming" | "closed" | "entered";

const TABS: { id: HubTab; label: string }[] = [
  { id: "open", label: "Live" },
  { id: "upcoming", label: "Upcoming" },
  { id: "closed", label: "Archived" },
  { id: "entered", label: "My events" },
];

function cardWatermark(contest: ContestListItem) {
  const match = contest.slug.match(/(\d+)/);
  const num = match?.[1] ?? "0";
  const prefix = contest.slug.includes("beta") ? "B" : "W";
  return `${prefix}#${num.padStart(2, "0")}`;
}

function heroTitle(contest: ContestListItem) {
  return contest.title.replace(/Contest/gi, "CTF");
}

function slugKicker(slug: string) {
  const match = slug.match(/(\d+)/);
  const num = match?.[1] ?? "0";
  const prefix = slug.includes("beta") ? "beta_ctf" : "weekly_ctf";
  return `> ${prefix}_${num.padStart(2, "0")}`;
}

function heroLead(contest: ContestListItem) {
  if (contest.slug === "weekly-advanced-1") {
    return "15 RAG & Guardrails challenges. Break, tune and defend AI pipelines against a hidden grader — every pass drops a flag. Fastest operators climb the board.";
  }
  return contest.intent;
}

function cardOpsLabel(contest: ContestListItem, operatorCount?: number) {
  if (contest.window === "upcoming") {
    return operatorCount != null && operatorCount > 0
      ? `${operatorCount} registered`
      : "registration open";
  }
  if (operatorCount != null && operatorCount > 0) {
    return `${operatorCount} ops`;
  }
  return "— ops";
}

function feedClockOffset(index: number) {
  const now = new Date();
  now.setSeconds(now.getSeconds() - index * 47);
  return now.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function operatorInitials(name: string) {
  const parts = name.trim().split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function cardCountdownLabel(contest: ContestListItem) {
  if (contest.window === "upcoming") {
    return "STARTS IN";
  }
  if (contest.window === "open") {
    return "ENDS IN";
  }
  return "ENDED";
}

function primaryCardCta(contest: ContestListItem) {
  if (contest.window === "open") {
    if (contest.canEnter) {
      return { label: "JOIN", href: routes.contest(contest.slug), primary: true };
    }
    if (contest.entered) {
      return { label: "CONTINUE", href: routes.contest(contest.slug), primary: true };
    }
    return { label: "VIEW", href: routes.contest(contest.slug), primary: false };
  }
  if (contest.window === "upcoming") {
    return { label: "NOTIFY ME", href: routes.contest(contest.slug), primary: false, disabled: true };
  }
  return { label: "RESULTS", href: routes.contest(contest.slug), primary: false };
}

function HeroCountdown({
  deadlineIso,
  window,
}: {
  deadlineIso: string | null;
  window: ContestWindow;
}) {
  const remaining = useDeadlineCountdown(deadlineIso);
  if (remaining == null) {
    return null;
  }
  const parts = countdownParts(remaining);
  const boxes = [
    { label: "DAYS", value: pad2(parts.days) },
    { label: "HRS", value: pad2(parts.hours) },
    { label: "MIN", value: pad2(parts.minutes) },
    { label: "SEC", value: pad2(parts.seconds) },
  ];
  const label = window === "upcoming" ? "EVENT STARTS IN" : "EVENT ENDS IN";
  return (
    <div className="lp-ct-hub-hero-timer-block">
      <p className="lp-ct-hub-timer-label">{label}</p>
      <div className="lp-ct-hub-timer" aria-live="polite">
        {boxes.map((box, index) => (
          <div key={box.label} className="lp-ct-hub-timer-cell">
            <strong>{box.value}</strong>
            <span>{box.label}</span>
            {index < boxes.length - 1 ? (
              <span className="lp-ct-hub-timer-colon" aria-hidden>
                :
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function HubSidebar({
  featured,
  board,
}: {
  featured: ContestListItem | null;
  board: ContestLeaderboard | null;
}) {
  return (
    <aside className="lp-ct-hub-side" aria-label="Event activity">
      <div className="lp-ct-hub-feed">
        <div className="lp-ct-hub-feed-head">
          <span className="lp-ct-hub-terminal-dots" aria-hidden>
            <span />
            <span />
            <span />
          </span>
          <span className="lp-ct-hub-feed-title">live_feed.log</span>
          {featured?.window === "open" ? (
            <span className="lp-ct-hub-feed-live">
              <span className="lp-ct-hub-pulse" aria-hidden /> LIVE
            </span>
          ) : null}
        </div>
        <div className="lp-ct-hub-feed-body">
          {board && board.items.length > 0 ? (
            board.items.slice(0, 6).map((row, index) => (
              <p key={row.rank} className="lp-ct-hub-feed-line">
                <span className="lp-ct-hub-feed-ts">{feedClockOffset(index)}</span>{" "}
                <span className="lp-ct-hub-feed-user">{row.displayName}</span>{" "}
                {row.solvedCount > 0 ? (
                  <>
                    captured a flag{" "}
                    <span className="lp-ct-hub-feed-pts lp-ct-hub-feed-pts--up">
                      +{Math.round(row.totalScore / Math.max(row.solvedCount, 1))}
                    </span>
                  </>
                ) : (
                  <>
                    joined the board{" "}
                    <span className="lp-ct-hub-feed-pts lp-ct-hub-feed-pts--muted">
                      +0
                    </span>
                  </>
                )}
              </p>
            ))
          ) : (
            <p className="lp-ct-hub-feed-empty">
              Standings update here while the event is live.
            </p>
          )}
        </div>
      </div>

      <div className="lp-ct-hub-topops">
        <div className="lp-ct-hub-topops-head">
          <h3 className="lp-ct-hub-topops-title">Top operators</h3>
          {featured ? (
            <Link href={routes.contest(featured.slug)} className="lp-ct-hub-topops-all">
              view all →
            </Link>
          ) : null}
        </div>
        {board && board.items.length > 0 ? (
          <ol className="lp-ct-hub-topops-list">
            {board.items.slice(0, 3).map((row) => (
              <li key={row.rank}>
                <span className="lp-ct-hub-topops-rank">{row.rank}</span>
                <span className="lp-ct-hub-topops-avatar" aria-hidden>
                  {operatorInitials(row.displayName)}
                </span>
                <span className="lp-ct-hub-topops-name">{row.displayName}</span>
                <span className="lp-ct-hub-topops-score">{row.totalScore.toLocaleString()}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="lp-ct-hub-feed-empty">No scores yet.</p>
        )}
      </div>
    </aside>
  );
}

function HubEventCard({
  contest,
  finishRank,
  operatorCount,
}: {
  contest: ContestListItem;
  finishRank?: number | null;
  operatorCount?: number;
}) {
  const remaining = useDeadlineCountdown(contest.windowDeadlineAt);
  const cta = primaryCardCta(contest);
  const tone =
    contest.window === "open"
      ? "live"
      : contest.window === "upcoming"
        ? "upcoming"
        : "archived";

  return (
    <article className={`lp-ct-hub-card lp-ct-hub-card--${tone}`}>
      <span className="lp-ct-hub-card-watermark" aria-hidden>
        {cardWatermark(contest)}
      </span>
      <div className="lp-ct-hub-card-badges">
        {contest.window === "open" ? (
          <span className="lp-ct-hub-mini-badge lp-ct-hub-mini-badge--live">LIVE</span>
        ) : null}
        {contest.window === "upcoming" ? (
          <span className="lp-ct-hub-mini-badge lp-ct-hub-mini-badge--up">UPCOMING</span>
        ) : null}
        {contest.window === "closed" ? (
          <span className="lp-ct-hub-mini-badge lp-ct-hub-mini-badge--arch">ARCHIVED</span>
        ) : null}
        {contest.entered && contest.window === "closed" ? (
          <span className="lp-ct-hub-mini-badge lp-ct-hub-mini-badge--played">PLAYED</span>
        ) : null}
      </div>
      <h3 className="lp-ct-hub-card-title">{heroTitle(contest)}</h3>
      <div className="lp-ct-hub-card-stats">
        <span className="lp-ct-hub-card-stat">
          <ListChecks className="size-3.5" aria-hidden />
          {contest.problemCount} challenges
        </span>
        <span className="lp-ct-hub-card-stat">
          <Users className="size-3.5" aria-hidden />
          {cardOpsLabel(contest, operatorCount)}
        </span>
        <span className="lp-ct-hub-card-stat">
          <Clock className="size-3.5" aria-hidden />
          {contest.timeBoxMinutes}m
        </span>
      </div>
      {contest.entered && contest.window === "closed" ? (
        <p className="lp-ct-hub-card-you">
          {finishRank != null ? `YOU FINISHED #${finishRank}` : "YOU PLAYED THIS EVENT"}
        </p>
      ) : null}
      <div className="lp-ct-hub-card-foot">
        {cta.disabled ? (
          <button type="button" className="lp-ct-hub-btn lp-ct-hub-btn--ghost" disabled>
            <Bell className="size-4" aria-hidden />
            {cta.label}
          </button>
        ) : (
          <Link
            href={cta.href}
            className={`lp-ct-hub-btn${cta.primary ? " lp-ct-hub-btn--primary" : " lp-ct-hub-btn--ghost"}`}
          >
            {cta.primary ? <Play className="size-4" aria-hidden /> : null}
            {cta.label}
          </Link>
        )}
        {remaining != null && contest.window !== "closed" ? (
          <span className="lp-ct-hub-card-countdown">
            {cardCountdownLabel(contest)} {formatCountdown(remaining).toUpperCase()}
          </span>
        ) : null}
      </div>
    </article>
  );
}

function FeaturedHero({
  contest,
  operatorCount,
  flagsCaptured,
  firstBloods,
}: {
  contest: ContestListItem;
  operatorCount: number;
  flagsCaptured: number;
  firstBloods: string;
}) {
  return (
    <section className="lp-ct-hub-hero" aria-labelledby="ct-hub-featured-title">
      <div className="lp-ct-hub-hero-badges">
        {contest.window === "open" ? (
          <span className="lp-ct-hub-badge lp-ct-hub-badge--live">
            <span className="lp-ct-hub-pulse" aria-hidden /> LIVE
          </span>
        ) : null}
        <span className="lp-ct-hub-badge lp-ct-hub-badge--solo">SOLO</span>
        <span className="lp-ct-hub-badge lp-ct-hub-badge--advanced">ADVANCED</span>
        <span className="lp-ct-hub-badge lp-ct-hub-badge--pool">
          <LineChart className="size-3" aria-hidden />
          DYNAMIC SCORING
        </span>
      </div>
      <h2 id="ct-hub-featured-title" className="lp-ct-hub-hero-title">
        <span className="lp-ct-hub-hero-kicker-inline">{slugKicker(contest.slug)}</span>{" "}
        {heroTitle(contest)}
      </h2>
      <p className="lp-ct-hub-hero-lead">{heroLead(contest)}</p>
      <div className="lp-ct-hub-hero-mid">
        <HeroCountdown deadlineIso={contest.windowDeadlineAt} window={contest.window} />
        <div className="lp-ct-hub-hero-actions">
          <Link href={routes.contest(contest.slug)} className="lp-ct-hub-btn lp-ct-hub-btn--join">
            <Play className="size-4" aria-hidden />
            {contest.canEnter ? "JOIN EVENT" : contest.entered ? "CONTINUE" : "OPEN EVENT"}
          </Link>
          <Link
            href={routes.contestScoreboard(contest.slug)}
            className="lp-ct-hub-btn lp-ct-hub-btn--scoreboard"
          >
            <Trophy className="size-4" aria-hidden />
            SCOREBOARD
          </Link>
        </div>
      </div>
      <dl className="lp-ct-hub-stats">
        <div className="lp-ct-hub-stat">
          <Users className="lp-ct-hub-stat-icon lp-ct-hub-stat-icon--ops" aria-hidden />
          <dd>{operatorCount > 0 ? operatorCount.toLocaleString() : "—"}</dd>
          <dt>Operators</dt>
        </div>
        <div className="lp-ct-hub-stat">
          <Flag className="lp-ct-hub-stat-icon lp-ct-hub-stat-icon--flags" aria-hidden />
          <dd>{flagsCaptured > 0 ? flagsCaptured.toLocaleString() : "—"}</dd>
          <dt>Flags captured</dt>
        </div>
        <div className="lp-ct-hub-stat">
          <Droplets className="lp-ct-hub-stat-icon lp-ct-hub-stat-icon--blood" aria-hidden />
          <dd>{firstBloods}</dd>
          <dt>First bloods</dt>
        </div>
        <div className="lp-ct-hub-stat">
          <Clock className="lp-ct-hub-stat-icon lp-ct-hub-stat-icon--clock" aria-hidden />
          <dd>{contest.timeBoxMinutes}m</dd>
          <dt>Operation clock</dt>
        </div>
      </dl>
    </section>
  );
}

export function ContestsHubView({
  items,
  error,
}: {
  items: ContestListItem[] | null;
  error: boolean;
}) {
  const [tab, setTab] = useState<HubTab>("open");
  const [query, setQuery] = useState("");
  const [board, setBoard] = useState<ContestLeaderboard | null>(null);
  const [finishRanks, setFinishRanks] = useState<Record<string, number>>({});

  const featured = useMemo(() => {
    if (!items?.length) {
      return null;
    }
    return items.find((c) => c.window === "open") ?? items[0];
  }, [items]);

  useEffect(() => {
    if (!featured || featured.window !== "open") {
      setBoard(null);
      return;
    }
    let cancelled = false;
    contestsApi
      .leaderboard(featured.slug, 1, 10)
      .then((data) => {
        if (!cancelled) {
          setBoard(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBoard(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [featured]);

  useEffect(() => {
    if (items?.some((c) => c.window === "open")) {
      setTab("open");
    }
  }, [items]);

  useEffect(() => {
    if (!items?.length) {
      return;
    }
    const closedEntered = items.filter((c) => c.entered && c.window === "closed");
    if (closedEntered.length === 0) {
      return;
    }
    let cancelled = false;
    Promise.all(
      closedEntered.map(async (contest) => {
        try {
          const data = await contestsApi.leaderboard(contest.slug, 1, 200);
          const you = data.items.find((row) => row.isYou);
          return you ? ([contest.slug, you.rank] as const) : null;
        } catch {
          return null;
        }
      }),
    ).then((pairs) => {
      if (cancelled) {
        return;
      }
      const next: Record<string, number> = {};
      for (const pair of pairs) {
        if (pair) {
          next[pair[0]] = pair[1];
        }
      }
      setFinishRanks(next);
    });
    return () => {
      cancelled = true;
    };
  }, [items]);

  const counts = useMemo(() => {
    const base = { open: 0, upcoming: 0, closed: 0, entered: 0 };
    if (!items) {
      return base;
    }
    for (const contest of items) {
      base[contest.window as ContestWindow] += 1;
      if (contest.entered) {
        base.entered += 1;
      }
    }
    return base;
  }, [items]);

  const gridItems = useMemo(() => {
    if (!items) {
      return [];
    }
    const order: Record<ContestWindow, number> = {
      open: 0,
      upcoming: 1,
      closed: 2,
    };
    let list = [...items].sort((a, b) => order[a.window] - order[b.window]);
    if (tab === "entered") {
      list = list.filter((c) => c.entered);
    } else {
      list = list.filter((c) => c.window === tab);
    }
    const q = query.trim().toLowerCase();
    if (!q) {
      return list;
    }
    return list.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        c.intent.toLowerCase().includes(q),
    );
  }, [items, query, tab]);

  const flagsCaptured = useMemo(() => {
    if (!board?.items.length) {
      return 0;
    }
    return board.items.reduce((sum, row) => sum + row.solvedCount, 0);
  }, [board]);

  const firstBloods = useMemo(() => {
    if (!featured) {
      return "—";
    }
    const solvedOperators = board?.items.filter((row) => row.solvedCount > 0).length ?? 0;
    const claimed = Math.min(featured.problemCount, solvedOperators);
    return `${claimed}/${featured.problemCount}`;
  }, [board, featured]);

  if (error) {
    return (
      <div className="lp-ct-hub">
        <div className="lp-ct-error">
          <strong>Could not load contests</strong>
          <p>Check that the API is running, then refresh this page.</p>
        </div>
      </div>
    );
  }

  if (!items) {
    return <div className="lp-ct-hub lp-ct-hub--loading" aria-busy="true" />;
  }

  if (items.length === 0) {
    return (
      <div className="lp-ct-hub">
        <p className="lp-ct-hub-empty">No events published yet. Check back soon.</p>
      </div>
    );
  }

  return (
    <div className="lp-ct-hub">
      <div className="lp-ct-hub-top">
        {featured ? (
          <FeaturedHero
            contest={featured}
            operatorCount={board?.total ?? 0}
            flagsCaptured={flagsCaptured}
            firstBloods={firstBloods}
          />
        ) : null}
        <HubSidebar featured={featured} board={board} />
      </div>

      <div className="lp-ct-hub-toolbar">
        <div className="lp-ct-hub-tabs" role="tablist" aria-label="Filter events">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={`lp-ct-hub-tab${tab === item.id ? " is-active" : ""}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
              {counts[item.id] > 0 ? (
                <span className="lp-ct-hub-tab-count"> {counts[item.id]}</span>
              ) : null}
            </button>
          ))}
        </div>
        <label className="lp-ct-hub-search">
          <Search className="size-4" aria-hidden />
          <span className="sr-only">Search events</span>
          <input
            type="search"
            placeholder="Search events…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

      {gridItems.length === 0 ? (
        <p className="lp-ct-hub-empty">No events in this filter.</p>
      ) : (
        <section className="lp-ct-hub-grid" aria-label="Events">
          {gridItems.map((contest) => (
            <HubEventCard
              key={contest.slug}
              contest={contest}
              finishRank={finishRanks[contest.slug] ?? null}
              operatorCount={
                contest.slug === featured?.slug ? (board?.total ?? undefined) : undefined
              }
            />
          ))}
        </section>
      )}
    </div>
  );
}
