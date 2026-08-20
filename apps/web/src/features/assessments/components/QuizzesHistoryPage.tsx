'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Star,
} from 'lucide-react';
import { Avatar } from '@/src/components/ui/avatar';
import { Button } from '@/src/components/ui/button';
import { Skeleton } from '@/src/components/ui/skeleton';
import { useMyQuizzes } from '@/src/features/assessments/useAssessments';
import type { QuizHistoryItem } from '@/src/domain/assessment';
import { useTranslation } from '@/src/i18n';
import { cn } from '@/src/lib/utils';

const PAGE_SIZE = 10;

function formatQuizId(id: string): string {
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

function quizStatus(score: number): { label: string; className: string } {
  if (score >= 70) return { label: 'Passed', className: 'text-good font-medium' };
  if (score >= 50) return { label: 'Completed', className: 'text-ink-2 font-medium' };
  return { label: 'Needs review', className: 'text-bad font-medium' };
}

function scoreStars(score: number): string {
  return (score / 20).toFixed(1);
}

function QuizTableRow({ item }: { item: QuizHistoryItem }) {
  const { t } = useTranslation();
  const status = quizStatus(item.score);
  const viewHref =
    item.lessonId && item.quizId
      ? `/lesson/${item.lessonId}/quiz/${item.quizId}`
      : item.lessonId
        ? `/lesson/${item.lessonId}`
        : null;

  return (
    <tr className="border-b border-line last:border-b-0">
      <td className="px-5 py-4">
        <div className="flex min-w-[200px] items-center gap-3">
          <Avatar name={item.lessonTitle} className="size-9 text-xs" />
          <span className="font-medium text-ink">{item.lessonTitle}</span>
        </div>
      </td>
      <td className="px-5 py-4 text-ink-2">{formatQuizId(item.quizId)}</td>
      <td className="px-5 py-4 text-ink-2">{formatTableDate(item.submittedAt)}</td>
      <td className="px-5 py-4 text-ink-2">
        {item.questionCount} {t('assessments.questions')}
      </td>
      <td className="px-5 py-4">
        <span className="inline-flex items-center gap-1.5 font-medium text-ink">
          <Star className="size-4 fill-[#FFC224] text-[#FFC224]" />
          {scoreStars(item.score)}
        </span>
        <span className="ml-2 text-xs text-ink-3">({item.score}%)</span>
      </td>
      <td className={cn('px-5 py-4', status.className)}>{status.label}</td>
      <td className="px-5 py-4">
        {viewHref ? (
          <Link href={viewHref}>
            <Button variant="soft" size="sm" className="h-9 rounded-full px-4">
              <Eye className="size-4" />
              View
            </Button>
          </Link>
        ) : (
          <Button variant="soft" size="sm" className="h-9 rounded-full px-4" disabled>
            <Eye className="size-4" />
            View
          </Button>
        )}
      </td>
    </tr>
  );
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-soft">
      <div className="space-y-0">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full rounded-none" />
        ))}
      </div>
    </div>
  );
}

export function QuizzesHistoryPage() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useMyQuizzes();
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
    <div className="w-full p-4 sm:p-6 lg:p-8">
      <section className="overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-soft">
        <div className="flex flex-col gap-3 border-b border-line px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h1 className="text-xl font-bold text-ink sm:text-2xl">{t('assessments.quizHistoryTitle')}</h1>
            <p className="mt-1 text-sm text-ink-2">{t('assessments.quizHistorySubtitle')}</p>
          </div>
          <nav className="text-sm text-ink-3" aria-label="Breadcrumb">
            <Link href="/dashboard" className="font-medium text-primary hover:text-primary-dark">
              Dashboard
            </Link>
            <span className="mx-2">&gt;</span>
            <span className="font-medium text-ink">{t('nav.quizzes')}</span>
          </nav>
        </div>

        {isLoading ? (
          <div className="p-5 sm:p-6">
            <TableSkeleton />
          </div>
        ) : null}

        {isError ? (
          <div className="px-5 py-12 text-center sm:px-6">
            <p className="text-sm text-ink-2">{t('assessments.loadQuizError')}</p>
            <Button variant="soft" className="mt-4" onClick={() => refetch()}>
              {t('common.retry')}
            </Button>
          </div>
        ) : null}

        {!isLoading && !isError && rows.length === 0 ? (
          <div className="px-5 py-14 text-center sm:px-6">
            <p className="text-sm text-ink-2">{t('assessments.noQuizzes')}</p>
            <Link href="/my-courses" className="mt-4 inline-block">
              <Button>{t('common.browseCourses')}</Button>
            </Link>
          </div>
        ) : null}

        {!isLoading && !isError && rows.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-bg-soft/80 text-xs text-ink-3">
                    <th className="px-5 py-4 font-semibold">Lesson</th>
                    <th className="px-5 py-4 font-semibold">Quiz ID</th>
                    <th className="px-5 py-4 font-semibold">Submitted</th>
                    <th className="px-5 py-4 font-semibold">Questions</th>
                    <th className="px-5 py-4 font-semibold">Score</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((item) => (
                    <QuizTableRow key={item.id} item={item} />
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

export default QuizzesHistoryPage;
