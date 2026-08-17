'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, Search } from 'lucide-react';
import type { CatalogCourse } from '@/src/components/marketing/CourseCatalogCard';
import { CourseCatalogCard } from './CourseCatalogCard';
import { Container } from './Container';
import { Skeleton } from '@/src/components/ui/skeleton';
import type { MarketplaceCourse } from '@/src/domain/marketplace';
import type { Course } from '@/src/domain/course';
import { useMarketplaceCourses } from '@/src/features/marketplace';
import { useAuthHydrated } from '@/src/features/auth/useAuthHydrated';
import { useCourses } from '@/src/features/courses';
import { useAuthStore } from '@/src/store/authStore';
import { resolveCategoryTitle, CATEGORY_TITLES } from '@/src/components/marketing/categoryCounts';
import { AI_CATEGORY_NAME_SET } from '@/src/constants/aiCategories';
import { categoryLabelFor, useTranslation } from '@/src/i18n';
import { buttonClasses } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';

const ALL_CATEGORIES = 'All Categories';
type CourseCategory = typeof ALL_CATEGORIES | string;
type SortKey = 'default' | 'title' | 'price-asc' | 'price-desc';

function toCatalogCourse(course: MarketplaceCourse, enrolled?: Course): CatalogCourse {
  const price = course.priceCents / 100;
  return {
    id: course.id,
    title: course.title,
    description: course.description.trim(),
    price,
    lessons: course.lessonCount,
    students: course.enrollmentCount,
    category: resolveCategoryTitle(course.category) ?? course.category,
    level: course.level,
    topics: enrolled?.topics ?? [],
    progressPercent: enrolled?.progressPercent,
  };
}

function buildCoursesUrl(params: { q?: string; category?: string }) {
  const search = new URLSearchParams();
  if (params.q?.trim()) search.set('q', params.q.trim());
  if (params.category && params.category !== ALL_CATEGORIES) {
    search.set('category', params.category);
  }
  const query = search.toString();
  return query ? `/courses?${query}` : '/courses';
}

