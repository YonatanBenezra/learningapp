import { redirect } from "next/navigation";
import { routes } from "@/config/routes";

/** Retired hiring/monetization routes send users back to the problem list. */
export function redirectToProblems(): never {
  redirect(routes.problems);
}
