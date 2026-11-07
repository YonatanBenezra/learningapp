"use client";

import { CtfScoreboardPage } from "@/features/contests/scoreboard/ctf-scoreboard-page";

export function EventScoreboard({
  slug,
}: {
  slug: string;
  eventTitle?: string;
}) {
  return <CtfScoreboardPage slug={slug} />;
}