export function CoursesCatalogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const hydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const user = useAuthStore((state) => state.user);
  const isLearner = !user?.role || user.role === 'user';
  const coursesQ = useMarketplaceCourses();
  const myCoursesQ = useCourses({
    enabled: hydrated && isAuthenticated && isLearner,
  });
  const myCoursesById = useMemo(() => {
    const map = new Map<string, Course>();
    for (const course of myCoursesQ.data?.courses ?? []) map.set(course.id, course);
    return map;
  }, [myCoursesQ.data?.courses]);
  const query = searchParams.get('q')?.trim() ?? '';
  const categoryParam = searchParams.get('category');
  const [searchInput, setSearchInput] = useState(query);
  const [sortKey, setSortKey] = useState<SortKey>('default');

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  const catalogCourses = useMemo(
    () =>
      (coursesQ.data?.courses ?? []).map((course) =>
        toCatalogCourse(course, myCoursesById.get(course.id)),
      ),
    [coursesQ.data?.courses, myCoursesById],
  );

  const categoryFilters = useMemo(() => {
    const extras = new Set<string>();
    for (const course of catalogCourses) {
      const title = resolveCategoryTitle(course.category) ?? course.category;
      if (title && !AI_CATEGORY_NAME_SET.has(title)) extras.add(title);
    }
    return [ALL_CATEGORIES, ...CATEGORY_TITLES, ...[...extras].sort()] as CourseCategory[];
  }, [catalogCourses]);

  const activeFilter: CourseCategory =
    categoryParam &&
    (categoryFilters.includes(categoryParam) || AI_CATEGORY_NAME_SET.has(categoryParam))
      ? categoryParam
      : ALL_CATEGORIES;

  const filteredCourses = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    const filtered = catalogCourses.filter((course) => {
      const courseCategory = resolveCategoryTitle(course.category) ?? course.category;
      const matchesCategory =
        activeFilter === ALL_CATEGORIES || courseCategory === activeFilter;
      if (!matchesCategory) return false;
      if (!normalizedQuery) return true;

      const haystack = [course.title, course.description, course.category, course.level, ...course.topics]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });

    const sorted = [...filtered];
    if (sortKey === 'title') sorted.sort((a, b) => a.title.localeCompare(b.title));
    if (sortKey === 'price-asc') sorted.sort((a, b) => a.price - b.price);
    if (sortKey === 'price-desc') sorted.sort((a, b) => b.price - a.price);
    return sorted;
  }, [activeFilter, catalogCourses, query, sortKey]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(buildCoursesUrl({ q: searchInput, category: activeFilter }));
  }

  function tabLabel(filter: CourseCategory) {
    if (filter === ALL_CATEGORIES) return t('marketing.catalogAll');
    return categoryLabelFor(t, filter);
  }

  const fieldClass =
    'h-11 rounded-md border border-line/80 bg-bg-elev/80 text-sm text-ink outline-none transition placeholder:text-ink/40 focus:border-primary focus:ring-2 focus:ring-primary/10';

  return (
    <section className="flex min-h-full flex-1 flex-col bg-[var(--marketing-hero)] pt-6 pb-16 lg:pt-8 lg:pb-16">
      <Container className="flex flex-1 flex-col">
        <header className="max-w-2xl" data-tour="tour-course-catalog">
          <h1 className="font-heading text-[2rem] font-medium leading-[1.18] tracking-[-0.02em] text-ink sm:text-[2.45rem]">
            {t('marketing.catalogTitle')}
          </h1>
          <p className="mt-3 text-base leading-7 text-ink/70">{t('marketing.catalogTip')}</p>
        </header>

        <nav
          className="-mx-4 mt-8 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label={t('marketing.allCategories')}
          data-tour="tour-course-filters"
        >
          <div className="flex min-w-max gap-6 border-b border-line/70">
            {categoryFilters.map((filter) => {
              const active = activeFilter === filter;
              return (
                <Link
                  key={filter}
                  href={buildCoursesUrl({ q: query, category: filter })}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    '-mb-px whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors',
                    active
                      ? 'border-primary text-ink'
                      : 'border-transparent text-ink/45 hover:text-ink',
                  )}
                >
                  {tabLabel(filter)}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <form onSubmit={submitSearch} className="relative min-w-0 w-full sm:w-72">
            <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-ink/40" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t('marketing.searchCourses')}
              aria-label={t('marketing.searchCoursesAria')}
              className={`${fieldClass} w-full py-2 ps-10 pe-3.5`}
            />
          </form>
          <div className="relative w-full sm:w-44">
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              aria-label={t('marketing.catalogSort')}
              className={`${fieldClass} w-full cursor-pointer appearance-none px-3.5 pe-10`}
            >
              <option value="default">{t('marketing.catalogSort')}</option>
              <option value="title">{t('marketing.catalogSortTitle')}</option>
              <option value="price-asc">{t('marketing.catalogSortPriceLow')}</option>
              <option value="price-desc">{t('marketing.catalogSortPriceHigh')}</option>
            </select>
            <ChevronDown className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-ink/40" />
          </div>
        </div>

        <div className="mt-8 flex flex-1 flex-col">
          {coursesQ.isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="rounded-md border border-line/80 bg-bg-elev/90 p-5">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-10 rounded-md" shimmer />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-28" shimmer />
                      <Skeleton className="mt-2 h-3 w-16" shimmer />
                    </div>
                  </div>
              <Skeleton className="mt-5 h-6 w-4/5" shimmer />
              <Skeleton className="mt-4 h-3 w-16" shimmer />
              <div className="mt-2 flex gap-2">
                <Skeleton className="h-5 w-14 rounded-md" shimmer />
                <Skeleton className="h-5 w-16 rounded-md" shimmer />
              </div>
              <Skeleton className="mt-6 h-3 w-20" shimmer />
              <Skeleton className="mt-1.5 h-2 w-full rounded-full" shimmer />
              <Skeleton className="mt-4 h-11 w-full rounded-md" shimmer />
                </div>
              ))}
            </div>
          ) : coursesQ.isError ? (
            <div className="mx-auto mt-16 max-w-md text-center">
              <p className="text-lg font-medium text-ink">{t('marketing.loadCoursesError')}</p>
              <p className="mt-2 text-sm leading-6 text-ink/65">{t('marketing.loadCoursesErrorHint')}</p>
              <button
                type="button"
                onClick={() => void coursesQ.refetch()}
                className={buttonClasses({
                  size: 'lg',
                  className: 'mt-6 h-11 rounded-md px-5 text-sm font-medium shadow-none',
                })}
              >
                {t('marketing.tryAgain')}
              </button>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="mx-auto mt-16 max-w-md text-center">
              <p className="text-lg font-medium text-ink">
                {catalogCourses.length === 0
                  ? t('marketing.noPublishedCourses')
                  : t('marketing.noSearchResults')}
              </p>
              <p className="mt-2 text-sm leading-6 text-ink/65">
                {catalogCourses.length === 0
                  ? t('marketing.noPublishedHint')
                  : t('marketing.noSearchHint')}
              </p>
              <Link
                href="/courses"
                className={buttonClasses({
                  variant: 'outline',
                  size: 'lg',
                  className: 'mt-6 h-11 rounded-md bg-transparent px-5 text-sm font-medium',
                })}
              >
                {t('marketing.viewAllCourses')}
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredCourses.map((course) => (
                <CourseCatalogCard
                  key={course.id}
                  course={course}
                  enrolled={myCoursesById.has(course.id)}
                />
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
