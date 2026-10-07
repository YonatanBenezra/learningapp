import { redirect } from "next/navigation";
import { routes } from "@/config/routes";

export default function DemoG1RunPage() {
  redirect(routes.exercise("grd-001-break-the-concierge"));
}
