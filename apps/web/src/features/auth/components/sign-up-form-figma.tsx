"use client";

import { Check, Lock, Mail, User } from "lucide-react";
import { motion } from "motion/react";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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

const TAKEN_USERNAMES = new Set(["admin", "jewel", "taken", "labpath"]);

export function SignUpFormFigma() {
  return (
    <Suspense fallback={null}>
      <SignUpFormInner />
    </Suspense>
  );
}

function SignUpFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [terms, setTerms] = useState(true);
  const [termsError, setTermsError] = useState(false);
  const [usernameState, setUsernameState] = useState<"idle" | "checking" | "valid" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  const rules = useMemo(
    () => ({
      length: password.length >= 12,
      number: /\d/.test(password),
      symbol: /[^A-Za-z0-9]/.test(password),
    }),
    [password],
  );

  const metCount = [rules.length, rules.number, rules.symbol].filter(Boolean).length;
  const strength =
    metCount === 0 ? "weak" : metCount === 1 ? "weak" : metCount === 2 ? "fair" : "strong";
  const strengthColor =
    strength === "weak" ? "var(--red)" : strength === "fair" ? "var(--amber)" : "var(--teal)";

  useEffect(() => {
    const slug = username.trim().toLowerCase();
    if (slug.length < 3) {
      setUsernameState("idle");
      return;
    }
    setUsernameState("checking");
    const timer = window.setTimeout(() => {
      setUsernameState(TAKEN_USERNAMES.has(slug) ? "error" : "valid");
    }, 400);
    return () => window.clearTimeout(timer);
  }, [username]);

  const ready =
    username.trim().length >= 3 &&
    usernameState === "valid" &&
    email.trim().length > 3 &&
    password.length >= 8 &&
    metCount >= 2;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!terms) {
      setTermsError(true);
      setShake(true);
      window.setTimeout(() => setShake(false), 360);
      return;
    }
    setTermsError(false);

    setPending(true);
    try {
      await authApi.register({ username: username.trim(), email: email.trim(), password });
      const me = await authApi.me();
      setAuthenticatedUser(me);
      setSuccess(true);
      window.setTimeout(() => {
        router.push(postAuthPath(Boolean(me.onboarding?.needed), searchParams.get("next")));
        router.refresh();
      }, 450);
    } catch (caught: unknown) {
      const message =
        caught instanceof Error ? caught.message : "Could not create your account.";
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
        eyebrow="Start training · Free in beta"
        title="Create your account"
        subtitle="Your first graded set takes about 15 minutes."
        subtitleShort="About 15 minutes to your first graded set."
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
        <AuthField
          label="Username"
          labelFor="sign-up-username"
          icon={User}
          index={3}
          state={usernameState === "valid" ? "valid" : usernameState === "error" ? "error" : "default"}
          helper={
            usernameState === "valid"
              ? "Available · shown on the leaderboard"
              : usernameState === "error"
                ? "That username is taken"
                : usernameState === "checking"
                  ? "Checking availability…"
                  : undefined
          }
          helperState={
            usernameState === "valid" ? "valid" : usernameState === "error" ? "error" : "default"
          }
          trail={
            usernameState === "valid" ? (
              <Check size={16} color="var(--teal)" aria-hidden />
            ) : null
          }
        >
          <AuthTextInput
            id="sign-up-username"
            name="username"
            type="text"
            required
            autoComplete="username"
            placeholder="ada-lovelace"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </AuthField>

        <AuthField
          label="Work email"
          labelFor="sign-up-email"
          icon={Mail}
          index={4}
          helper="We only email about your account and contests."
        >
          <AuthTextInput
            id="sign-up-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="ada@lab.dev"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </AuthField>

        <AuthField
          label="Password"
          labelFor="sign-up-password"
          icon={Lock}
          index={5}
          trail={<AuthPasswordToggle visible={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
        >
          <AuthTextInput
            id="sign-up-password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </AuthField>

        <PasswordStrength
          rules={rules}
          metCount={metCount}
          strength={strength}
          strengthColor={strengthColor}
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: E, delay: 0.4 }}
        >
          <AuthCheckbox
            id="sign-up-terms"
            checked={terms}
            onChange={(next) => {
              setTerms(next);
              if (next) setTermsError(false);
            }}
            error={termsError}
            label={
              <>
                I agree to the{" "}
                <Link href={routes.home}>Terms</Link> and <Link href={routes.home}>Privacy Policy</Link>
              </>
            }
          />
        </motion.div>

        {error ? <AuthInlineError message={error} /> : null}

        <AuthSubmitButton
          pending={pending}
          success={success}
          idleLabel="Create account"
          pendingLabel="Creating account…"
          disabled={!ready}
          index={7}
        />
      </motion.form>
    </>
  );
}

function PasswordStrength({
  rules,
  metCount,
  strength,
  strengthColor,
}: {
  rules: { length: boolean; number: boolean; symbol: boolean };
  metCount: number;
  strength: string;
  strengthColor: string;
}) {
  const labels = [
    { key: "length", label: "12+ characters", met: rules.length },
    { key: "number", label: "A number", met: rules.number },
    { key: "symbol", label: "A symbol", met: rules.symbol },
  ] as const;

  return (
    <motion.div
      className="lp-auth-figma-strength"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: E, delay: 0.38 }}
    >
      <div className="lp-auth-figma-strength-head">
        <div className="lp-auth-figma-strength-bars">
          {[0, 1, 2, 3].map((i) => {
            const filled =
              strength === "strong"
                ? i < 4
                : strength === "fair"
                  ? i < 2
                  : strength === "weak" && metCount > 0
                    ? i < 1
                    : false;
            return (
              <span key={i} className="lp-auth-figma-strength-seg">
                <motion.span
                  className="lp-auth-figma-strength-seg-fill"
                  style={{ background: strengthColor }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: filled ? 1 : 0 }}
                  transition={{ duration: 0.2, ease: E }}
                />
              </span>
            );
          })}
        </div>
        <span className="lp-auth-figma-strength-label" style={{ color: strengthColor }}>
          {strength === "weak" ? "Weak" : strength === "fair" ? "Fair" : "Strong"}
        </span>
      </div>
      <div className="lp-auth-figma-rules">
        {labels.map((rule) => (
          <Rule key={rule.key} label={rule.label} met={rule.met} />
        ))}
      </div>
    </motion.div>
  );
}

function Rule({ label, met }: { label: string; met: boolean }) {
  return (
    <motion.span
      className={`lp-auth-figma-rule${met ? " is-met" : ""}`}
      animate={met ? { scale: [1, 1.06, 1] } : { scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {met ? <Check size={12} aria-hidden /> : null}
      {label}
    </motion.span>
  );
}
