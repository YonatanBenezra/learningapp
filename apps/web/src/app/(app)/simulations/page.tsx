import { redirect } from "next/navigation";
import { routes } from "@/config/routes";

/** Legacy URL — simulators live under Problems tracks now. */
export default function SimulationsPage() {
  redirect(routes.problems);
}
