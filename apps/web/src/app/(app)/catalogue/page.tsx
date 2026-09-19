import { redirect } from "next/navigation";
import { routes } from "@/config/routes";

export default function CatalogueRedirectPage() {
  redirect(routes.problems);
}
