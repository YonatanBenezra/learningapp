"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { routes } from "@/config/routes";
import { authApi } from "@/features/auth/auth-api";
import { WorkspaceShell } from "@/features/workspace/components/workspace-shell";
import type { Grade } from "@/types/grade";
import type { Run } from "@/types/run";
import type { User } from "@/types/user";
import "./onboarding.css";

type OnboardingSession = {
  run: Run | null;
  grade: Grade | null;
  pending: boolean;
};

export function OnboardingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState(false);
  const [session, setSession] = useState<OnboardingSession>({
    run: null,
    grade: null,
    pending: false,
  });
  const onSessionChange = useCallback((next: OnboardingSession) => {
    setSession(next);
  }, []);

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
          <li className={stepClass(session, 1)}>Skim the brief on the left</li>
          <li className={stepClass(session, 2)}>Keep the starter chunk settings</li>
          <li className={stepClass(session, 3)}>Submit and wait for the verdict</li>
        </ol>
        {session.grade?.verdict === "pass" ? (
          <p className="lp-onboard-done">
            Onboarding complete —{" "}
            <Link href={routes.catalogue} className="lp-link">
              open the catalogue
            </Link>
            .
          </p>
        ) : null}
      </header>
      <WorkspaceShell
        slug={user.onboarding.exerciseSlug}
        initialValues={user.onboarding.starter}
        onboarding
        onSessionChange={onSessionChange}
      />
    </div>
  );
}

function stepClass(session: OnboardingSession, step: 1 | 2 | 3): string | undefined {
  const started = session.pending || session.run !== null;
  const graded = session.grade !== null;
  if (step === 1) {
    return started || graded ? "is-done" : "is-active";
  }
  if (step === 2) {
    if (graded || session.run) {
      return "is-done";
    }
    return started ? "is-active" : undefined;
  }
  if (graded) {
    return "is-done";
  }
  return session.run ? "is-active" : undefined;
}
