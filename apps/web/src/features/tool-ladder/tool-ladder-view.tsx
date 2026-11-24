"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Check, Lock, Swords } from "lucide-react";
import { GlobalLoader } from "@/components/ui/global-loader";
import { routes } from "@/config/routes";
import { useAuthSession } from "@/features/auth/use-auth-session";
import { ToolUnlockButton } from "@/features/workspace/components/tool-lock";
import { toolsApi } from "@/features/workspace/tools-api";
import { cn } from "@/lib/utils";
import type { AttackTrack, LadderTool, ToolLadders, ToolTrack } from "@/types/tools";
import "./tool-ladder.css";

const VIA_LABEL: Record<NonNullable<LadderTool["via"]>, string> = {
  solved: "Earned",
  bought: "Unlocked early",
  level: "Won on a level",
};

/** The first tool of a ladder the learner does not hold yet. */
export function nextTool(track: ToolTrack): LadderTool | null {
  return track.tools.find((tool) => !tool.unlocked) ?? null;
}

function LadderStep({
  tool,
  isNext,
  cost,
  onUnlock,
}: {
  tool: LadderTool;
  isNext: boolean;
  cost: number;
  onUnlock: (toolId: string) => Promise<void>;
}) {
  const state = tool.unlocked ? "held" : isNext ? "next" : "locked";
  return (
    <li className={cn("lp-ladder-step", `is-${state}`)}>
      <span className="lp-ladder-node" aria-hidden>
        {tool.unlocked ? <Check size={14} strokeWidth={3} /> : state === "locked" ? <Lock size={12} /> : tool.step}
      </span>
      <div className="lp-ladder-body">
        <div className="lp-ladder-title">
          <strong>{tool.title}</strong>
          <span className={cn("lp-ladder-chip", `is-${state}`)}>
            {tool.unlocked && tool.via ? VIA_LABEL[tool.via] : isNext ? "Next" : "Locked"}
          </span>
        </div>
        <p className="lp-ladder-blurb">{tool.blurb}</p>
        <p className="lp-ladder-meta">
          Step {tool.step} · taught in{" "}
          <Link href={routes.exercise(tool.teachesIn.slug)} className="lp-link">
            {tool.teachesIn.title}
          </Link>
          {tool.level ? `, level ${tool.level}` : ""}
        </p>
        {isNext ? (
          // Only the next tool offers its actions here; a later one can be
          // unlocked early from the workspace of an exercise that needs it.
          <div className="lp-ladder-actions">
            <Link href={routes.exercise(tool.teachesIn.slug)} className="lp-ladder-go">
              Earn it
            </Link>
            <ToolUnlockButton tool={tool} cost={cost} onUnlock={onUnlock} />
          </div>
        ) : null}
      </div>
    </li>
  );
}

function LadderCard({
  track,
  cost,
  onUnlock,
}: {
  track: ToolTrack;
  cost: number;
  onUnlock: (toolId: string) => Promise<void>;
}) {
  const held = track.tools.filter((tool) => tool.unlocked).length;
  const next = nextTool(track);
  const percent = Math.round((held / Math.max(1, track.tools.length)) * 100);
  return (
    <section className="lp-ladder-card" aria-labelledby={`ladder-${track.id}`}>
      <header className="lp-ladder-card-head">
        <div>
          <p className="lp-ladder-kicker">{track.id === "rag" ? "RAG simulator" : "Guardrails · G3"}</p>
          <h2 id={`ladder-${track.id}`}>{track.title}</h2>
        </div>
        <p className="lp-ladder-count">
          <strong>{held}</strong> of {track.tools.length} tools
        </p>
      </header>
      <div
        className="lp-ladder-bar"
        role="progressbar"
        aria-label={`${track.title}: ${held} of ${track.tools.length} tools`}
        aria-valuemin={0}
        aria-valuemax={track.tools.length}
        aria-valuenow={held}
      >
        <span style={{ width: `${percent}%` }} />
      </div>
      <ol className="lp-ladder-path">
        {track.tools.map((tool) => (
          <LadderStep
            key={tool.id}
            tool={tool}
            isNext={tool.id === next?.id}
            cost={cost}
            onUnlock={onUnlock}
          />
        ))}
      </ol>
    </section>
  );
}

