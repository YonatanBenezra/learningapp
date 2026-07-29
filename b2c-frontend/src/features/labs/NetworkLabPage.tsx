'use client';

import { useMemo, useState } from 'react';
import { Network } from 'lucide-react';
import { Badge } from '@/src/components/ui/badge';
import { Skeleton } from '@/src/components/ui/skeleton';
import {
  NetworkSimulatorLab,
  type ScenarioLabSubmission,
} from '@/src/features/labs/components/NetworkSimulatorLab';
import { useQuery } from '@tanstack/react-query';
import { getNetworkScenario, listNetworkScenarios } from '@/src/features/labs/labsApi';
import { cn } from '@/src/lib/utils';

function difficultyVariant(difficulty: string): 'good' | 'warn' | 'bad' | 'outline' {
  if (difficulty === 'easy') return 'good';
  if (difficulty === 'hard') return 'bad';
  return 'warn';
}

function SimulatorSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-[#1e1e1e] shadow-card">
      <div className="border-b border-[#2d2d2d] bg-[#252526] px-5 py-4">
        <Skeleton className="h-5 w-48 bg-[#2d2d2d]" />
        <Skeleton className="mt-2 h-4 w-full max-w-xl bg-[#2d2d2d]" />
      </div>
      <div className="grid gap-4 p-5 xl:grid-cols-[240px_1fr]">
        <div className="space-y-3">
          <Skeleton className="h-40 rounded-lg bg-[#252526]" />
          <Skeleton className="h-24 rounded-lg bg-[#252526]" />
        </div>
        <Skeleton className="h-64 rounded-lg bg-[#252526]" />
      </div>
      <div className="border-t border-line bg-bg p-5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-4 h-24 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function NetworkLabPage() {
  const scenariosQ = useQuery({
    queryKey: ['network-scenarios'],
    queryFn: listNetworkScenarios,
    staleTime: 5 * 60 * 1000,
  });
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [submission, setSubmission] = useState<ScenarioLabSubmission | null>(null);

  const activeScenarioId = useMemo(() => {
    if (scenarioId) return scenarioId;
    return scenariosQ.data?.[0]?.id ?? null;
  }, [scenarioId, scenariosQ.data]);

  const scenarioQ = useQuery({
    queryKey: ['network-scenario', activeScenarioId],
    queryFn: () => getNetworkScenario(activeScenarioId!),
    enabled: Boolean(activeScenarioId),
    staleTime: 5 * 60 * 1000,
  });

  const activeScenario = scenariosQ.data?.find((s) => s.id === activeScenarioId);

  function handleScenarioChange(id: string) {
    setScenarioId(id);
    setSubmission(null);
  }

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8 xl:px-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Network lab</h1>
          <p className="mt-2 text-sm leading-7 text-ink-2 sm:text-base">
            Investigate flow captures, filter suspicious traffic, and validate your analysis in
            realistic practice scenarios.
          </p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-bg-soft text-primary">
          <Network className="size-5" />
        </span>
      </div>

      {scenariosQ.isLoading ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-36 rounded-lg" />
            ))}
          </div>
          <SimulatorSkeleton />
        </div>
      ) : scenariosQ.isError ? (
        <div className="rounded-2xl border border-line bg-bg-elev p-8 text-center shadow-card">
          <p className="text-sm text-ink-2">Unable to load network scenarios.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <p className="text-sm font-medium text-ink-2">Scenarios</p>
            <div
              className="flex flex-wrap gap-2"
              role="tablist"
              aria-label="Network lab scenarios"
            >
              {(scenariosQ.data ?? []).map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  role="tab"
                  aria-selected={activeScenarioId === scenario.id}
                  onClick={() => handleScenarioChange(scenario.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-3.5 py-2 text-left transition',
                    activeScenarioId === scenario.id
                      ? 'border-primary/30 bg-primary-soft text-primary'
                      : 'border-line bg-bg-elev text-ink-2 hover:border-line-2 hover:text-ink',
                  )}
                >
                  <span className="text-sm font-medium">{scenario.title}</span>
                  <Badge
                    variant={difficultyVariant(scenario.difficulty)}
                    className="capitalize"
                  >
                    {scenario.difficulty}
                  </Badge>
                </button>
              ))}
            </div>
            {activeScenario ? (
              <p className="text-sm text-ink-3">
                Selected: <span className="font-medium text-ink-2">{activeScenario.title}</span>
              </p>
            ) : null}
          </div>

          {scenarioQ.isLoading ? (
            <SimulatorSkeleton />
          ) : scenarioQ.isError ? (
            <div className="rounded-2xl border border-line bg-bg-elev p-8 text-center shadow-card">
              <p className="text-sm text-ink-2">Could not load this scenario. Try another one.</p>
            </div>
          ) : scenarioQ.data ? (
            <div className="overflow-hidden rounded-2xl border border-line shadow-card">
              <NetworkSimulatorLab
                key={activeScenarioId}
                scenario={scenarioQ.data}
                value={submission}
                onChange={setSubmission}
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export default NetworkLabPage;
