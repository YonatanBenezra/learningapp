'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiError } from '@/src/infrastructure/apiClient';
import { useAuthStore } from '@/src/store/authStore';
import { Spinner } from '@/src/components/ui/spinner';
import { cn } from '@/src/lib/utils';
import { platformContainerClass } from '@/src/features/platform/platformLayout';
import { RequireAssessmentComplete } from '@/src/features/auth/guards';
import { fetchSimulation, type SimulationBootstrap, type SimulationPublic } from './simulationsApi';
import { SimulationExperience } from './SimulationExperience';

export function SimulationPage({ slug }: { slug: string }) {
  return (
    <RequireAssessmentComplete>
      <SimulationPageContent slug={slug} />
    </RequireAssessmentComplete>
  );
}

function SimulationPageContent({ slug }: { slug: string }) {
  const sessionReady = useAuthStore((s) => s.sessionReady);
  const [simulation, setSimulation] = useState<SimulationPublic | null>(null);
  const [bootstrap, setBootstrap] = useState<SimulationBootstrap>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSimulation(slug);
      setSimulation(data.simulation);
      setBootstrap(data.bootstrap);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load simulation.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!sessionReady) return;
    void load();
  }, [sessionReady, load]);

  if (!sessionReady || loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  if (error && !simulation) {
    return (
      <div className={cn(platformContainerClass, 'py-12 text-center')}>
        <p className="text-sm text-bad">{error}</p>
        <Link href="/simulations" className="mt-4 inline-block text-sm text-primary hover:underline">
          Back to simulations
        </Link>
      </div>
    );
  }

  if (!simulation) return null;

  return <SimulationExperience simulation={simulation} bootstrap={bootstrap} />;
}
