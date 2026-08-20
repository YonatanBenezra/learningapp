'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Loader2,
} from 'lucide-react';
import type { Course } from '@/src/domain/course';
import { useCourseStructure } from '@/src/features/courses';
import { learnerCourseStructurePath } from '@/src/features/auth/learnerRoutes';
import { useCompleteLesson, useLesson } from '@/src/features/lessons';
import { useGenerateExam } from '@/src/features/assessments';
import { CourseModuleSidebar } from '@/src/features/courses/components/CourseModuleSidebar';
import {
  CourseCompletionBanner,
  CourseLessonPanel,
} from '@/src/features/courses/components/CourseLessonPanel';
import { buttonClasses } from '@/src/components/ui/button';
import { Skeleton } from '@/src/components/ui/skeleton';
import { AI_CATEGORY_OPTIONS } from '@/src/constants/aiCategories';
import { cn } from '@/src/lib/utils';
import {
  useIsRtl,
  useTranslation,
  useCategoryLabel,
  useCourseLevelLabel,
} from '@/src/i18n';

interface CoursePlayerProps {
  courseId: string;
  course: Course;
}

export function CoursePlayer({ courseId, course }: CoursePlayerProps) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeLessonId = searchParams.get('lesson');

  const structureQ = useCourseStructure(courseId);
  const completeMut = useCompleteLesson();
  const examGen = useGenerateExam();
  const activeLessonQ = useLesson(activeLessonId);

  const modules = structureQ.data?.modules ?? [];
  const flatLessons = useMemo(
    () => modules.flatMap((module) => module.lessons.map((lesson) => ({ ...lesson, moduleId: module.id }))),
    [modules],
  );

  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!activeLessonId || modules.length === 0) return;
    const module = modules.find((item) => item.lessons.some((lesson) => lesson.id === activeLessonId));
    if (module) setExpandedModuleId(module.id);
  }, [activeLessonId, modules]);

  useEffect(() => {
    if (!expandedModuleId && modules.length > 0) {
      setExpandedModuleId(modules[0].id);
    }
  }, [expandedModuleId, modules]);

  const nav = useMemo(() => {
    const index = flatLessons.findIndex((lesson) => lesson.id === activeLessonId);
    const currentModule = modules.find((module) =>
      module.lessons.some((lesson) => lesson.id === activeLessonId),
    );
    return {
      prev: index > 0 ? flatLessons[index - 1] : null,
      next: index >= 0 && index < flatLessons.length - 1 ? flatLessons[index + 1] : null,
      moduleTitle: currentModule?.title ?? null,
      moduleDomain: currentModule?.domain ?? null,
      position: index >= 0 ? { n: index + 1, total: flatLessons.length } : null,
    };
  }, [activeLessonId, flatLessons, modules]);

  const justCompleted =
    completeMut.isSuccess && completeMut.variables === activeLessonId ? completeMut.data : null;

  useEffect(() => {
    if (justCompleted && activeLessonId) {
      setCompletedLessonIds((current) => new Set(current).add(activeLessonId));
    }
  }, [justCompleted, activeLessonId]);

  useEffect(() => {
    if (activeLessonQ.data?.progress?.status === 'completed' && activeLessonId) {
      setCompletedLessonIds((current) => new Set(current).add(activeLessonId));
    }
  }, [activeLessonQ.data, activeLessonId]);

  function selectLesson(lessonId: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (lessonId) params.set('lesson', lessonId);
    else params.delete('lesson');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function toggleModule(moduleId: string) {
    setExpandedModuleId((current) => (current === moduleId ? null : moduleId));
  }

  const firstLessonId = flatLessons[0]?.id ?? null;
  const lessonCompleted =
    activeLessonQ.data?.progress?.status === 'completed' ||
    Boolean(justCompleted) ||
    Boolean(activeLessonId && completedLessonIds.has(activeLessonId));

  if (structureQ.isLoading) {
    return (
      <div className="flex h-[calc(100dvh-4rem)]">
        <Skeleton className="h-full flex-1 rounded-none" shimmer />
        <Skeleton className="hidden h-full w-[360px] rounded-none lg:block" shimmer />
      </div>
    );
  }

  if (structureQ.isError) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center p-6">
        <div className="max-w-md text-center">
          <p className="text-lg font-medium text-ink">{t('player.loadStructureError')}</p>
          <button
            type="button"
            className={buttonClasses({
              variant: 'outline',
              className: 'mt-5 h-11 rounded-md bg-transparent px-5 text-sm font-medium',
            })}
            onClick={() => structureQ.refetch()}
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] max-h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-[var(--marketing-hero)]">
      {justCompleted ? (
        <div className="shrink-0">
          <CourseCompletionBanner
            streak={justCompleted.streak}
            courseProgressPercent={justCompleted.course.progressPercent}
            achievements={justCompleted.achievements}
          />
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <section className="order-2 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:order-1">
          <div className="min-h-0 flex-1 overflow-y-auto">
            {activeLessonId ? (
              <div className="min-h-full">
                <CourseLessonPanel
                  lessonId={activeLessonId}
                  moduleTitle={nav.moduleTitle}
                  moduleDomain={nav.moduleDomain}
                  position={nav.position}
                />
                <div className="mx-auto w-full max-w-4xl px-5 pb-12 sm:px-8 lg:px-10">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-8">
                    {nav.prev ? (
                      <button
                        type="button"
                        onClick={() => selectLesson(nav.prev!.id)}
                        className={buttonClasses({
                          variant: 'outline',
                          className: 'h-11 rounded-md bg-transparent px-5 text-sm font-medium',
                        })}
                      >
                        <ArrowLeft className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
                        {t('player.previous')}
                      </button>
                    ) : (
                      <span />
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      {!lessonCompleted ? (
                        <button
                          type="button"
                          onClick={() => completeMut.mutate(activeLessonId)}
                          disabled={completeMut.isPending}
                          className={buttonClasses({
                            variant: 'outline',
                            className: 'h-11 rounded-md bg-transparent px-5 text-sm font-medium',
                          })}
                        >
                          {completeMut.isPending ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Check className="size-4" />
                          )}
                          {t('player.markComplete')}
                        </button>
                      ) : null}

                      {nav.next ? (
                        <button
                          type="button"
                          onClick={() => selectLesson(nav.next!.id)}
                          className={buttonClasses({
                            className: 'h-11 rounded-md px-5 text-sm font-medium shadow-none',
                          })}
                        >
                          {t('player.nextLesson')}
                          <ArrowRight className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => selectLesson(null)}
                          className={buttonClasses({
                            variant: 'outline',
                            className: 'h-11 rounded-md bg-transparent px-5 text-sm font-medium',
                          })}
                        >
                          {t('player.backToOverview')}
                        </button>
                      )}
                    </div>
                  </div>
                  {completeMut.isError && completeMut.variables === activeLessonId ? (
                    <p className="mt-3 text-sm text-bad">{t('player.saveProgressError')}</p>
                  ) : null}
                </div>
              </div>
            ) : (
              <CourseIntroPanel
                course={course}
                moduleCount={modules.length}
                lessonCount={flatLessons.length}
                onStart={() => firstLessonId && selectLesson(firstLessonId)}
              />
            )}
          </div>
        </section>

        <div className="order-1 flex min-h-[240px] shrink-0 flex-col overflow-hidden border-b border-line/70 bg-bg-elev/40 lg:order-2 lg:h-full lg:w-[360px] lg:border-b-0 lg:border-s">
          <CourseModuleSidebar
            modules={modules}
            activeLessonId={activeLessonId}
            expandedModuleId={expandedModuleId}
            completedLessonIds={completedLessonIds}
            diagramHref={learnerCourseStructurePath(courseId)}
            examPending={examGen.isPending}
            onFinalExam={() =>
              examGen.mutate(
                { scope: 'course', scopeId: courseId },
                { onSuccess: (exam) => router.push(`/exam/${exam.id}`) },
              )
            }
            onToggleModule={toggleModule}
            onSelectLesson={selectLesson}
          />
        </div>
      </div>
    </div>
  );
}

