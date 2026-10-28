import { redirect } from "next/navigation";
import { routes } from "@/config/routes";

/** Contest-scoped standings (not the global practice leaderboard). */
export default async function ContestLeaderboardRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(routes.contestScoreboard(slug));
}
