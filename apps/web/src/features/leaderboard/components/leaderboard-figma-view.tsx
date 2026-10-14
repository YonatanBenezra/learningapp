"use client";

import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
  type Transition,
} from "motion/react";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  FileText,
  Image as ImageIcon,
  Layers,
  LineChart,
  Search,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import { routes } from "@/config/routes";
import { useAuthSession } from "@/features/auth/use-auth-session";
import { leaderboardApi } from "@/features/leaderboard/leaderboard-api";
import {
  mapLeaderboardEntry,
  buildPodiumSlots,
  LEADERBOARD_NEXT_GOAL,
  LEADERBOARD_PAGE_SUBTITLE,
  LEADERBOARD_SPARSE_TABLE_BODY,
  LEADERBOARD_SPARSE_TABLE_TITLE,
  LEADERBOARD_SUMMARY_COPY,
  PODIUM_OPEN_SPOT_MESSAGE,
  PODIUM_OPEN_SPOT_START_SLUG,
  sortEntriesForPeriod,
  TRACK_COLORS,
  TRACK_LABELS,
  TRACK_ORDER,
  type PodiumSlot,
  type TrackId,
  TRACK_FILTER_OPTIONS,
  type PeriodFilter,
  type PodiumLearner,
  type RankingRow,
  type TrackFilter,
  type Trend,
} from "@/features/leaderboard/leaderboard-figma-catalog";
import { ApiError } from "@/lib/api-client";
import type { LeaderboardEntry, LeaderboardResponse } from "@/types/leaderboard";

const E: Transition["ease"] = [0.2, 0, 0, 1];
const TABLE_PAGE_SIZE = 10;

const TRACK_ICON: Record<TrackId, typeof FileText> = {
  rag: FileText,
  eval: BarChart3,
  guard: Shield,
  prompt: ImageIcon,
};

function PodiumStrongestIn({ tracks }: { tracks: TrackId[] }) {
  if (tracks.length === 0) {
    return null;
  }
  return (
    <div className="lp-lb-podium-tracks">
      <span className="lp-lb-podium-tracks-label">Strongest in</span>
      {tracks.map((track) => {
        const Icon = TRACK_ICON[track];
        return (
          <span key={track} className="lp-lb-track-chip">
            <Icon size={12} aria-hidden />
            {TRACK_LABELS[track]}
          </span>
        );
      })}
    </div>
  );
}

const PERIOD_SEGMENTS: { id: PeriodFilter; label: string }[] = [
  { id: "30d", label: "30 days" },
  { id: "season", label: "Season" },
  { id: "all", label: "All time" },
];

function avatarClass(tone: RankingRow["tone"]) {
  return `lp-lb-avatar--${tone}`;
}

function FadeUp({
  delay,
  children,
  className,
}: {
  delay: number;
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduceMotion ? { duration: 0 } : { duration: 0.5, ease: E, delay, opacity: { ease: "easeOut" } }
      }
    >
      {children}
    </motion.div>
  );
}

