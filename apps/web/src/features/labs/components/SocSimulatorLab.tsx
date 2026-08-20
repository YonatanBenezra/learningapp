'use client';

import { useEffect, useState } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { useTranslation } from '@/src/i18n';
import {
  getSocScenario,
  listSocScenarios,
  submitSocScenario,
  type ScenarioSubmitResult,
  type SocScenario,
} from '../labsApi';

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

export function SocSimulatorLab({
  starterState,
  value,
  onChange,
  readOnly = false,
}: {
  starterState: unknown;
  value: ScenarioLabSubmission | null;
  onChange: (data: ScenarioLabSubmission) => void;
  readOnly?: boolean;
}) {
  const { t } = useTranslation();
  const [scenario, setScenario] = useState<SocScenario | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>(value?.answers ?? {});
  const [localResult, setLocalResult] = useState<ScenarioSubmitResult | null>(
    value?.localResult ?? null,
  );
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const scenarios = await listSocScenarios();
        const id = scenarioIdFromStarter(starterState, scenarios[0]?.id ?? 'phishing-triage');
        const data = await getSocScenario(id);
        if (!cancelled) {
          setScenario(data);
          onChange({ scenarioId: id, answers, localResult });
        }
      } catch {
        if (!cancelled) setError(t('labs.loadSocError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, []);

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
      const result = await submitSocScenario(scenario.id, payload);
      setLocalResult(result);
    } catch {
      setError(t('labs.checkAnswersPremium'));
    } finally {
      setChecking(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-line bg-bg-soft p-8 text-sm text-ink-2">
        <Loader2 className="size-4 animate-spin" /> {t('labs.loadingSoc')}
      </div>
    );
  }

  if (error && !scenario) {
    return <p className="text-sm text-bad">{error}</p>;
  }

  if (!scenario) return null;

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-line bg-bg-soft p-5">
        <div className="flex items-center gap-2 font-semibold text-ink">
          <ShieldAlert className="size-5 text-secondary" />
          {scenario.title}
        </div>
        <p className="mt-2 text-sm text-ink-2">{scenario.description}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">{t('labs.alerts')}</p>
          <div className="mt-3 space-y-2">
            {scenario.alerts.map((alert) => (
              <div key={alert.id} className="rounded-xl border border-line/80 bg-[#FCFCFC] p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium capitalize text-ink">{alert.severity}</span>
                  <span className="text-xs text-ink-3">{alert.source}</span>
                </div>
                <p className="mt-1 text-ink-2">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">{t('labs.logs')}</p>
          <pre className="mt-3 max-h-56 overflow-auto rounded-xl bg-[#0F172A] p-3 font-mono text-xs leading-6 text-[#E2E8F0]">
            {scenario.logs.join('\n')}
          </pre>
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <p className="text-sm font-semibold text-ink">{t('labs.investigationQuestions')}</p>
        <div className="mt-4 space-y-4">
          {scenario.questions.map((q) => (
            <div key={q.id}>
              <label className="text-sm font-medium text-ink" htmlFor={`soc-${q.id}`}>
                {q.prompt}
              </label>
              {q.hint && <p className="mt-1 text-xs text-ink-3">{q.hint}</p>}
              <input
                id={`soc-${q.id}`}
                value={answers[q.id] ?? ''}
                readOnly={readOnly}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                className="mt-2 h-11 w-full rounded-lg border border-line px-3 text-sm outline-none focus:border-primary"
              />
            </div>
          ))}
        </div>

        {!readOnly && (
          <Button className="mt-5" variant="soft" onClick={() => void checkAnswers()} disabled={checking}>
            {checking ? <Loader2 className="size-4 animate-spin" /> : t('labs.checkLocally')}
          </Button>
        )}

        {localResult && (
          <p className="mt-4 text-sm text-ink-2">
            {t('labs.localScore', {
              score: String(localResult.score),
              correct: String(localResult.correct),
              total: String(localResult.total),
            })}
          </p>
        )}
        {error && <p className="mt-3 text-sm text-bad">{error}</p>}
      </div>
    </div>
  );
}

export default SocSimulatorLab;
