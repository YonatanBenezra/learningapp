'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle } from 'lucide-react';
import { FREE_PROBLEM_LIMIT } from '@aieng/shared';
import { ApiError } from '@/src/infrastructure/apiClient';
import { useAuthStore } from '@/src/store/authStore';
import { Spinner } from '@/src/components/ui/spinner';
import { cn } from '@/src/lib/utils';
import { readGuestBundle } from '@/src/features/practice/guestStorage';
import { fetchProblems } from '@/src/features/practice/problemsListApi';
import type { ProblemPublic } from '@/src/features/practice/practiceApi';
import { difficultyClass, problemTypeLabel } from './problemLabels';
import {
  matchesTypeFilter,
  ProblemCategoryFilters,
  type ProblemTypeFilter,
} from './ProblemCategoryFilters';
import { platformContainerClass } from './platformLayout';

const DIFFICULTIES = ['all', 'easy', 'medium', 'hard'] as const;

export function ProblemsHome({
  searchQuery = '',
  onSearchChange,
}: {
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
}) {
  const sessionReady = useAuthStore((s) => s.sessionReady);
  const [allProblems, setAllProblems] = useState<ProblemPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number]>('all');
  const [topicFilter, setTopicFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<ProblemTypeFilter>('all');
  const [completedSlugs, setCompletedSlugs] = useState<string[]>([]);

  useEffect(() => {
    setCompletedSlugs(readGuestBundle()?.completedSlugs ?? []);
  }, []);

  useEffect(() => {
    if (!sessionReady) return;
    setLoading(true);
    void fetchProblems()
      .then(setAllProblems)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load problems.'))
      .finally(() => setLoading(false));
  }, [sessionReady]);

  const filtered = useMemo(() => {
    let list = allProblems;
    if (difficulty !== 'all') list = list.filter((p) => p.difficulty === difficulty);
    if (topicFilter) list = list.filter((p) => p.topic === topicFilter);
    if (typeFilter !== 'all') list = list.filter((p) => matchesTypeFilter(p.type, typeFilter));

    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.topic.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q),
    );
  }, [allProblems, difficulty, topicFilter, typeFilter, searchQuery]);

  const completedCount = completedSlugs.length;

  if (!sessionReady || loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  return (
    <div className={cn(platformContainerClass, 'flex-1 py-6')}>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Problems</h1>
          <p className="mt-1 text-sm text-ink-2">
            Sharpen skills on RAG, LLMs, agents, and MLOps — coding drills, concept checks, and
            production-ready AI tasks.
            <span className="ml-2 text-ink">
              {completedCount}/{FREE_PROBLEM_LIMIT} free completed
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDifficulty(d)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm capitalize transition-colors',
                difficulty === d
                  ? 'bg-ink text-bg'
                  : 'bg-[#f4f4f5] text-[#555] hover:text-ink dark:bg-bg-soft dark:text-ink-2',
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <ProblemCategoryFilters
        problems={allProblems}
        topicFilter={topicFilter}
        typeFilter={typeFilter}
        onTopicChange={setTopicFilter}
        onTypeChange={setTypeFilter}
      />

      {onSearchChange && (
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search problems…"
          className="mb-4 h-9 w-full max-w-xs rounded-md border border-line-2 bg-bg-soft px-3 text-sm md:hidden"
        />
      )}

      {error && <p className="mb-4 text-sm text-bad">{error}</p>}

      <div className="overflow-hidden rounded-lg border border-[#e5e5e5] bg-white dark:border-line-2 dark:bg-bg">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#e5e5e5] bg-[#fafafa] text-xs font-medium uppercase tracking-wide text-[#888] dark:border-line-2 dark:bg-bg-soft dark:text-ink-2">
              <th className="w-12 px-4 py-3" scope="col">
                <span className="sr-only">Status</span>
              </th>
              <th className="px-4 py-3" scope="col">
                Title
              </th>
              <th className="hidden px-4 py-3 sm:table-cell" scope="col">
                Topic
              </th>
              <th className="px-4 py-3" scope="col">
                Type
              </th>
              <th className="px-4 py-3" scope="col">
                Difficulty
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((problem) => {
              const done = completedSlugs.includes(problem.slug);
              return (
                <tr
                  key={problem.slug}
                  className="border-b border-[#e5e5e5] last:border-0 transition-colors hover:bg-[#fafafa] dark:border-line-2 dark:hover:bg-bg-lav/40"
                >
                  <td className="px-4 py-3">
                    {done ? (
                      <CheckCircle2 className="size-5 text-good" aria-label="Completed" />
                    ) : (
                      <Circle className="size-5 text-[#ddd] dark:text-line-2" aria-label="Not started" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/problems/${problem.slug}`}
                      className="font-medium text-ink hover:text-primary"
                    >
                      {problem.title}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-ink-2 sm:table-cell">{problem.topic}</td>
                  <td className="px-4 py-3 text-ink-2">{problemTypeLabel(problem.type)}</td>
                  <td className={cn('px-4 py-3 capitalize', difficultyClass(problem.difficulty))}>
                    {problem.difficulty}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="px-4 py-12 text-center text-sm text-ink-2">No problems match your filters.</p>
        )}
      </div>
    </div>
  );
}
