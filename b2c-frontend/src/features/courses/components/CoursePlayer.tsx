'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  GraduationCap,
  Loader2,
  Network,
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
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Progress } from '@/src/components/ui/progress';
import { Skeleton } from '@/src/components/ui/skeleton';

interface CoursePlayerProps {
  courseId: string;
  course: Course;
}

export function CoursePlayer({ courseId, course }: CoursePlayerProps) {
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
      <div className="flex min-h-[calc(100dvh-4rem)] flex-col">
        <Skeleton className="h-16 w-full rounded-none" />
        <div className="flex flex-1">
          <Skeleton className="flex-1 rounded-none" />
          <Skeleton className="hidden w-[360px] rounded-none lg:block" />
        </div>
      </div>
    );
  }

  if (structureQ.isError) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center p-6">
        <div className="rounded-xl border border-line bg-bg-elev p-8 text-center shadow-soft">
          <p className="text-ink-2">Unable to load course structure.</p>
          <Button variant="soft" className="mt-4" onClick={() => structureQ.refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] max-h-[calc(100dvh-4rem)] flex-col overflow-hidden">
      <header className="shrink-0 border-b border-line bg-bg-elev px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Link
              href="/my-courses"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 transition hover:text-primary"
            >
              <ArrowLeft className="size-4" /> Back to course list
            </Link>
            <nav className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-ink-3 sm:text-sm">
              <Link href="/dashboard" className="transition hover:text-primary">
                <span className="text-primary">AI</span>
                <span className="text-ink">Study</span>
              </Link>
              <ChevronRight className="size-3.5" />
              <Link href="/my-courses" className="transition hover:text-primary">
                My Courses
              </Link>
              <ChevronRight className="size-3.5" />
              <span className="line-clamp-1 font-medium text-ink">{course.title}</span>
            </nav>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-ink sm:text-xl">{course.title}</h1>
              <Badge variant="outline" className="capitalize">
                {course.level}
              </Badge>
            </div>
          </div>

          <div className="w-full max-w-xs">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-semibold uppercase tracking-[0.08em] text-ink-3">
                Progress
              </span>
              <span className="font-semibold tabular-nums text-ink">
                {justCompleted?.course.progressPercent ?? course.progressPercent}%
              </span>
            </div>
            <Progress value={justCompleted?.course.progressPercent ?? course.progressPercent} />
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={learnerCourseStructurePath(courseId)}>
                <Button variant="soft" size="sm">
                  <Network className="size-4" /> Diagram
                </Button>
              </Link>
              <Button
                variant="soft"
                size="sm"
                onClick={() =>
                  examGen.mutate(
                    { scope: 'course', scopeId: courseId },
                    { onSuccess: (exam) => router.push(`/exam/${exam.id}`) },
                  )
                }
                disabled={examGen.isPending}
              >
                {examGen.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <GraduationCap className="size-4" />
                )}
                Final exam
              </Button>
            </div>
          </div>
        </div>
      </header>

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
        <section className="order-2 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-line lg:order-1 lg:border-r">
          <div className="min-h-0 flex-1 overflow-y-auto">
            {activeLessonId ? (
              <CourseLessonPanel
                lessonId={activeLessonId}
                moduleTitle={nav.moduleTitle}
                moduleDomain={nav.moduleDomain}
                position={nav.position}
              />
            ) : (
              <CourseIntroPanel
                course={course}
                lessonCount={flatLessons.length}
                onStart={() => firstLessonId && selectLesson(firstLessonId)}
              />
            )}
          </div>

          <footer className="shrink-0 border-t border-line bg-bg-elev px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex w-full flex-wrap items-center justify-between gap-3">
              <div>
                {nav.prev ? (
                  <Button variant="ghost" size="sm" onClick={() => selectLesson(nav.prev!.id)}>
                    <ArrowLeft className="size-4" /> Previous
                  </Button>
                ) : (
                  <span />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {activeLessonId && !lessonCompleted ? (
                  <Button
                    onClick={() => completeMut.mutate(activeLessonId)}
                    disabled={completeMut.isPending}
                  >
                    {completeMut.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Check className="size-4" />
                    )}
                    Mark as complete
                  </Button>
                ) : null}

                {!activeLessonId && firstLessonId ? (
                  <Button onClick={() => selectLesson(firstLessonId)}>Start first lesson</Button>
                ) : null}

                {nav.next ? (
                  <Button
                    variant={lessonCompleted ? 'primary' : 'soft'}
                    onClick={() => selectLesson(nav.next!.id)}
                  >
                    Next lesson
                    <ArrowRight className="size-4" />
                  </Button>
                ) : lessonCompleted && !nav.next ? (
                  <Button variant="soft" onClick={() => selectLesson(null)}>
                    Back to overview
                  </Button>
                ) : null}
              </div>
            </div>

            {completeMut.isError && completeMut.variables === activeLessonId ? (
              <p className="mt-3 w-full text-sm text-bad">
                Could not save progress. Please try again.
              </p>
            ) : null}
          </footer>
        </section>

        <div className="order-1 flex min-h-[280px] shrink-0 flex-col overflow-hidden lg:order-2 lg:h-full lg:w-[360px]">
          <CourseModuleSidebar
            modules={modules}
            activeLessonId={activeLessonId}
            expandedModuleId={expandedModuleId}
            completedLessonIds={completedLessonIds}
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
  lessonCount,
  onStart,
}: {
  course: Course;
  lessonCount: number;
  onStart: () => void;
}) {
  return (
    <div className="flex items-center justify-center p-6 sm:p-8">
      <div className="max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
          Course overview
        </p>
        <h2 className="mt-3 text-2xl font-bold text-ink">{course.title}</h2>
        <p className="mt-2 text-sm text-ink-2">{course.category}</p>
        {course.topics.length > 0 ? (
          <p className="mt-4 text-sm leading-6 text-ink-3">{course.topics.join(' · ')}</p>
        ) : null}
        <p className="mt-6 text-sm text-ink-2">
          Select a module on the right, then choose a lesson to begin. Your content will appear
          here.
        </p>
        {lessonCount > 0 ? (
          <Button className="mt-6" onClick={onStart}>
            Start first lesson
          </Button>
        ) : null}
      </div>
    </div>
  );
}
