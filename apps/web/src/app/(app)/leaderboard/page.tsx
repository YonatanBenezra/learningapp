import { LeaderboardView } from "@/features/leaderboard/components/leaderboard-view";
import "@/features/leaderboard/leaderboard.css";

export const metadata = {
  title: "Leaderboard",
  description: "Practice rankings for learners with public profiles.",
};

export default function LeaderboardPage() {
  return (
    <div className="lp-page lp-page-leaderboard">
      <LeaderboardView />
    </div>
  );
}
