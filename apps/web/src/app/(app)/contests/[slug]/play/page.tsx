import { redirect } from "next/navigation";
import { routes } from "@/config/routes";

/** @deprecated Use `/contests/[slug]/arena` */
export default async function ContestPlayRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(routes.contestArena(slug));
}
