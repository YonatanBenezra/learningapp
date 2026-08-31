type Interval = { low: number; high: number };

function asInterval(value: unknown): Interval | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const row = value as Record<string, unknown>;
  if (typeof row.low !== "number" || typeof row.high !== "number") {
    return null;
  }
  return { low: row.low, high: row.high };
}

function fmt(value: number): string {
  return value.toFixed(2);
}

export function ScorecardIntervals({
  scorecard,
  className,
}: {
  scorecard?: Record<string, unknown>;
  className?: string;
}) {
  if (!scorecard) {
    return null;
  }
  const ciA = asInterval(scorecard.ciA);
  const ciB = asInterval(scorecard.ciB);
  const parts: string[] = [];
  if (ciA && ciB) {
    parts.push(
      `Wilson 95%: A [${fmt(ciA.low)}, ${fmt(ciA.high)}] · B [${fmt(ciB.low)}, ${fmt(ciB.high)}]`,
    );
    if (typeof scorecard.ciOverlap === "boolean") {
      parts.push(scorecard.ciOverlap ? "CIs overlap" : "CIs do not overlap");
    }
  }
  if (typeof scorecard.seedA === "number" || typeof scorecard.decodeA === "string") {
    const decodeA =
      typeof scorecard.decodeA === "string" ? ` ${scorecard.decodeA}` : "";
    const decodeB =
      typeof scorecard.decodeB === "string" ? ` ${scorecard.decodeB}` : "";
    parts.push(
      `A seed ${scorecard.seedA ?? "—"}${decodeA} · B seed ${scorecard.seedB ?? "—"}${decodeB}`,
    );
  }
  if (typeof scorecard.accCleanA === "number") {
    parts.push(
      `Clean slice A ${fmt(scorecard.accCleanA)} / B ${fmt(Number(scorecard.accCleanB))} · overlap slice A ${fmt(Number(scorecard.accOverlapA))} / B ${fmt(Number(scorecard.accOverlapB))}`,
    );
  }
  if (parts.length === 0) {
    return null;
  }
  return <p className={className}>{parts.join(" · ")}</p>;
}
