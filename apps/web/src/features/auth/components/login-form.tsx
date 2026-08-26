"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { routes } from "@/config/routes";
import { authApi } from "@/features/auth/auth-api";

export function LoginForm() {
  return (
    <Suspense fallback={<p className="text-sm opacity-70">Loading…</p>}>
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
        setError("Magic link sent. Dev mode should also return a token.");
        return;
      }
      await authApi.consumeMagicLink(requested.token);
      router.push(safeNext(searchParams.get("next")));
      router.refresh();
    } catch {
      setError("Could not sign in. Is the API running?");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="flex max-w-sm flex-col gap-3" onSubmit={onSubmit}>
      <label className="text-sm">
        Email
        <input
          type="email"
          name="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 block w-full border px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="border px-3 py-2 text-sm"
      >
        {pending ? "Signing in…" : "Send magic link"}
      </button>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </form>
  );
}

function safeNext(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return routes.catalogue;
  }
  return value;
}
