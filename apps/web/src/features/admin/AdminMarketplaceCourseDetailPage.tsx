'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Layers3,
  RefreshCw,
  UserRound,
} from 'lucide-react';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { useTranslation } from '@/src/i18n';
import { cn } from '@/src/lib/utils';
import {
  AdminMetricStripSkeleton,
  AdminReportHeaderSkeleton,
  AdminTableSectionSkeleton,
  formatUsd,
} from './AdminUi';
import type { AdminMarketplaceCourseDetail } from './adminApi';
import { useAdminMarketplaceCourse } from './useAdmin';

type ModuleItem = AdminMarketplaceCourseDetail['modules'][number];

function CurriculumModules({ modules }: { modules: ModuleItem[] }) {
  const [openModules, setOpenModules] = useState<Set<string>>(
    () => new Set(modules.slice(0, 1).map((module) => module.id)),
  );

  function toggleModule(moduleId: string) {
    setOpenModules((current) => {
      const next = new Set(current);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }

  if (!modules.length) {
    return (
      <div className="px-6 py-12 text-center text-sm text-ink-3">
        No curriculum modules available.
      </div>
    );
  }

  return (
    <div className="divide-y divide-line">
      {modules.map((module) => {
        const open = openModules.has(module.id);

        return (
          <div key={module.id}>
            <button
              type="button"
              onClick={() => toggleModule(module.id)}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-bg-soft/70 sm:px-6"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-ink">
                    Module {module.order + 1}: {module.title}
                  </p>
                  <Badge variant="default">{module.lessons.length} lessons</Badge>
                </div>
                <p className="mt-1 text-xs uppercase tracking-[0.12em] text-ink-3">
                  {module.domain}
                </p>
              </div>
              <ChevronDown
                className={cn(
                  'size-5 shrink-0 text-ink-3 transition-transform duration-200',
                  open && 'rotate-180',
                )}
              />
            </button>

            {open ? (
              module.lessons.length ? (
                <ul className="border-t border-line bg-bg-soft/30 px-5 py-3 sm:px-6">
                  {module.lessons.map((lesson) => (
                    <li
                      key={lesson.id}
                      className="flex items-center gap-3 border-b border-line/70 py-2.5 last:border-b-0"
                    >
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold tabular-nums text-primary">
                        {lesson.order + 1}
                      </span>
                      <span className="text-sm text-ink-2">{lesson.title}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="border-t border-line bg-bg-soft/30 px-5 py-4 text-sm text-ink-3 sm:px-6">
                  No lessons in this module.
                </p>
              )
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function courseStatusVariant(status: string): 'default' | 'good' | 'warn' | 'bad' {
  if (status === 'ready') return 'good';
  if (status === 'generating') return 'warn';
  if (status === 'failed') return 'bad';
  return 'default';
}

function InlineMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[120px] flex-1 px-5 py-4 sm:px-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-3">{label}</p>
      <p className="mt-1.5 font-heading text-2xl font-semibold tabular-nums text-ink">{value}</p>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="w-full min-h-full bg-bg">
      <AdminReportHeaderSkeleton />
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <AdminMetricStripSkeleton count={4} />
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <AdminTableSectionSkeleton filterCount={0} rows={6} />
          <AdminTableSectionSkeleton filterCount={0} rows={4} />
        </div>
      </div>
    </div>
  );
}

export function AdminMarketplaceCourseDetailPage({ courseId }: { courseId: string }) {
  const { t } = useTranslation();
  const dataQ = useAdminMarketplaceCourse(courseId);

  if (dataQ.isLoading) return <DetailSkeleton />;

  if (dataQ.isError || !dataQ.data) {
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

  const { course, modules, stats, recentSales } = dataQ.data;
  const totalLessons = modules.reduce((sum, module) => sum + module.lessons.length, 0);

  return (
    <div className="w-full min-h-full bg-bg">
      <div className="border-b border-line bg-[var(--sidebar-bg)] px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/admin/marketplace"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 transition hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Back to marketplace
        </Link>

        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Course record
            </p>
            <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {course.title}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant={course.isPublished ? 'good' : 'warn'}>
                {course.isPublished ? 'Published' : 'Draft'}
              </Badge>
              <Badge variant={courseStatusVariant(course.status)} className="capitalize">
                {course.status}
              </Badge>
              <Badge variant="default" className="capitalize">
                {course.level}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-md bg-bg-elev"
              onClick={() => dataQ.refetch()}
            >
              <RefreshCw className="size-3.5" />
              {t('adminCommon.refresh')}
            </Button>
            <Link
              href={`/courses/${course.id}`}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-md border border-line bg-bg-elev px-3 text-sm font-medium text-ink transition hover:border-primary/30 hover:text-primary',
              )}
            >
              Public listing
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col divide-y divide-line rounded-md border border-line bg-bg-elev sm:flex-row sm:divide-x sm:divide-y-0">
          <InlineMetric label="Students" value={course.enrollmentCount.toLocaleString()} />
          <InlineMetric label="Revenue" value={formatUsd(course.revenueCents)} />
          <InlineMetric label="List price" value={formatUsd(course.priceCents)} />
          <InlineMetric label="Lessons" value={String(course.lessonCount || totalLessons)} />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <section className="rounded-md border border-line bg-bg-elev p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-3">
                Creator
              </p>
              <div className="mt-4 flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-bg-soft text-sm font-semibold text-ink">
                  {course.creator.name.trim().charAt(0).toUpperCase() || '?'}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-ink">{course.creator.name}</p>
                  <p className="mt-0.5 truncate text-sm text-ink-3">{course.creator.email}</p>
                  <Badge variant="primary" className="mt-2 capitalize">
                    {course.creator.role}
                  </Badge>
                </div>
              </div>
              <Link
                href="/admin/users"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                View user directory
                <ChevronRight className="size-3.5" />
              </Link>
            </section>

            <section className="rounded-md border border-line bg-bg-elev p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-3">
                Record metadata
              </p>
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="text-ink-3">Category</dt>
                  <dd className="mt-0.5 font-medium text-ink">{course.category}</dd>
                </div>
                <div>
                  <dt className="text-ink-3">Modules</dt>
                  <dd className="mt-0.5 font-medium tabular-nums text-ink">{course.moduleCount}</dd>
                </div>
                <div>
                  <dt className="text-ink-3">Currency</dt>
                  <dd className="mt-0.5 font-medium text-ink">{course.currency}</dd>
                </div>
                <div className="border-t border-line pt-4">
                  <dt className="inline-flex items-center gap-1.5 text-ink-3">
                    <CalendarDays className="size-3.5" />
                    Created
                  </dt>
                  <dd className="mt-0.5 font-medium text-ink">{formatDate(course.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-ink-3">Last updated</dt>
                  <dd className="mt-0.5 font-medium text-ink">{formatDate(course.updatedAt)}</dd>
                </div>
                {course.failureReason ? (
                  <div>
                    <dt className="text-ink-3">Failure reason</dt>
                    <dd className="mt-0.5 text-bad">{course.failureReason}</dd>
                  </div>
                ) : null}
              </dl>
            </section>

            <section className="rounded-md border border-line bg-bg-elev p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-3">
                Enrollment stats
              </p>
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="text-ink-3">Completed enrollments</dt>
                  <dd className="mt-0.5 font-semibold tabular-nums text-ink">
                    {stats.completedEnrollments.toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-3">Recorded revenue</dt>
                  <dd className="mt-0.5 font-semibold tabular-nums text-primary">
                    {formatUsd(stats.recordedRevenueCents)}
                  </dd>
                </div>
              </dl>
            </section>
          </aside>

          <div className="space-y-6">
            <section className="rounded-md border border-line bg-bg-elev p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <BookOpen className="size-4 text-primary" />
                <h2 className="font-heading text-lg font-semibold text-ink">Course overview</h2>
              </div>
              <p className="mt-4 text-sm leading-7 text-ink-2">
                {course.description?.trim() || 'No course description provided.'}
              </p>

              {course.topics.length ? (
                <div className="mt-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
                    Topics
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {course.topics.map((topic) => (
                      <span
                        key={topic}
                        className="rounded-md border border-line bg-bg-soft px-2.5 py-1 text-xs font-medium text-ink-2"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>

            <section className="overflow-hidden rounded-md border border-line bg-bg-elev">
              <div className="border-b border-line px-5 py-4 sm:px-6">
                <div className="flex items-center gap-2">
                  <Layers3 className="size-4 text-primary" />
                  <h2 className="font-heading text-lg font-semibold text-ink">Curriculum</h2>
                </div>
                <p className="mt-1 text-sm text-ink-2">
                  {modules.length} modules · {totalLessons} lessons
                </p>
              </div>

              <CurriculumModules modules={modules} />
            </section>

            <section className="overflow-hidden rounded-md border border-line bg-bg-elev">
              <div className="border-b border-line px-5 py-4 sm:px-6">
                <div className="flex items-center gap-2">
                  <UserRound className="size-4 text-primary" />
                  <h2 className="font-heading text-lg font-semibold text-ink">Recent sales</h2>
                </div>
                <p className="mt-1 text-sm text-ink-2">Latest completed marketplace enrollments</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line bg-bg-soft text-[11px] uppercase tracking-[0.14em] text-ink-3">
                      <th className="px-5 py-3 font-semibold sm:px-6">Student</th>
                      <th className="px-5 py-3 font-semibold sm:px-6">Amount</th>
                      <th className="px-5 py-3 font-semibold sm:px-6">Purchased</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSales.length ? (
                      recentSales.map((sale, index) => (
                        <tr
                          key={`${sale.studentEmail}-${sale.purchasedAt}-${index}`}
                          className="border-b border-line last:border-b-0 hover:bg-bg-soft/80"
                        >
                          <td className="px-5 py-4 text-ink sm:px-6">{sale.studentEmail}</td>
                          <td className="px-5 py-4 tabular-nums text-ink sm:px-6">
                            {formatUsd(sale.amountCents)}
                          </td>
                          <td className="px-5 py-4 tabular-nums text-ink-2 sm:px-6">
                            {formatDate(sale.purchasedAt)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-ink-3">
                          No completed sales recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminMarketplaceCourseDetailPage;
