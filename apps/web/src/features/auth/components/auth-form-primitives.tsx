"use client";

import Link from "next/link";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

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
      className="mb-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: E, delay: 0.1 + index * 0.05 }}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9FEF00]">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#F4F4F4] sm:text-[1.75rem]">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-[#8799B5]">{subtitle}</p>
      {subtitleShort ? (
        <p className="mt-1 text-sm text-[#8799B5] sm:hidden">{subtitleShort}</p>
      ) : null}
    </motion.header>
  );
}

export function AuthModeSwitch({
  prompt,
  href,
  label,
  className,
}: {
  prompt: string;
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <motion.p
      className={cn("text-center text-sm text-[#8799B5]", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: E, delay: 0.06 }}
    >
      {prompt}{" "}
      <Link
        href={href}
        className="group inline-flex items-center gap-1 font-semibold text-[#B2F233] underline-offset-2 hover:text-[#9FEF00] hover:underline"
      >
        {label}
        <ArrowRight
          className="size-3.5 transition-transform group-hover:translate-x-0.5"
          strokeWidth={2.25}
          aria-hidden
        />
      </Link>
    </motion.p>
  );
}

export function AuthOAuthRow({ index = 1 }: { index?: number }) {
  return (
    <motion.div
      className="mb-6 grid grid-cols-2 gap-3"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: E, delay: 0.1 + index * 0.05 }}
    >
      <button
        type="button"
        disabled
        aria-label="Sign in with Google"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-[4px] border border-[#3A4559] bg-[#242F40] text-sm font-medium text-[#F4F4F4] opacity-70"
      >
        <GoogleGlyph />
        Google
      </button>
      <button
        type="button"
        disabled
        aria-label="Sign in with GitHub"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-[4px] border border-[#3A4559] bg-[#242F40] text-sm font-medium text-[#F4F4F4] opacity-70"
      >
        <GitHubGlyph />
        GitHub
      </button>
    </motion.div>
  );
}

export function AuthEmailDivider({ index = 2 }: { index?: number }) {
  return (
    <motion.div
      className="relative mb-6 flex items-center gap-3"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: E, delay: 0.1 + index * 0.05 }}
    >
      <span className="h-px flex-1 bg-[#2A3547]" aria-hidden />
      <span className="text-xs font-medium uppercase tracking-wide text-[#526177]">Or with email</span>
      <span className="h-px flex-1 bg-[#2A3547]" aria-hidden />
    </motion.div>
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
      className="space-y-2"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: E, delay: 0.1 + index * 0.05 }}
    >
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-[#F4F4F4]" htmlFor={labelFor}>
          {label}
        </label>
        {labelRight}
      </div>
      <div
        className={cn(
          "flex h-12 items-center gap-3 rounded-[4px] border bg-[#1E2939] px-3 transition-colors",
          "focus-within:border-[#9FEF00] focus-within:ring-1 focus-within:ring-[#9FEF00]/25",
          state === "valid" && "border-[#9FEF00]/50",
          state === "error" && "border-[#F35E5E]",
          state === "default" && "border-[#3A4559]",
        )}
      >
        <Icon size={16} className="shrink-0 text-[#8799B5]" aria-hidden />
        <div className="min-w-0 flex-1">{children}</div>
        {trail ? <span className="shrink-0">{trail}</span> : null}
      </div>
      {helper ? (
        <p
          id={helperId}
          className={cn(
            "text-xs",
            helperState === "valid" && "text-[#9FEF00]",
            helperState === "error" && "text-[#F35E5E]",
            helperState === "default" && "text-[#8799B5]",
          )}
        >
          {helper}
        </p>
      ) : null}
    </motion.div>
  );
}

export function AuthTextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="h-full w-full bg-transparent text-sm text-[#F4F4F4] outline-none placeholder:text-[#526177]"
      {...props}
    />
  );
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
      className="text-xs font-semibold text-[#8799B5] transition-colors hover:text-[#F4F4F4]"
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
    <div
      className={cn(
        "flex items-start gap-3 rounded-[4px] border border-transparent p-1",
        error && "border-[#F35E5E]/40 bg-[#F35E5E]/5",
      )}
    >
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 rounded border-[#3A4559] bg-[#1E2939] accent-[#9FEF00]"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <label className="text-sm leading-snug text-[#8799B5] [&_a]:font-medium [&_a]:text-[#B2F233] [&_a]:hover:underline" htmlFor={id}>
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
  const active = !disabled && !pending && !success;
  return (
    <motion.button
      type="submit"
      className={cn(
        "mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-[4px] text-sm font-bold transition-colors",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9FEF00]",
        success && "bg-[#9FEF00] text-[#121C2B]",
        !success && active && "bg-[#9FEF00] text-[#121C2B] hover:bg-[#b2f233]",
        !success && !active && "cursor-not-allowed bg-[#242F40] text-[#526177]",
      )}
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
          <Loader2 className="size-4 animate-spin" aria-hidden />
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
      className="rounded-[4px] border border-[#F35E5E]/30 bg-[#F35E5E]/10 px-3 py-2 text-sm text-[#F35E5E]"
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