function useCountUp(target: number, delay: number, duration: number, enabled: boolean) {
  const reduceMotion = useReducedMotion();
  const [value, setValue] = useState(reduceMotion || !enabled ? target : 0);

  useEffect(() => {
    if (reduceMotion || !enabled) {
      setValue(target);
      return;
    }
    const startAt = performance.now() + delay * 1000;
    let raf = 0;
    const tick = (now: number) => {
      if (now < startAt) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(1, (now - startAt) / duration);
      const eased = 1 - (1 - t) ** 3;
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, delay, duration, enabled, reduceMotion]);

  return value.toLocaleString("en-US");
}

function TrackDropdown({
  value,
  onChange,
}: {
  value: TrackFilter;
  onChange: (id: TrackFilter) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const label = TRACK_FILTER_OPTIONS.find((o) => o.id === value)?.label ?? "All tracks";

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="lp-lb-select-wrap" ref={ref}>
      <button
        type="button"
        className="lp-lb-select-btn"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((o) => !o)}
      >
        {label}
        <ChevronDown size={14} aria-hidden />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            className="lp-lb-menu"
            role="listbox"
            aria-label="Track filter"
            initial={{ opacity: 0, scale: 0.97, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ duration: reduceMotion ? 0 : 0.15 }}
          >
            {TRACK_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={opt.id === value}
                className={opt.id === value ? "is-active" : undefined}
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function formatUpdatedAgo(fetchedAt: Date | null): string {
  if (!fetchedAt) {
    return "live from practice passes";
  }
  const mins = Math.max(0, Math.floor((Date.now() - fetchedAt.getTime()) / 60_000));
  if (mins < 1) {
    return "updated just now";
  }
  if (mins === 1) {
    return "updated 1 min ago";
  }
  return `updated ${mins} min ago`;
}

const TRACK_BARS_CAP = 8;

function trackBarCount(uniquePasses: number): number {
  if (uniquePasses <= 0) {
    return 0;
  }
  if (uniquePasses === 1) {
    return 1;
  }
  if (uniquePasses === 2) {
    return 2;
  }
  return Math.min(TRACK_BARS_CAP, uniquePasses);
}

function TrackBars({ trackPasses }: { trackPasses: RankingRow["trackPasses"] }) {
  const activeTracks = TRACK_ORDER.filter((track) => (trackPasses[track] ?? 0) > 0);
  const segments = TRACK_ORDER.flatMap((track) => {
    const count = trackPasses[track] ?? 0;
    const bars = trackBarCount(count);
    if (bars === 0) {
      return [];
    }
    const isLastGroup = track === activeTracks[activeTracks.length - 1];
    return Array.from({ length: bars }, (_, index) => {
      const isLastInGroup = index === bars - 1;
      return (
        <span
          key={`${track}-${index}`}
          className={`lp-lb-track-seg lp-lb-track-seg--${track}${
            isLastInGroup && !isLastGroup ? " lp-lb-track-seg--group-end" : ""
          }`}
          style={{ background: TRACK_COLORS[track] }}
          title={`${TRACK_LABELS[track]}: ${count}`}
        />
      );
    });
  });

  if (segments.length === 0) {
    return (
      <div className="lp-lb-track-bar lp-lb-track-bar--empty" aria-label="No track activity">
        {TRACK_ORDER.map((track) => (
          <span key={track} className="lp-lb-track-seg lp-lb-track-seg--ghost" title={TRACK_LABELS[track]} />
        ))}
      </div>
    );
  }

  return (
    <div className="lp-lb-track-bar" aria-label="Track activity">
      {segments}
    </div>
  );
}

function YouNextGoal({ currentRank }: { currentRank: number }) {
  const targetRank = Math.max(1, currentRank - 2);
  const goal = LEADERBOARD_NEXT_GOAL;

  return (
    <div className="lp-lb-next-goal">
      <p>
        <ArrowRight size={14} aria-hidden />
        Pass one more problem to reach #{targetRank}.{" "}
        <strong className="lp-lb-next-goal-task">{goal.title}</strong> has a {goal.solveRate}%
        solve rate.
      </p>
      <Link href={routes.exercise(goal.slug)} className="lp-lb-next-btn">
        Start {goal.id}
        <ArrowRight size={14} aria-hidden />
      </Link>
    </div>
  );
}

function TrendCell({ trend, index }: { trend: Trend; index: number }) {
  const reduceMotion = useReducedMotion();
  const text =
    trend.dir === "flat" ? "–" : trend.dir === "up" ? `▲ ${trend.delta}` : `▼ ${trend.delta}`;
  const cls =
    trend.dir === "up" ? "lp-lb-trend--up" : trend.dir === "down" ? "lp-lb-trend--down" : "lp-lb-trend--flat";

  return (
    <motion.span
      className={`lp-lb-col-trend ${cls}`}
      initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : trend.dir === "down" ? -4 : 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduceMotion ? 0 : 0.65 + index * 0.035 + 0.2, duration: 0.35, ease: E }}
    >
      {text}
    </motion.span>
  );
}

function RankingTableRow({
  row,
  index,
  flash,
  stickyYou,
  youRail,
}: {
  row: RankingRow;
  index: number;
  flash?: "up" | "down" | null;
  stickyYou?: boolean;
  youRail?: boolean;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      layout={!reduceMotion}
      transition={{ type: "spring", stiffness: 380, damping: 32, duration: reduceMotion ? 0 : 0.35 }}
      initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
    >
      <Link
        href={routes.profile(row.id)}
        className={`lp-lb-table-row${row.isYou ? " lp-lb-table-row--you" : ""}${
          stickyYou ? " lp-lb-table-row--you-sticky" : ""
        }${flash === "up" ? " lp-lb-table-row--flash-up" : ""}${
          flash === "down" ? " lp-lb-table-row--flash-down" : ""
        }`}
      >
        {row.isYou && youRail ? (
          <motion.span
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 3,
              background: "var(--ember)",
              transformOrigin: "top center",
            }}
            initial={{ scaleY: reduceMotion ? 1 : 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: reduceMotion ? 0 : 0.65 + index * 0.035 + 0.35, duration: 0.4, ease: E }}
          />
        ) : null}
        <span className={`lp-lb-col-rank${row.isYou ? " lp-lb-col-rank--you" : ""}`}>
          #{row.rank}
        </span>
        <div className="lp-lb-learner">
          <span className={`lp-lb-learner-avatar ${avatarClass(row.tone)}`}>{row.initials}</span>
          <div className="lp-lb-learner-text">
            <div className="lp-lb-learner-name-row">
              <span className="lp-lb-learner-name">{row.name}</span>
              {row.isYou ? <span className="lp-lb-you-chip">YOU</span> : null}
            </div>
            <span className="lp-lb-learner-handle">{row.handle}</span>
          </div>
        </div>
        <span className="lp-lb-col-mono lp-lb-col-solves">{row.solves}</span>
        <span className="lp-lb-col-mono lp-lb-col-recent">{row.recent}</span>
        <span className="lp-lb-col-tracks">
          <TrackBars trackPasses={row.trackPasses} />
        </span>
        <span className={`lp-lb-col-rating${row.isYou ? " lp-lb-col-rating--you" : ""}`}>
          {row.rating.toLocaleString("en-US")}
        </span>
        <TrendCell trend={row.trend} index={index} />
      </Link>
    </motion.div>
  );
}

