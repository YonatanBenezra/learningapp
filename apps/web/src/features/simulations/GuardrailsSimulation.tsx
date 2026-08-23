'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Play, Send } from 'lucide-react';
import { ApiError } from '@/src/infrastructure/apiClient';
import { buttonClasses } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { platformContainerClass } from '@/src/features/platform/platformLayout';
import { SimulationPanel } from './SimulationPanel';
import {
  runSimulation,
  submitSimulation,
  type GuardrailsBootstrap,
  type GuardrailsConfig,
  type GuardrailsRunResult,
  type SimulationPublic,
  type SimulationSubmitResult,
} from './simulationsApi';

function statusLabel(status: GuardrailsRunResult['status']): string {
  switch (status) {
    case 'blocked_input':
      return 'Blocked at input';
    case 'refused':
      return 'Refused by model';
    case 'blocked_output':
      return 'Blocked at output';
    case 'unsafe_output':
      return 'Unsafe output leaked';
    default:
      return 'Allowed';
  }
}

export function GuardrailsSimulation({
  simulation,
  bootstrap,
}: {
  simulation: SimulationPublic;
  bootstrap: GuardrailsBootstrap;
}) {
  const [userInput, setUserInput] = useState(bootstrap.defaultUserInput);
  const [config, setConfig] = useState<GuardrailsConfig>(bootstrap.defaultConfig);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<GuardrailsRunResult | null>(null);
  const [submitResult, setSubmitResult] = useState<SimulationSubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const configBody = { userInput, ...config };

  function toggleGuardrail(key: keyof GuardrailsConfig) {
    setConfig((current) => ({ ...current, [key]: !current[key] }));
  }

  async function handleRun() {
    if (!userInput.trim()) return;
    setRunning(true);
    setError(null);
    setSubmitResult(null);
    try {
      const result = await runSimulation(simulation.slug, configBody);
      if ('mockOutput' in result && 'safe' in result) setRunResult(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Guardrail test failed.');
    } finally {
      setRunning(false);
    }
  }

  async function handleSubmit() {
    if (!userInput.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitSimulation(simulation.slug, configBody);
      setSubmitResult(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Submit failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={cn(platformContainerClass, 'flex-1 py-6')}>
      <Link
        href="/simulations"
        className="inline-flex items-center gap-2 text-sm font-medium text-ink-2 hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        All simulations
      </Link>

      <header className="mt-4 mb-6 max-w-3xl">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">Guardrails</p>
        <h1 className="mt-1 text-xl font-semibold text-ink">{simulation.title}</h1>
        <p className="mt-2 text-sm leading-6 text-ink-2">{simulation.description}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4">
          <SimulationPanel title="Goal">
            <p className="text-sm leading-6 text-ink-2">{simulation.taskPrompt}</p>
          </SimulationPanel>

          <SimulationPanel title="Guardrail layers">
            <ul className="space-y-3">
              {bootstrap.guardrailOptions.map((option) => (
                <li key={option.key} className="rounded-md border border-line/60 bg-bg-soft px-3 py-3 dark:bg-bg-lav/20">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={config[option.key]}
                      onChange={() => toggleGuardrail(option.key)}
                      className="mt-1 rounded border-line-2"
                    />
                    <span>
                      <span className="block text-sm font-medium text-ink">{option.label}</span>
                      <span className="mt-1 block text-sm leading-6 text-ink-2">{option.description}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </SimulationPanel>

          <SimulationPanel title="Test prompt">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-line-2 bg-bg-soft px-3 py-3 text-sm leading-6 text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:bg-bg-lav/20"
              spellCheck={false}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {bootstrap.testCases.map((testCase) => (
                <button
                  key={testCase.id}
                  type="button"
                  onClick={() => setUserInput(testCase.input)}
                  className={buttonClasses({
                    variant: 'outline',
                    size: 'sm',
                    className: 'h-8 rounded-md px-3 text-xs shadow-none',
                  })}
                >
                  {testCase.label}
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleRun()}
                disabled={running || submitting || !userInput.trim()}
                className={buttonClasses({
                  variant: 'outline',
                  size: 'sm',
                  className: 'h-9 rounded-md px-4 shadow-none',
                })}
              >
                {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                Test prompt
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={running || submitting || !userInput.trim()}
                className={buttonClasses({
                  size: 'sm',
                  className: 'h-9 rounded-md px-4 shadow-none',
                })}
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Submit config
              </button>
            </div>
          </SimulationPanel>
        </section>

        <section className="space-y-4">
          <SimulationPanel title="Pipeline result (mock)">
            {runResult ? (
              <>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-1 font-medium uppercase tracking-wide',
                      runResult.safe ? 'bg-good-soft text-good' : 'bg-warn-soft text-warn',
                    )}
                  >
                    {runResult.safe ? 'Safe' : 'Unsafe'}
                  </span>
                  <span className="rounded-full bg-bg-soft px-2.5 py-1 text-ink-3 dark:bg-bg-lav/20">
                    {statusLabel(runResult.status)}
                  </span>
                  <span className="rounded-full bg-bg-soft px-2.5 py-1 text-ink-3 dark:bg-bg-lav/20">
                    Input: {runResult.inputKind}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-ink">{runResult.mockOutput}</p>
                {runResult.layer !== 'none' ? (
                  <p className="mt-2 text-xs text-ink-3">Triggered layer: {runResult.layer.replace('_', ' ')}</p>
                ) : null}
                {runResult.hints.length > 0 ? (
                  <ul className="mt-3 space-y-1.5 text-sm text-ink-2">
                    {runResult.hints.map((hint) => (
                      <li key={hint}>• {hint}</li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-ink-3">Test a prompt to see which guardrail layer handles it.</p>
            )}
          </SimulationPanel>

          {submitResult ? (
            <SimulationPanel title="Result">
              <p
                className={cn(
                  'text-sm font-medium',
                  submitResult.passed ? 'text-good' : 'text-warn',
                )}
              >
                {submitResult.passed ? 'Passed' : 'Needs improvement'} · {submitResult.score}%
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-2">{submitResult.feedback}</p>
            </SimulationPanel>
          ) : null}

          {error ? (
            <p className="rounded-md border border-bad/25 bg-bad-soft/40 px-3 py-2 text-sm text-bad" role="alert">
              {error}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
