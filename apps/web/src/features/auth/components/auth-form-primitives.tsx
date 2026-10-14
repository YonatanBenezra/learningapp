"use client";

import { ArrowRight, Check, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";

const E = [0.2, 0, 0, 1] as const;

export function AuthFormIntro({
  eyebrow,
  title,
  subtitle,
  subtitleShort,
  index = 0,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  subtitleShort?: string;
  index?: number;
}) {
  return (
    <motion.header
      className="lp-auth-figma-form-head"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: E, delay: 0.1 + index * 0.05 }}
    >
      <p className="lp-auth-figma-eyebrow lp-auth-figma-eyebrow--desktop">{eyebrow}</p>
      <h2 className="lp-auth-figma-title">{title}</h2>
      <p className="lp-auth-figma-subtitle lp-auth-figma-subtitle--desktop">{subtitle}</p>
      {subtitleShort ? (
        <p className="lp-auth-figma-subtitle lp-auth-figma-subtitle--mobile">{subtitleShort}</p>
      ) : null}
    </motion.header>
  );
}

export function AuthOAuthRow({ index = 1 }: { index?: number }) {
  return (
    <motion.div
      className="lp-auth-figma-oauth-row"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: E, delay: 0.1 + index * 0.05 }}
    >
      <button type="button" className="lp-auth-figma-oauth-btn" disabled aria-label="Sign in with Google">
        <GoogleGlyph />
        Google
      </button>
      <button type="button" className="lp-auth-figma-oauth-btn" disabled aria-label="Sign in with GitHub">
        <GitHubGlyph />
        GitHub
      </button>
    </motion.div>
  );
}

export function AuthEmailDivider({ index = 2 }: { index?: number }) {
  return (
    <motion.p
      className="lp-auth-figma-divider"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: E, delay: 0.1 + index * 0.05 }}
    >
      Or with email
    </motion.p>
  );
}

export function AuthField({
  label,
  labelFor,
  labelRight,
  helper,
  helperState = "default",
  state = "default",
  icon: Icon,
  trail,
  children,
  index = 0,
}: {
  label: string;
  labelFor: string;
  labelRight?: ReactNode;
  helper?: string;
  helperState?: "default" | "valid" | "error";
  state?: "default" | "valid" | "error";
  icon: LucideIcon;
  trail?: ReactNode;
  children: ReactNode;
  index?: number;
}) {
  const helperId = helper ? `${labelFor}-helper` : undefined;
  return (
    <motion.div
      className="lp-auth-figma-field"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: E, delay: 0.1 + index * 0.05 }}
    >
      <div className="lp-auth-figma-field-head">
        <label className="lp-auth-figma-label" htmlFor={labelFor}>
          {label}
        </label>
        {labelRight}
      </div>
      <div
        className={`lp-auth-figma-control${state === "valid" ? " is-valid" : ""}${
          state === "error" ? " is-error" : ""
        }`}
      >
        <Icon size={16} className="lp-auth-figma-control-icon" aria-hidden />
        {children}
        {trail ? <span className="lp-auth-figma-control-trail">{trail}</span> : null}
      </div>
      {helper ? (
        <p
          id={helperId}
          className={`lp-auth-figma-helper${
            helperState === "valid" ? " is-valid" : helperState === "error" ? " is-error" : ""
          }`}
        >
          {helper}
        </p>
      ) : null}
    </motion.div>
  );
}

export function AuthTextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="lp-auth-figma-input" {...props} />;
}

export function AuthPasswordToggle({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="lp-auth-figma-toggle"
      aria-pressed={visible}
      onClick={onToggle}
    >
      {visible ? "Hide" : "Show"}
    </button>
  );
}

export function AuthCheckbox({
  id,
  checked,
  onChange,
  label,
  error,
}: {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  label: ReactNode;
  error?: boolean;
}) {
  return (
    <div className={`lp-auth-figma-check-row${error ? " is-error" : ""}`}>
      <input
        id={id}
        type="checkbox"
        className="lp-auth-figma-check"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <label className="lp-auth-figma-check-label" htmlFor={id}>
        {label}
      </label>
    </div>
  );
}

export function AuthSubmitButton({
  pending,
  success,
  idleLabel,
  pendingLabel,
  disabled,
  index = 6,
}: {
  pending: boolean;
  success: boolean;
  idleLabel: string;
  pendingLabel: string;
  disabled?: boolean;
  index?: number;
}) {
  return (
    <motion.button
      type="submit"
      className={`lp-auth-figma-submit${success ? " is-success" : ""}`}
      disabled={disabled || pending || success}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: E, delay: 0.1 + index * 0.05 }}
    >
      {success ? (
        <>
          <Check size={18} aria-hidden />
          Done
        </>
      ) : pending ? (
        <>
          <span className="lp-auth-figma-spinner" aria-hidden />
          {pendingLabel}
        </>
      ) : (
        <>
          {idleLabel}
          <ArrowRight size={16} aria-hidden />
        </>
      )}
    </motion.button>
  );
}

export function AuthInlineError({ message }: { message: string }) {
  return (
    <motion.p
      role="alert"
      className="lp-auth-figma-inline-error"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {message}
    </motion.p>
  );
}

function GoogleGlyph() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function GitHubGlyph() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.48 0-.24-.01-.86-.01-1.7-2.78.62-3.37-1.36-3.37-1.36-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.94.86.09-.66.35-1.12.64-1.38-2.22-.26-4.56-1.14-4.56-5.08 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05A9.2 9.2 0 0 1 12 6.84c.85.004 1.71.12 2.51.35 1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.95-2.34 4.81-4.57 5.07.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.8 0 .27.18.59.69.49A10.1 10.1 0 0 0 22 12.26C22 6.58 17.52 2 12 2z" />
    </svg>
  );
}

export { Loader2, Check, E };
