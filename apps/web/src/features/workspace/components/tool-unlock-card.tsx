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
  tools,
  tracks,
  onClose,
}: {
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
        {next ? (
          <p className="lp-unlock-next">
            Next on the ladder: <strong>{next.title}</strong>, taught in {next.teachesIn.title}.
          </p>
        ) : track ? (
          <p className="lp-unlock-next">You hold every tool on this ladder.</p>
        ) : null}
        <div className="lp-unlock-actions">
          {next ? (
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
          {next ? (
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
