"use client";

import Link from "next/link";
import { routes } from "@/config/routes";
import {
  authUserInitials,
  useAuthSession,
} from "@/features/auth/use-auth-session";

type CatalogNavAuthProps = {
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
};

export function CatalogNavAuth({ variant, onNavigate }: CatalogNavAuthProps) {
  const { user, signedIn, resolved, status } = useAuthSession();

  if (variant === "mobile") {
    if (status === "anonymous" && resolved) {
      return (
        <Link
          href={routes.login}
          className="lp-site-nav-signin mt-3 flex w-full justify-center rounded-lg shadow-none hover:shadow-none min-[520px]:hidden"
          onClick={onNavigate}
        >
          Sign in
        </Link>
      );
    }
    return null;
  }

  if (signedIn && user) {
    return (
      <Link
        href={routes.progress}
        className="lp-site-nav-avatar"
        aria-label="Your profile"
        title={user.displayName ?? user.email}
      >
        {authUserInitials(user)}
      </Link>
    );
  }

  if (status === "anonymous" && resolved) {
    return (
      <Link
        href={routes.login}
        className="lp-site-nav-signin rounded-lg shadow-none hover:shadow-none max-[520px]:hidden"
        title="Sign in"
      >
        Sign in
      </Link>
    );
  }

  return (
    <span
      className="lp-site-nav-avatar lp-site-nav-avatar--pending"
      aria-busy="true"
      aria-label="Checking your session"
      title="Checking your session"
    />
  );
}

/** Home marketing header — text CTA instead of avatar circle. */
export function HomeNavAuthCta({
  className,
  loginClassName,
}: {
  className?: string;
  loginClassName?: string;
}) {
  const { signedIn, resolved, status } = useAuthSession();

  if (signedIn) {
    return (
      <Link href={routes.progress} className={className}>
        Profile
      </Link>
    );
  }

  if (status === "anonymous" && resolved) {
    return (
      <Link href={routes.login} className={loginClassName ?? className}>
        Sign In
      </Link>
    );
  }

  return (
    <span
      className={`${className ?? ""} lp-site-nav-auth-pending`.trim()}
      aria-busy="true"
    >
      Profile
    </span>
  );
}
