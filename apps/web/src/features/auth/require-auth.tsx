"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { GlobalLoader } from "@/components/ui/global-loader";
import { isPublicAppPath } from "@/config/public-routes";
import { loginPath } from "@/config/routes";
import {
  ensureAuthSession,
  getAuthSnapshot,
} from "@/features/auth/auth-session";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const publicPath = isPublicAppPath(pathname);
  const cached = getAuthSnapshot();
  const [ready, setReady] = useState(
    publicPath ||
      cached.status === "authenticated" ||
      cached.status === "soft",
  );

  useEffect(() => {
    if (publicPath) {
      return;
    }

    let cancelled = false;

    ensureAuthSession().then((session) => {
      if (cancelled) {
        return;
      }
      if (session.status === "authenticated" || session.status === "soft") {
        setReady(true);
        return;
      }
      setReady(false);
      router.replace(loginPath(pathname));
    });

    return () => {
      cancelled = true;
    };
  }, [pathname, router, publicPath]);

  if (publicPath) {
    return children;
  }

  if (!ready) {
    return <GlobalLoader fullPage />;
  }

  return children;
}
