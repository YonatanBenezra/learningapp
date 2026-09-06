"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loginPath, postAuthPath } from "@/config/routes";
import {
  ensureAuthSession,
} from "@/features/auth/auth-session";

type AuthLinkProps = {
  href: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
};

export function AuthLink({ href, className, children, onClick }: AuthLinkProps) {
  // Start at the real destination so early clicks don't bounce to /login.
  const [target, setTarget] = useState(href);

  useEffect(() => {
    let cancelled = false;
    ensureAuthSession().then((session) => {
      if (cancelled) {
        return;
      }
      if (session.status === "authenticated") {
        setTarget(postAuthPath(Boolean(session.user.onboarding?.needed), href));
        return;
      }
      if (session.status === "anonymous") {
        setTarget(loginPath(href));
        return;
      }
      setTarget(href);
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
