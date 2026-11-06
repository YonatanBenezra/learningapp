import { PublicProfilePage } from "./public-profile-page";

export default async function PublicProfilePageRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PublicProfilePage slug={slug} />;
}
