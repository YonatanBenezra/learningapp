"use client";

import { useEffect, useState } from "react";
import { authApi } from "@/features/auth/auth-api";
import { WorkspaceShell } from "@/features/workspace/components/workspace-shell";
import type { User } from "@/types/user";
import "./onboarding.css";

export function OnboardingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    authApi
      .me()
      .then((result) => {
        if (!cancelled) {
          setUser(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p className="lp-page lp-pg-note">Could not start onboarding.</p>;
  }

  if (!user?.onboarding) {
    return <p className="lp-page lp-pg-note">Preparing your first solve…</p>;
  }

  return (
    <div className="lp-onboard">
      <header className="lp-onboard-bar">
        <p className="lp-onboard-kicker">First solve · about 2 minutes</p>
        <h1 className="lp-onboard-title">Chunk a corpus, then read the scorecard</h1>
        <ol className="lp-onboard-steps">
          <li>Skim the brief on the left</li>
          <li>Keep the starter chunk settings</li>
          <li>Submit and wait for the verdict</li>
        </ol>
      </header>
      <WorkspaceShell
        slug={user.onboarding.exerciseSlug}
        initialValues={user.onboarding.starter}
        onboarding
      />
    </div>
  );
}
