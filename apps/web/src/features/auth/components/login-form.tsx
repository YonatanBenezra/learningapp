"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Lock,
  Shield,
  Sparkles,
  Swords,
  UserRound,
} from "lucide-react";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { AuthInputWrap } from "./auth-input-wrap";
import { postAuthPath, routes } from "@/config/routes";
import { authApi } from "@/features/auth/auth-api";
import { setAuthenticatedUser } from "@/features/auth/auth-session";
import { problemsApi } from "@/features/problems/problems-api";
import {
  exerciseSlugFromNext,
  isSimulatorNext,
  loginBackHref,
} from "@/features/auth/login-next";
import { authToastError, authToastSuccess } from "@/features/auth/auth-toast";
import { AuthSocial } from "./auth-social";
import "../auth.css";

export function LoginForm() {
  return (
    <Suspense fallback={<LoginFormSkeleton />}>
      <LoginFormFields />
    </Suspense>
  );
}

function LoginFormSkeleton() {
  return (
    <div className="lc-auth-card lc-auth-card--sim" aria-busy="true">
      <p className="lc-auth-card-sub">Preparing sign-in…</p>
    </div>
  );
}

function LoginFormFields() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const simGate = isSimulatorNext(next);
  const exerciseSlug = exerciseSlugFromNext(next);

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [exerciseTitle, setExerciseTitle] = useState<string | null>(null);

  useEffect(() => {
    if (!exerciseSlug) {
      setExerciseTitle(null);
      return;
    }
    let cancelled = false;
    problemsApi
      .getBySlug(exerciseSlug)
      .then((exercise) => {
        if (!cancelled) {
          setExerciseTitle(exercise.title);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setExerciseTitle(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [exerciseSlug]);

  const ready = login.trim().length > 0 && password.length >= 8;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await authApi.login(login, password);
      const me = await authApi.me();
      setAuthenticatedUser(me);
      authToastSuccess(
        simGate ? "Signed in — opening simulator…" : "Welcome back!",
      );
      router.push(postAuthPath(Boolean(me.onboarding?.needed), next));
      router.refresh();
    } catch (caught: unknown) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Invalid email/username or password.";
      setError(message);
      authToastError(message);
    } finally {
      setPending(false);
    }
  }

  const headline = simGate
    ? "Sign in to open the simulator"
    : "Welcome back";
  const subcopy = simGate
    ? "Graded practice runs, live levels, and your personal solve rate are saved to your account."
    : "Sign in to continue to your workspace.";

  return (
    <div className={`lc-auth-card${simGate ? " lc-auth-card--sim" : ""}`}>
      {simGate ? (
        <div className="lc-auth-sim-gate" aria-hidden={false}>
          <div className="lc-auth-sim-gate-icon">
            <Shield className="size-6" strokeWidth={1.75} />
          </div>
          <p className="lc-auth-sim-kicker">
            <Swords className="size-3.5" strokeWidth={2.25} aria-hidden />
            Practice workspace · sign-in required
          </p>
          {exerciseTitle ? (
            <p className="lc-auth-sim-target">
              <span>Up next</span>
              <strong>{exerciseTitle}</strong>
            </p>
          ) : null}
          <ul className="lc-auth-sim-points">
            <li>
              <Sparkles className="size-3.5" strokeWidth={2.2} aria-hidden />
              Live sim + official grade
            </li>
            <li>
              <BarChart3 className="size-3.5" strokeWidth={2.2} aria-hidden />
              Your solve rate per problem
            </li>
            <li>
              <Lock className="size-3.5" strokeWidth={2.2} aria-hidden />
              Attempts tied to your profile
            </li>
          </ul>
        </div>
      ) : null}

      <header className="lc-auth-card-head">
        <h2 className="lc-auth-card-title">{headline}</h2>
        <p className="lc-auth-card-sub">{subcopy}</p>
      </header>

      <form className="lc-auth-form" onSubmit={onSubmit} noValidate>
        <label className="lc-auth-field">
          <span className="lc-auth-label">Username or email</span>
          <AuthInputWrap icon={UserRound}>
            <input
              type="text"
              name="login"
              required
              autoComplete="username"
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              placeholder="you@company.com"
              className="lc-auth-input"
            />
          </AuthInputWrap>
        </label>
        <label className="lc-auth-field">
          <span className="lc-auth-label">Password</span>
          <AuthInputWrap icon={Lock}>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="lc-auth-input"
            />
          </AuthInputWrap>
        </label>
        <button
          type="submit"
          disabled={pending || !ready}
          className={`lc-auth-submit${ready ? " is-ready" : ""}${simGate ? " lc-auth-submit--sim" : ""}`}
        >
          {pending ? (
            "Signing in…"
          ) : simGate ? (
            <>
              Continue to simulator
              <ArrowRight className="size-4" strokeWidth={2.25} aria-hidden />
            </>
          ) : (
            "Sign In"
          )}
        </button>
        {error ? (
          <p role="alert" className="lc-auth-error">
            {error}
          </p>
        ) : null}
        <div className="lc-auth-row">
          <Link href={routes.login}>Forgot Password?</Link>
          <Link href={routes.register}>Sign Up</Link>
        </div>
      </form>

      <AuthSocial />

      <p className="lc-auth-card-foot">
        Don&apos;t have an account? <Link href={routes.register}>Sign up</Link>
      </p>

      {simGate ? (
        <Link href={loginBackHref(next)} className="lc-auth-sim-back">
          ← Back to Problems
        </Link>
      ) : null}
    </div>
  );
}
