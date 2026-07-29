'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, BookOpen, Search, X } from 'lucide-react';
import { Container } from '@/src/components/marketing/Container';
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
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const staticItems = useMemo(() => buildStaticSearchIndex(), []);
  const results = useMemo(() => filterSearchItems(staticItems, query), [staticItems, query]);
  const trimmedQuery = query.trim();

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    inputRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-bg"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <div className="shrink-0 border-b border-line bg-bg-elev/95 backdrop-blur-md">
        <Container className="py-4 sm:py-5">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <div className="relative flex flex-1 items-center">
              <Search
                className="pointer-events-none absolute left-4 size-5 text-ink-3"
                strokeWidth={2}
              />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search courses, categories, or pages…"
                className="h-14 w-full rounded-lg border border-line bg-bg-soft pl-12 pr-4 text-base text-ink outline-none transition placeholder:text-ink-3 focus:border-primary focus:ring-2 focus:ring-primary/15"
                autoComplete="off"
              />
            </div>

            <button
              type="button"
              aria-label="Close search"
              onClick={onClose}
              className="grid size-12 shrink-0 place-items-center rounded-lg border border-line bg-bg-elev text-ink-2 transition-colors hover:border-primary/30 hover:bg-bg-soft hover:text-primary sm:size-14"
            >
              <X className="size-5" strokeWidth={2} />
            </button>
          </form>
        </Container>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <Container className="py-4 sm:py-6">
          {trimmedQuery && results.length > 0 ? (
            <ul className="overflow-hidden rounded-lg border border-line bg-bg-elev shadow-soft">
              {results.map((item, index) => (
                <li key={item.id} className="border-b border-line last:border-b-0">
                  <button
                    type="button"
                    onClick={() => navigateTo(item.href)}
                    className={cn(
                      'flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-bg-soft',
                      index === 0 && 'bg-primary-soft/40',
                    )}
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                      <BookOpen className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base font-semibold text-ink">
                        {item.label}
                      </span>
                      {item.description ? (
                        <span className="block truncate text-sm text-ink-3">
                          {item.description}
                        </span>
                      ) : null}
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-ink-3" />
                  </button>
                </li>
              ))}
            </ul>
          ) : trimmedQuery ? (
            <p className="rounded-lg border border-dashed border-line bg-bg-soft px-4 py-3 text-sm text-ink-2">
              No quick matches. Press Enter to search courses for &ldquo;{trimmedQuery}&rdquo;.
            </p>
          ) : (
            <p className="text-sm text-ink-3">
              Type to search pages, courses, and categories.
            </p>
          )}
        </Container>
      </div>
    </div>
  );
}