function CourseIntroPanel({
  course,
  moduleCount,
  lessonCount,
  onStart,
}: {
  course: Course;
  moduleCount: number;
  lessonCount: number;
  onStart: () => void;
}) {
  const { t } = useTranslation();
  const categoryLabel = useCategoryLabel(course.category);
  const levelLabel = useCourseLevelLabel(course.level);
  const category = AI_CATEGORY_OPTIONS.find((option) => option.name === course.category);
  const Icon = category?.icon ?? BookOpen;

  return (
    <div className="flex min-h-full items-center justify-center px-6 py-12 sm:px-10">
      <div className="w-full max-w-lg">
        <span
          className={cn(
            'grid size-12 place-items-center rounded-md',
            category?.iconBg ?? 'bg-primary-soft',
          )}
        >
          <Icon className={cn('size-6', category?.iconColor ?? 'text-primary')} strokeWidth={1.75} />
        </span>

        <h2 className="mt-6 font-heading text-[1.85rem] font-medium leading-tight tracking-[-0.03em] text-ink sm:text-[2.15rem]">
          {course.title}
        </h2>
        <p className="mt-3 text-sm text-ink/55">
          {categoryLabel}
          <span className="mx-1.5 text-ink/20">·</span>
          {levelLabel}
          <span className="mx-1.5 text-ink/20">·</span>
          {t('player.modules')} {moduleCount}
          <span className="mx-1.5 text-ink/20">·</span>
          {t('player.lessonCount', { count: String(lessonCount) })}
        </p>

        {course.topics.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {course.topics.slice(0, 6).map((topic) => (
              <span
                key={topic}
                className="rounded-md bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary"
              >
                {topic}
              </span>
            ))}
          </div>
        ) : null}

        <p className="mt-6 text-sm leading-6 text-ink/65">{t('player.selectModuleHint')}</p>

        {lessonCount > 0 ? (
          <button
            type="button"
            onClick={onStart}
            className={buttonClasses({
              size: 'lg',
              className: 'mt-8 h-11 rounded-md px-5 text-sm font-medium shadow-none',
            })}
          >
            {t('player.startFirstLesson')}
            <ArrowRight className="size-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
