"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, UserRound } from "lucide-react";
import { FormEvent, Suspense, useState } from "react";
import { AuthInputWrap } from "./auth-input-wrap";
import { postAuthPath, routes } from "@/config/routes";
import { authApi } from "@/features/auth/auth-api";
import { setAuthenticatedUser } from "@/features/auth/auth-session";
import { AuthSocial } from "./auth-social";
import "../auth.css";

export function LoginForm() {
  return (
    <Suspense fallback={<p className="lc-auth-error">Preparing sign-in…</p>}>
      <LoginFormFields />
    </Suspense>
  );
}

function LoginFormFields() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      router.push(postAuthPath(Boolean(me.onboarding?.needed), searchParams.get("next")));
      router.refresh();
    } catch (caught: unknown) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Invalid email/username or password.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="lc-auth-card">
      <header className="lc-auth-card-head">
        <h2 className="lc-auth-card-title">Welcome back</h2>
        <p className="lc-auth-card-sub">Sign in to continue to your workspace.</p>
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
          className={`lc-auth-submit${ready ? " is-ready" : ""}`}
        >
          {pending ? "Signing in…" : "Sign In"}
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
    </div>
  );
}
