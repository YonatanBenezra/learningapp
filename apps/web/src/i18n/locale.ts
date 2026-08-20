import type { Locale, Messages } from './types';
import { LOCALE_STORAGE_KEY } from './types';
import { messages as en } from './messages/en';
import { messages as bn } from './messages/bn';
import { messages as he } from './messages/he';
import { messages as de } from './messages/de';
import { messages as zh } from './messages/zh';
import { messages as es } from './messages/es';
import { messages as ar } from './messages/ar';
import { messages as hi } from './messages/hi';
import { messages as fr } from './messages/fr';
import { messages as ja } from './messages/ja';

const catalog: Record<Locale, Messages> = {
  en,
  bn,
  he,
  de,
  zh,
  es,
  fr: fr,
  ar: ar,
  hi: hi,
  ja: ja,
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
  | `subscription.${keyof Messages['subscription']}`
  | `createCourse.${keyof Messages['createCourse']}`
  | `assessments.${keyof Messages['assessments']}`
  | `settings.${keyof Messages['settings']}`
  | `profile.${keyof Messages['profile']}`
  | `profileMenu.${keyof Messages['profileMenu']}`
  | `notifications.${keyof Messages['notifications']}`
  | `player.${keyof Messages['player']}`
  | `assessmentRunner.${keyof Messages['assessmentRunner']}`
  | `exercises.${keyof Messages['exercises']}`
  | `marketplace.${keyof Messages['marketplace']}`
  | `labs.${keyof Messages['labs']}`
  | `achievements.${keyof Messages['achievements']}`
  | `admin.${keyof Messages['admin']}`
  | `adminCommon.${keyof Messages['adminCommon']}`
  | `instructor.${keyof Messages['instructor']}`
  | `authExtra.${keyof Messages['authExtra']}`
  | `navbarExtra.${keyof Messages['navbarExtra']}`
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
    if (tz === 'Europe/Berlin') return 'de';
    if (tz === 'Asia/Shanghai' || tz === 'Asia/Chongqing' || tz === 'Asia/Hong_Kong') return 'zh';
    if (
      tz === 'Europe/Madrid' ||
      tz === 'America/Mexico_City' ||
      tz === 'America/Bogota' ||
      tz === 'America/Argentina/Buenos_Aires'
    )
      return 'es';
    if (
      tz === 'Asia/Riyadh' ||
      tz === 'Asia/Dubai' ||
      tz === 'Africa/Cairo' ||
      tz === 'Asia/Baghdad' ||
      tz === 'Asia/Kuwait'
    )
      return 'ar';
    if (tz === 'Asia/Kolkata') return 'hi';
    if (tz === 'Asia/Tokyo') return 'ja';
    if (tz === 'Europe/Paris' || tz === 'Europe/Brussels' || tz === 'America/Montreal') return 'fr';
  } catch {
    /* ignore */
  }

  return 'en';
}

export { catalog };
