'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ApiError } from '@/src/infrastructure/apiClient';
import { useAuthStore } from '@/src/store/authStore';
import { Spinner } from '@/src/components/ui/spinner';
import { cn } from '@/src/lib/utils';
import { platformContainerClass } from '@/src/features/platform/platformLayout';
import { difficultyClass } from '@/src/features/platform/problemLabels';
import {
  fetchSimulations,
  simulationKindLabel,
  type SimulationPublic,
} from './simulationsApi';

export function SimulationsHome() {
  const sessionReady = useAuthStore((s) => s.sessionReady);
  const [simulations, setSimulations] = useState<SimulationPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionReady) return;
    setLoading(true);
    void fetchSimulations()
      .then(setSimulations)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load simulations.'))
      .finally(() => setLoading(false));
  }, [sessionReady]);

  if (!sessionReady || loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  return (
    <div className={cn(platformContainerClass, 'flex-1 py-6')}>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink">Simulations</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-2">
          Hands-on AI engineering scenarios — configure, run, and see how your choices change the
          outcome.
        </p>
      </div>

      {error ? <p className="mb-4 text-sm text-bad">{error}</p> : null}

      <div className="overflow-hidden rounded-lg border border-[#e5e5e5] bg-white dark:border-line-2 dark:bg-bg">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#e5e5e5] bg-[#fafafa] text-xs font-medium uppercase tracking-wide text-[#888] dark:border-line-2 dark:bg-bg-soft dark:text-ink-2">
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
            {simulations.map((simulation) => (
              <tr
                key={simulation.slug}
                className="border-b border-[#e5e5e5] last:border-0 transition-colors hover:bg-[#fafafa] dark:border-line-2 dark:hover:bg-bg-lav/40"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/simulations/${simulation.slug}`}
                    className="group inline-flex items-center gap-1 font-medium text-ink hover:text-primary"
                  >
                    {simulation.title}
                    <ArrowRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                  <p className="mt-1 text-xs text-ink-2 sm:hidden">{simulation.topic}</p>
                </td>
                <td className="hidden px-4 py-3 text-ink-2 sm:table-cell">{simulation.topic}</td>
                <td className="px-4 py-3 text-ink-2">{simulationKindLabel(simulation.kind)}</td>
                <td className={cn('px-4 py-3 capitalize', difficultyClass(simulation.difficulty))}>
                  {simulation.difficulty}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {simulations.length === 0 && (
          <p className="px-4 py-12 text-center text-sm text-ink-2">No simulations available yet.</p>
        )}
      </div>
    </div>
  );
}
