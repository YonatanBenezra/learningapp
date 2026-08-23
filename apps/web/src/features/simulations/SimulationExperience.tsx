'use client';

import { cn } from '@/src/lib/utils';
import { platformContainerClass } from '@/src/features/platform/platformLayout';
import { GuardrailsSimulation } from './GuardrailsSimulation';
import { PromptLabSimulation } from './PromptLabSimulation';
import { RagPipelineSimulation } from './RagPipelineSimulation';
import { VectorPlaygroundSimulation } from './VectorPlaygroundSimulation';
import type {
  GuardrailsBootstrap,
  PromptLabBootstrap,
  RagPipelineBootstrap,
  SimulationBootstrap,
  SimulationPublic,
  VectorPlaygroundBootstrap,
} from './simulationsApi';

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

export function SimulationExperience({
  simulation,
  bootstrap,
  embedded = false,
}: {
  simulation: SimulationPublic;
  bootstrap: SimulationBootstrap;
  embedded?: boolean;
}) {
  if (simulation.kind === 'prompt_lab') {
    return (
      <PromptLabSimulation
        simulation={simulation}
        bootstrap={isPromptLabBootstrap(bootstrap) ? bootstrap : null}
        embedded={embedded}
      />
    );
  }

  if (simulation.kind === 'vector_playground' && isVectorBootstrap(bootstrap)) {
    return (
      <VectorPlaygroundSimulation simulation={simulation} bootstrap={bootstrap} embedded={embedded} />
    );
  }

  if (simulation.kind === 'rag_pipeline' && isRagBootstrap(bootstrap)) {
    return <RagPipelineSimulation simulation={simulation} bootstrap={bootstrap} embedded={embedded} />;
  }

  if (simulation.kind === 'guardrails' && isGuardrailsBootstrap(bootstrap)) {
    return <GuardrailsSimulation simulation={simulation} bootstrap={bootstrap} embedded={embedded} />;
  }

  return (
    <div className={cn(!embedded && platformContainerClass, embedded ? 'p-4' : 'py-12 text-center')}>
      <p className="text-sm text-ink-2">This simulation type is not available yet.</p>
    </div>
  );
}
