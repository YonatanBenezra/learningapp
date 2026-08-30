"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { loginPath } from "@/config/routes";
import { authApi } from "@/features/auth/auth-api";
import { ApiError } from "@/lib/api-client";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then(() => {
        if (!cancelled) {
          setAllowed(true);
        }
      })
      .catch((caught: unknown) => {
        if (cancelled) {
          return;
        }
        if (caught instanceof ApiError && caught.status === 401) {
          router.replace(loginPath(pathname));
          return;
        }
        setAllowed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (!allowed) {
    return null;
  }

  return children;
}
