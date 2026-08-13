'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen, CornerDownLeft, Search, X } from 'lucide-react';
import { useTranslation, useIsRtl } from '@/src/i18n';
import {
  buildStaticSearchIndex,
  filterSearchItems,
} from '@/src/components/marketing/navbarSearch';
import { cn } from '@/src/lib/utils';

type NavbarSearchOverlayProps = {
  open: boolean;
  onClose: () => void;
};

export function NavbarSearchOverlay({ open, onClose }: NavbarSearchOverlayProps) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const staticItems = useMemo(() => buildStaticSearchIndex(), []);
  const results = useMemo(() => filterSearchItems(staticItems, query), [staticItems, query]);
  const trimmedQuery = query.trim();
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  function navigateTo(href: string) {
    onClose();
    router.push(href);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!trimmedQuery) return;

    if (results.length > 0) {
      navigateTo(results[0].href);
      return;
    }

    navigateTo(`/courses?q=${encodeURIComponent(trimmedQuery)}`);
  }

  return (
    <AnimatePresence>
      {open ? (
        <div
          className="fixed inset-0 z-[60]"
          role="dialog"
          aria-modal="true"
          aria-label={t('marketing.searchAria')}
        >
          <motion.button
            type="button"
            aria-label={t('marketing.closeSearchAria')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/20 backdrop-blur-md dark:bg-black/55"
          />

          <div className="relative flex min-h-full items-start justify-center px-4 pb-8 pt-[max(5rem,12vh)] sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'w-full max-w-2xl overflow-hidden rounded-2xl border shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-2xl',
                'border-line/80 bg-bg-elev/90',
                'dark:border-white/15 dark:bg-slate-950/80 dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]',
              )}
              onClick={(event) => event.stopPropagation()}
            >
              <form onSubmit={handleSubmit} className="border-b border-line/80 dark:border-white/10">
                <div className="flex items-center gap-2 px-3 py-3 sm:px-4 sm:py-4">
                  <div className="relative flex min-w-0 flex-1 items-center">
                    <Search
                      className="pointer-events-none absolute left-3.5 size-5 text-primary sm:left-4"
                      strokeWidth={2}
                    />
                    <input
                      ref={inputRef}
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t('marketing.searchPlaceholder')}
                      className={cn(
                        'h-12 w-full rounded-xl border pl-11 pr-4 text-base text-ink outline-none transition sm:h-[3.25rem] sm:pl-12',
                        'border-line/80 bg-bg-soft/80 placeholder:text-ink-3',
                        'focus:border-primary/40 focus:ring-2 focus:ring-primary/15',
                        'dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/45',
                        'dark:focus:border-white/25 dark:focus:ring-white/10',
                      )}
                      autoComplete="off"
                    />
                  </div>

                  <button
                    type="button"
                    aria-label={t('marketing.closeSearchAria')}
                    onClick={onClose}
                    className={cn(
                      'grid size-11 shrink-0 place-items-center rounded-xl border transition-colors sm:size-12',
                      'border-line/80 bg-bg-soft/80 text-ink-2 hover:border-primary/30 hover:text-primary',
                      'dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:text-white',
                    )}
                  >
                    <X className="size-5" strokeWidth={2} />
                  </button>
                </div>
              </form>

              <div className="max-h-[min(50vh,420px)] overflow-y-auto px-2 py-2 sm:px-3 sm:py-3">
                {trimmedQuery && results.length > 0 ? (
                  <ul className="space-y-1">
                    {results.map((item, index) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => navigateTo(item.href)}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors sm:px-3.5',
                            'hover:bg-bg-soft dark:hover:bg-white/[0.06]',
                            index === 0 && 'bg-primary-soft/50 dark:bg-white/[0.08]',
                          )}
                        >
                          <span
                            className={cn(
                              'grid size-10 shrink-0 place-items-center rounded-xl border',
                              'border-primary/15 bg-primary-soft text-primary',
                              'dark:border-white/10 dark:bg-white/10 dark:text-sky-200',
                            )}
                          >
                            <BookOpen className="size-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-ink dark:text-white sm:text-base">
                              {item.label}
                            </span>
                            {item.description ? (
                              <span className="block truncate text-xs text-ink-3 dark:text-white/55 sm:text-sm">
                                {item.description}
                              </span>
                            ) : null}
                          </span>
                          <ArrowIcon className="size-4 shrink-0 text-ink-3 dark:text-white/40" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : trimmedQuery ? (
                  <div
                    className={cn(
                      'rounded-xl border border-dashed px-4 py-4 text-sm',
                      'border-line bg-bg-soft/70 text-ink-2',
                      'dark:border-white/15 dark:bg-white/[0.04] dark:text-white/70',
                    )}
                  >
                    {t('marketing.noQuickMatches')}{' '}
                    <kbd className="rounded-md border border-line bg-bg-elev px-1.5 py-0.5 text-xs font-medium dark:border-white/15 dark:bg-white/10">
                      {t('marketing.enterKey')}
                    </kbd>{' '}
                    {t('marketing.toSearchFor')} &ldquo;{trimmedQuery}&rdquo;.
                  </div>
                ) : (
                  <p className="px-2 py-2 text-sm text-ink-3 dark:text-white/50">
                    {t('marketing.typeToSearch')}
                  </p>
                )}
              </div>

              <div
                className={cn(
                  'flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-4 py-3 text-xs text-ink-3',
                  'border-line/80 dark:border-white/10 dark:text-white/45',
                )}
              >
                <span className="inline-flex items-center gap-1.5">
                  <CornerDownLeft className="size-3.5" />
                  {t('marketing.enterToOpen')}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <kbd className="rounded border border-line bg-bg-soft px-1.5 py-0.5 font-medium dark:border-white/15 dark:bg-white/10">
                    {t('marketing.escToClose')}
                  </kbd>
                  {t('marketing.toClose')}
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
