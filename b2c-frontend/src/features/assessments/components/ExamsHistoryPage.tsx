'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  GraduationCap,
} from 'lucide-react';
import { Avatar } from '@/src/components/ui/avatar';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Skeleton } from '@/src/components/ui/skeleton';
import { useMyExams } from '@/src/features/assessments/useAssessments';
import type { ExamHistoryItem } from '@/src/domain/assessment';
import { useTranslation } from '@/src/i18n';
import { cn } from '@/src/lib/utils';

const PAGE_SIZE = 10;

function formatExamId(id: string): string {
  const digits = id.replace(/\D/g, '');
  const tail = (digits || id).slice(-4).toUpperCase();
  return `#${tail.padStart(4, '0').slice(-4)}`;
}

function formatTableDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function examStatus(score: number): { label: string; className: string } {
  if (score >= 70) return { label: 'Passed', className: 'text-good font-medium' };
  if (score >= 50) return { label: 'Completed', className: 'text-ink-2 font-medium' };
  return { label: 'Needs review', className: 'text-bad font-medium' };
}

function scoreBadgeVariant(score: number): 'good' | 'default' | 'bad' {
  if (score >= 70) return 'good';
  if (score >= 50) return 'default';
  return 'bad';
}

function scopeLabel(scope: ExamHistoryItem['scope']) {
  return scope === 'course' ? 'Course exam' : 'Module exam';
}

function ExamTableRow({ item }: { item: ExamHistoryItem }) {
  const { t } = useTranslation();
  const status = examStatus(item.score);

  return (
    <tr className="border-b border-line last:border-b-0">
      <td className="px-5 py-4 sm:px-6">
        <div className="flex min-w-[200px] items-center gap-3">
          <Avatar name={item.scopeTitle} className="size-9 text-xs" />
          <span className="font-medium text-ink">{item.scopeTitle}</span>
        </div>
      </td>
      <td className="px-5 py-4 text-ink-2 sm:px-6">{formatExamId(item.examId)}</td>
      <td className="px-5 py-4 sm:px-6">
        <span className="rounded-full border border-line bg-bg-soft px-2.5 py-0.5 text-xs font-medium capitalize text-ink-2">
          {scopeLabel(item.scope)}
        </span>
      </td>
      <td className="px-5 py-4 text-ink-2 sm:px-6">{formatTableDate(item.submittedAt)}</td>
      <td className="px-5 py-4 text-ink-2 sm:px-6">
        {item.questionCount} {t('assessments.questions')}
      </td>
      <td className="px-5 py-4 sm:px-6">
        <Badge variant={scoreBadgeVariant(item.score)}>{item.score}%</Badge>
      </td>
      <td className={cn('px-5 py-4 sm:px-6', status.className)}>{status.label}</td>
      <td className="px-5 py-4 sm:px-6">
        <Link href={`/exam/${item.examId}`}>
          <Button variant="soft" size="sm" className="h-9 rounded-full px-4">
            <Eye className="size-4" />
            {t('assessments.viewExam')}
          </Button>
        </Link>
      </td>
    </tr>
  );
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-line">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full rounded-none" />
      ))}
    </div>
  );
}

export function ExamsHistoryPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useMyExams();
  const [page, setPage] = useState(0);

  const rows = data ?? [];
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = useMemo(
    () => rows.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [rows, safePage],
  );

  const rangeStart = rows.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const rangeEnd = Math.min((safePage + 1) * PAGE_SIZE, rows.length);

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8 xl:px-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {t('assessments.examHistoryTitle')}
          </h1>
          <p className="mt-2 text-sm leading-7 text-ink-2 sm:text-base">
            {rows.length > 0
              ? `${rows.length} exam${rows.length === 1 ? '' : 's'} completed · ${t('assessments.examHistorySubtitle')}`
              : t('assessments.examHistorySubtitle')}
          </p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-bg-soft text-primary">
          <GraduationCap className="size-5" />
        </span>
      </div>

      <section className="overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-card">
        {isLoading ? (
          <div className="p-5 sm:p-6">
            <TableSkeleton />
          </div>
        ) : null}

        {isError ? (
          <div className="px-5 py-12 text-center sm:px-6">
            <p className="text-sm text-ink-2">{t('assessments.loadExamError')}</p>
            <Button variant="soft" className="mt-4 rounded-full px-5" onClick={() => refetch()}>
              {t('common.retry')}
            </Button>
          </div>
        ) : null}

        {!isLoading && !isError && rows.length === 0 ? (
          <div className="px-5 py-14 text-center sm:px-6">
            <GraduationCap className="mx-auto size-8 text-ink-3" />
            <p className="mt-4 text-sm leading-6 text-ink-2">{t('assessments.noExams')}</p>
            <Link href="/my-courses" className="mt-5 inline-block">
              <Button className="rounded-full px-5">{t('common.browseCourses')}</Button>
            </Link>
          </div>
        ) : null}

        {!isLoading && !isError && rows.length > 0 ? (
          <>
            <div className="border-b border-line px-5 py-4 sm:px-6">
              <p className="text-sm text-ink-2">
                Showing {rangeStart}-{rangeEnd} of {rows.length} exams
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-bg-soft text-xs font-medium text-ink-3">
                    <th className="px-5 py-3.5 sm:px-6">Exam</th>
                    <th className="px-5 py-3.5 sm:px-6">Exam ID</th>
                    <th className="px-5 py-3.5 sm:px-6">Scope</th>
                    <th className="px-5 py-3.5 sm:px-6">Submitted</th>
                    <th className="px-5 py-3.5 sm:px-6">Questions</th>
                    <th className="px-5 py-3.5 sm:px-6">Score</th>
                    <th className="px-5 py-3.5 sm:px-6">Status</th>
                    <th className="px-5 py-3.5 sm:px-6">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((item) => (
                    <ExamTableRow key={item.id} item={item} />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-4 border-t border-line px-5 py-4 sm:px-6">
              <p className="text-sm text-ink-3">
                {rangeStart}-{rangeEnd} of {rows.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Previous page"
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  disabled={safePage === 0}
                  className="grid size-9 place-items-center rounded-lg border border-line text-ink-3 transition hover:bg-bg-soft hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Next page"
                  onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
                  disabled={safePage >= totalPages - 1}
                  className="grid size-9 place-items-center rounded-lg border border-line text-ink-3 transition hover:bg-bg-soft hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}

export default ExamsHistoryPage;
