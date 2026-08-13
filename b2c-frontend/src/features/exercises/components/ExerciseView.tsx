'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Code2,
  Loader2,
  Network,
  Send,
  Shield,
  Sparkles,
  Terminal,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { BrandWordmark } from '@/src/components/ui/brand-wordmark';
import { Progress } from '@/src/components/ui/progress';
import { Skeleton } from '@/src/components/ui/skeleton';
import type { Exercise, ExerciseSubmission } from '@/src/domain/exercise';
import { useLesson } from '@/src/features/lessons';
import {
  CodeEditorLab,
  NetworkSimulatorLab,
  resolveLabForExerciseDomain,
  SocSimulatorLab,
  TerminalLab,
  type LabKind,
} from '@/src/features/labs';
import { cn } from '@/src/lib/utils';
import { useIsRtl, useTranslation } from '@/src/i18n';
import { useExerciseSubmission, useSubmitExercise } from '../useExercises';

const LAB_ICONS: Record<LabKind, LucideIcon> = {
  code: Code2,
  terminal: Terminal,
  soc: Shield,
  network: Network,
};

function prettyDomain(domain: string): string {
  return domain.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function scoreTone(score: number | null): 'good' | 'warn' | 'bad' | 'default' {
  if (score === null) return 'default';
  if (score >= 80) return 'good';
  if (score >= 60) return 'warn';
  return 'bad';
}

function ExerciseStatusBadge({
  graded,
  grading,
}: {
  graded: boolean;
  grading: boolean;
}) {
  const { t } = useTranslation();

  if (graded) {
    return (
      <Badge variant="good" className="gap-1.5">
        <CheckCircle2 className="size-3.5" /> {t('exercises.statusGraded')}
      </Badge>
    );
  }
  if (grading) {
    return (
      <Badge variant="warn" className="gap-1.5">
        <Loader2 className="size-3.5 animate-spin" /> {t('exercises.statusAiGrading')}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1.5">
      <CircleDashed className="size-3.5" /> {t('exercises.statusInProgress')}
    </Badge>
  );
}

function GradingResultCard({ submission }: { submission: ExerciseSubmission }) {
  const { t } = useTranslation();
  const score = submission.score;
  const tone = scoreTone(score);

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-bg-elev shadow-soft">
      <div
        className={cn(
          'border-b px-5 py-4 sm:px-6',
          tone === 'good' && 'border-good/20 bg-good-soft/50',
          tone === 'warn' && 'border-warn/20 bg-warn-soft/50',
          tone === 'bad' && 'border-bad/20 bg-bad-soft/50',
          tone === 'default' && 'border-line bg-bg-soft/60',
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'grid size-11 place-items-center rounded-xl border',
                tone === 'good' && 'border-good/30 bg-good-soft text-good',
                tone === 'warn' && 'border-warn/30 bg-warn-soft text-warn',
                tone === 'bad' && 'border-bad/30 bg-bad-soft text-bad',
                tone === 'default' && 'border-line bg-bg-soft text-primary',
              )}
            >
              <Sparkles className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-3">
                {t('exercises.aiEvaluation')}
              </p>
              <h2 className="text-lg font-bold text-ink">{t('exercises.submissionGraded')}</h2>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-3">{t('exercises.score')}</p>
            <p className="text-3xl font-bold tabular-nums text-ink">
              {score ?? '—'}
              {score !== null ? '%' : ''}
            </p>
          </div>
        </div>
        {score !== null ? (
          <div className="mt-4">
            <Progress value={score} className="h-2" />
          </div>
        ) : null}
      </div>

      {submission.feedback ? (
        <div className="px-5 py-5 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-3">{t('exercises.feedback')}</p>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-ink-2">
            {submission.feedback}
          </p>
        </div>
      ) : null}
    </section>
  );
}

export function ExerciseView({
  lessonId,
  exercise,
}: {
  lessonId: string;
  exercise: Exercise;
}) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const lessonQ = useLesson(lessonId);
  const lab = resolveLabForExerciseDomain(exercise.domain);
  const LabIcon = LAB_ICONS[lab.kind] ?? Wrench;
  const submit = useSubmitExercise(exercise.id);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [labData, setLabData] = useState<unknown>(null);
  const submissionQ = useExerciseSubmission(submissionId, Boolean(submissionId));

  const handleLabChange = useCallback((data: unknown) => {
    setLabData(data);
  }, []);

  const graded = submissionQ.data?.status === 'graded';
  const grading = submissionQ.data?.status === 'submitted' || submissionQ.data?.status === 'grading';
  const lessonTitle = lessonQ.data?.lesson.title ?? t('player.lesson');

  const labNode = useMemo(() => {
    const common = {
      starterState: exercise.taskSpec.starterState,
      value: labData as never,
      onChange: handleLabChange,
      readOnly: graded,
    };
    switch (lab.kind) {
      case 'terminal':
        return <TerminalLab {...common} />;
      case 'soc':
        return <SocSimulatorLab {...common} />;
      case 'network':
        return <NetworkSimulatorLab {...common} />;
      default:
        return <CodeEditorLab {...common} />;
    }
  }, [exercise.taskSpec.starterState, lab.kind, labData, handleLabChange, graded]);

  function onSubmit() {
    submit.mutate(labData ?? {}, {
      onSuccess: (submission) => setSubmissionId(submission.id),
    });
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-primary/[0.04] via-bg to-bg">
      <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="border-b border-line pb-5">
          <Link
            href={`/lesson/${lessonId}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 transition hover:text-primary"
          >
            <ArrowLeft className="size-4" /> {t('exercises.backToLesson')}
          </Link>
          <nav className="mt-3 flex flex-wrap items-center gap-1.5 text-sm text-ink-3">
            <Link href="/dashboard" className="transition hover:text-primary">
              <BrandWordmark size="sm" className="font-semibold" />
            </Link>
            <ChevronRight className={`size-4${isRtl ? ' rotate-180' : ''}`} />
            <Link href={`/lesson/${lessonId}`} className="line-clamp-1 transition hover:text-primary">
              {lessonTitle}
            </Link>
            <ChevronRight className={`size-4${isRtl ? ' rotate-180' : ''}`} />
            <span className="font-medium text-ink">{t('exercises.handsOnExercise')}</span>
          </nav>
        </div>

        <header className="overflow-hidden rounded-xl border border-line bg-bg-elev shadow-soft">
          <div className="h-1 bg-gradient-to-r from-primary via-primary-2 to-primary/40" />
          <div className="p-5 sm:p-6 lg:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                  {t('exercises.practicalAssessment')}
                </p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                  {t('exercises.handsOnExercise')}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-2">{lab.description}</p>
              </div>
              <ExerciseStatusBadge graded={graded} grading={grading} />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Badge variant="primary" className="gap-1.5">
                <LabIcon className="size-3.5" />
                {lab.label}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {prettyDomain(exercise.domain)}
              </Badge>
            </div>

            <div className="mt-6 rounded-xl border border-line bg-bg-soft/70 px-4 py-4 sm:px-5">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-3">
                {t('exercises.taskInstructions')}
              </p>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
                {exercise.taskSpec.description}
              </p>
            </div>
          </div>
        </header>

        <section className="overflow-hidden rounded-xl border border-line bg-bg-elev shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-bg-soft/60 px-4 py-3.5 sm:px-5">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-lg border border-line bg-bg-elev text-primary">
                <LabIcon className="size-4" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-3">
                  {t('exercises.workspace')}
                </p>
                <p className="text-sm font-semibold text-ink">{lab.label}</p>
              </div>
            </div>
            {graded ? (
              <span className="text-xs font-medium text-ink-3">{t('exercises.readOnlyAfterSubmit')}</span>
            ) : (
              <span className="text-xs font-medium text-ink-3">{t('exercises.completeTaskBelow')}</span>
            )}
          </div>
          <div className="p-4 sm:p-5 lg:p-6">{labNode}</div>
        </section>

        {submissionQ.isLoading && submissionId ? (
          <section className="rounded-xl border border-line bg-bg-elev p-5 shadow-soft sm:p-6">
            <div className="flex items-center gap-3">
              <Loader2 className="size-5 animate-spin text-primary" />
              <div>
                <p className="font-semibold text-ink">{t('exercises.evaluatingSubmission')}</p>
                <p className="text-sm text-ink-2">{t('exercises.gradingHint')}</p>
              </div>
            </div>
            <Skeleton className="mt-5 h-24 w-full rounded-lg" />
          </section>
        ) : null}

        {graded && submissionQ.data ? <GradingResultCard submission={submissionQ.data} /> : null}

        {!graded ? (
          <section className="rounded-xl border border-line bg-bg-elev px-4 py-4 shadow-soft sm:px-6 sm:py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-ink">{t('exercises.readyToSubmit')}</p>
                <p className="mt-1 text-sm text-ink-2">{t('exercises.submitHint')}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {grading ? (
                  <p className="flex items-center gap-2 text-sm text-ink-2">
                    <Loader2 className="size-4 animate-spin text-primary" />
                    {t('exercises.gradingInProgress')}
                  </p>
                ) : null}
                {submit.isError ? (
                  <p className="text-sm text-bad">{t('exercises.submitError')}</p>
                ) : null}
                <Button
                  onClick={onSubmit}
                  disabled={submit.isPending || grading}
                  className="min-w-[180px]"
                >
                  {submit.isPending || grading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  {t('exercises.submitForGrading')}
                </Button>
              </div>
            </div>
          </section>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Link href={`/lesson/${lessonId}`}>
              <Button variant="soft">
                <ArrowLeft className="size-4" /> {t('exercises.returnToLesson')}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExerciseView;
