'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen, CornerDownLeft, FolderOpen, Layers, Search, X } from 'lucide-react';
import { useTranslation, useIsRtl, useMarketingNavLinks, categoryLabelFor } from '@/src/i18n';
import { filterSearchItems, type NavbarSearchItem } from '@/src/components/marketing/navbarSearch';
import { CATEGORIES } from '@/src/components/marketing/data';
import { useMarketplaceCourses } from '@/src/features/marketplace';
import { cn } from '@/src/lib/utils';

type NavbarSearchOverlayProps = {
  open: boolean;
  onClose: () => void;
};

const GROUP_ICONS = {
  page: FolderOpen,
  category: Layers,
  course: BookOpen,
} as const;

export function NavbarSearchOverlay({ open, onClose }: NavbarSearchOverlayProps) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const navLinks = useMarketingNavLinks();
  const marketplaceQ = useMarketplaceCourses();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  if (!open && (query !== '' || highlightedIndex !== 0)) {
    setQuery('');
    setHighlightedIndex(0);
  }

  const catalog = useMemo<NavbarSearchItem[]>(() => {
    const pages: NavbarSearchItem[] = navLinks.map((link) => ({
      id: `page-${link.href}`,
      label: link.label,
      description: t('marketing.resultTypePage'),
      href: link.href,
      group: 'page',
    }));

    const categories: NavbarSearchItem[] = CATEGORIES.map((category) => ({
      id: `category-${category.title}`,
      label: categoryLabelFor(t, category.title),
      description: t('marketing.resultTypeCategory'),
      href: `/courses?category=${encodeURIComponent(category.title)}`,
      group: 'category',
    }));

    const courses: NavbarSearchItem[] = (marketplaceQ.data?.courses ?? []).map((course) => ({
      id: `course-${course.id}`,
      label: course.title,
      description: [course.instructorName, course.category].filter(Boolean).join(' · ') || t('marketing.resultTypeCourse'),
      href: `/courses/${course.id}`,
      group: 'course',
    }));

    return [...pages, ...categories, ...courses];
  }, [marketplaceQ.data?.courses, navLinks, t]);

  const trimmedQuery = query.trim();
  const results = useMemo(() => {
    if (!trimmedQuery) {
      return catalog.filter((item) => item.group !== 'course').slice(0, 8);
    }
    return filterSearchItems(catalog, trimmedQuery, 8);
  }, [catalog, trimmedQuery]);

  const activeIndex = Math.min(highlightedIndex, Math.max(results.length - 1, 0));

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, [open]);

  function closeSearch() {
    setQuery('');
    setHighlightedIndex(0);
    onClose();
  }

  function navigateTo(href: string) {
    closeSearch();
    router.push(href);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (results[activeIndex]) {
      navigateTo(results[activeIndex].href);
      return;
    }
    if (trimmedQuery) {
      navigateTo(`/courses?q=${encodeURIComponent(trimmedQuery)}`);
    }
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((index) => (results.length === 0 ? 0 : (index + 1) % results.length));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((index) =>
        results.length === 0 ? 0 : (index - 1 + results.length) % results.length,
      );
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      closeSearch();
    }
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
            onClick={closeSearch}
            className="absolute inset-0 bg-ink/25 backdrop-blur-md"
          />

          <div className="relative flex min-h-full items-start justify-center px-4 pb-8 pt-[max(5rem,12vh)] sm:px-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-bg-elev"
              onClick={(event) => event.stopPropagation()}
            >
              <form onSubmit={handleSubmit} className="border-b border-line">
                <div className="flex items-center gap-2 px-3 py-3 sm:px-4">
                  <div className="relative flex min-w-0 flex-1 items-center">
                    <Search
                      className="pointer-events-none absolute start-3.5 size-4 text-ink-3"
                      strokeWidth={2}
                    />
                    <input
                      ref={inputRef}
                      type="search"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setHighlightedIndex(0);
                      }}
                      onKeyDown={onInputKeyDown}
                      placeholder={t('marketing.searchPlaceholder')}
                      aria-activedescendant={results[activeIndex] ? `search-option-${results[activeIndex].id}` : undefined}
                      aria-controls="navbar-search-results"
                      className="h-11 w-full rounded-lg border border-line bg-bg-soft ps-10 pe-3 text-sm text-ink outline-none placeholder:text-ink-3 focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                      autoComplete="off"
                      role="combobox"
                      aria-expanded="true"
                      aria-autocomplete="list"
                    />
                  </div>

                  <button
                    type="button"
                    aria-label={t('marketing.closeSearchAria')}
                    onClick={closeSearch}
                    className="grid size-11 shrink-0 place-items-center rounded-lg border border-line bg-bg-soft text-ink-2 transition-colors hover:text-ink"
                  >
                    <X className="size-4" strokeWidth={2} />
                  </button>
                </div>
              </form>

              <div id="navbar-search-results" role="listbox" className="max-h-[min(50vh,420px)] overflow-y-auto px-2 py-2">
                {results.length > 0 ? (
                  <ul className="space-y-0.5">
                    {results.map((item, index) => {
                      const Icon = GROUP_ICONS[item.group];
                      const active = index === activeIndex;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            id={`search-option-${item.id}`}
                            role="option"
                            aria-selected={active}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            onClick={() => navigateTo(item.href)}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                              active ? 'bg-primary-soft' : 'hover:bg-bg-soft',
                            )}
                          >
                            <span
                              className={cn(
                                'grid size-9 shrink-0 place-items-center rounded-lg border',
                                active
                                  ? 'border-primary/20 bg-bg-elev text-primary'
                                  : 'border-line bg-bg-soft text-ink-3',
                              )}
                            >
                              <Icon className="size-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-ink">{item.label}</span>
                              {item.description ? (
                                <span className="block truncate text-xs text-ink-3">{item.description}</span>
                              ) : null}
                            </span>
                            <ArrowIcon className="size-4 shrink-0 text-ink-3" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : trimmedQuery ? (
                  <div className="rounded-lg border border-dashed border-line bg-bg-soft/70 px-4 py-4 text-sm text-ink-2">
                    {t('marketing.noQuickMatches')}{' '}
                    <kbd className="rounded-md border border-line bg-bg-elev px-1.5 py-0.5 text-xs font-medium">
                      {t('marketing.enterKey')}
                    </kbd>{' '}
                    {t('marketing.toSearchFor')} &ldquo;{trimmedQuery}&rdquo;.
                  </div>
                ) : (
                  <p className="px-2 py-2 text-sm text-ink-3">{t('marketing.typeToSearch')}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-4 py-2.5 text-xs text-ink-3">
                <span className="inline-flex items-center gap-1.5">
                  <CornerDownLeft className="size-3.5" />
                  {t('marketing.enterToOpen')}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <kbd className="rounded border border-line bg-bg-soft px-1.5 py-0.5 font-medium">
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
