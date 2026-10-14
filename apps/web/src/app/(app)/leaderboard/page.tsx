import { LeaderboardFigmaView } from "@/features/leaderboard/components/leaderboard-figma-view";
import "@/features/leaderboard/leaderboard-figma.css";

export const metadata = {
  title: "Leaderboard",
  description: "Practice rankings for learners with public profiles.",
};

export default function LeaderboardPage() {
  return (
    <div className="lp-page lp-page-leaderboard">
      <LeaderboardFigmaView />
    </div>
  );
}
