'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Filter,
  Loader2,
  Network,
  Search,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { cn } from '@/src/lib/utils';
import {
  getNetworkScenario,
  listNetworkScenarios,
  submitNetworkScenario,
  type NetworkScenario,
  type ScenarioSubmitResult,
} from '../labsApi';
import {
  collectHosts,
  filterNetworkFlows,
  parseNetworkFlowLines,
} from './network/parseNetworkFlows';
import {
  NetworkCaptureBanner,
  NetworkFlowStats,
  NetworkFlowViewer,
  NetworkHostList,
} from './network/NetworkFlowViewer';

export interface ScenarioLabSubmission {
  scenarioId: string;
  answers: Record<string, string>;
  localResult?: ScenarioSubmitResult | null;
}

function scenarioIdFromStarter(starterState: unknown, fallback: string): string {
  if (starterState && typeof starterState === 'object') {
    const s = starterState as Record<string, unknown>;
    if (typeof s.scenarioId === 'string') return s.scenarioId;
  }
  return fallback;
}

function difficultyVariant(difficulty: string): 'good' | 'warn' | 'bad' | 'outline' {
  if (difficulty === 'easy') return 'good';
  if (difficulty === 'hard') return 'bad';
  return 'warn';
}

export function NetworkSimulatorLab({
  starterState,
  scenario: scenarioProp,
  value,
  onChange,
  readOnly = false,
}: {
  starterState?: unknown;
  scenario?: NetworkScenario;
  value: ScenarioLabSubmission | null;
  onChange: (data: ScenarioLabSubmission) => void;
  readOnly?: boolean;
}) {
  const selfLoaded = scenarioProp === undefined;
  const [embeddedScenario, setEmbeddedScenario] = useState<NetworkScenario | null>(null);
  const [embeddedLoading, setEmbeddedLoading] = useState(selfLoaded);
  const [embeddedError, setEmbeddedError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>(value?.answers ?? {});
  const [localResult, setLocalResult] = useState<ScenarioSubmitResult | null>(
    value?.localResult ?? null,
  );
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedHost, setSelectedHost] = useState<string | null>(null);

  const scenario = scenarioProp ?? embeddedScenario;
  const loading = scenarioProp ? false : embeddedLoading;

  useEffect(() => {
    if (scenarioProp || !selfLoaded) return;

    let cancelled = false;
    async function load() {
      setEmbeddedLoading(true);
      setEmbeddedError(null);
      try {
        const scenarios = await listNetworkScenarios();
        const id = scenarioIdFromStarter(starterState, scenarios[0]?.id ?? 'port-scan');
        const data = await getNetworkScenario(id);
        if (!cancelled) setEmbeddedScenario(data);
      } catch {
        if (!cancelled) setEmbeddedError('Could not load network scenario.');
      } finally {
        if (!cancelled) setEmbeddedLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [starterState, scenarioProp, selfLoaded]);

  useEffect(() => {
    setAnswers(value?.answers ?? {});
    setLocalResult(value?.localResult ?? null);
    setFilterQuery('');
    setSelectedHost(null);
    setError(null);
  }, [scenario?.id]);

  const allFlows = useMemo(
    () => (scenario ? parseNetworkFlowLines(scenario.pcapSummary) : []),
    [scenario],
  );

  const hosts = useMemo(() => collectHosts(allFlows), [allFlows]);

  const flowCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const flow of allFlows) {
      counts[flow.source] = (counts[flow.source] ?? 0) + 1;
      counts[flow.destination] = (counts[flow.destination] ?? 0) + 1;
    }
    return counts;
  }, [allFlows]);

  const filteredFlows = useMemo(() => {
    let flows = allFlows;
    if (selectedHost) {
      flows = flows.filter(
        (flow) => flow.source === selectedHost || flow.destination === selectedHost,
      );
    }
    return filterNetworkFlows(flows, filterQuery);
  }, [allFlows, selectedHost, filterQuery]);

  useEffect(() => {
    if (scenario) onChange({ scenarioId: scenario.id, answers, localResult });
  }, [scenario, answers, localResult, onChange]);

  async function checkAnswers() {
    if (!scenario || readOnly) return;
    setChecking(true);
    setError(null);
    try {
      const payload = scenario.questions.map((q) => ({
        questionId: q.id,
        answer: answers[q.id] ?? '',
      }));
      const result = await submitNetworkScenario(scenario.id, payload);
      setLocalResult(result);
    } catch {
      setError('Could not check answers. Premium subscription may be required.');
    } finally {
      setChecking(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center gap-3 bg-[#1e1e1e] p-8 text-sm text-[#cccccc]">
        <Loader2 className="size-5 animate-spin text-primary" />
        Loading network scenario…
      </div>
    );
  }

  if (embeddedError && !scenario) {
    return (
      <div className="bg-bg-elev p-8 text-center">
        <p className="text-sm text-bad">{embeddedError}</p>
      </div>
    );
  }

  if (!scenario) return null;

  const resultByQuestion = new Map(localResult?.results.map((r) => [r.questionId, r]) ?? []);

  return (
    <div className="overflow-hidden bg-[#1e1e1e]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2d2d2d] bg-[#252526] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg border border-[#007F8E]/30 bg-[#007F8E]/10 text-[#4ec9b0]">
            <Network className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#cccccc]">{scenario.title}</p>
            <p className="mt-0.5 text-xs text-[#858585]">
              {allFlows.length} flows · Packet capture simulator
            </p>
          </div>
        </div>
        <Badge variant={difficultyVariant(scenario.difficulty)} className="capitalize">
          {scenario.difficulty}
        </Badge>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <p className="text-sm leading-6 text-[#858585]">{scenario.description}</p>

        <NetworkCaptureBanner capturing={false} flowCount={allFlows.length} />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#858585]" />
            <Input
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter flows: host 10.0.0.5 · port 22 · SYN"
              className="h-10 border-[#2d2d2d] bg-[#252526] pl-9 font-mono text-xs text-[#cccccc] placeholder:text-[#6e7681]"
            />
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#858585]">
            <Filter className="size-3.5" />
            BPF-style filters supported
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[240px_1fr]">
          <div className="space-y-3">
            <NetworkHostList
              hosts={hosts}
              selectedHost={selectedHost}
              onSelectHost={setSelectedHost}
              flowCounts={flowCounts}
            />
            <NetworkFlowStats flows={allFlows} />
          </div>

          <NetworkFlowViewer
            flows={filteredFlows}
            visibleCount={filteredFlows.length}
            selectedHost={selectedHost}
            onSelectHost={setSelectedHost}
          />
        </div>

        <div className="rounded-lg border border-[#2d2d2d] bg-[#252526] p-4 sm:p-5">
          <p className="text-sm font-medium text-[#cccccc]">Raw flow summary</p>
          <pre className="mt-3 max-h-40 overflow-auto rounded-lg border border-[#2d2d2d] bg-[#0d1117] p-3 font-mono text-[12px] leading-6 text-[#e6edf3]">
            {scenario.pcapSummary.join('\n')}
          </pre>
        </div>

        <div className="rounded-xl border border-line bg-bg p-4 sm:p-5">
          <h2 className="text-base font-semibold text-ink">Analysis worksheet</h2>
          <p className="mt-1 text-sm leading-6 text-ink-2">
            Review the flow table, identify suspicious hosts and techniques, then submit your
            findings.
          </p>

          <div className="mt-5 space-y-4">
            {scenario.questions.map((q, index) => {
              const result = resultByQuestion.get(q.id);
              return (
                <div key={q.id} className="rounded-lg border border-line bg-bg-soft/50 p-4">
                  <label className="text-sm font-medium text-ink" htmlFor={`net-${q.id}`}>
                    {index + 1}. {q.prompt}
                  </label>
                  {q.hint ? <p className="mt-1 text-xs text-ink-3">{q.hint}</p> : null}
                  <input
                    id={`net-${q.id}`}
                    value={answers[q.id] ?? ''}
                    readOnly={readOnly}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    className={cn(
                      'mt-2 h-11 w-full rounded-lg border bg-bg-elev px-3 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
                      result?.correct && 'border-good/40',
                      result && !result.correct && 'border-bad/40',
                    )}
                  />
                  {result ? (
                    <p
                      className={cn(
                        'mt-2 flex items-center gap-1.5 text-xs font-medium',
                        result.correct ? 'text-good' : 'text-bad',
                      )}
                    >
                      {result.correct ? (
                        <>
                          <CheckCircle2 className="size-3.5" /> Correct
                        </>
                      ) : (
                        <>
                          <XCircle className="size-3.5" /> Incorrect — review the flow table
                        </>
                      )}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>

          {!readOnly ? (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                className="rounded-full px-5"
                onClick={() => void checkAnswers()}
                disabled={checking}
              >
                {checking ? <Loader2 className="size-4 animate-spin" /> : 'Validate analysis'}
              </Button>
              {localResult ? (
                <p className="text-sm text-ink-2">
                  Score:{' '}
                  <span className="font-semibold text-ink">{localResult.score}%</span> (
                  {localResult.correct}/{localResult.total} correct)
                </p>
              ) : null}
            </div>
          ) : null}

          {error ? <p className="mt-3 text-sm text-bad">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}

export default NetworkSimulatorLab;
