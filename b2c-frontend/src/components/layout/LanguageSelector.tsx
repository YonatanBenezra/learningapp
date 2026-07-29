'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check, Search, ChevronDown } from 'lucide-react';
import { useTranslation } from '@/src/i18n';
import type { Locale } from '@/src/i18n';
import { cn } from '@/src/lib/utils';

interface Language {
  code: Locale;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = [
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

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const current = languages.find((l) => l.code === locale) ?? languages[0];

  const filtered = useMemo(
    () =>
      languages.filter(
        (l) =>
          l.name.toLowerCase().includes(search.toLowerCase()) ||
          l.nativeName.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          setOpen(!open);
          setSearch('');
        }}
        className={cn(
          'flex items-center gap-1.5 rounded-xl border text-sm font-medium transition-all duration-200',
          compact ? 'size-9 justify-center border-line px-0 py-0' : 'gap-2 border-transparent px-3 py-2',
          open
            ? 'border-line bg-bg-soft text-ink'
            : 'text-ink-2 hover:border-line hover:bg-bg-soft hover:text-ink',
        )}
        aria-label="Select language"
        aria-expanded={open}
      >
        <Globe className={cn('shrink-0', compact ? 'size-[18px]' : 'size-5')} />
        {!compact && <span className="hidden lg:inline">{current.name}</span>}
        {!compact && (
          <ChevronDown
            className={cn(
              'size-3.5 shrink-0 transition-transform duration-200',
              open && 'rotate-180',
            )}
          />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="absolute right-0 top-full z-50 mt-2 w-[240px] overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-card"
          >
            <div className="border-b border-line p-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search language..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full rounded-xl border-0 bg-bg-soft pl-9 pr-3 text-sm text-ink outline-none placeholder:text-ink-3 focus:bg-bg-lav"
                />
              </div>
            </div>

            <div className="max-h-[280px] overflow-y-auto p-1.5">
              {filtered.length === 0 ? (
                <div className="py-6 text-center text-sm text-ink-3">No languages found</div>
              ) : (
                filtered.map((lang) => {
                  const isSelected = lang.code === locale;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLocale(lang.code);
                        setOpen(false);
                        setSearch('');
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-150',
                        isSelected
                          ? 'bg-primary-soft text-primary'
                          : 'text-ink hover:bg-bg-soft',
                      )}
                    >
                      <span className="text-lg leading-none">{lang.flag}</span>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="font-medium leading-tight">{lang.name}</span>
                        <span className="text-[11px] leading-tight text-ink-3">
                          {lang.nativeName}
                        </span>
                      </div>
                      {isSelected && <Check className="size-4 shrink-0 text-primary" />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
