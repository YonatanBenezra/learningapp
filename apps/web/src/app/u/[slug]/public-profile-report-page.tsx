"use client";

import { EmployerReportView } from "@/features/profile/components/public-profile";

type PublicProfileReportPageProps = {
  slug: string;
};

export function PublicProfileReportPage({ slug }: PublicProfileReportPageProps) {
  return <EmployerReportView slug={slug} />;
}
