import { redirect } from "next/navigation";
import { routes } from "@/config/routes";

export default function LeaderboardLegacyRedirectPage() {
  redirect(routes.dashboardRanking);
}
