"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, UserRound } from "lucide-react";
import { FormEvent, Suspense, useState } from "react";
import { AuthInputWrap } from "./auth-input-wrap";
import { postAuthPath, routes } from "@/config/routes";
import { authApi } from "@/features/auth/auth-api";
import { setAuthenticatedUser } from "@/features/auth/auth-session";
import { AuthSocial } from "./auth-social";
import "../auth.css";

export function RegisterForm() {
  return (
    <Suspense fallback={<p className="lc-auth-error">Preparing sign-up…</p>}>
      <RegisterFormFields />
    </Suspense>
  );
}

function RegisterFormFields() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const ready =
    username.trim().length >= 3 &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    confirmPassword.length >= 8;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);
    try {
      await authApi.register({ username, email, password });
      const me = await authApi.me();
      setAuthenticatedUser(me);
      router.push(postAuthPath(Boolean(me.onboarding?.needed), searchParams.get("next")));
      router.refresh();
    } catch (caught: unknown) {
      setError(
        caught instanceof Error ? caught.message : "Could not create your account.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="lc-auth-card">
      <header className="lc-auth-card-head">
        <h2 className="lc-auth-card-title">Create your account</h2>
        <p className="lc-auth-card-sub">Start practicing with simulators and graded runs.</p>
      </header>
      <form className="lc-auth-form" onSubmit={onSubmit} noValidate>
        <label className="lc-auth-field">
          <span className="lc-auth-label">Username</span>
          <AuthInputWrap icon={UserRound}>
            <input
              type="text"
              name="username"
              required
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="labpath-dev"
              className="lc-auth-input"
            />
          </AuthInputWrap>
        </label>
        <label className="lc-auth-field">
          <span className="lc-auth-label">Email</span>
          <AuthInputWrap icon={Mail}>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              className="lc-auth-input"
            />
          </AuthInputWrap>
        </label>
        <label className="lc-auth-field">
          <span className="lc-auth-label">Confirm password</span>
          <AuthInputWrap icon={Lock}>
            <input
              type="password"
              name="confirmPassword"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat password"
              className="lc-auth-input"
            />
          </AuthInputWrap>
        </label>
        <button
          type="submit"
          disabled={pending || !ready}
          className={`lc-auth-submit${ready ? " is-ready" : ""}`}
        >
          {pending ? "Creating account…" : "Sign Up"}
        </button>
        {error ? (
          <p role="alert" className="lc-auth-error">
            {error}
          </p>
        ) : null}
      </form>
      <AuthSocial />
      <p className="lc-auth-card-foot">
        Already have an account? <Link href={routes.login}>Sign in</Link>
      </p>
    </div>
  );
}
