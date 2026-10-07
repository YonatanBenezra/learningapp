import { redirect } from "next/navigation";
import { routes } from "@/config/routes";

export default function DemoRagWorkspacePage() {
  redirect(routes.exercise("rag-001-chunk-it-right"));
}
