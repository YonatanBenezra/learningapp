"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Sparkles, X } from "lucide-react";
import { routes } from "@/config/routes";
import type { LadderTool, ToolTrack } from "@/types/tools";
import "./tool-unlock-card.css";

/**
 * The unlock moment: shown once when a pass hands the learner new tools,
 * with what each does and the next tool on the ladder.
 */
export function ToolUnlockCard({
  currentSlug,
  stage = null,
  tools,
  tracks,
  onClose,
}: {
  /** The exercise open now: a next tool taught here is a level, not a trip. */
  currentSlug?: string;
  /** A staged level of this exercise still to play: that comes next. */
  stage?: { level: number; title: string } | null;
  tools: LadderTool[];
  tracks: ToolTrack[];
  onClose: () => void;
}) {
  const primaryRef = useRef<HTMLAnchorElement | HTMLButtonElement | null>(null);
  useEffect(() => {
    primaryRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const track = tracks.find((row) => row.tools.some((tool) => tool.id === tools[0]?.id));
  const next = track?.tools.find((tool) => !tool.unlocked) ?? null;
  const held = track ? track.tools.filter((tool) => tool.unlocked).length : 0;
  const nextHere = stage !== null || (next !== null && next.teachesIn.slug === currentSlug);

  return createPortal(
    <div className="lp-unlock-backdrop" onClick={onClose}>
      <section
        className="lp-unlock-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lp-unlock-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="lp-unlock-close" aria-label="Close" onClick={onClose}>
          <X size={16} aria-hidden />
        </button>
        <p className="lp-unlock-kicker">
          <Sparkles size={14} aria-hidden />
          {tools.length === 1 ? "New tool unlocked" : `${tools.length} new tools unlocked`}
        </p>
        <ul className="lp-unlock-tools">
          {tools.map((tool) => (
            <li key={tool.id}>
              <span className="lp-unlock-step" aria-hidden>
                {tool.step}
              </span>
              <div>
                <h2 id={tool.id === tools[0].id ? "lp-unlock-title" : undefined}>{tool.title}</h2>
                <p>{tool.blurb}</p>
              </div>
            </li>
          ))}
        </ul>
        {track ? (
          <p className="lp-unlock-progress">
            {track.title}: <strong>{held}</strong> of {track.tools.length} tools
          </p>
        ) : null}
        {stage ? (
          <p className="lp-unlock-next">
            Next: <strong>level {stage.level}, {stage.title}</strong>, in this exercise.
          </p>
        ) : next && nextHere ? (
          <p className="lp-unlock-next">
            Next on the ladder: <strong>{next.title}</strong>
            {next.level ? `, level ${next.level} of this exercise` : ", in this exercise"}.
          </p>
        ) : next ? (
          <p className="lp-unlock-next">
            Next on the ladder: <strong>{next.title}</strong>, taught in {next.teachesIn.title}.
          </p>
        ) : track ? (
          <p className="lp-unlock-next">You hold every tool on this ladder.</p>
        ) : null}
        <div className="lp-unlock-actions">
          {next && !nextHere ? (
            <Link
              ref={(node) => {
                primaryRef.current = node;
              }}
              href={routes.exercise(next.teachesIn.slug)}
              className="lp-unlock-primary"
            >
              Go to {next.teachesIn.title}
            </Link>
          ) : (
            <button
              ref={(node) => {
                primaryRef.current = node;
              }}
              type="button"
              className="lp-unlock-primary"
              onClick={onClose}
            >
              Keep working
            </button>
          )}
          <Link href={routes.dashboardTools} className="lp-unlock-secondary">
            See all your tools
          </Link>
          {next && !nextHere ? (
            <button type="button" className="lp-unlock-secondary" onClick={onClose}>
              Keep working
            </button>
          ) : null}
        </div>
      </section>
    </div>,
    document.body,
  );
}
