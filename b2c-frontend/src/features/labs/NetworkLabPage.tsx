'use client';

import { useMemo, useState } from 'react';
import { Network } from 'lucide-react';
import { Badge } from '@/src/components/ui/badge';
import { NetworkSimulatorLab, type ScenarioLabSubmission } from '@/src/features/labs/components/NetworkSimulatorLab';
import { useQuery } from '@tanstack/react-query';
import { listNetworkScenarios } from '@/src/features/labs/labsApi';
import { cn } from '@/src/lib/utils';

export function NetworkLabPage() {
  const scenariosQ = useQuery({
    queryKey: ['network-scenarios'],
    queryFn: listNetworkScenarios,
  });
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [submission, setSubmission] = useState<ScenarioLabSubmission | null>(null);

  const activeScenarioId = useMemo(() => {
    if (scenarioId) return scenarioId;
    return scenariosQ.data?.[0]?.id ?? 'port-scan';
  }, [scenarioId, scenariosQ.data]);

  return (
    <div className="min-h-full bg-gradient-to-b from-primary/[0.04] via-bg to-bg">
      <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="border-b border-line pb-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
              <Network className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                Practice lab
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                Network Simulator
              </h1>
            </div>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-2">
            Investigate realistic flow captures, filter suspicious traffic, and validate your
            analysis before submitting exercises.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(scenariosQ.data ?? []).map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              onClick={() => setScenarioId(scenario.id)}
              className={cn(
                'rounded-lg border px-3 py-2 text-left transition',
                activeScenarioId === scenario.id
                  ? 'border-primary/30 bg-primary/10'
                  : 'border-line bg-bg-elev hover:border-primary/20',
              )}
            >
              <span className="block text-sm font-medium text-ink">{scenario.title}</span>
              <Badge variant="outline" className="mt-1 capitalize">
                {scenario.difficulty}
              </Badge>
            </button>
          ))}
        </div>

        <NetworkSimulatorLab
          key={activeScenarioId}
          starterState={{ scenarioId: activeScenarioId }}
          value={submission}
          onChange={setSubmission}
        />
      </div>
    </div>
  );
}

export default NetworkLabPage;