function PodiumCard({
  learner,
  delay,
  isYou,
}: {
  learner: PodiumLearner;
  delay: number;
  isYou?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const isFirst = learner.rank === 1;
  const ratingDisplay = useCountUp(learner.rating, delay + 0.15, 1000, true);

  return (
    <motion.article
      className={`lp-lb-podium-card${isFirst ? " lp-lb-podium-card--first" : ""}`}
      initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        isFirst && !reduceMotion
          ? { type: "spring", stiffness: 220, damping: 18, delay }
          : { duration: 0.6, ease: E, delay }
      }
    >
      {isFirst ? (
        <motion.div
          className="lp-lb-podium-glow"
          initial={{ opacity: reduceMotion ? 1 : 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.1, duration: 0.6, ease: E }}
        />
      ) : null}
      <Link href={routes.profile(learner.id)} className="lp-lb-podium-link">
        <div className="lp-lb-podium-top">
          <div className="lp-lb-podium-avatar-wrap">
            <span
              className={`lp-lb-podium-avatar ${isFirst ? "lp-lb-podium-avatar--60 lp-lb-podium-avatar--first" : `lp-lb-podium-avatar--52 ${avatarClass(learner.tone)}`}`}
            >
              {learner.initials}
            </span>
            <motion.span
              className={`lp-lb-podium-medal lp-lb-podium-medal--${learner.rank}`}
              initial={{ scale: reduceMotion ? 1 : isFirst ? 0.6 : 0.85, opacity: reduceMotion ? 1 : 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={
                isFirst && !reduceMotion
                  ? { type: "spring", stiffness: 420, damping: 14, delay: delay + 0.25 }
                  : { duration: 0.35, delay: delay + 0.15 }
              }
            >
              {learner.rank}
            </motion.span>
          </div>
          <div className="lp-lb-podium-identity">
            <div className="lp-lb-learner-name-row">
              <p className="lp-lb-podium-name">{learner.name}</p>
              {isYou ? <span className="lp-lb-you-chip">YOU</span> : null}
            </div>
            <p className="lp-lb-podium-handle">{learner.handle}</p>
          </div>
          {isFirst ? (
            <span className="lp-lb-podium-rank-chip">♛ #1</span>
          ) : (
            <span className="lp-lb-podium-rank-label">#{learner.rank}</span>
          )}
        </div>
        <div className="lp-lb-podium-rating-wrap">
          <p className="lp-lb-podium-rating-kicker">Rating</p>
          <p className="lp-lb-podium-rating-val">{ratingDisplay}</p>
        </div>
        <div className="lp-lb-podium-stats">
          <div className="lp-lb-podium-stat-cell">
            <span className="lp-lb-podium-stat-label">Solves</span>
            <span className="lp-lb-podium-stat-val">{learner.solves}</span>
          </div>
          <div className="lp-lb-podium-stat-cell">
            <span className="lp-lb-podium-stat-label">Recent</span>
            <span className="lp-lb-podium-stat-val">{learner.recent}</span>
          </div>
          <div className="lp-lb-podium-stat-cell">
            <span className="lp-lb-podium-stat-label">Streak</span>
            <span className="lp-lb-podium-stat-val">
              {learner.streakDays > 0 ? `${learner.streakDays}d` : "—"}
            </span>
          </div>
        </div>
        <PodiumStrongestIn tracks={learner.strongestTracks} />
      </Link>
    </motion.article>
  );
}

function copyInviteLink() {
  const url = `${window.location.origin}${routes.home}`;
  void navigator.clipboard.writeText(url).then(
    () => toast.success("Invite link copied"),
    () => toast.error("Could not copy link"),
  );
}

function PodiumOpenSpotCard({ rank, delay }: { rank: 2 | 3; delay: number }) {
  const reduceMotion = useReducedMotion();
  const href =
    rank === 2 ? routes.exercise(PODIUM_OPEN_SPOT_START_SLUG) : routes.problems;
  const ctaLabel = rank === 2 ? "Start P1-R3" : "Browse problems";

  return (
    <motion.article
      className="lp-lb-podium-card lp-lb-podium-card--open"
      aria-label={`Rank ${rank} — open spot`}
      initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: E, delay }}
    >
      <div className="lp-lb-podium-open-body">
        <span className="lp-lb-podium-open-rank" aria-hidden>
          #{rank}
        </span>
        <p className="lp-lb-podium-open-msg">{PODIUM_OPEN_SPOT_MESSAGE}</p>
        <Link href={href} className="lp-lb-podium-open-btn">
          {ctaLabel}
          <ArrowRight size={14} aria-hidden />
        </Link>
      </div>
    </motion.article>
  );
}

