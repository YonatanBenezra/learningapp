import type { Locale, Messages } from './types';
import { LOCALE_STORAGE_KEY } from './types';
import { messages as en } from './messages/en';
import { messages as bn } from './messages/bn';
import { messages as he } from './messages/he';

const catalog: Record<Locale, Messages> = {
  en,
  bn,
  he,
  de: en,
  zh: en,
  es: en,
  fr: en,
  ar: en,
  hi: en,
  ja: en,
};

export function getMessages(locale: Locale): Messages {
  return catalog[locale] ?? en;
}

export type MessageKey =
  | `common.${keyof Messages['common']}`
  | `nav.${keyof Messages['nav']}`
  | `auth.${keyof Messages['auth']}`
  | `dashboard.${keyof Messages['dashboard']}`
  | `courses.${keyof Messages['courses']}`
  | `assessments.${keyof Messages['assessments']}`
  | `settings.${keyof Messages['settings']}`
  | `achievements.${keyof Messages['achievements']}`
  | `admin.${keyof Messages['admin']}`
  | `instructor.${keyof Messages['instructor']}`
  | `marketing.${keyof Messages['marketing']}`;

export function translate(locale: Locale, key: MessageKey, vars?: Record<string, string>): string {
  const parts = key.split('.');
  let value: unknown = getMessages(locale);
  for (const part of parts) {
    value = (value as Record<string, unknown> | undefined)?.[part];
  }
  if (typeof value !== 'string') return key;
  if (!vars) return value;
  return Object.entries(vars).reduce(
    (text, [name, replacement]) => text.replace(`{${name}}`, replacement),
    value,
  );
}

export function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && stored in catalog) return stored as Locale;
  } catch {
    /* ignore */
  }

  const browser = navigator.language.split('-')[0];
  if (browser in catalog) return browser as Locale;

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === 'Asia/Dhaka') return 'bn';
    if (tz === 'Asia/Jerusalem') return 'he';
  } catch {
    /* ignore */
  }

  return 'en';
}

export { catalog };
