'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  ArrowRight,
  ArrowLeft,
  Globe,
  Check,
  ChevronDown,
  Search,
  Sparkles,
} from 'lucide-react';
import { useLogin, useSignup } from './useAuth';
import { ApiError } from '@/src/infrastructure/apiClient';
import { useTranslation } from '@/src/i18n';
import { PasswordStrength } from './PasswordStrength';
import { AuthIllustration } from './AuthIllustration';
import { Spinner } from '@/src/components/ui/spinner';

const GOOGLE_ENABLED = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function authSwitchHref(mode: 'login' | 'signup') {
  if (typeof window === 'undefined') return mode === 'login' ? '/login' : '/signup';
  const redirect = new URLSearchParams(window.location.search).get('redirect');
  const base = mode === 'login' ? '/login' : '/signup';
  return redirect ? `${base}?redirect=${encodeURIComponent(redirect)}` : base;
}

function AuthLogo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5" aria-label="AIStudy home">
      <span className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary">
        <Sparkles className="size-5" />
      </span>
      <span className="font-heading text-xl font-semibold tracking-tight text-ink">
        <span className="text-primary">AI</span>
        Study
      </span>
    </Link>
  );
}

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const { t } = useTranslation();
  const isSignup = mode === 'signup';
  const login = useLogin();
  const signup = useSignup();
  const mutation = isSignup ? signup : login;
  const [switchHref, setSwitchHref] = useState(isSignup ? '/login' : '/signup');

  useEffect(() => {
    setSwitchHref(authSwitchHref(isSignup ? 'login' : 'signup'));
  }, [isSignup]);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [googleMsg, setGoogleMsg] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const serverError = mutation.error instanceof ApiError ? mutation.error.message : null;
  const error = localError ?? serverError;

  const isNameValid = fullName.trim().length > 0;
  const isEmailValid = emailRe.test(email);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    if (isSignup && !fullName.trim()) return setLocalError(t('auth.errorName'));
    if (!emailRe.test(email)) return setLocalError(t('auth.errorEmail'));
    if (isSignup && password.length < 8)
      return setLocalError(t('auth.errorPasswordShort'));
    if (!password) return setLocalError(t('auth.errorPasswordRequired'));
    if (isSignup) {
      signup.mutate({ email: email.trim(), password, name: fullName.trim() });
      return;
    }
    login.mutate({ email: email.trim(), password });
  }

  const inputBase =
    'h-12 w-full rounded-xl border bg-bg-elev px-3 text-sm text-ink outline-none placeholder:text-ink-3 transition-colors duration-200';
  const inputIdle = 'border-line hover:border-line-2';
  const inputFocus = 'border-primary ring-2 ring-primary/15';

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-bg p-4 sm:p-6 lg:p-8">
      <div className="flex w-full max-w-[1180px] overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-lift">
        <div className="flex w-full flex-col p-8 sm:w-[55%] sm:p-10 lg:p-12">
          <div className="mb-8 flex items-center justify-between gap-4">
            <Link
              href="/"
              className="flex size-10 items-center justify-center rounded-xl border border-line text-ink-3 transition-colors hover:border-line-2 hover:bg-bg-soft hover:text-ink"
              aria-label="Back to home"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <p className="text-right text-sm text-ink-2">
              {isSignup ? t('auth.alreadyHaveAccount') + ' ' : t('auth.noAccount') + ' '}
              <Link
                href={switchHref}
                className="font-semibold text-primary transition-colors hover:text-primary-dark"
              >
                {isSignup ? t('common.signIn') : t('common.signUp')}
              </Link>
            </p>
          </div>

          <AuthLogo />

          <div className="mb-8 mt-8">
            <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {isSignup ? t('auth.createAccount') : t('auth.welcomeBack')}
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-2">
              {isSignup ? t('auth.signupSubtitle') : t('auth.loginSubtitle')}
            </p>
          </div>

          <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
            {isSignup && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="fullName" className="text-sm font-medium text-ink-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
                  <input
                    id="fullName"
                    type="text"
                    autoComplete="name"
                    placeholder="John Doe"
                    className={`${inputBase} pl-10 pr-10 ${focusedField === 'fullName' ? inputFocus : inputIdle}`}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onFocus={() => setFocusedField('fullName')}
                    onBlur={() => setFocusedField(null)}
                  />
                  {isNameValid && (
                    <span className="absolute right-3 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-ink-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={`${inputBase} pl-10 pr-10 ${focusedField === 'email' ? inputFocus : inputIdle}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
                {isEmailValid && (
                  <span className="absolute right-3 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-sm font-medium text-ink-2">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  placeholder={isSignup ? 'At least 8 characters' : 'Your password'}
                  className={`${inputBase} pl-10 pr-10 ${focusedField === 'password' ? inputFocus : inputIdle}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 transition-colors hover:text-ink-2"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {isSignup && <PasswordStrength password={password} />}
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="rounded-lg bg-bad-soft px-4 py-2.5 text-sm text-bad"
                  role="alert"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-white shadow-[var(--shadow-primary)] transition-all hover:bg-primary-dark disabled:opacity-50"
            >
              {mutation.isPending ? (
                <>
                  <Spinner className="size-4 text-white" />
                  Please wait…
                </>
              ) : (
                <>
                  {isSignup ? 'Create account' : 'Sign in'}
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>

            {isSignup ? (
              <p className="text-center text-xs leading-relaxed text-ink-3">
                By creating an account, you agree to our{' '}
                <Link href="/contact" className="font-medium text-primary hover:text-primary-dark">
                  Terms & Privacy Policy
                </Link>
                .
              </p>
            ) : null}
          </form>

          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-line" />
            <span className="text-xs font-medium uppercase tracking-wider text-ink-3">Or continue with</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <button
            type="button"
            className="flex h-12 w-full items-center justify-center gap-2.5 rounded-full border border-line bg-bg-soft text-sm font-medium text-ink-2 transition-colors hover:border-primary/30 hover:bg-bg hover:text-ink"
            onClick={() =>
              GOOGLE_ENABLED
                ? setGoogleMsg('Google sign-in will be available soon.')
                : setGoogleMsg('Google sign-in is not configured yet — use email for now.')
            }
          >
            <GoogleMark />
            Continue with Google
          </button>
          {googleMsg ? (
            <p className="mt-2.5 text-center text-xs text-ink-3">{googleMsg}</p>
          ) : null}

          <div className="mt-auto pt-8">
            <AuthLanguageSelector />
          </div>
        </div>

        <div className="hidden w-[45%] lg:block">
          <AuthIllustration />
        </div>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z" />
      <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1 .7-2.4 1.2-4 1.2-3 0-5.6-2-6.6-4.8H1.4v3C3.4 21.4 7.4 24 12 24z" />
      <path fill="#FBBC05" d="M5.4 14.5a7.2 7.2 0 0 1 0-4.6v-3H1.4a12 12 0 0 0 0 10.6l4-3z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.6 1.4 6.4l4 3C6.4 6.7 9 4.8 12 4.8z" />
    </svg>
  );
}

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
];

function AuthLanguageSelector() {
  const { locale, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const current = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

  const filtered = LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpen(false); setSearch(''); }
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch(''); }}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-ink-2 transition-colors hover:bg-bg-soft hover:text-ink"
      >
        <Globe className="size-3.5" />
        <span>{current.flag} {current.code.toUpperCase()}</span>
        <ChevronDown className={`size-3 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-full left-0 z-50 mb-2 w-[220px] overflow-hidden rounded-xl border border-line bg-bg-elev shadow-lift"
          >
            <div className="border-b border-line p-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-3" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-full rounded-lg border-0 bg-bg-soft pl-8 pr-2 text-xs text-ink outline-none placeholder:text-ink-3 focus:ring-2 focus:ring-primary/15"
                />
              </div>
            </div>
            <div className="max-h-[240px] overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <div className="py-4 text-center text-xs text-ink-3">No results</div>
              ) : (
                filtered.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setLocale(lang.code as typeof locale);
                      setOpen(false);
                      setSearch('');
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs transition-colors ${
                      lang.code === locale
                        ? 'bg-primary-soft text-primary'
                        : 'text-ink-2 hover:bg-bg-soft'
                    }`}
                  >
                    <span className="text-sm">{lang.flag}</span>
                    <span className="flex-1 font-medium">{lang.name}</span>
                    {lang.code === locale && <Check className="size-3.5 text-primary" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
