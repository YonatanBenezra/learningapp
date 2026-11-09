import { LOBBY_RULES } from "@/features/contests/arena/lib/lobby-mock";
import type { LobbyRule } from "@/features/contests/arena/lib/lobby-types";
import type { ContestDetail, ContestListItem } from "@/types/contest";

/** Operation rules for event overview — derived from contest clock and pool size. */
export function missionRulesForContest(
  contest: ContestListItem | ContestDetail,
): LobbyRule[] {
  const n = contest.problemCount || 15;
  const clock = contest.timeBoxMinutes;
  return [
    {
      num: "01",
      text: `Same ${n} challenges for every operator — a fixed draw for this event.`,
    },
    {
      num: "02",
      text: `Your ${clock}-minute operation clock starts the moment you join. It can't be paused.`,
    },
    ...LOBBY_RULES.slice(2),
  ];
}
