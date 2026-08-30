"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loginPath, postAuthPath } from "@/config/routes";
import { authApi } from "@/features/auth/auth-api";
import { ApiError } from "@/lib/api-client";

type AuthLinkProps = {
  href: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
};

export function AuthLink({ href, className, children, onClick }: AuthLinkProps) {
  const [target, setTarget] = useState(loginPath(href));

  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then((me) => {
        if (!cancelled) {
          setTarget(postAuthPath(Boolean(me.onboarding?.needed), href));
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled && !(caught instanceof ApiError && caught.status === 401)) {
          setTarget(href);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [href]);

  return (
    <Link href={target} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
