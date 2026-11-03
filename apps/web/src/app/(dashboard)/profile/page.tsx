import { redirect } from "next/navigation";
import { routes } from "@/config/routes";

/** @deprecated Use {@link routes.dashboardProfile} */
export default function LegacyProfileRedirect() {
  redirect(routes.dashboardProfile);
}
