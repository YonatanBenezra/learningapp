"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GlobalLoader } from "@/components/ui/global-loader";
import { routes } from "@/config/routes";
import { ensureAuthSession } from "@/features/auth/auth-session";

export function FirstSessionGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    ensureAuthSession().then((session) => {
      if (cancelled) {
        return;
      }
      if (
        session.status === "authenticated" &&
        session.user.onboarding?.needed
      ) {
        router.replace(routes.onboarding);
        return;
      }
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return <GlobalLoader fullPage />;
  }

  return children;
}
