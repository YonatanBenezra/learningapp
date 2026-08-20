'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  ClipboardCheck,
  ListChecks,
  Sparkles,
} from 'lucide-react';
import { DIAGNOSTIC_ASSESSMENT_QUESTION_COUNT } from '@aieng/shared';
import { platformContainerClass } from '@/src/features/platform/platformLayout';
import { buttonClasses } from '@/src/components/ui/button';
import { ApiError } from '@/src/infrastructure/apiClient';
import { PRACTICE_PATH } from '@/src/config/mvp';
import { cn } from '@/src/lib/utils';
import { markAssessmentPromptSeen } from '@/src/features/skill-assessment/skillAssessmentApi';
import {
  useMySkillAssessments,
  useStartDiagnosticAssessment,
} from '@/src/features/skill-assessment/useSkillAssessment';
import { AssessmentStartGeneratingOverlay } from './AssessmentStartGeneratingOverlay';
import { useTranslation } from '@/src/i18n';

const GENERATING_MIN_MS = 2200;
const DEFAULT_ASSESSMENT_TOPIC = 'Artificial Intelligence' as const;

function StatPill({
  icon: Icon,
  label,
}: {
  icon: typeof Clock3;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-line/70 bg-bg-soft/80 px-3.5 py-3 dark:border-line-2 dark:bg-bg-soft/40">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" strokeWidth={2} />
      </span>
      <span className="text-left text-sm font-medium leading-snug text-ink">{label}</span>
    </div>
  );
}

export function PracticeAssessmentStart() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const start = useStartDiagnosticAssessment();
  const assessmentsQ = useMySkillAssessments();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectAfter =
    searchParams.get('redirect')?.startsWith('/') ? searchParams.get('redirect')! : PRACTICE_PATH;

  const pendingAssessment = useMemo(() => {
    return assessmentsQ.data?.assessments.find(
      (a) => a.status === 'pending' && a.generationStatus === 'ready' && a.questionCount > 0,
    );
  }, [assessmentsQ.data?.assessments]);

  const features = [
    t('marketing.assessmentStartFeature1'),
    t('marketing.assessmentStartFeature2'),
    t('marketing.assessmentStartFeature3'),
  ] as const;

  async function handleStart() {
    setError(null);
    setGenerating(true);

    try {
      const [assessment] = await Promise.all([
        start.mutateAsync({ topic: DEFAULT_ASSESSMENT_TOPIC }),
        new Promise((resolve) => window.setTimeout(resolve, GENERATING_MIN_MS)),
      ]);
      markAssessmentPromptSeen();
      router.push(`/assessment/${assessment.id}?redirect=${encodeURIComponent(redirectAfter)}`);
    } catch (err) {
      setGenerating(false);
      if (err instanceof ApiError && err.status === 429) {
        setError(err.message);
        return;
      }
      setError(t('marketing.errorStartFailed'));
    }
  }

  if (generating) {
    return <AssessmentStartGeneratingOverlay />;
  }

  return (
    <section className="relative flex min-h-[calc(100dvh-50px)] flex-1 flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-24 top-0 size-72 rounded-full bg-primary/[0.07] blur-3xl" />
        <div className="absolute -right-16 bottom-0 size-80 rounded-full bg-[#7c3aed]/[0.06] blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,127,142,0.08),transparent_55%)] dark:bg-[radial-gradient(circle_at_top,rgba(0,157,175,0.12),transparent_55%)]" />
      </div>

      <div className={cn(platformContainerClass, 'relative flex flex-1 items-center py-10 sm:py-14')}>
        <div className="mx-auto w-full max-w-[42rem]">
          <div className="overflow-hidden rounded-2xl border border-line/80 bg-bg-elev/95 shadow-lift backdrop-blur-sm dark:border-line-2 dark:bg-bg-elev/90">
            <div className="h-1 bg-gradient-to-r from-primary via-primary-2 to-[#6366f1]" />

            <div className="p-6 sm:p-8 lg:p-10">
              {pendingAssessment ? (
                <div className="mb-6 flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/[0.05] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-left">
                    <p className="text-sm font-semibold text-ink">{t('marketing.continueAssessmentTitle')}</p>
                    <p className="mt-1 text-sm text-ink-2">{t('marketing.continueAssessmentDesc')}</p>
                  </div>
                  <Link
                    href={`/assessment/${pendingAssessment.id}?redirect=${encodeURIComponent(redirectAfter)}`}
                    className={buttonClasses({
                      variant: 'outline',
                      size: 'sm',
                      className:
                        'h-10 shrink-0 rounded-lg border-primary/30 bg-bg-elev/80 px-4 text-sm font-semibold hover:bg-primary/[0.06]',
                    })}
                  >
                    {t('marketing.continueAssessment')}
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              ) : null}

              <div className="text-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  <Sparkles className="size-3.5" />
                  {t('marketing.diagnosticBadge')}
                </span>

                <div className="mx-auto mt-6 grid size-16 place-items-center rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.12] to-primary/[0.04] text-primary shadow-[0_8px_30px_rgba(0,127,142,0.12)]">
                  <ClipboardCheck className="size-8" strokeWidth={1.6} />
                </div>

                <h1 className="mt-6 font-heading text-[2rem] font-semibold leading-[1.12] tracking-[-0.025em] text-ink sm:text-[2.4rem]">
                  {t('marketing.startPageTitle')}
                </h1>
                <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-ink-2">
                  {t('marketing.startPageDescription')}
                </p>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <StatPill
                  icon={ListChecks}
                  label={t('marketing.summaryFormatValue', {
                    count: String(DIAGNOSTIC_ASSESSMENT_QUESTION_COUNT),
                  })}
                />
                <StatPill icon={Clock3} label={t('marketing.summaryDurationValue')} />
              </div>

              <ul className="mt-8 space-y-3 rounded-xl border border-line/70 bg-bg-soft/50 p-4 sm:p-5 dark:border-line-2 dark:bg-bg-soft/30">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm leading-6 text-ink-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" strokeWidth={2} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {error ? (
                <p
                  className="mt-6 rounded-xl border border-bad/30 bg-bad-soft px-4 py-3 text-sm text-bad"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}

              <div className="mt-8 flex flex-col items-center gap-4">
                <button
                  type="button"
                  onClick={() => void handleStart()}
                  disabled={start.isPending}
                  className={buttonClasses({
                    size: 'lg',
                    className:
                      'h-12 w-full max-w-md rounded-xl px-6 text-sm font-semibold shadow-primary sm:w-auto sm:min-w-[260px]',
                  })}
                >
                  {t('marketing.takeAssessment')}
                  <ArrowRight className="size-4" />
                </button>

                <Link
                  href="/"
                  className="text-sm font-medium text-ink-3 transition-colors hover:text-ink"
                >
                  {t('marketing.backToHome')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
