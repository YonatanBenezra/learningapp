import { PublicProfileView } from "@/features/profile/components/public-profile";
import "@/features/progress/progress.css";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PublicProfileView slug={slug} />;
}
