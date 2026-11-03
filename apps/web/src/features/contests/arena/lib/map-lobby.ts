import type { ContestDetail, ContestLeaderboard } from "@/types/contest";
import { buildLobbyFromApi, defaultLobbySubtitle, LOBBY_CATEGORIES } from "./lobby-mock";
import type { LobbyEvent, LobbyScoreboardRow } from "./lobby-types";

function lobbyDisplayTitle(title: string): string {
  return title.replace(/^Weekly Contest #(\d+)/i, "Weekly CTF #$1");
}

export const LOBBY_MAX_PTS = LOBBY_CATEGORIES.reduce((sum, row) => sum + row.points, 0);

export function mapContestToLobby(contest: ContestDetail): LobbyEvent {
  return buildLobbyFromApi({
    slug: contest.slug,
    title: lobbyDisplayTitle(contest.title),
    startsAt: contest.startsAt,
    endsAt: contest.endsAt,
    clockMinutes: contest.timeBoxMinutes,
    maxPoints: Math.max(contest.maxScore || 0, LOBBY_MAX_PTS),
    operatorCount: 214,
    challengeCount: contest.problemCount || 15,
    window: contest.window,
    canEnter: contest.canEnter,
    entered: contest.entered,
    subtitle: defaultLobbySubtitle(),
  });
}

export function mergeLeaderboardIntoLobby(
  lobby: LobbyEvent,
  board: ContestLeaderboard | null,
): LobbyEvent {
  if (!board || board.items.length === 0) {
    return lobby;
  }
  const scoreboard: LobbyScoreboardRow[] = board.items.slice(0, 8).map((row) => ({
    rank: row.rank,
    name: row.displayName,
    score: row.totalScore,
    initials: row.displayName.slice(0, 2).toUpperCase(),
  }));
  return {
    ...lobby,
    operatorCount: board.total || lobby.operatorCount,
    scoreboard,
  };
}
