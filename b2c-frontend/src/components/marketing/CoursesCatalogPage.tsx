'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LayoutGrid, List, Search } from 'lucide-react';
import type { CatalogCourse } from '@/src/components/marketing/CourseCatalogCard';
import { CourseCatalogCard } from './CourseCatalogCard';
import { Container } from './Container';
import { Skeleton } from '@/src/components/ui/skeleton';
import type { MarketplaceCourse } from '@/src/domain/marketplace';
import { useMarketplaceCourses } from '@/src/features/marketplace';
import { useAuthHydrated } from '@/src/features/auth/useAuthHydrated';
import { useCourses } from '@/src/features/courses';
import { useAuthStore } from '@/src/store/authStore';
import { resolveCategoryTitle, CATEGORY_TITLES } from '@/src/components/marketing/categoryCounts';
import { InfoTip, Tooltip } from '@/src/components/ui/tooltip';
import { cn } from '@/src/lib/utils';

type ViewMode = 'grid' | 'list';
type CourseCategory = 'All Categories' | string;

function toCatalogCourse(course: MarketplaceCourse): CatalogCourse {
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
  };
}

function buildCoursesUrl(params: { q?: string; category?: string }) {
  const search = new URLSearchParams();
  if (params.q?.trim()) search.set('q', params.q.trim());
  if (params.category && params.category !== 'All Categories') {
    search.set('category', params.category);
  }
  const query = search.toString();
  return query ? `/courses?${query}` : '/courses';
}