function AttackCard({ track }: { track: AttackTrack }) {
  const won = track.exercises.reduce((sum, row) => sum + row.levelsWon, 0);
  const total = track.exercises.reduce((sum, row) => sum + row.levels, 0);
  return (
    <section className="lp-ladder-card" aria-labelledby={`attack-${track.id}`}>
      <header className="lp-ladder-card-head">
        <div>
          <p className="lp-ladder-kicker">Guardrails · {track.id.toUpperCase()}</p>
          <h2 id={`attack-${track.id}`}>{track.title}</h2>
        </div>
        <p className="lp-ladder-count">
          <strong>{won}</strong> of {total} levels
        </p>
      </header>
      <ul className="lp-attack-list">
        {track.exercises.map((exercise) => (
          <li key={exercise.slug} className={cn(exercise.solved && "is-solved")}>
            <Link href={routes.exercise(exercise.slug)} className="lp-attack-title">
              {exercise.title}
            </Link>
            <span
              className="lp-attack-pips"
              aria-label={`${exercise.levelsWon} of ${exercise.levels} levels beaten`}
            >
              {Array.from({ length: exercise.levels }, (_, index) => (
                <span key={index} className={cn("lp-attack-pip", index < exercise.levelsWon && "is-won")}>
                  <Swords size={11} aria-hidden />
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * The progress map: every simulator's tool ladder, what the learner holds,
 * what comes next, and the G1/G2 level badges.
 */
export function ToolLadderView() {
  const { user, resolved } = useAuthSession();
  const [ladders, setLadders] = useState<ToolLadders | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.workspace = "dashboard";
    return () => {
      delete document.documentElement.dataset.workspace;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }
    let cancelled = false;
    toolsApi
      .ladders()
      .then((data) => {
        if (!cancelled) {
          setLadders(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const unlock = useCallback(async (toolId: string) => {
    setLadders(await toolsApi.unlock(toolId));
  }, []);

  if (!resolved || !user || (!ladders && !failed)) {
    return <GlobalLoader platform fullPage label="Loading your tools…" />;
  }

  if (!ladders) {
    return (
      <main className="lp-dash-figma-main lp-ladder-page">
        <p className="lp-ladder-note">Could not load your tools. Refresh to try again.</p>
      </main>
    );
  }

  const held = ladders.tracks.reduce(
    (sum, track) => sum + track.tools.filter((tool) => tool.unlocked).length,
    0,
  );
  const total = ladders.tracks.reduce((sum, track) => sum + track.tools.length, 0);

  return (
    <main className="lp-dash-figma-main lp-ladder-page">
      <header className="lp-ladder-head">
        <div>
          <h1>Your tools</h1>
          <p>
            Every simulator starts with one or two controls. Each exercise you solve hands you the
            tool it teaches; a locked tool shows where it unlocks, or you can unlock it early for{" "}
            {ladders.cost} rating points.
          </p>
        </div>
        <dl className="lp-ladder-stats">
          <div>
            <dt>Tools held</dt>
            <dd>
              {held}
              <span> / {total}</span>
            </dd>
          </div>
          <div>
            <dt>Points spent on tools</dt>
            <dd>{ladders.spent}</dd>
          </div>
        </dl>
      </header>
      <div className="lp-ladder-grid">
        {ladders.tracks.map((track) => (
          <LadderCard key={track.id} track={track} cost={ladders.cost} onUnlock={unlock} />
        ))}
      </div>
      {ladders.attacks.some((track) => track.exercises.length > 0) ? (
        <>
          <h2 className="lp-ladder-section">Attack levels</h2>
          <p className="lp-ladder-note">
            Direct and indirect injection keep their three levels per exercise; every level you beat
            is a badge.
          </p>
          <div className="lp-ladder-grid">
            {ladders.attacks
              .filter((track) => track.exercises.length > 0)
              .map((track) => (
                <AttackCard key={track.id} track={track} />
              ))}
          </div>
        </>
      ) : null}
    </main>
  );
}
