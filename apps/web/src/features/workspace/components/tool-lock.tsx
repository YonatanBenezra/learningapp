"use client";

import Link from "next/link";
import { useState } from "react";
import { Lock, Sparkles } from "lucide-react";
import { routes } from "@/config/routes";
import { cn } from "@/lib/utils";
import type { ExerciseTool } from "@/types/tools";
import "./tool-lock.css";

/** "Unlock for 25 points", with a confirm step before the points are spent. */
export function ToolUnlockButton({
  tool,
  cost,
  onUnlock,
}: {
  tool: { id: string; title: string };
  cost: number;
  onUnlock: (toolId: string) => Promise<void>;
}) {
  const [step, setStep] = useState<"idle" | "confirm" | "busy">("idle");
  const [error, setError] = useState<string | null>(null);
  if (step === "idle") {
    return (
      <button
        type="button"
        className="lp-tool-unlock"
        onClick={() => {
          setError(null);
          setStep("confirm");
        }}
      >
        Unlock for {cost} points
      </button>
    );
  }
  return (
    <span className="lp-tool-confirm" role="group" aria-label={`Unlock ${tool.title}`}>
      <span>
        Spend {cost} rating points on {tool.title}?
      </span>
      <button
        type="button"
        className="lp-tool-unlock is-primary"
        disabled={step === "busy"}
        onClick={async () => {
          setStep("busy");
          try {
            await onUnlock(tool.id);
          } catch {
            setError("Could not unlock it. Try again.");
            setStep("confirm");
          }
        }}
      >
        {step === "busy" ? "Unlocking…" : "Unlock"}
      </button>
      <button
        type="button"
        className="lp-tool-unlock"
        disabled={step === "busy"}
        onClick={() => setStep("idle")}
      >
        Cancel
      </button>
      {error ? <span className="lp-tool-error">{error}</span> : null}
    </span>
  );
}

/** The heading of one tool's controls in a practice workspace. */
export function ToolGroupHead({
  tool,
  cost,
  onUnlock,
}: {
  tool: ExerciseTool;
  cost: number;
  onUnlock?: (toolId: string) => Promise<void>;
}) {
  const locked = tool.state === "locked";
  return (
    <header className={cn("lp-tool-head", `is-${tool.state}`)}>
      <span className="lp-tool-step" aria-hidden>
        {locked ? <Lock size={12} /> : tool.step}
      </span>
      <span className="lp-tool-title">
        <strong>{tool.title}</strong>
        {tool.state === "new" ? (
          <em className="lp-tool-badge">
            <Sparkles size={11} aria-hidden /> New tool
          </em>
        ) : null}
        {tool.state === "unlocked" ? (
          <em className="lp-tool-badge is-known">Yours</em>
        ) : null}
        {locked ? <em className="lp-tool-badge is-locked">Locked</em> : null}
      </span>
      <span className="lp-tool-blurb">
        {locked ? (
          <>
            Unlocks after{" "}
            <Link href={routes.exercise(tool.teachesIn.slug)} className="lp-link">
              {tool.teachesIn.title}
            </Link>
            .
          </>
        ) : (
          tool.blurb
        )}
      </span>
      {locked && onUnlock ? (
        <ToolUnlockButton tool={tool} cost={cost} onUnlock={onUnlock} />
      ) : null}
    </header>
  );
}
