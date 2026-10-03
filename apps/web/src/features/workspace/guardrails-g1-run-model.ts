import {
  DEMO_G1_RUN_DETAIL,
  type G1RunDetailModel,
  isG1DemoRun,
} from "@/features/traces/demo/g1-run-demo-data";
import { GUARDRAILS_G1_SLUG } from "@/features/simulations/simulations-demo-data";
import type { Grade } from "@/types/grade";
import type { Run } from "@/types/run";

type ScorecardWin = { level: number; won: boolean; encoding: string | null };

function readWins(scorecard: Record<string, unknown> | undefined): ScorecardWin[] {
  const raw = scorecard?.wins;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter(
    (row): row is ScorecardWin =>
      Boolean(row) &&
      typeof row === "object" &&
      typeof (row as ScorecardWin).level === "number" &&
      typeof (row as ScorecardWin).won === "boolean",
  );
}

export function isGuardrailsG1Run(run: Run, runId: string): boolean {
  if (isG1DemoRun(runId)) {
    return true;
  }
  return run.exerciseSlug === GUARDRAILS_G1_SLUG;
}

export function buildG1RunDetailModel(
  run: Run,
  grade: Grade | null,
  runId: string,
): G1RunDetailModel {
  if (isG1DemoRun(runId)) {
    return { ...DEMO_G1_RUN_DETAIL, runId };
  }

  const wins = readWins(grade?.scorecard);
  const levelsWon = wins.filter((row) => row.won).length;
  const totalLevels = wins.length || 3;
  const maxCleared = wins.filter((row) => row.won).reduce((max, row) => Math.max(max, row.level), 0);
  const verdict = grade?.verdict ?? null;
  const inFlight = run.status === "queued" || run.status === "running";

  const base = DEMO_G1_RUN_DETAIL;

  return {
    ...base,
    runId,
    runIdDisplay: run.id.length > 18 ? `${run.id.slice(0, 12)}…${run.id.slice(-4)}` : run.id,
    attempt: 1,
    exerciseSlug: run.exerciseSlug ?? GUARDRAILS_G1_SLUG,
    exerciseTitle: run.title ?? "Break the Concierge",
    verdict: inFlight ? null : verdict,
    statusLabel: inFlight ? (run.status === "queued" ? "queued" : "running") : "graded",
    progressLabel: levelsWon >= totalLevels ? "cleared" : levelsWon > 0 ? "in progress" : "active",
    progressFillPct: Math.min(100, Math.round((levelsWon / totalLevels) * 100)),
    progressCleared: levelsWon >= totalLevels && verdict === "pass",
    stats: {
      levelReached: wins.length ? `${levelsWon} / ${totalLevels}` : "—",
      levelFoot: maxCleared ? `Through level ${maxCleared}` : "Hidden grading",
      messages: "—",
      messagesFoot: "Open trace for full log",
      canaryEvent: "—",
      canaryFoot: wins.find((row) => row.won)?.encoding ?? "—",
      timeOnLevel: "—",
      timeFoot: "From run metadata",
    },
    timeline: wins.length
      ? wins.map((row) => ({
          id: `win-${row.level}`,
          time: "—",
          label: row.won
            ? `Level ${row.level} cleared${row.encoding ? ` · ${row.encoding}` : ""}`
            : `Level ${row.level} held`,
          kind: row.won ? ("cleared" as const) : ("turn-quiet" as const),
        }))
      : base.timeline.slice(0, 1),
    messages: base.messages.slice(0, 0),
  };
}
