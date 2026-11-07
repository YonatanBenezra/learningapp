import { redirect } from "next/navigation";
import { routes } from "@/config/routes";

export default async function ContestLobbyRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(routes.ctfEvent(slug));
}
