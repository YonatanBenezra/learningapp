"use client";

import Link from "next/link";
import { loginPath, routes } from "@/config/routes";

type ExerciseStartBtnProps = {
  slug: string;
  signedIn: boolean;
  className?: string;
};

function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden="true">
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ExerciseStartBtn({ slug, signedIn, className }: ExerciseStartBtnProps) {
  const href = routes.exercise(slug);
  const btnClass = className ?? "lp-cat-btn";

  if (signedIn) {
    return (
      <Link href={href} className={btnClass}>
        Start
      </Link>
    );
  }

  return (
    <Link
      href={loginPath(href)}
      className={`${btnClass} lp-ex-start--locked`}
      aria-label="Sign in to submit"
      data-tooltip="Sign in to submit"
    >
      <LockIcon />
    </Link>
  );
}