export function CoursesCatalogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hydrated = useAuthHydrated();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const user = useAuthStore((state) => state.user);
  const isLearner = !user?.role || user.role === 'user';
  const coursesQ = useMarketplaceCourses();
  const myCoursesQ = useCourses({
    enabled: hydrated && isAuthenticated && isLearner,
  });
  const enrolledCourseIds = useMemo(
    () => new Set((myCoursesQ.data?.courses ?? []).map((course) => course.id)),
    [myCoursesQ.data?.courses],
  );
  const query = searchParams.get('q')?.trim() ?? '';
  const categoryParam = searchParams.get('category');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchInput, setSearchInput] = useState(query);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  const catalogCourses = useMemo(
    () => (coursesQ.data?.courses ?? []).map(toCatalogCourse),
    [coursesQ.data?.courses],
  );

  const categoryFilters = useMemo(() => {
    const extras = new Set<string>();
    for (const course of catalogCourses) {
      const title = resolveCategoryTitle(course.category) ?? course.category;
      if (title && !CATEGORY_TITLES.includes(title)) extras.add(title);
    }
    return ['All Categories', ...CATEGORY_TITLES, ...[...extras].sort()] as CourseCategory[];
  }, [catalogCourses]);

  const activeFilter: CourseCategory =
    categoryParam &&
    (categoryFilters.includes(categoryParam) || CATEGORY_TITLES.includes(categoryParam))
      ? categoryParam
      : 'All Categories';

  const filteredCourses = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    return catalogCourses.filter((course) => {
      const courseCategory = resolveCategoryTitle(course.category) ?? course.category;
      const matchesCategory =
        activeFilter === 'All Categories' || courseCategory === activeFilter;
      if (!matchesCategory) return false;
      if (!normalizedQuery) return true;

      const haystack = [course.title, course.description, course.category, course.level]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [activeFilter, catalogCourses, query]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(buildCoursesUrl({ q: searchInput, category: activeFilter }));
  }

  function toggleBookmark(id: string) {
    setBookmarks((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className="flex min-h-full flex-1 flex-col bg-bg py-8 lg:py-10">
      <Container className="flex flex-1 flex-col">
        <div className="flex items-start gap-2 pb-2" data-tour="tour-course-catalog">
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Course catalog</h1>
          <InfoTip
            content="Browse published marketplace courses. Filter by category or search by title, topic, and level."
            label="About course catalog"
            side="bottom"
            className="mt-3"
          />
        </div>

        <div className="mt-6 flex flex-col gap-4 rounded-lg border border-line bg-bg-elev p-4 shadow-card xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            <div className="inline-flex w-fit items-center rounded-md border border-line bg-bg-soft p-0.5">
              <button
                type="button"
                aria-pressed={viewMode === 'list'}
                onClick={() => setViewMode('list')}
                className={cn(
                  'inline-flex items-center gap-2 rounded-[5px] px-3.5 py-2 text-base font-medium transition-colors',
                  viewMode === 'list'
                    ? 'bg-bg-elev text-ink shadow-xs'
                    : 'text-ink-2 hover:text-ink',
                )}
              >
                <List className="size-4" />
                List
              </button>
              <button
                type="button"
                aria-pressed={viewMode === 'grid'}
                onClick={() => setViewMode('grid')}
                className={cn(
                  'inline-flex items-center gap-2 rounded-[5px] px-3.5 py-2 text-base font-medium transition-colors',
                  viewMode === 'grid'
                    ? 'bg-bg-elev text-ink shadow-xs'
                    : 'text-ink-2 hover:text-ink',
                )}
              >
                <LayoutGrid className="size-4" />
                Grid
              </button>
            </div>

            <p className="text-base text-ink-2">
              <span className="font-semibold tabular-nums text-ink">{filteredCourses.length}</span>{' '}
              courses
              {activeFilter !== 'All Categories' ? (
                <>
                  {' '}
                  · <span className="text-ink">{activeFilter}</span>
                </>
              ) : null}
            </p>
          </div>

          <form onSubmit={submitSearch} className="relative w-full sm:max-w-md xl:w-[360px]">
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search courses..."
              className="h-11 w-full rounded-md border border-line bg-bg py-2 pl-3.5 pr-10 text-base text-ink outline-none transition placeholder:text-ink-3 focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
            <Tooltip content="Search by course title, description, category, or skill level.">
              <button
                type="submit"
                aria-label="Search courses"
                className="absolute right-1 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-ink-3 transition hover:bg-bg-soft hover:text-primary"
              >
                <Search className="size-4" />
              </button>
            </Tooltip>
          </form>
        </div>

        <div
          className="mt-4 flex flex-wrap gap-2 rounded-lg border border-line bg-bg-elev p-3 shadow-card"
          data-tour="tour-course-filters"
        >
          {categoryFilters.map((filter) => {
            const active = activeFilter === filter;
            const href = buildCoursesUrl({ q: query, category: filter });
            return (
              <Link
                key={filter}
                href={href}
                className={cn(
                  'rounded-md px-3.5 py-2 text-base font-medium transition-colors',
                  active
                    ? 'bg-primary-deep text-white'
                    : 'border border-line bg-bg-soft text-ink-2 hover:border-line-2 hover:text-ink',
                )}
              >
                {filter}
              </Link>
            );
          })}
        </div>

        <div className="mt-6 flex flex-1 flex-col">
        {coursesQ.isLoading ? (
          <div
            className={cn(
              viewMode === 'grid'
                ? 'grid gap-5 md:grid-cols-2 xl:grid-cols-3'
                : 'flex flex-col gap-3',
            )}
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-lg border border-line bg-bg-elev shadow-card"
              >
                <Skeleton className="h-11 w-full rounded-none" shimmer />
                <div className="space-y-3 p-5">
                  <Skeleton className="h-5 w-3/4" shimmer />
                  <Skeleton className="h-4 w-full" shimmer />
                  <Skeleton className="h-4 w-5/6" shimmer />
                </div>
                <Skeleton className="h-14 w-full rounded-none" shimmer />
              </div>
            ))}
          </div>
        ) : coursesQ.isError ? (
          <div className="mx-auto mt-10 max-w-lg rounded-lg border border-line bg-bg-elev p-10 text-center shadow-card">
            <p className="text-lg font-semibold text-ink">Could not load courses</p>
            <p className="mt-2 text-sm text-ink-2">Please refresh the page or try again later.</p>
            <button
              type="button"
              onClick={() => void coursesQ.refetch()}
              className="mt-6 inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Try again
            </button>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="mx-auto mt-10 max-w-lg rounded-lg border border-line bg-bg-elev p-10 text-center shadow-card">
            <p className="text-lg font-semibold text-ink">
              {catalogCourses.length === 0
                ? 'No published courses yet'
                : 'No courses match your search'}
            </p>
            <p className="mt-2 text-sm text-ink-2">
              {catalogCourses.length === 0
                ? 'Instructor courses will appear here once they are published.'
                : 'Try another keyword or browse all categories.'}
            </p>
            <Link
              href="/courses"
              className="mt-6 inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              View all courses
            </Link>
          </div>
        ) : (
          <div
            className={cn(
              viewMode === 'grid'
                ? 'grid gap-5 md:grid-cols-2 xl:grid-cols-3'
                : 'flex flex-col gap-3',
            )}
          >
            {filteredCourses.map((course) => (
              <CourseCatalogCard
                key={course.id}
                course={course}
                variant={viewMode}
                enrolled={enrolledCourseIds.has(course.id)}
                bookmarked={bookmarks.has(course.id)}
                onToggleBookmark={() => toggleBookmark(course.id)}
              />
            ))}
          </div>
        )}
        </div>
      </Container>
    </section>
  );
}
