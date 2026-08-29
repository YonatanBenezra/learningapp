"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { routes } from "@/config/routes";
import { authApi } from "@/features/auth/auth-api";

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
          "A sign-in link has been sent. In local development, the API should also return a token.",
        );
        return;
      }
      await authApi.consumeMagicLink(requested.token);
      router.push(safeNext(searchParams.get("next")));
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
    <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
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
        className="lp-btn lp-btn-primary w-full"
      >
        {pending ? "Sending secure link…" : "Send sign-in link"}
      </button>
      {error ? (
        <p role="alert" className="lp-form-error">
          {error}
        </p>
      ) : null}
      <p className="text-xs lp-muted">
        Links expire after use. Use the same email each time you return.
      </p>
    </form>
  );
}

function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return routes.catalogue;
  }
  return value;
}