function PodiumSoonCard({ rank, delay }: { rank: 1 | 2 | 3; delay: number }) {
  const reduceMotion = useReducedMotion();
  const isFirst = rank === 1;

  return (
    <motion.article
      className={`lp-lb-podium-card lp-lb-podium-card--soon${isFirst ? " lp-lb-podium-card--soon-first" : ""}`}
      aria-label={`Rank ${rank} — coming soon`}
      initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: E, delay }}
    >
      <div className="lp-lb-podium-link lp-lb-podium-link--static">
        <div className="lp-lb-podium-top">
          <div className="lp-lb-podium-avatar-wrap">
            <span
              className={`lp-lb-podium-avatar ${isFirst ? "lp-lb-podium-avatar--60 lp-lb-podium-avatar--first" : "lp-lb-podium-avatar--52 lp-lb-podium-avatar--soon"}`}
            >
              ···
            </span>
            <span className={`lp-lb-podium-medal lp-lb-podium-medal--${rank}`}>{rank}</span>
          </div>
          <div className="lp-lb-podium-identity">
            <p className="lp-lb-podium-name">Soon</p>
            <p className="lp-lb-podium-handle">Open rank</p>
          </div>
          <span className="lp-lb-podium-rank-label">#{rank}</span>
        </div>
        <div className="lp-lb-podium-rating-wrap">
          <p className="lp-lb-podium-rating-kicker">Rating</p>
          <p className="lp-lb-podium-rating-val lp-lb-podium-rating-val--soon">—</p>
        </div>
        <div className="lp-lb-podium-stats">
          <div className="lp-lb-podium-stat-cell">
            <span className="lp-lb-podium-stat-label">Solves</span>
            <span className="lp-lb-podium-stat-val">—</span>
          </div>
          <div className="lp-lb-podium-stat-cell">
            <span className="lp-lb-podium-stat-label">Recent</span>
            <span className="lp-lb-podium-stat-val">—</span>
          </div>
          <div className="lp-lb-podium-stat-cell">
            <span className="lp-lb-podium-stat-label">Streak</span>
            <span className="lp-lb-podium-stat-val">—</span>
          </div>
        </div>
        <div className="lp-lb-podium-tracks lp-lb-podium-tracks--soon">
          <span className="lp-lb-podium-tracks-label">Strongest in</span>
          <span className="lp-lb-track-chip lp-lb-track-chip--muted">Soon</span>
        </div>
      </div>
    </motion.article>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="lp-lb lp-lb--loading" aria-busy="true" aria-label="Loading leaderboard">
      <div className="lp-lb-inner">
        <span className="lp-lb-skel-block" style={{ width: "12rem", height: "0.75rem" }} />
        <span className="lp-lb-skel-block" style={{ width: "min(22rem, 100%)", height: "3rem", marginTop: 12 }} />
        <div className="lp-lb-stats" style={{ marginTop: 24 }}>
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className="lp-lb-skel-block" style={{ height: "6.5rem" }} />
          ))}
        </div>
        <div className="lp-lb-podium" style={{ marginTop: 24 }}>
          {[1, 2, 3].map((i) => (
            <span key={i} className="lp-lb-skel-block lp-lb-podium-card" />
          ))}
        </div>
        <span className="lp-lb-skel-block" style={{ height: "24rem", marginTop: 24, borderRadius: 20 }} />
      </div>
    </div>
  );
}

