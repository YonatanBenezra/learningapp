'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Loader2, Sparkles } from 'lucide-react';
import { DIAGNOSTIC_ASSESSMENT_QUESTION_COUNT } from '@aieng/shared';
import { platformContainerClass } from '@/src/features/platform/platformLayout';
import { cn } from '@/src/lib/utils';
import { useGenerationPhases, useTranslation } from '@/src/i18n';

const MIN_PHASE_MS = 700;
const TARGET_PROGRESS = 94;

function GeneratingSpinner() {
  return (
    <div className="relative mx-auto grid size-20 place-items-center" role="status" aria-hidden="true">
      <span className="absolute inset-0 rounded-full border-[3px] border-primary/10" />
      <span className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary animate-app-loader-spin" />
      <span className="absolute inset-2 rounded-full border-[3px] border-transparent border-b-primary-2 animate-app-loader-spin-reverse opacity-80" />
      <span className="relative grid size-10 place-items-center rounded-xl bg-gradient-to-br from-primary/[0.14] to-primary/[0.04] text-primary">
        <Sparkles className="size-5" strokeWidth={1.75} />
      </span>
    </div>
  );
}

export function AssessmentStartGeneratingOverlay() {
  const { t } = useTranslation();
  const phases = useGenerationPhases();
  const [activePhase, setActivePhase] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (phases.length <= 1) return;
    const timer = window.setInterval(() => {
      setActivePhase((current) => (current + 1) % phases.length);
    }, MIN_PHASE_MS);
    return () => window.clearInterval(timer);
  }, [phases.length]);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const next = Math.min(TARGET_PROGRESS, (elapsed / (phases.length * MIN_PHASE_MS)) * TARGET_PROGRESS);
      setProgress(next);
    }, 40);
    return () => window.clearInterval(timer);
  }, [phases.length]);

  return (
    <section className="relative flex min-h-[calc(100dvh-50px)] flex-1 flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-24 top-0 size-72 rounded-full bg-primary/[0.07] blur-3xl" />
        <div className="absolute -right-16 bottom-0 size-80 rounded-full bg-[#7c3aed]/[0.06] blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,127,142,0.08),transparent_55%)] dark:bg-[radial-gradient(circle_at_top,rgba(0,157,175,0.12),transparent_55%)]" />
      </div>

      <div className={cn(platformContainerClass, 'relative flex flex-1 items-center py-10 sm:py-14')}>
        <div className="mx-auto w-full max-w-[42rem]">
          <div
            className="overflow-hidden rounded-2xl border border-line/80 bg-bg-elev/95 shadow-lift backdrop-blur-sm dark:border-line-2 dark:bg-bg-elev/90"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="h-1 bg-gradient-to-r from-primary via-primary-2 to-[#6366f1]" />

            <div className="p-6 sm:p-8 lg:p-10">
              <div className="text-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  <Loader2 className="size-3.5 animate-spin" strokeWidth={2.5} />
                  {t('marketing.assessGeneratingBadge')}
                </span>

                <div className="mt-6">
                  <GeneratingSpinner />
                </div>

                <h1 className="mt-6 font-heading text-[1.75rem] font-semibold leading-[1.12] tracking-[-0.025em] text-ink sm:text-[2rem]">
                  {t('marketing.assessGeneratingTitle')}
                </h1>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-2 sm:text-[15px]">
                  {t('marketing.assessGeneratingShortDesc', {
                    count: String(DIAGNOSTIC_ASSESSMENT_QUESTION_COUNT),
                  })}
                </p>
              </div>

              <div className="mt-8 rounded-xl border border-line/70 bg-bg-soft/50 p-4 dark:border-line-2 dark:bg-bg-soft/30 sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-3 text-xs font-medium text-ink-3">
                  <span>{t('marketing.assessGenInProgress')}</span>
                  <span className="tabular-nums text-primary">{Math.round(progress)}%</span>
                </div>
                <div className="relative h-2 overflow-hidden rounded-full bg-primary/10">
                  <div
                    className="relative h-full rounded-full bg-gradient-to-r from-primary via-primary-2 to-[#6366f1] transition-[width] duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 animate-shimmer bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)]" />
                  </div>
                </div>

                <ol className="mt-5 space-y-1">
                  {phases.map((label, index) => {
                    const state =
                      index < activePhase ? 'done' : index === activePhase ? 'active' : 'pending';
                    return (
                      <li
                        key={label}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-300',
                          state === 'active' && 'bg-primary/[0.07] font-medium text-ink',
                          state === 'done' && 'text-ink-2',
                          state === 'pending' && 'text-ink/35',
                        )}
                      >
                        {state === 'done' ? (
                          <CheckCircle2 className="size-4 shrink-0 text-primary" strokeWidth={2} />
                        ) : state === 'active' ? (
                          <Loader2
                            className="size-4 shrink-0 animate-spin text-primary"
                            strokeWidth={2}
                          />
                        ) : (
                          <Circle className="size-4 shrink-0 text-line" strokeWidth={2} />
                        )}
                        <span className="leading-6">{label}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
