"use client";

import { useEffect, useState } from "react";
import { authApi } from "@/features/auth/auth-api";
import { ProblemNav } from "@/features/workspace/components/problem-nav";

export function OnboardingProblemNav() {
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then((user) => {
        if (!cancelled) {
          setSlug(user.onboarding?.exerciseSlug ?? null);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!slug) {
    return null;
  }

  return <ProblemNav slug={slug} onboarding />;
}
