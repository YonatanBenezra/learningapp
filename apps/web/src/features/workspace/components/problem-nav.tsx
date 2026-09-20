"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { brand } from "@/config/brand";
import { loginPath, routes } from "@/config/routes";
import {
  ensureAuthSession,
  getAuthSnapshot,
} from "@/features/auth/auth-session";
import { applyTheme, readTheme, type Theme } from "@/features/theme/theme";
import { problemsApi } from "@/features/problems/problems-api";
import type { Exercise } from "@/types/exercise";
import {
  requestToggleBrief,
  requestWorkspaceSubmit,
  WS_EVENTS,
  type WorkspaceNavState,
} from "../workspace-events";
import {
  IconChevronLeft,
  IconChevronRight,
  IconPanelLayout,
  IconSubmitCloud,
} from "./workspace-icons";
import "../problem-nav.css";

type ProblemNavProps = {
  slug: string;
  onboarding?: boolean;
};

function isSignedInStatus(status: string) {
  return status === "authenticated" || status === "soft";
}

export function ProblemNav({ slug, onboarding = false }: ProblemNavProps) {
  const router = useRouter();
  const [pathQuery, setPathQuery] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPathQuery(params.get("path"));
  }, [slug]);
  const [problems, setProblems] = useState<Exercise[]>([]);
  const [navState, setNavState] = useState<WorkspaceNavState>({
    pending: false,
    disabled: true,
  });
  const [signedIn, setSignedIn] = useState(
    isSignedInStatus(getAuthSnapshot().status),
  );

  useEffect(() => {
    document.documentElement.dataset.workspace = "problem";
    return () => {
      delete document.documentElement.dataset.workspace;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    problemsApi
      .list()
      .then((result) => {
        if (!cancelled) {
          setProblems(result.items);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    ensureAuthSession().then((session) => {
      if (!cancelled) {
        setSignedIn(isSignedInStatus(session.status));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onState = (event: Event) => {
      const detail = (event as CustomEvent<WorkspaceNavState>).detail;
      if (detail) {
        setNavState(detail);
      }
    };
    window.addEventListener(WS_EVENTS.state, onState);
    return () => window.removeEventListener(WS_EVENTS.state, onState);
  }, []);

  const index = useMemo(
    () => problems.findIndex((item) => item.slug === slug),
    [problems, slug],
  );

  const prevSlug = index > 0 ? problems[index - 1]?.slug : null;
  const nextSlug =
    index >= 0 && index < problems.length - 1
      ? problems[index + 1]?.slug
      : null;

  function exerciseHref(targetSlug: string) {
    const base = routes.exercise(targetSlug);
    return pathQuery ? `${base}?path=${encodeURIComponent(pathQuery)}` : base;
  }

  function goRandom() {
    if (problems.length === 0) {
      return;
    }
    const candidates = problems.filter((item) => item.slug !== slug);
    const pool = candidates.length > 0 ? candidates : problems;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick) {
      router.push(exerciseHref(pick.slug));
    }
  }

  function toggleTheme() {
    const next: Theme = readTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
  }

  return (
    <header className="lp-problem-nav">
      <div className="lp-problem-nav-inner">
        <div className="lp-problem-nav-left">
          <Link href={routes.home} className="lp-problem-logo" aria-label={brand.name}>
            <span className="lp-problem-mark" aria-hidden="true">
              <svg viewBox="0 0 20 20" width="14" height="14" fill="none">
                <path
                  d="M5 6.5h6.2L7.8 13.5H14"
                  stroke="currentColor"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </Link>

          <Link
            href={onboarding ? routes.onboarding : routes.problems}
            className="lp-problem-link"
          >
            <span className="lp-problem-link-icon lp-problem-tone--blue" aria-hidden="true">
              <svg viewBox="0 0 16 16" width="15" height="15" fill="none">
                <path
                  d="M3 4.5h10M3 8h10M3 11.5h6"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            {onboarding ? "First solve" : "Problem List"}
          </Link>

          {!onboarding ? (
          <div className="lp-problem-steppers">
            <button
              type="button"
              className="lp-problem-icon-btn lp-problem-tone--violet"
              aria-label="Previous problem"
              disabled={!prevSlug}
              onClick={() => prevSlug && router.push(exerciseHref(prevSlug))}
            >
              <IconChevronLeft size={15} />
            </button>
            <button
              type="button"
              className="lp-problem-icon-btn lp-problem-tone--violet"
              aria-label="Next problem"
              disabled={!nextSlug}
              onClick={() => nextSlug && router.push(exerciseHref(nextSlug))}
            >
              <IconChevronRight size={15} />
            </button>
            <button
              type="button"
              className="lp-problem-icon-btn lp-problem-tone--amber"
              aria-label="Random problem"
              disabled={problems.length === 0}
              onClick={goRandom}
            >
              <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden="true">
                <path
                  d="M11.5 2.5 13.5 4.5M13.5 4.5 11.5 6.5M13.5 4.5H9M4.5 13.5 2.5 11.5M2.5 11.5 4.5 9.5M2.5 11.5H7"
                  stroke="currentColor"
                  strokeWidth="1.35"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          ) : null}
        </div>

        <div className="lp-problem-nav-center">
          <button
            type="button"
            className="lp-problem-submit"
            disabled={navState.disabled || navState.pending}
            onClick={() => {
              if (!signedIn) {
                router.push(
                  loginPath(onboarding ? routes.onboarding : routes.exercise(slug)),
                );
                return;
              }
              requestWorkspaceSubmit();
            }}
          >
            <span className="lp-problem-submit-icon">
              <IconSubmitCloud size={16} />
            </span>
            {navState.pending ? "Submitting…" : "Submit"}
          </button>
        </div>

        <div className="lp-problem-nav-right">
          <button
            type="button"
            className="lp-problem-icon-btn lp-problem-tone--indigo"
            aria-label="Toggle problem panel"
            title="Toggle problem panel"
            onClick={requestToggleBrief}
          >
            <IconPanelLayout size={16} />
          </button>
          <button
            type="button"
            className="lp-problem-icon-btn lp-problem-tone--sun"
            aria-label="Toggle color theme"
            title="Theme"
            onClick={toggleTheme}
          >
            <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="2.5" fill="currentColor" />
              <path
                d="M8 1.5v1.2M8 13.3v1.2M1.5 8h1.2M13.3 8h1.2M3.4 3.4l.85.85M11.75 11.75l.85.85M3.4 12.6l.85-.85M11.75 4.25l.85-.85"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          {!signedIn ? (
            <Link href={routes.login} className="lp-problem-auth-link">
              Sign In
            </Link>
          ) : (
            <Link href={routes.progress} className="lp-problem-auth-link lp-problem-auth-link--dash">
              Dashboard
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
