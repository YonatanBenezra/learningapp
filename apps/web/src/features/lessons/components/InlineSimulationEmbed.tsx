'use client';

import { useEffect, useState } from 'react';
import { ApiError } from '@/src/infrastructure/apiClient';
import { Spinner } from '@/src/components/ui/spinner';
import { fetchSimulation, type SimulationBootstrap, type SimulationPublic } from '@/src/features/simulations/simulationsApi';
import { SimulationExperience } from '@/src/features/simulations/SimulationExperience';

export function InlineSimulationEmbed({ slug }: { slug: string }) {
  const [simulation, setSimulation] = useState<SimulationPublic | null>(null);
  const [bootstrap, setBootstrap] = useState<SimulationBootstrap>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void fetchSimulation(slug)
      .then((data) => {
        if (cancelled) return;
        setSimulation(data.simulation);
        setBootstrap(data.bootstrap);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load simulation.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-line/80 bg-bg-elev/60 dark:border-line-2">
        <Spinner className="size-7 text-primary" />
      </div>
    );
  }

  if (error || !simulation) {
    return (
      <div className="rounded-xl border border-bad/30 bg-bad-soft/40 px-5 py-4 text-sm text-bad">
        {error ?? 'Simulation unavailable.'}
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-xl border border-primary/20 bg-bg dark:border-line-2">
      <SimulationExperience simulation={simulation} bootstrap={bootstrap} embedded />
    </div>
  );
}
