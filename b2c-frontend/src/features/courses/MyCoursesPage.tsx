'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BookOpen,
  ChevronRight,
  LayoutGrid,
  List,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react';
import { useCourses } from '@/src/features/courses';
import { learnerCoursePath } from '@/src/features/auth/learnerRoutes';
import { CourseCard, statusVariant } from '@/src/features/courses/components/CourseCard';
import type { Course } from '@/src/domain/course';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Skeleton } from '@/src/components/ui/skeleton';
import { cn } from '@/src/lib/utils';
import {
  useTranslation,
  useIsRtl,
  useCategoryLabel,
  useCourseLevelLabel,
  useCourseStatusLabel,
} from '@/src/i18n';

type FilterTab = 'all' | 'in-progress' | 'completed' | 'generating';
type ViewMode = 'grid' | 'list';

function matchesFilter(course: Course, filter: FilterTab) {
  if (filter === 'all') return true;
  if (filter === 'generating') return course.status === 'generating';
  if (filter === 'completed') {
    return course.status === 'completed' || course.progressPercent >= 100;
  }
  return (
    course.status === 'ready' &&
    course.progressPercent > 0 &&
    course.progressPercent < 100
  );
}

function PageHeader({ courseCount }: { courseCount?: number }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{t('courses.title')}</h1>
        <p className="mt-2 text-sm leading-7 text-ink-2 sm:text-base">
          {courseCount !== undefined
            ? courseCount === 1
              ? t('dashboard.coursesInLibraryOne')
              : t('dashboard.coursesInLibraryMany', { count: String(courseCount) })
            : t('courses.subtitle')}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/courses">
          <Button size="lg" variant="soft" className="rounded-full px-5">
            <BookOpen className="size-4" />
            {t('common.browseCourses')}
          </Button>
        </Link>
        <Link href="/create-course">
          <Button size="lg" className="rounded-full px-5">
            <Plus className="size-4" />
            {t('common.newCourse')}
          </Button>
        </Link>
      </div>
    </div>
  );
}

function CourseToolbar({
  search,
  onSearchChange,
  onSearchSubmit,
  filter,
  onFilterChange,
  view,
  onViewChange,
  resultCount,
  totalCount,
  filterTabs,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  filter: FilterTab;
  onFilterChange: (filter: FilterTab) => void;
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  resultCount: number;
  totalCount: number;
  filterTabs: { id: FilterTab; label: string }[];
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <form onSubmit={onSearchSubmit} className="relative max-w-xl">
        <label htmlFor="course-search" className="sr-only">
          {t('courses.searchLabel')}
        </label>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
        <input
          id="course-search"
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t('courses.searchPlaceholder')}
          className="h-11 w-full rounded-xl border border-line bg-bg-elev pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-ink-3 focus:border-primary focus:ring-2 focus:ring-primary/10"
        />
      </form>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex gap-1 overflow-x-auto pb-1 sm:gap-2"
          role="tablist"
          aria-label={t('courses.filterAria')}
        >
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={filter === tab.id}
              onClick={() => onFilterChange(tab.id)}
              className={cn(
                'shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition',
                filter === tab.id
                  ? 'bg-primary-soft text-primary'
                  : 'text-ink-2 hover:bg-bg-soft hover:text-ink',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <p className="text-sm text-ink-2">
            {resultCount === totalCount
              ? totalCount === 1
                ? t('courses.countOne')
                : t('courses.countMany', { count: String(totalCount) })
              : t('courses.countOf', {
                  shown: String(resultCount),
                  total: String(totalCount),
                })}
          </p>
          <div className="flex rounded-lg border border-line p-0.5">
            <button
              type="button"
              onClick={() => onViewChange('grid')}
              className={cn(
                'grid size-9 place-items-center rounded-md transition',
                view === 'grid' ? 'bg-bg-soft text-primary' : 'text-ink-3 hover:text-ink-2',
              )}
              aria-label={t('courses.gridView')}
              aria-pressed={view === 'grid'}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewChange('list')}
              className={cn(
                'grid size-9 place-items-center rounded-md transition',
                view === 'list' ? 'bg-bg-soft text-primary' : 'text-ink-3 hover:text-ink-2',
              )}
              aria-label={t('courses.listView')}
              aria-pressed={view === 'list'}
            >
              <List className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CourseListRow({ course }: { course: Course }) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const categoryLabel = useCategoryLabel(course.category);
  const levelLabel = useCourseLevelLabel(course.level);
  const status = useCourseStatusLabel(course.status);

  return (
    <div className="flex flex-col gap-3 px-5 py-4 sm:grid sm:grid-cols-[minmax(0,1.6fr)_140px_120px_120px_72px] sm:items-center sm:gap-4 sm:px-6">
      <div className="min-w-0">
        <Link
          href={learnerCoursePath(course.id)}
          className="font-medium text-ink transition hover:text-primary"
        >
          {course.title}
        </Link>
        <p className="mt-1 text-xs text-ink-3">
          {t('courses.levelSuffix', { level: levelLabel })}
        </p>
      </div>
      <p className="text-sm text-ink-2">{categoryLabel}</p>
      <div>
        <Badge variant={statusVariant[course.status]} className="capitalize">
          {status}
        </Badge>
      </div>
      <div>
        <p className="text-sm font-semibold tabular-nums text-ink">{course.progressPercent}%</p>
        <div className="mt-1.5 hidden sm:block">
          <ProgressMini value={course.progressPercent} />
        </div>
      </div>
      <div className="sm:text-right">
        <Link
          href={learnerCoursePath(course.id)}
          className="inline-grid size-8 place-items-center rounded-xl border border-line bg-bg-soft text-ink-3 transition hover:border-primary/30 hover:bg-primary-soft hover:text-primary"
        >
          <ChevronRight className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
        </Link>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8 xl:px-10">
      <div className="space-y-3">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-full max-w-xl" />
      </div>
      <Skeleton className="h-11 w-full max-w-xl rounded-xl" />
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-md" />
        ))}
      </div>
    </div>
  );
}

