"use client";

import Link from "next/link";
import { Check, Lock, Mail } from "lucide-react";
import { motion } from "motion/react";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { postAuthPath, routes } from "@/config/routes";
import { authApi } from "@/features/auth/auth-api";
import { setAuthenticatedUser } from "@/features/auth/auth-session";
import { authToastError } from "@/features/auth/auth-toast";
import {
  AuthCheckbox,
  AuthEmailDivider,
  AuthField,
  AuthFormIntro,
  AuthInlineError,
  AuthOAuthRow,
  AuthPasswordToggle,
  AuthSubmitButton,
  AuthTextInput,
  E,
} from "./auth-form-primitives";

export function SignInFormFigma() {
  return (
    <Suspense fallback={null}>
      <SignInFormInner />
    </Suspense>
  );
}

function SignInFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  const ready = login.trim().length > 0 && password.length >= 8;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    setPending(true);
    try {
      await authApi.login(login, password);
      const me = await authApi.me();
      setAuthenticatedUser(me);
      setSuccess(true);
      window.setTimeout(() => {
        router.push(postAuthPath(Boolean(me.onboarding?.needed), next));
        router.refresh();
      }, 450);
    } catch (caught: unknown) {
      const message =
        caught instanceof Error ? caught.message : "Invalid email/username or password.";
      setError(message);
      authToastError(message);
      setShake(true);
      window.setTimeout(() => setShake(false), 360);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <AuthFormIntro
        eyebrow="Welcome back"
        title="Sign in to LabPath"
        subtitle="Pick up where you left off. Your runs and traces are waiting."
        subtitleShort="Your runs and traces are waiting."
      />
      <AuthOAuthRow index={1} />
      <AuthEmailDivider index={2} />

      <motion.form
        className="lp-auth-figma-fields"
        onSubmit={onSubmit}
        noValidate
        animate={shake ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.35 }}
      >
        <AuthField label="Username or email" labelFor="sign-in-login" icon={Mail} index={3}>
          <AuthTextInput
            id="sign-in-login"
            name="login"
            type="text"
            required
            autoComplete="username"
            placeholder="you@company.com"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
          />
        </AuthField>

        <AuthField
          label="Password"
          labelFor="sign-in-password"
          icon={Lock}
          index={4}
          labelRight={
            <Link href="/magic-link" className="lp-auth-figma-field-link">
              <span className="lp-auth-figma-forgot-long">Forgot password?</span>
              <span className="lp-auth-figma-forgot-short">Forgot?</span>
            </Link>
          }
          trail={
            <>
              <AuthPasswordToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />
            </>
          }
        >
          <AuthTextInput
            id="sign-in-password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </AuthField>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: E, delay: 0.35 }}
        >
          <AuthCheckbox
            id="sign-in-remember"
            checked={remember}
            onChange={setRemember}
            label="Keep me signed in"
          />
        </motion.div>

        {error ? <AuthInlineError message={error} /> : null}

        <AuthSubmitButton
          pending={pending}
          success={success}
          idleLabel="Sign in"
          pendingLabel="Signing in…"
          disabled={!ready}
          index={6}
        />
      </motion.form>
    </>
  );
}
