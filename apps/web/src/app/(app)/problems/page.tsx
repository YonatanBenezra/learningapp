import { redirect } from "next/navigation";
import { routes } from "@/config/routes";

/** Legacy public catalog — product flow is sign-in → Practice hub. */
export default function ProblemsRedirectPage() {
  redirect(routes.practiceHub);
}
