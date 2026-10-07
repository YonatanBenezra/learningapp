import { redirect } from "next/navigation";
import { routes } from "@/config/routes";

export default function DemoRagTracePage() {
  redirect(routes.exercise("rag-001-chunk-it-right"));
}
