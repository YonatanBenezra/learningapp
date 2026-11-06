"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { GlobalLoader } from "@/components/ui/global-loader";
import { isPublicAppPath } from "@/config/public-routes";
import { loginPath } from "@/config/routes";
import {
  ensureAuthSession,
  getAuthSnapshot,
} from "@/features/auth/auth-session";

function hasCachedSession() {
  if (typeof window === "undefined") {
    return false;
  }
  return getAuthSnapshot().status === "authenticated";
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const publicPath = isPublicAppPath(pathname);
  const [ready, setReady] = useState(() => publicPath || hasCachedSession());
  const [gateLabel, setGateLabel] = useState("Checking your session…");

  useLayoutEffect(() => {
    if (publicPath) {
      setReady(true);
      return;
    }
    if (hasCachedSession()) {
      setReady(true);
    }
  }, [publicPath, pathname]);

  useEffect(() => {
    if (publicPath) {
      return;
    }

    let cancelled = false;

    ensureAuthSession().then((session) => {
      if (cancelled) {
        return;
      }
      if (session.status === "authenticated") {
        setReady(true);
        return;
      }
      setReady(false);
      setGateLabel("Redirecting to sign in…");
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
    return <GlobalLoader fullPage label={gateLabel} />;
  }

  return children;
}
