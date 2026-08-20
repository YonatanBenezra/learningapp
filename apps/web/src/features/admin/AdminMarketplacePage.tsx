'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import {
  AdminCardGridSkeleton,
  AdminFilterBarSkeleton,
  AdminReportLoadingShell,
} from './AdminUi';
import { useTranslation } from '@/src/i18n';
import { cn } from '@/src/lib/utils';
import { formatUsd } from './AdminUi';
import type { AdminMarketplaceCourseSummary } from './adminApi';
import { useAdminMarketplace } from './useAdmin';

type PublishFilter = 'all' | 'published' | 'draft';
type StatusFilter = 'all' | 'failed' | 'generating' | 'ready';
type KindFilter = 'all' | 'marketplace' | 'personal';

function parseStatusFilter(value: string | null): StatusFilter {
  if (value === 'failed' || value === 'generating' || value === 'ready') return value;
  return 'all';
}

function InlineMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[120px] flex-1 px-5 py-4 sm:px-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-3">{label}</p>
      <p className="mt-1.5 font-heading text-2xl font-semibold tabular-nums text-ink">{value}</p>
    </div>
  );
}

function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="min-w-[148px]">
      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-ink-3">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className={cn(
          'h-9 w-full rounded-md border border-line bg-bg px-3 text-sm text-ink',
          'outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15',
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function creatorInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || '?';
}

function courseStatusVariant(status: string): 'default' | 'good' | 'warn' | 'bad' {
  if (status === 'ready') return 'good';
  if (status === 'generating') return 'warn';
  if (status === 'failed') return 'bad';
  return 'default';
}

function courseCardStyles(course: AdminMarketplaceCourseSummary) {
  if (course.status === 'failed') {
    return 'border-bad/25 bg-[var(--sidebar-bg)] hover:border-bad/40';
  }
  if (course.status === 'generating') {
    return 'border-warn/25 bg-[var(--sidebar-bg)] hover:border-warn/40';
  }
  return 'border-line bg-[var(--sidebar-bg)] hover:border-primary/30';
}

