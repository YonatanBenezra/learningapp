import type { ContestListItem } from "@/types/contest";

/** Timed CTF rows only — assessments live on `/assessments`. */
export function contestListItems(items: ContestListItem[]) {
  return items.filter((item) => item.kind !== "assessment");
}
