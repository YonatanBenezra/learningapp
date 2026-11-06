import type { PracticeProblemCard, PracticeTab } from "@/features/practice-hub/types";

export function filterPracticeProblems(
  items: PracticeProblemCard[],
  tab: PracticeTab,
  query: string,
) {
  let list = items;
  if (tab === "rag") {
    list = list.filter((p) => p.simulator === "rag");
  } else if (tab === "guardrails") {
    list = list.filter((p) => p.simulator === "guardrails");
  } else if (tab === "solved") {
    list = list.filter((p) => p.cleared);
  } else if (tab === "todo") {
    list = list.filter((p) => !p.cleared);
  }

  const q = query.trim().toLowerCase();
  if (!q) {
    return list;
  }
  return list.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      p.simulatorLabel.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q)),
  );
}

export function practiceTabCounts(items: PracticeProblemCard[]): Record<PracticeTab, number> {
  const counts: Record<PracticeTab, number> = {
    all: items.length,
    rag: 0,
    guardrails: 0,
    solved: 0,
    todo: 0,
  };
  for (const p of items) {
    if (p.simulator === "rag") {
      counts.rag += 1;
    }
    if (p.simulator === "guardrails") {
      counts.guardrails += 1;
    }
    if (p.cleared) {
      counts.solved += 1;
    } else {
      counts.todo += 1;
    }
  }
  return counts;
}
