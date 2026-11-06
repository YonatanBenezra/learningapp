import { redirect } from "next/navigation";
import { routes } from "@/config/routes";

/** Legacy public arena listing — product flow is sign-in → Contests hub. */
export default function ContestsRedirectPage() {
  redirect(routes.contestHub);
}
