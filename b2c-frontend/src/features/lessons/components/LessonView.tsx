'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  Pencil,
  Trophy,
} from 'lucide-react';
import { useLesson, useStartLesson, useCompleteLesson } from '@/src/features/lessons';
import { learnerCoursePath, myCoursesPath } from '@/src/features/auth/learnerRoutes';
import { useCourseStructure } from '@/src/features/courses';
import { useUpdateInstructorLessonContent } from '@/src/features/instructor/useInstructor';
import { resolveLabForDomain } from '@/src/features/labs';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Skeleton } from '@/src/components/ui/skeleton';
import { ApiError } from '@/src/infrastructure/apiClient';
import { useTranslation } from '@/src/i18n';
import { LessonContentBody } from '@/src/features/lessons/components/LessonContentBody';
import {
  LessonContentEditor,
  type LessonContentDraft,
} from '@/src/features/lessons/components/LessonContentEditor';
import { LessonPracticeActions } from '@/src/features/lessons/components/LessonPracticeActions';

function prettyKey(key: string): string {
  return key.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function LessonView({ lessonId }: { lessonId: string }) {
  const { t } = useTranslation();
  const lessonQ = useLesson(lessonId);
  const courseId = lessonQ.data?.lesson.courseId ?? null;
  const instructorCourseId = lessonQ.data?.instructorCourseId ?? null;
  const canEditContent = Boolean(lessonQ.data?.canEditContent && instructorCourseId);
  const structureQ = useCourseStructure(courseId);
  const updateContent = useUpdateInstructorLessonContent(instructorCourseId ?? '');

  const { mutate: startLesson } = useStartLesson();
  const completeMut = useCompleteLesson();

  const [isEditing, setIsEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const startedFor = useRef<string | null>(null);
  useEffect(() => {
    const data = lessonQ.data;
    if (!data || canEditContent) return;
    const status = data.progress?.status;
    if (status === 'in_progress' || status === 'completed') return;
    if (startedFor.current === lessonId) return;
    startedFor.current = lessonId;
    startLesson(lessonId);
  }, [lessonQ.data, lessonId, startLesson, canEditContent]);

  const nav = useMemo(() => {
    const mods = structureQ.data?.modules ?? [];
    const flat = mods.flatMap((m) => m.lessons.map((l) => ({ id: l.id, title: l.title })));
    const idx = flat.findIndex((l) => l.id === lessonId);
    const currentModule = mods.find((m) => m.lessons.some((l) => l.id === lessonId));
    return {
      prev: idx > 0 ? flat[idx - 1] : null,
      next: idx >= 0 && idx < flat.length - 1 ? flat[idx + 1] : null,
      moduleTitle: currentModule?.title ?? null,
      moduleDomain: currentModule?.domain ?? null,
      position: idx >= 0 ? { n: idx + 1, total: flat.length } : null,
    };
  }, [structureQ.data, lessonId]);

  const backHref = canEditContent
    ? `/instructor/courses/${instructorCourseId}`
    : courseId
      ? learnerCoursePath(courseId)
      : myCoursesPath();

  const backLabel = canEditContent
    ? t('player.backToCourseEditor')
    : (nav.moduleTitle ?? t('player.backToCourse'));

  if (lessonQ.isLoading) {
    return (
      <Shell>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-8 h-40 w-full rounded-lg" />
        <Skeleton className="mt-6 h-96 w-full rounded-lg" />
      </Shell>
    );
  }

  if (lessonQ.isError || !lessonQ.data) {
    return (
      <Shell>
        <Link href="/my-courses" className="text-sm font-medium text-ink-2 hover:text-primary">
          <ArrowLeft className="mr-1 inline size-4" /> {t('player.allCourses')}
        </Link>
        <div className="mt-8 rounded-lg border border-line bg-bg-elev p-10 text-center">
          <h1 className="text-xl font-bold">{t('player.lessonNotFound')}</h1>
          <p className="mt-2 text-sm text-ink-2">{t('player.linkWrong')}</p>
        </div>
      </Shell>
    );
  }

  const { lesson, progress } = lessonQ.data;
  const isCompleted = progress?.status === 'completed';
  const justCompleted =
    completeMut.isSuccess && completeMut.variables === lessonId ? completeMut.data : null;
  const completeFailed = completeMut.isError && completeMut.variables === lessonId;
  const done = isCompleted || Boolean(justCompleted);
  const labMeta = nav.moduleDomain ? resolveLabForDomain(nav.moduleDomain) : null;

  function handleSaveContent(draft: LessonContentDraft) {
    if (!instructorCourseId) return;
    setEditError(null);
    updateContent.mutate(
      {
        lessonId,
        input: {
          title: draft.title.trim(),
          content: {
            summary: draft.summary.trim(),
            sections: draft.sections
              .map((section) => ({
                title: section.title.trim(),
                body: section.body.trim(),
              }))
              .filter((section) => section.title && section.body),
            keyPoints: draft.keyPoints.map((point) => point.trim()).filter(Boolean),
          },
        },
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          setEditError(null);
        },
        onError: (error) =>
          setEditError(
            error instanceof ApiError ? error.message : t('player.saveLessonError'),
          ),
      },
    );
  }

  return (
    <Shell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 transition hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          {backLabel}
        </Link>

        {canEditContent ? (
          <Button
            type="button"
            variant={isEditing ? 'soft' : 'primary'}
            className="rounded-lg"
            onClick={() => {
              setEditError(null);
              setIsEditing((value) => !value);
            }}
          >
            <Pencil className="size-4" />
            {isEditing ? t('player.preview') : t('player.editContent')}
          </Button>
        ) : null}
      </div>

      <header className="mt-6 overflow-hidden rounded-lg border border-line bg-bg-elev">
        <div className="border-b border-line bg-gradient-to-r from-primary/[0.08] via-transparent to-transparent px-6 py-5 sm:px-8">
          <div className="flex flex-wrap items-center gap-2">
            {canEditContent ? (
              <Badge variant="primary">{t('player.instructorPreview')}</Badge>
            ) : null}
            {nav.position ? (
              <Badge variant="default">
                {t('player.lessonOf', {
                  current: String(nav.position.n),
                  total: String(nav.position.total),
                })}
              </Badge>
            ) : null}
            {isCompleted ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-good">
                <CheckCircle2 className="size-4" /> {t('player.completed')}
              </span>
            ) : null}
            {labMeta ? <Badge variant="default">{labMeta.label}</Badge> : null}
          </div>

          {nav.moduleTitle ? (
            <p className="mt-4 text-sm font-medium uppercase tracking-[0.14em] text-ink-3">
              {nav.moduleTitle}
            </p>
          ) : null}

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            {lesson.title}
          </h1>
        </div>
      </header>

      {justCompleted ? (
        <div className="mt-6 rounded-lg border border-good/40 bg-good-soft p-5">
          <div className="flex items-center gap-2 font-semibold text-good">
            <CheckCircle2 className="size-5" /> {t('player.lessonComplete')}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            {justCompleted.streak ? (
              <span className="text-ink-2">
                🔥{' '}
                <span className="font-semibold text-ink">
                  {t('player.dayStreak', { count: String(justCompleted.streak.current) })}
                </span>
              </span>
            ) : null}
            <span className="text-ink-2">
              {t('player.courseProgress')}{' '}
              <span className="font-semibold text-ink">{justCompleted.course.progressPercent}%</span>
            </span>
          </div>
          {justCompleted.achievements.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                <Trophy className="size-4" /> {t('player.unlocked')}
              </span>
              {justCompleted.achievements.map((a) => (
                <Badge key={a} variant="primary">
                  {prettyKey(a)}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <article className="mt-6 rounded-lg border border-line bg-bg-elev p-6 sm:p-8">
        {isEditing && canEditContent ? (
          <LessonContentEditor
            title={lesson.title}
            content={lesson.content}
            isSaving={updateContent.isPending}
            error={editError}
            onCancel={() => {
              setEditError(null);
              setIsEditing(false);
            }}
            onSave={handleSaveContent}
          />
        ) : (
          <LessonContentBody
            content={lesson.content}
            emptyMessage={
              canEditContent ? t('player.noContentYet') : t('player.noWrittenContent')
            }
          />
        )}
      </article>

      {!isEditing ? (
        <>
          {!canEditContent ? (
            <>
              <LessonPracticeActions
                lessonId={lessonId}
                lessonTitle={lesson.title}
                labLabel={labMeta?.label}
              />

              {completeFailed ? (
                <p className="mt-6 text-sm text-bad">{t('player.saveProgressError')}</p>
              ) : null}
            </>
          ) : null}

          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
            {nav.prev ? (
              <Link href={`/lesson/${nav.prev.id}`}>
                <Button variant="ghost" size="sm" className="rounded-lg">
                  <ArrowLeft className="size-4" /> {t('player.previous')}
                </Button>
              </Link>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-3">
              {!done && !canEditContent ? (
                <Button
                  onClick={() => completeMut.mutate(lessonId)}
                  disabled={completeMut.isPending}
                  className="rounded-lg"
                >
                  {completeMut.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  {t('player.markComplete')}
                </Button>
              ) : null}
              {nav.next ? (
                <Link href={`/lesson/${nav.next.id}`}>
                  <Button variant={done ? 'primary' : 'soft'} className="rounded-lg">
                    {t('player.nextLesson')} <ArrowRight className="size-4" />
                  </Button>
                </Link>
              ) : (
                done &&
                courseId && (
                  <Link href={backHref}>
                    <Button variant="primary" className="rounded-lg">
                      {t('player.backToCourse')}
                    </Button>
                  </Link>
                )
              )}
            </div>
          </div>
        </>
      ) : null}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full bg-gradient-to-b from-primary/[0.04] via-bg to-bg">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
