'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiError } from '@/src/infrastructure/apiClient';
import { useAuthStore } from '@/src/store/authStore';
import { Spinner } from '@/src/components/ui/spinner';
import { cn } from '@/src/lib/utils';
import { platformContainerClass } from '@/src/features/platform/platformLayout';
import { RequireAssessmentComplete } from '@/src/features/auth/guards';
import {
  fetchSimulation,
  type GuardrailsBootstrap,
  type PromptLabBootstrap,
  type RagPipelineBootstrap,
  type SimulationBootstrap,
  type SimulationPublic,
  type VectorPlaygroundBootstrap,
} from './simulationsApi';
import { GuardrailsSimulation } from './GuardrailsSimulation';
import { PromptLabSimulation } from './PromptLabSimulation';
import { RagPipelineSimulation } from './RagPipelineSimulation';
import { VectorPlaygroundSimulation } from './VectorPlaygroundSimulation';

export function SimulationPage({ slug }: { slug: string }) {
  return (
    <RequireAssessmentComplete>
      <SimulationPageContent slug={slug} />
    </RequireAssessmentComplete>
  );
}

function isVectorBootstrap(bootstrap: SimulationBootstrap): bootstrap is VectorPlaygroundBootstrap {
  return bootstrap !== null && 'chunks' in bootstrap;
}

function isRagBootstrap(bootstrap: SimulationBootstrap): bootstrap is RagPipelineBootstrap {
  return bootstrap !== null && 'chunkSizeOptions' in bootstrap;
}

function isGuardrailsBootstrap(bootstrap: SimulationBootstrap): bootstrap is GuardrailsBootstrap {
  return bootstrap !== null && 'guardrailOptions' in bootstrap;
}

function isPromptLabBootstrap(bootstrap: SimulationBootstrap): bootstrap is PromptLabBootstrap {
  return bootstrap !== null && 'starterPrompts' in bootstrap;
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

  if (simulation.kind === 'prompt_lab') {
    return (
      <PromptLabSimulation
        simulation={simulation}
        bootstrap={isPromptLabBootstrap(bootstrap) ? bootstrap : null}
      />
    );
  }

  if (simulation.kind === 'vector_playground' && isVectorBootstrap(bootstrap)) {
    return <VectorPlaygroundSimulation simulation={simulation} bootstrap={bootstrap} />;
  }

  if (simulation.kind === 'rag_pipeline' && isRagBootstrap(bootstrap)) {
    return <RagPipelineSimulation simulation={simulation} bootstrap={bootstrap} />;
  }

  if (simulation.kind === 'guardrails' && isGuardrailsBootstrap(bootstrap)) {
    return <GuardrailsSimulation simulation={simulation} bootstrap={bootstrap} />;
  }

  return (
    <div className={cn(platformContainerClass, 'py-12 text-center')}>
      <p className="text-sm text-ink-2">This simulation type is not available yet.</p>
    </div>
  );
}
