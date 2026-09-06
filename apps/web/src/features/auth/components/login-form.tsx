"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { postAuthPath } from "@/config/routes";
import { authApi } from "@/features/auth/auth-api";
import { setAuthenticatedUser } from "@/features/auth/auth-session";

export function LoginForm() {
  return (
    <Suspense fallback={<p className="text-sm lp-muted">Preparing sign-in…</p>}>
      <LoginFormFields />
    </Suspense>
  );
}

function LoginFormFields() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const requested = await authApi.requestMagicLink(email);
      if (!requested.token) {
        setError(
          "No sign-in token came back. In local development, sign-in usually completes instantly — confirm the API is running on :3001 and NODE_ENV=development.",
        );
        return;
      }
      await authApi.consumeMagicLink(requested.token);
      const me = await authApi.me();
      setAuthenticatedUser(me);
      router.push(postAuthPath(Boolean(me.onboarding?.needed), searchParams.get("next")));
      router.refresh();
    } catch {
      setError(
        "We could not complete sign-in. Please verify your email and ensure the API is running.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="lp-auth-form" onSubmit={onSubmit} noValidate>
      <label className="lp-field">
        <span className="lp-field-label">Work email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@company.com"
          className="lp-field-input"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="ag-btn ag-btn-lg ag-btn-orange"
      >
        {pending ? "Sending secure link…" : "Send sign-in link"}
      </button>
      {error ? (
        <p role="alert" className="lp-form-error">
          {error}
        </p>
      ) : null}
      <p className="lp-auth-note text-xs lp-muted">
        Sign-in completes instantly in development (token returned by the API).
        In production, check your email — links expire after use.
      </p>
    </form>
  );
}