function AdminMarketplaceCourseCard({ course }: { course: AdminMarketplaceCourseSummary }) {
  return (
    <article
      className={cn(
        'group overflow-hidden rounded-md border shadow-card transition',
        courseCardStyles(course),
      )}
    >
      <Link href={`/admin/marketplace/${course.id}`} className="block">
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 font-heading text-lg font-semibold leading-snug text-ink group-hover:text-primary">
              {course.title}
            </h3>
            <ChevronRight className="mt-0.5 size-4 shrink-0 text-ink-3 transition group-hover:text-primary" />
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge variant={course.kind === 'marketplace' ? 'primary' : 'default'} className="capitalize">
              {course.kind}
            </Badge>
            <Badge variant={course.isPublished ? 'good' : 'warn'}>
              {course.isPublished ? 'Published' : 'Draft'}
            </Badge>
            <Badge variant={courseStatusVariant(course.status)} className="capitalize">
              {course.status}
            </Badge>
          </div>

          <p className="mt-3 text-xs font-medium uppercase tracking-[0.1em] text-ink-3">
            {course.category} · {course.level}
          </p>

          <div className="mt-4 flex items-center gap-2.5 border-t border-line/80 pt-4">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
              {creatorInitial(course.creatorName)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{course.creatorName}</p>
              <p className="truncate text-xs text-ink-3">
                {course.creatorEmail || 'No email on file'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 border-t border-line/80 bg-bg-soft/50">
          <div className="px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3">Price</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-ink">
              {formatUsd(course.priceCents)}
            </p>
          </div>
          <div className="border-x border-line/80 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3">
              Students
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-ink">
              {course.enrollmentCount.toLocaleString()}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3">
              Revenue
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-primary">
              {formatUsd(course.revenueCents)}
            </p>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function AdminMarketplacePage() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const dataQ = useAdminMarketplace();
  const [publishFilter, setPublishFilter] = useState<PublishFilter>('all');
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() =>
    parseStatusFilter(searchParams.get('status')),
  );

  const derived = useMemo(() => {
    if (!dataQ.data) return null;

    const catalogCourses = dataQ.data.courses;
    const attentionCourses = catalogCourses.filter(
      (course) => course.status === 'failed' || course.status === 'generating',
    );
    const publishedInList = catalogCourses.filter((course) => course.isPublished).length;
    const draftInList = catalogCourses.length - publishedInList;
    const readyInList = catalogCourses.filter((course) => course.status === 'ready').length;
    const marketplaceInList = catalogCourses.filter((course) => course.kind === 'marketplace').length;
    const personalInList = catalogCourses.length - marketplaceInList;

    const filteredCourses = catalogCourses.filter((course) => {
      if (kindFilter === 'marketplace' && course.kind !== 'marketplace') return false;
      if (kindFilter === 'personal' && course.kind !== 'personal') return false;
      if (publishFilter === 'published' && !course.isPublished) return false;
      if (publishFilter === 'draft' && course.isPublished) return false;
      if (statusFilter === 'failed' && course.status !== 'failed') return false;
      if (statusFilter === 'generating' && course.status !== 'generating') return false;
      if (statusFilter === 'ready' && course.status !== 'ready') return false;
      return true;
    });

    const filtersActive =
      statusFilter !== 'all' || publishFilter !== 'all' || kindFilter !== 'all';

    return {
      catalogCourses,
      attentionCourses,
      publishedInList,
      draftInList,
      readyInList,
      marketplaceInList,
      personalInList,
      filteredCourses,
      filtersActive,
    };
  }, [dataQ.data, publishFilter, kindFilter, statusFilter]);

  const clearFilters = () => {
    setStatusFilter('all');
    setPublishFilter('all');
    setKindFilter('all');
  };

  if (dataQ.isLoading) {
    return (
      <AdminReportLoadingShell metricCount={4}>
        <div className="mt-6 flex flex-wrap items-end justify-end gap-3">
          <AdminFilterBarSkeleton filters={3} />
        </div>
        <AdminCardGridSkeleton className="mt-6" count={6} />
      </AdminReportLoadingShell>
    );
  }

  if (dataQ.isError || !dataQ.data || !derived) {
    return (
      <div className="flex w-full items-center justify-center px-4 py-20">
        <div className="rounded-md border border-line bg-bg-elev px-8 py-10 text-center">
          <p className="text-ink-2">{t('admin.accessDenied')}</p>
          <Button variant="soft" className="mt-4 rounded-md" onClick={() => dataQ.refetch()}>
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  const data = dataQ.data;

  const kindOptions: { value: KindFilter; label: string }[] = [
    { value: 'all', label: `All kinds (${data.totalCourses})` },
    { value: 'marketplace', label: `Marketplace (${derived.marketplaceInList})` },
    { value: 'personal', label: `Personal (${derived.personalInList})` },
  ];

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All statuses' },
    { value: 'ready', label: `Ready (${derived.readyInList})` },
    { value: 'generating', label: `Generating (${data.generatingCourses})` },
    { value: 'failed', label: `Failed (${data.failedCourses})` },
  ];

  const publishOptions: { value: PublishFilter; label: string }[] = [
    { value: 'all', label: 'All publish states' },
    { value: 'published', label: `Published (${derived.publishedInList})` },
    { value: 'draft', label: `Draft (${derived.draftInList})` },
  ];

  return (
    <div className="w-full min-h-full bg-bg">
      <div className="border-b border-line bg-[var(--sidebar-bg)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Marketplace registry
            </p>
            <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {t('admin.marketplaceTitle')}
            </h1>
            <p className="mt-2 text-sm text-ink-2">
              All platform courses — marketplace listings and personal courses
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-fit rounded-md bg-bg-elev"
            onClick={() => dataQ.refetch()}
          >
            <RefreshCw className="size-3.5" />
            {t('adminCommon.refresh')}
          </Button>
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col divide-y divide-line rounded-md border border-line bg-bg-elev sm:flex-row sm:divide-x sm:divide-y-0">
          <InlineMetric label="Total courses" value={data.totalCourses.toLocaleString()} />
          <InlineMetric label="Marketplace" value={data.marketplaceCourses.toLocaleString()} />
          <InlineMetric label="Published" value={data.publishedCourses.toLocaleString()} />
          <InlineMetric label="Enrollments" value={data.totalEnrollments.toLocaleString()} />
        </div>

        {statusFilter === 'all' && kindFilter === 'all' && derived.attentionCourses.length > 0 ? (
          <section className="mt-6 overflow-hidden rounded-md border border-line bg-bg-elev">
            <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <AlertTriangle className="size-4 text-warn" />
                  Requires attention
                </div>
                <p className="mt-1 text-sm text-ink-2">
                  {derived.attentionCourses.length} course
                  {derived.attentionCourses.length === 1 ? '' : 's'} failed or still generating
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-fit rounded-md bg-bg"
                onClick={() => setStatusFilter('failed')}
              >
                Filter failed
              </Button>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
              {derived.attentionCourses.map((course) => (
                <AdminMarketplaceCourseCard key={course.id} course={course} />
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-6 overflow-hidden rounded-md border border-line bg-bg-elev">
          <div className="flex flex-col gap-4 border-b border-line px-5 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Store className="size-4 text-primary" />
                Course catalog
              </div>
              <p className="mt-1 text-sm text-ink-2">
                {derived.filteredCourses.length} of {derived.catalogCourses.length} records shown
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <FilterSelect
                label="Kind"
                value={kindFilter}
                onChange={setKindFilter}
                options={kindOptions}
              />
              <FilterSelect
                label="Status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={statusOptions}
              />
              <FilterSelect
                label="Publish"
                value={publishFilter}
                onChange={setPublishFilter}
                options={publishOptions}
              />
              {derived.filtersActive ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 rounded-md px-3 text-sm text-ink-2"
                  onClick={clearFilters}
                >
                  Clear filters
                </Button>
              ) : null}
            </div>
          </div>

          {derived.catalogCourses.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Users className="mx-auto size-8 text-ink-3" />
              <p className="mt-3 text-sm font-medium text-ink">No courses yet</p>
              <p className="mt-1 text-sm text-ink-3">
                Courses will appear here once users create them on the platform.
              </p>
            </div>
          ) : derived.filteredCourses.length ? (
            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
              {derived.filteredCourses.map((course) => (
                <AdminMarketplaceCourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <TrendingUp className="mx-auto size-8 text-ink-3" />
              <p className="mt-3 text-sm font-medium text-ink">No courses match this filter</p>
              <p className="mt-1 text-sm text-ink-3">Try different filter values or clear filters.</p>
              {derived.filtersActive ? (
                <Button variant="soft" size="sm" className="mt-4 rounded-md" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default AdminMarketplacePage;