export function MyCoursesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const queryParam = searchParams.get('q')?.trim() ?? '';
  const [search, setSearch] = useState(queryParam);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [view, setView] = useState<ViewMode>('grid');

  const filterTabs = useMemo(
    () =>
      [
        { id: 'all' as const, label: t('courses.filterAll') },
        { id: 'in-progress' as const, label: t('courses.filterInProgress') },
        { id: 'completed' as const, label: t('courses.filterCompleted') },
        { id: 'generating' as const, label: t('courses.filterGenerating') },
      ] as const,
    [t],
  );

  const { data, isLoading, isError, refetch } = useCourses();
  const courses = data?.courses ?? [];

  const filteredCourses = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();

    return courses.filter((course) => {
      if (!matchesFilter(course, filter)) return false;
      if (!normalizedQuery) return true;

      const haystack = [course.title, course.category, course.level, ...course.topics]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [courses, filter, search]);

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) params.set('q', search.trim());
    else params.delete('q');
    const next = params.toString();
    router.replace(next ? `/my-courses?${next}` : '/my-courses');
  }

  if (isLoading) return <PageSkeleton />;

  const shellClass = 'w-full space-y-6 p-4 sm:p-6 lg:p-8 xl:px-10';

  if (isError) {
    return (
      <div className={shellClass}>
        <PageHeader />
        <div className="rounded-2xl border border-line bg-bg-elev p-10 text-center shadow-card">
          <p className="text-ink-2">{t('courses.loadError')}</p>
          <Button variant="soft" className="mt-4 rounded-full px-5" onClick={() => refetch()}>
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className={shellClass}>
        <PageHeader />
        <div className="rounded-2xl border border-line bg-bg-elev p-10 text-center shadow-card sm:p-12">
          <div className="mx-auto grid size-14 place-items-center rounded-full border border-line bg-bg-soft text-primary">
            <Sparkles className="size-7" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-ink sm:text-2xl">{t('courses.empty')}</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-ink-2">{t('courses.emptyBody')}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/courses">
              <Button size="lg" variant="soft" className="rounded-full px-6">
                {t('common.browseCourses')}
              </Button>
            </Link>
            <Link href="/create-course">
              <Button size="lg" className="rounded-full px-6">
                <Plus className="size-4" />
                {t('dashboard.createCourse')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <PageHeader courseCount={courses.length} />

      <CourseToolbar
        search={search}
        onSearchChange={setSearch}
        onSearchSubmit={handleSearchSubmit}
        filter={filter}
        onFilterChange={setFilter}
        view={view}
        onViewChange={setView}
        resultCount={filteredCourses.length}
        totalCount={courses.length}
        filterTabs={[...filterTabs]}
      />

      {filteredCourses.length === 0 ? (
        <div className="rounded-2xl border border-line bg-bg-elev p-10 text-center shadow-card">
          <div className="mx-auto grid size-12 place-items-center rounded-full border border-line bg-bg-soft text-ink-3">
            <Search className="size-5" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-ink">{t('courses.noMatchTitle')}</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-ink-2">
            {search.trim()
              ? t('courses.noMatchSearch', { query: search.trim() })
              : t('courses.noMatchFilter')}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button
              variant="soft"
              className="rounded-full px-5"
              onClick={() => {
                setSearch('');
                setFilter('all');
                router.replace('/my-courses');
              }}
            >
              {t('courses.resetFilters')}
            </Button>
            <Link href="/create-course">
              <Button className="rounded-full px-5">
                <Plus className="size-4" />
                {t('dashboard.createCourse')}
              </Button>
            </Link>
          </div>
        </div>
      ) : view === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-card">
          <div className="hidden border-b border-line bg-bg-soft px-5 py-3 text-xs font-medium text-ink-3 sm:grid sm:grid-cols-[minmax(0,1.6fr)_140px_120px_120px_72px] sm:gap-4 sm:px-6">
            <span>{t('courses.tableCourseTitle')}</span>
            <span>{t('courses.tableCategory')}</span>
            <span>{t('courses.tableStatus')}</span>
            <span>{t('courses.tableCompletion')}</span>
            <span className="text-right">{t('courses.tableAction')}</span>
          </div>
          <div className="divide-y divide-line">
            {filteredCourses.map((course, index) => (
              <div key={course.id} className={cn(index % 2 === 1 && 'bg-bg-soft/40')}>
                <CourseListRow course={course} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProgressMini({ value }: { value: number }) {
  return (
    <div className="h-1 overflow-hidden rounded-full bg-line">
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
