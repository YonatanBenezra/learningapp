"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, UserRound } from "lucide-react";
import { FormEvent, Suspense, useState } from "react";
import { AuthInputWrap } from "./auth-input-wrap";
import { postAuthPath, routes } from "@/config/routes";
import { authApi } from "@/features/auth/auth-api";
import { setAuthenticatedUser } from "@/features/auth/auth-session";
import { isSimulatorNext, loginBackHref } from "@/features/auth/login-next";
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

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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

  const headline = simGate ? "Sign In required" : "Welcome back";
  const subcopy = simGate ? null : "Sign in to continue to your workspace.";

  return (
    <div className={`lc-auth-card${simGate ? " lc-auth-card--sim" : ""}`}>
      <header className="lc-auth-card-head">
        <h2 className="lc-auth-card-title">{headline}</h2>
        {subcopy ? <p className="lc-auth-card-sub">{subcopy}</p> : null}
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
