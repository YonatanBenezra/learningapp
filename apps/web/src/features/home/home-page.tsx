"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GlobalLoader } from "@/components/ui/global-loader";
import { routes } from "@/config/routes";
import { useAuthSession } from "@/features/auth/use-auth-session";
import { HomePageContent } from "@/features/home/home-page-content";

export function HomePage() {
  const router = useRouter();
  const { signedIn, resolved } = useAuthSession();

  useEffect(() => {
    if (!resolved || !signedIn) {
      return;
    }
    router.replace(routes.dashboard);
  }, [resolved, signedIn, router]);

  if (!resolved) {
    return <GlobalLoader fullPage label="Checking your session…" />;
  }

  if (signedIn) {
    return <GlobalLoader fullPage label="Opening your workspace…" />;
  }

  return <HomePageContent />;
}
