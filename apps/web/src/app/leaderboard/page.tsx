import { LeaderboardView } from "@/features/leaderboard/components/leaderboard-view";
import "@/features/progress/progress.css";

export default function LeaderboardPage() {
  return (
    <div className="lp-page lp-page-progress">
      <header className="lp-cat-header">
        <p className="lp-page-eyebrow">Team-free</p>
        <h1 className="lp-cat-title">Leaderboard</h1>
        <p className="lp-cat-lead">
          Individual ranking for published Pro profiles. Free can view. Opt out
          from Progress and you leave the board.
        </p>
      </header>
      <LeaderboardView />
    </div>
  );
}
