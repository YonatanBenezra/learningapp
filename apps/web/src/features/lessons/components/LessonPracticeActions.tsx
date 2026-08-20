'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ClipboardList, Wrench } from 'lucide-react';
import { useGenerateQuiz } from '@/src/features/assessments';
import { useGenerateExercise } from '@/src/features/exercises';
import { buttonClasses } from '@/src/components/ui/button';
import { ApiError } from '@/src/infrastructure/apiClient';
import { useTranslation } from '@/src/i18n';
import {
  LessonGeneratingOverlay,
  type LessonGeneratingKind,
} from './LessonGeneratingOverlay';

function formatGenerationError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  return fallback;
}

interface LessonPracticeActionsProps {
  lessonId: string;
  lessonTitle?: string | null;
  labLabel?: string | null;
}

export function LessonPracticeActions({
  lessonId,
  lessonTitle,
  labLabel,
}: LessonPracticeActionsProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const quizGen = useGenerateQuiz();
  const exerciseGen = useGenerateExercise();
  const [overlay, setOverlay] = useState<LessonGeneratingKind | null>(null);
  const navTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (navTimer.current) window.clearTimeout(navTimer.current);
    },
    [],
  );

  function goTo(href: string) {
    navTimer.current = window.setTimeout(() => router.push(href), 550);
  }

  const generatingKind = overlay;
  const overlayOpen = generatingKind !== null;
  const activeGen = generatingKind === 'quiz' ? quizGen : exerciseGen;
  const pending = overlayOpen && !activeGen.isError && !activeGen.isSuccess;
  const errorMessage =
    generatingKind === 'exercise' && exerciseGen.isError
      ? formatGenerationError(exerciseGen.error, t('player.generateExerciseRetry'))
      : generatingKind === 'quiz' && quizGen.isError
        ? formatGenerationError(quizGen.error, t('player.generateQuizRetry'))
        : null;

  function startQuiz() {
    setOverlay('quiz');
    quizGen.reset();
    quizGen.mutate(lessonId, {
      onSuccess: (quiz) => goTo(`/lesson/${lessonId}/quiz/${quiz.id}`),
    });
  }

  function startExercise() {
    setOverlay('exercise');
    exerciseGen.reset();
    exerciseGen.mutate(lessonId, {
      onSuccess: (exercise) => goTo(`/lesson/${lessonId}/exercise/${exercise.id}`),
    });
  }

  function retry() {
    if (generatingKind === 'quiz') startQuiz();
    else startExercise();
  }

  return (
    <>
      <section className="mt-12 border-t border-line/70 pt-8">
        <p className="max-w-xl text-sm leading-6 text-ink/55">{t('player.finishedReading')}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <article className="flex flex-col rounded-md border border-line/80 bg-bg-elev/90 p-6 transition-colors hover:border-primary/35 hover:bg-bg-elev">
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-10 place-items-center rounded-md bg-primary-soft text-primary">
                <ClipboardList className="size-5" strokeWidth={1.75} />
              </span>
              <span className="font-heading text-xl font-medium tabular-nums tracking-[-0.04em] text-primary/55">
                01
              </span>
            </div>
            <h3 className="mt-5 font-heading text-lg font-medium tracking-[-0.02em] text-ink">
              {t('player.lessonQuiz')}
            </h3>
            <p className="mt-1.5 flex-1 text-sm leading-6 text-ink/60">{t('player.generateQuiz')}</p>
            <button
              type="button"
              className={buttonClasses({
                variant: 'outline',
                className: 'mt-6 h-11 w-full rounded-md bg-transparent px-4 text-sm font-medium',
              })}
              onClick={startQuiz}
              disabled={overlayOpen}
            >
              {t('player.takeQuiz')}
              <ArrowRight className="size-4 rtl-flip" />
            </button>
          </article>

          <article className="flex flex-col rounded-md border border-line/80 bg-bg-elev/90 p-6 transition-colors hover:border-secondary/40 hover:bg-bg-elev">
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-10 place-items-center rounded-md bg-secondary-soft text-secondary">
                <Wrench className="size-5" strokeWidth={1.75} />
              </span>
              <span className="font-heading text-xl font-medium tabular-nums tracking-[-0.04em] text-secondary/55">
                02
              </span>
            </div>
            <h3 className="mt-5 font-heading text-lg font-medium tracking-[-0.02em] text-ink">
              {t('player.handsOnPractice')}
            </h3>
            <p className="mt-1.5 flex-1 text-sm leading-6 text-ink/60">
              {labLabel
                ? t('player.generateExerciseLab', { lab: labLabel })
                : t('player.generateExercise')}
            </p>
            <button
              type="button"
              className={buttonClasses({
                className: 'mt-6 h-11 w-full rounded-md px-4 text-sm font-medium shadow-none',
              })}
              onClick={startExercise}
              disabled={overlayOpen}
            >
              {t('player.startExercise')}
              <ArrowRight className="size-4 rtl-flip" />
            </button>
          </article>
        </div>
      </section>

      <LessonGeneratingOverlay
        open={overlayOpen}
        kind={generatingKind ?? 'exercise'}
        lessonTitle={lessonTitle}
        labLabel={labLabel}
        pending={pending}
        errorMessage={errorMessage}
        onRetry={retry}
        onClose={() => {
          quizGen.reset();
          exerciseGen.reset();
          setOverlay(null);
        }}
      />
    </>
  );
}
