"use client";

import Link from "next/link";
import { routes } from "@/config/routes";
import { AuthLink } from "@/features/auth/auth-link";
import {
  authUserInitials,
  useAuthSession,
} from "@/features/auth/use-auth-session";

type CatalogNavAuthProps = {
  variant: "header" | "mobile";
  onNavigate?: () => void;
};

const openProblemsCtaClass =
  "lp-btn lp-btn--primary lp-btn--sm lp-site-nav-header-auth-cta";

/** One auth cluster in the nav bar — no duplicate avatar (mobile + desktop). */
export function CatalogNavHeaderAuth() {
  const { user, signedIn } = useAuthSession();

  return (
    <div className="lp-site-nav-header-auth">
      {signedIn && user ? (
        <Link
          href={routes.progress}
          className="lp-site-nav-avatar"
          aria-label="Your profile"
          title={user.displayName ?? user.email}
        >
          {authUserInitials(user)}
        </Link>
      ) : (
        <Link href={routes.signIn} className="lp-site-nav-signin-link">
          Sign in
        </Link>
      )}
      <AuthLink href={routes.problems} className={openProblemsCtaClass}>
        Open problems
      </AuthLink>
    </div>
  );
}

export function CatalogNavAuth({ variant, onNavigate }: CatalogNavAuthProps) {
  const { user, signedIn } = useAuthSession();

  if (variant === "header") {
    return <CatalogNavHeaderAuth />;
  }

  if (variant === "mobile") {
    return (
      <div className="lp-site-nav-mobile-cta mt-3 flex flex-col gap-2">
        <AuthLink
          href={routes.problems}
          className="lp-btn lp-btn--primary lp-btn--block"
          onClick={onNavigate}
        >
          Open problems
        </AuthLink>
        {signedIn && user ? (
          <Link
            href={routes.progress}
            className="lp-btn lp-btn--ghost lp-btn--block"
            onClick={onNavigate}
          >
            Profile
          </Link>
        ) : (
          <Link
            href={routes.signIn}
            className="lp-btn lp-btn--ghost lp-btn--block"
            onClick={onNavigate}
          >
            Sign in
          </Link>
        )}
      </div>
    );
  }

  return null;
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
      <Link href={routes.signIn} className={loginClassName ?? className}>
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
