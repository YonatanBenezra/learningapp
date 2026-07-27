'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  detectLocale,
  getMessages,
  translate,
  type MessageKey,
} from './locale';
import { LOCALE_STORAGE_KEY, type Locale, type Messages } from './types';

interface I18nContextValue {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, vars?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function subscribeLocale(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange);
  return () => window.removeEventListener('storage', onStoreChange);
}

function getLocaleSnapshot(): Locale {
  return detectLocale();
}

function getServerLocaleSnapshot(): Locale {
  return 'en';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const detected = useSyncExternalStore(subscribeLocale, getLocaleSnapshot, getServerLocaleSnapshot);
  const [locale, setLocaleState] = useState<Locale>(detected);

  useLayoutEffect(() => {
    const initial = detectLocale();
    document.documentElement.lang = initial;
    document.documentElement.dir = initial === 'he' || initial === 'ar' ? 'rtl' : 'ltr';
  }, []);

  useEffect(() => {
    setLocaleState(detected);
  }, [detected]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'he' || locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    setLocaleState(next);
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const messages = getMessages(locale);
    return {
      locale,
      messages,
      setLocale,
      t: (key: MessageKey, vars?: Record<string, string>) => translate(locale, key, vars),
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export function useTranslation() {
  const { t, locale, setLocale, messages } = useI18n();
  return { t, locale, setLocale, messages };
}
