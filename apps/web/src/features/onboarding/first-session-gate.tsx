"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { routes } from "@/config/routes";
import { authApi } from "@/features/auth/auth-api";

export function FirstSessionGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then((me) => {
        if (cancelled) {
          return;
        }
        if (me.onboarding?.needed) {
          router.replace(routes.onboarding);
          return;
        }
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return <p className="lp-page lp-pg-note">Opening your first solve…</p>;
  }

  return children;
}
