import type { Grade } from "@/types/grade";

export function recallAt5FromGrade(grade: Grade): number | null {
  if (typeof grade.scorecard?.recallAt5 === "number") {
    return grade.scorecard.recallAt5 as number;
  }
  const metric = grade.metrics?.recall_at_5?.value;
  return typeof metric === "number" ? metric : null;
}

export function gradeFailToastDetail(grade: Grade, threshold = 0.8): string {
  const recall = recallAt5FromGrade(grade);
  if (recall != null) {
    return `Recall@5 ${recall.toFixed(2)} < ${threshold.toFixed(2)} · no penalty`;
  }
  return "Threshold not met · no penalty";
}

export function formatDeadlineClock(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function formatRemainingHms(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
