'use client';

import { useEffect, useRef } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  Loader2,
  Trophy,
  Wrench,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLesson, useStartLesson } from '@/src/features/lessons';
import { useGenerateQuiz } from '@/src/features/assessments';
import { useGenerateExercise } from '@/src/features/exercises';
import { resolveLabForDomain } from '@/src/features/labs';
import type { Domain } from '@/src/domain/course';
import { LessonContentBody } from '@/src/features/lessons/components/LessonContentBody';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Skeleton } from '@/src/components/ui/skeleton';
import { ApiError } from '@/src/infrastructure/apiClient';

function formatGenerationError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  return fallback;
}

function prettyKey(key: string): string {
  return key.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface CourseLessonPanelProps {
  lessonId: string;
  moduleTitle?: string | null;
  moduleDomain?: Domain | null;
  position?: { n: number; total: number } | null;
}

export function CourseLessonPanel({
  lessonId,
  moduleTitle,
  moduleDomain,
  position,
}: CourseLessonPanelProps) {
  const router = useRouter();
  const lessonQ = useLesson(lessonId);
  const { mutate: startLesson } = useStartLesson();
  const quizGen = useGenerateQuiz();
  const exerciseGen = useGenerateExercise();
  const startedFor = useRef<string | null>(null);

  useEffect(() => {
    const data = lessonQ.data;
    if (!data) return;
    const status = data.progress?.status;
    if (status === 'in_progress' || status === 'completed') return;
    if (startedFor.current === lessonId) return;
    startedFor.current = lessonId;
    startLesson(lessonId);
  }, [lessonQ.data, lessonId, startLesson]);

  if (lessonQ.isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-4 h-10 w-2/3" />
        <Skeleton className="mt-6 h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (lessonQ.isError || !lessonQ.data) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="rounded-xl border border-line bg-bg-soft p-8 text-center">
          <p className="font-medium text-ink">Unable to load this lesson.</p>
          <p className="mt-1 text-sm text-ink-2">Select another item from the module list.</p>
        </div>
      </div>
    );
  }

  const { lesson, progress } = lessonQ.data;
  const isCompleted = progress?.status === 'completed';
  const labMeta = moduleDomain ? resolveLabForDomain(moduleDomain) : null;

  return (
    <div className="p-5 sm:p-6 lg:p-8">
      <div className="w-full">
        <div className="flex flex-wrap items-center gap-2">
          {moduleTitle ? (
            <Badge variant="outline" className="max-w-full truncate">
              {moduleTitle}
            </Badge>
          ) : null}
          {position ? (
            <Badge variant="default">
              Lesson {position.n} of {position.total}
            </Badge>
          ) : null}
          {isCompleted ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-good">
              <CheckCircle2 className="size-4" /> Completed
            </span>
          ) : null}
          {labMeta ? <Badge variant="default">{labMeta.label}</Badge> : null}
        </div>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {lesson.title}
        </h1>

        <article className="mt-8">
          <LessonContentBody content={lesson.content} />
        </article>

        <div className="mt-10 border-t border-line pt-8">
          <p className="text-sm font-medium text-ink-2">
            Finished reading? Optionally test your understanding or practice hands-on.
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-line bg-bg-soft p-4">
            <h3 className="font-semibold text-ink">Lesson quiz</h3>
            <p className="mt-1 text-sm text-ink-2">Generate an AI quiz from this lesson.</p>
            <Button
              variant="soft"
              size="sm"
              className="mt-4"
              onClick={() =>
                quizGen.mutate(lessonId, {
                  onSuccess: (quiz) => router.push(`/lesson/${lessonId}/quiz/${quiz.id}`),
                })
              }
              disabled={quizGen.isPending}
            >
              {quizGen.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ClipboardList className="size-4" />
              )}
              Take quiz
            </Button>
            {quizGen.isError ? (
              <p className="mt-2 text-xs text-bad">
                {formatGenerationError(quizGen.error, 'Could not generate quiz.')}
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-line bg-bg-soft p-4">
            <h3 className="font-semibold text-ink">Hands-on practice</h3>
            <p className="mt-1 text-sm text-ink-2">
              {labMeta
                ? `Generate an exercise in the ${labMeta.label.toLowerCase()}.`
                : 'Generate an AI exercise for this lesson.'}
            </p>
            <Button
              variant="soft"
              size="sm"
              className="mt-4"
              onClick={() =>
                exerciseGen.mutate(lessonId, {
                  onSuccess: (exercise) =>
                    router.push(`/lesson/${lessonId}/exercise/${exercise.id}`),
                })
              }
              disabled={exerciseGen.isPending}
            >
              {exerciseGen.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Wrench className="size-4" />
              )}
              Start exercise
            </Button>
            {exerciseGen.isError ? (
              <p className="mt-2 text-xs text-bad">
                {formatGenerationError(exerciseGen.error, 'Could not generate exercise.')}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CourseCompletionBanner({
  streak,
  courseProgressPercent,
  achievements,
}: {
  streak?: { current: number } | null;
  courseProgressPercent: number;
  achievements: string[];
}) {
  return (
    <div className="border-b border-good/30 bg-good-soft px-5 py-4 sm:px-6 lg:px-8">
      <div className="flex w-full flex-wrap items-center gap-x-6 gap-y-2">
        <span className="inline-flex items-center gap-2 font-semibold text-good">
          <CheckCircle2 className="size-5" /> Lesson marked complete
        </span>
        {streak ? (
          <span className="text-sm text-ink-2">
            Streak: <span className="font-semibold text-ink">{streak.current} days</span>
          </span>
        ) : null}
        <span className="text-sm text-ink-2">
          Course progress:{' '}
          <span className="font-semibold text-ink">{courseProgressPercent}%</span>
        </span>
        {achievements.length > 0 ? (
          <span className="inline-flex flex-wrap items-center gap-2 text-sm">
            <Trophy className="size-4 text-primary" />
            {achievements.map((item) => (
              <Badge key={item} variant="primary">
                {prettyKey(item)}
              </Badge>
            ))}
          </span>
        ) : null}
      </div>
    </div>
  );
}
