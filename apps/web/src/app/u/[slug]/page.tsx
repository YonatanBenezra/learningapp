import { PublicProfileView } from "@/features/profile/components/public-profile";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PublicProfileView slug={slug} />;
}