export function LeaderboardFigmaView() {
  const reduceMotion = useReducedMotion();
  const { user } = useAuthSession();
  const mySlug = user?.profile?.slug ?? null;

  const [board, setBoard] = useState<LeaderboardResponse | null>(null);
  const [boardFetchedAt, setBoardFetchedAt] = useState<Date | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [period, setPeriod] = useState<PeriodFilter>("30d");
  const [trackFilter, setTrackFilter] = useState<TrackFilter>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tablePages, setTablePages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [flashById, setFlashById] = useState<Record<string, "up" | "down">>({});
  const [youSticky, setYouSticky] = useState(false);
  const youAnchorRef = useRef<HTMLDivElement>(null);
  const prevOrderRef = useRef<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    leaderboardApi
      .list()
      .then((result) => {
        if (!cancelled) {
          setBoard(result);
          setBoardFetchedAt(new Date());
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled && !(caught instanceof ApiError && caught.status === 401)) {
          setLoadError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 120);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setTablePages(1);
  }, [debouncedSearch, period, trackFilter]);

  useEffect(() => {
    const el = youAnchorRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setYouSticky(!entry.isIntersecting),
      { root: null, threshold: 0, rootMargin: "0px 0px -20% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [board, tablePages, debouncedSearch]);

  const sortedItems = useMemo(() => {
    if (!board) return [];
    return sortEntriesForPeriod(board.items, period);
  }, [board, period]);

  const filteredItems = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    if (!q) return sortedItems;
    return sortedItems.filter(
      (row) => row.displayName.toLowerCase().includes(q) || row.slug.toLowerCase().includes(q),
    );
  }, [sortedItems, debouncedSearch]);

  const searching = Boolean(debouncedSearch);

  const podiumSlots = useMemo((): PodiumSlot[] => {
    if (searching || filteredItems.length === 0) return [];
    return buildPodiumSlots(filteredItems);
  }, [filteredItems, searching]);

  const youEntry = useMemo(
    () => (mySlug ? sortedItems.find((row) => row.slug === mySlug) : undefined),
    [sortedItems, mySlug],
  );

  const tableSource = useMemo(() => {
    const base = searching ? filteredItems : filteredItems.filter((row) => row.rank > 3);
    return base;
  }, [filteredItems, searching]);

  const visibleRows = useMemo(() => {
    const slice = tableSource.slice(0, tablePages * TABLE_PAGE_SIZE);
    return slice.map((entry) => mapLeaderboardEntry(entry, entry.slug === mySlug));
  }, [tableSource, tablePages, mySlug]);

  const youRowPinned = useMemo(() => {
    if (!youEntry || searching || youEntry.rank <= 3) return null;
    if (visibleRows.some((row) => row.isYou)) return null;
    return mapLeaderboardEntry(youEntry, true);
  }, [youEntry, searching, visibleRows]);

  const showGapBeforeYou =
    youRowPinned &&
    visibleRows.length > 0 &&
    youRowPinned.rank > visibleRows[visibleRows.length - 1].rank + 1;

  useEffect(() => {
    if (reduceMotion) {
      prevOrderRef.current = visibleRows.map((r) => r.id);
      return;
    }
    const prev = prevOrderRef.current;
    const next = visibleRows.map((r) => r.id);
    if (prev.length === 0) {
      prevOrderRef.current = next;
      return;
    }
    const flashes: Record<string, "up" | "down"> = {};
    next.forEach((id, newIdx) => {
      const oldIdx = prev.indexOf(id);
      if (oldIdx === -1) return;
      if (newIdx < oldIdx) flashes[id] = "up";
      if (newIdx > oldIdx) flashes[id] = "down";
    });
    if (Object.keys(flashes).length > 0) {
      setFlashById(flashes);
      const t = window.setTimeout(() => setFlashById({}), 600);
      prevOrderRef.current = next;
      return () => window.clearTimeout(t);
    }
    prevOrderRef.current = next;
  }, [visibleRows, reduceMotion]);

  const aggregates = useMemo(() => {
    const items = board?.items ?? [];
    return {
      ranked: items.length,
      recentPasses: items.reduce((sum, row) => sum + row.recentPasses, 0),
    };
  }, [board]);

  const statsReady = board !== null;
  const rankedDisplay = useCountUp(aggregates.ranked, 0.15, 800, statsReady);
  const passesDisplay = useCountUp(aggregates.recentPasses, 0.21, 800, statsReady);
  const yourRankDisplay = youEntry
    ? `#${youEntry.rank}`
    : mySlug
      ? "—"
      : "Sign in";
  const yourRatingDisplay = youEntry ? youEntry.rating.toLocaleString("en-US") : null;

  const hasMore = visibleRows.length < tableSource.length;

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    window.setTimeout(() => {
      setTablePages((p) => p + 1);
      setLoadingMore(false);
    }, reduceMotion ? 0 : 400);
  };

  const showingFrom = visibleRows[0]?.rank ?? 0;
  const showingTo = visibleRows[visibleRows.length - 1]?.rank ?? 0;
  const showTableBody = searching || tableSource.length > 0;
  const topShownCount = searching ? 0 : Math.min(3, filteredItems.length);
  const openPodiumSpots = !searching && filteredItems.length > 0 && filteredItems.length < 3;
  const showSparseTableEmpty =
    !searching && tableSource.length === 0 && aggregates.ranked > 0 && aggregates.ranked <= 3;

  if (loadError) {
    return (
      <div className="lp-lb">
        <div className="lp-lb-inner">
          <h1 className="lp-lb-title">Leaderboard</h1>
          <div className="lp-lb-empty">
            <strong>Could not load rankings</strong>
            <p>Check that the API is running, then refresh.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!board) {
    return <LeaderboardSkeleton />;
  }

  return (
    <div className="lp-lb">
      <div className="lp-lb-inner">
        <header className="lp-lb-head">
          <FadeUp delay={0} className="lp-lb-head-copy">
            <p className="lp-lb-eyebrow">SEASON 1 · OCTOBER 2026</p>
            <div className="lp-lb-title-row">
              <h1 className="lp-lb-title">Leaderboard</h1>
              <motion.span
                className="lp-lb-title-accent"
                initial={{ opacity: reduceMotion ? 1 : 0, filter: reduceMotion ? "none" : "blur(6px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: reduceMotion ? 0 : 0.55, ease: E, delay: 0.06 }}
              >
                this month
              </motion.span>
            </div>
            <p className="lp-lb-subtitle">{LEADERBOARD_PAGE_SUBTITLE}</p>
          </FadeUp>
          <FadeUp delay={0.12} className="lp-lb-head-controls">
            <LayoutGroup>
              <div className="lp-lb-segments" role="tablist" aria-label="Ranking period">
                {PERIOD_SEGMENTS.map((seg) => {
                  const active = period === seg.id;
                  return (
                    <button
                      key={seg.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      className={`lp-lb-segment${active ? " is-active" : ""}`}
                      onClick={() => setPeriod(seg.id)}
                    >
                      {active ? (
                        <motion.span
                          layoutId="lb-period-pill"
                          className="lp-lb-segment-pill"
                          transition={{ type: "spring", stiffness: 500, damping: 35 }}
                        />
                      ) : null}
                      <span className="lp-lb-segment-label">{seg.label}</span>
                    </button>
                  );
                })}
              </div>
            </LayoutGroup>
            <TrackDropdown value={trackFilter} onChange={setTrackFilter} />
          </FadeUp>
        </header>

        <section className="lp-lb-stats" aria-label="Leaderboard stats">
          <FadeUp delay={0.15}>
            <div className="lp-lb-stat">
              <div className="lp-lb-stat-icon" aria-hidden>
                <Layers size={18} />
              </div>
              <div className="lp-lb-stat-body">
                <p className="lp-lb-stat-label">Ranked learners</p>
                <div className="lp-lb-stat-value-row">
                  <p className="lp-lb-stat-value">{rankedDisplay}</p>
                  {aggregates.ranked === 1 ? (
                    <span className="lp-lb-stat-meta lp-lb-stat-meta--teal">be the 2nd</span>
                  ) : null}
                </div>
              </div>
            </div>
          </FadeUp>
          <FadeUp delay={0.21}>
            <div className="lp-lb-stat">
              <div className="lp-lb-stat-icon" aria-hidden>
                <Check size={18} />
              </div>
              <div className="lp-lb-stat-body">
                <p className="lp-lb-stat-label">Passes · 30 days</p>
                <div className="lp-lb-stat-value-row">
                  <p className="lp-lb-stat-value">{passesDisplay}</p>
                </div>
              </div>
            </div>
          </FadeUp>
          <FadeUp delay={0.27}>
            <div className={`lp-lb-stat${youEntry ? " lp-lb-stat--you" : ""}`}>
              <div className="lp-lb-stat-icon" aria-hidden>
                <LineChart size={18} />
              </div>
              <div className="lp-lb-stat-body">
                <p className="lp-lb-stat-label">Your rank</p>
                <div className="lp-lb-stat-value-row">
                  <p className="lp-lb-stat-value lp-lb-stat-value--ember">{yourRankDisplay}</p>
                  {yourRatingDisplay ? (
                    <span className="lp-lb-stat-meta">rating {yourRatingDisplay}</span>
                  ) : mySlug && !youEntry ? (
                    <span className="lp-lb-stat-meta">Pass a problem to rank</span>
                  ) : null}
                </div>
              </div>
            </div>
          </FadeUp>
          <FadeUp delay={0.33}>
            <div className="lp-lb-stat lp-lb-stat--rules">
              <p className="lp-lb-stat-rules-kicker">How ranking works</p>
              <p className="lp-lb-stat-code">rating = solves×100 + passes(30d)</p>
              <p className="lp-lb-stat-rules-note">{LEADERBOARD_SUMMARY_COPY}</p>
            </div>
          </FadeUp>
        </section>

        {podiumSlots.length > 0 ? (
          <section className="lp-lb-podium lp-lb-podium-scroll" aria-label="Top learners">
            {podiumSlots.map((slot) => {
              const delay = slot.kind === "learner"
                ? slot.learner.rank === 1
                  ? 0.55
                  : slot.learner.rank === 2
                    ? 0.35
                    : 0.45
                : slot.rank === 1
                  ? 0.55
                  : slot.rank === 2
                    ? 0.35
                    : 0.45;
              if (slot.kind === "learner") {
                return (
                  <PodiumCard
                    key={`learner-${slot.learner.id}`}
                    learner={slot.learner}
                    isYou={slot.learner.id === mySlug}
                    delay={delay}
                  />
                );
              }
              if (openPodiumSpots && slot.rank !== 1) {
                return (
                  <PodiumOpenSpotCard key={`open-${slot.rank}`} rank={slot.rank} delay={delay} />
                );
              }
              return <PodiumSoonCard key={`soon-${slot.rank}`} rank={slot.rank} delay={delay} />;
            })}
          </section>
        ) : null}

        <FadeUp delay={0.65} className="lp-lb-ranking">
          <div className="lp-lb-ranking-top">
            <div>
              <h2 className="lp-lb-ranking-title">Global ranking</h2>
              <p className="lp-lb-ranking-meta">
                {aggregates.ranked} learner{aggregates.ranked === 1 ? "" : "s"} ·{" "}
                {formatUpdatedAgo(boardFetchedAt)}
              </p>
            </div>
            <label className="lp-lb-search">
              <Search size={15} className="lp-lb-search-icon" aria-hidden />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search learner"
                autoComplete="off"
              />
            </label>
          </div>

          {filteredItems.length === 0 ? (
            <div className="lp-lb-empty">
              <strong>{board.items.length === 0 ? "No one on the board yet" : "No matches"}</strong>
              <p>
                {board.items.length === 0
                  ? "Pass a published problem and enable your public profile to appear here."
                  : "Try a different search term."}
              </p>
              {board.items.length === 0 ? (
                <Link href={routes.problems}>Open problems</Link>
              ) : null}
            </div>
          ) : (
            <>
              {showSparseTableEmpty ? (
                <div className="lp-lb-table-sparse">
                  <div className="lp-lb-table-sparse-icon" aria-hidden>
                    <LineChart size={20} />
                  </div>
                  <p className="lp-lb-table-sparse-title">{LEADERBOARD_SPARSE_TABLE_TITLE}</p>
                  <p className="lp-lb-table-sparse-body">{LEADERBOARD_SPARSE_TABLE_BODY}</p>
                  <div className="lp-lb-table-sparse-actions">
                    <Link href={routes.problems} className="lp-lb-table-sparse-primary">
                      Open problems
                      <ArrowRight size={14} aria-hidden />
                    </Link>
                    <button type="button" className="lp-lb-table-sparse-link" onClick={copyInviteLink}>
                      Copy invite link
                    </button>
                  </div>
                </div>
              ) : showTableBody ? (
                <>
                  <div className="lp-lb-table-head">
                    <span>Rank</span>
                    <span>Learner</span>
                    <span>Solves</span>
                    <span className="lp-lb-col-recent">Recent 30d</span>
                    <span className="lp-lb-col-tracks">Tracks</span>
                    <span>Rating</span>
                    <span>Trend</span>
                  </div>

                  <LayoutGroup>
                    <AnimatePresence mode="popLayout">
                      {visibleRows.length === 0 && searching ? (
                        <motion.p key="search-empty" className="lp-lb-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          No learners match this search.
                        </motion.p>
                      ) : (
                        visibleRows.map((row, index) => (
                          <Fragment key={row.id}>
                            <RankingTableRow
                              row={row}
                              index={index}
                              flash={flashById[row.id] ?? null}
                              youRail={row.isYou}
                            />
                            {row.isYou && youEntry && youEntry.rank > 1 && !searching ? (
                              <YouNextGoal currentRank={youEntry.rank} />
                            ) : null}
                          </Fragment>
                        ))
                      )}
                    </AnimatePresence>
                  </LayoutGroup>
                </>
              ) : (
                <p className="lp-lb-ranking-hint">
                  Top {topShownCount} of {aggregates.ranked} ranked{" "}
                  {topShownCount === 1 ? "learner is" : "learners are"} shown above. The table lists
                  rank #4 and below as more people pass problems.
                </p>
              )}

              {!searching && youRowPinned ? (
                <>
                  {showGapBeforeYou ? (
                    <div className="lp-lb-gap-row" aria-hidden>
                      · · ·
                    </div>
                  ) : null}
                  <div ref={youAnchorRef} className={youSticky ? "lp-lb-you-anchor--ghost" : undefined}>
                    <RankingTableRow row={youRowPinned} index={visibleRows.length} youRail stickyYou={false} />
                    {youEntry && youEntry.rank > 1 ? (
                      <YouNextGoal currentRank={youEntry.rank} />
                    ) : null}
                  </div>
                  {youSticky ? (
                    <>
                      <RankingTableRow row={youRowPinned} index={0} youRail stickyYou />
                      {youEntry && youEntry.rank > 1 ? (
                        <YouNextGoal currentRank={youEntry.rank} />
                      ) : null}
                    </>
                  ) : null}
                </>
              ) : null}

              <div className="lp-lb-ranking-foot">
                {showTableBody && !showSparseTableEmpty ? (
                  <div className="lp-lb-legend" aria-label="Track legend">
                    {TRACK_ORDER.map((track) => (
                      <span key={track} className="lp-lb-legend-item">
                        <span
                          className="lp-lb-legend-swatch"
                          style={{ background: TRACK_COLORS[track] }}
                          aria-hidden
                        />
                        {TRACK_LABELS[track]}
                      </span>
                    ))}
                  </div>
                ) : null}
                <span className="lp-lb-foot-meta">
                  {visibleRows.length > 0
                    ? `Showing ${showingFrom}–${showingTo} of ${aggregates.ranked}`
                    : showSparseTableEmpty
                      ? `${aggregates.ranked} on the board`
                      : showTableBody
                        ? `${tableSource.length} ranked`
                        : `${aggregates.ranked} on the board`}
                </span>
                {hasMore ? (
                  <button type="button" className="lp-lb-load-more" disabled={loadingMore} onClick={loadMore}>
                    {loadingMore ? <span className="lp-lb-spinner" aria-hidden /> : null}
                    Load more
                  </button>
                ) : null}
              </div>
            </>
          )}
        </FadeUp>
      </div>
    </div>
  );
}

export const LeaderboardView = LeaderboardFigmaView;
