"use client";

import { PublicProfileView } from "@/features/profile/components/public-profile";

type PublicProfilePageProps = {
  slug: string;
};

export function PublicProfilePage({ slug }: PublicProfilePageProps) {
  return <PublicProfileView slug={slug} />;
}
