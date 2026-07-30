'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronsRight,
  Clock3,
  Hash,
  Layers3,
  Loader2,
  Share2,
  Sparkles,
} from 'lucide-react';
import type { MarketplaceCourseDetailResponse } from '@/src/domain/marketplace';
import { Container } from '@/src/components/marketing/Container';
import { Button, buttonClasses } from '@/src/components/ui/button';
import { Skeleton } from '@/src/components/ui/skeleton';
import { useAuthHydrated } from '@/src/features/auth/useAuthHydrated';
import { learnerCoursePath, marketplaceCoursePath } from '@/src/features/auth/learnerRoutes';
import { useCourse } from '@/src/features/courses';
import { useAuthStore } from '@/src/store/authStore';
import { usePurchaseMarketplaceCourse } from '@/src/features/marketplace';
import { ApiError } from '@/src/infrastructure/apiClient';
import { toast } from '@/src/lib/toast';
import { cn } from '@/src/lib/utils';

type DetailTab = 'overview' | 'curriculum';

function MarketplaceCourseDetailSkeleton() {
  return (
    <div className="bg-bg pb-16">
      <Container className="py-6 lg:py-8">
        <nav aria-hidden="true" className="flex flex-wrap items-center gap-1.5">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="size-3.5 rounded-sm" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="size-3.5 rounded-sm" />
          <Skeleton className="h-4 w-40" />
        </nav>

        <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
          <div className="min-w-0">
            <div className="rounded-lg border border-line bg-bg-elev p-5 sm:p-6">
              <Skeleton className="h-6 w-24 rounded-md" />

              <Skeleton className="mt-4 h-10 w-full max-w-2xl" />
              <Skeleton className="mt-2 h-10 w-full max-w-xl" />

              <div className="mt-5 grid gap-4 border-y border-line py-5 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                ))}
              </div>

              <div className="mt-5 overflow-hidden rounded-lg border border-line">
                <div className="flex border-b border-line">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <div key={index} className="flex min-w-[120px] flex-1 items-center justify-center gap-2 px-4 py-3.5">
                      <Skeleton className="size-4 rounded-sm" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>

                <div className="space-y-8 p-5 sm:p-6">
                  <div>
                    <Skeleton className="h-6 w-36" />
                    <Skeleton className="mt-3 h-4 w-full" />
                    <Skeleton className="mt-2 h-4 w-full" />
                    <Skeleton className="mt-2 h-4 w-5/6" />
                  </div>

                  <div>
                    <Skeleton className="h-6 w-40" />
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton key={index} className="h-12 w-full rounded-lg" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="xl:sticky xl:top-20">
            <div className="rounded-lg border border-line bg-bg-elev p-5 shadow-card sm:p-6">
              <div className="flex flex-wrap items-end gap-3">
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-6 w-16 rounded-md" />
              </div>

              <Skeleton className="mt-5 h-12 w-full rounded-lg" />

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="size-9 rounded-full" />
              </div>

              <div className="mt-6 border-t border-line pt-5">
                <Skeleton className="h-4 w-36" />
                <ul className="mt-4 divide-y divide-line">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <li key={index} className="flex items-center justify-between gap-3 py-3">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-12" />
                    </li>
                  ))}
                </ul>
              </div>

              <Skeleton className="mt-5 h-16 w-full rounded-lg" />
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
}

function formatLevel(level: string): string {
  return level.replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPrice(priceCents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(priceCents / 100);
}

function moduleLessonCount(modules: MarketplaceCourseDetailResponse['modules']): number {
  return modules.reduce((total, module) => total + module.lessons.length, 0);
}

const TABS: { id: DetailTab; label: string; icon: typeof BookOpen }[] = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'curriculum', label: 'Curriculum', icon: Layers3 },
];

function MetaItem({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-sm font-medium text-ink-3">{label}</p>
      <p className="mt-1 truncate text-base font-semibold text-ink sm:text-lg">{value}</p>
      {sub ? <p className="mt-0.5 truncate text-sm text-ink-2">{sub}</p> : null}
    </div>
  );
}

function SidebarIncludes({
  lessonTotal,
  moduleTotal,
  level,
}: {
  lessonTotal: number;
  moduleTotal: number;
  level: string;
}) {
  const items = [
    { icon: BookOpen, label: 'Lessons', value: String(lessonTotal) },
    { icon: Hash, label: 'Modules', value: String(moduleTotal) },
    { icon: Clock3, label: 'Access', value: 'Lifetime' },
    { icon: BarChart3, label: 'Skill level', value: formatLevel(level) },
    { icon: Award, label: 'Certificate', value: 'On completion' },
  ];

  return (
    <div className="mt-6 border-t border-line pt-5">
      <h3 className="text-sm font-semibold text-ink">This course includes</h3>
      <ul className="mt-4 divide-y divide-line">
        {items.map((item) => (
          <li key={item.label} className="flex items-center justify-between gap-3 py-3 text-sm">
            <span className="inline-flex items-center gap-2.5 text-ink-2">
              <item.icon className="size-4 text-ink-3" />
              {item.label}
            </span>
            <span className="font-semibold text-ink">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { MarketplaceCourseDetailSkeleton };

export function MarketplaceCourseDetailPage({
  data,
}: {
  data: MarketplaceCourseDetailResponse;
}) {
  const { course, modules } = data;
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const isInstructor = user?.role === 'instructor';
  const isCourseOwner =
    user?.email?.toLowerCase() === course.instructorEmail.toLowerCase();
  const purchase = usePurchaseMarketplaceCourse();
  const accessQ = useCourse(course.id, { enabled: hydrated && isAuthenticated });
  const hasLearnerAccess = Boolean(accessQ.data?.course);
  const accessLoading = isAuthenticated && accessQ.isLoading;
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [openModules, setOpenModules] = useState<Set<string>>(
    () => new Set(modules.slice(0, 1).map((module) => module.id)),
  );
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const lessonTotal = course.lessonCount || moduleLessonCount(modules);
  const moduleTotal = modules.length;

  function toggleModule(moduleId: string) {
    setOpenModules((current) => {
      const next = new Set(current);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }

  function handleEnroll() {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.push(`/signup?next=${encodeURIComponent(marketplaceCoursePath(course.id))}`);
      return;
    }

    setPurchaseError(null);
    purchase.mutate(course.id, {
      onSuccess: () => {
        toast.success(`Enrolled in "${course.title}". Find it in My Courses.`);
        router.push(learnerCoursePath(course.id));
      },
      onError: (error) => {
        const message =
          error instanceof ApiError ? error.message : 'Could not complete enrollment.';
        setPurchaseError(message);
        toast.error(message);
      },
    });
  }

  function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      void navigator.share({
        title: course.title,
        text: course.description,
        url: window.location.href,
      });
      return;
    }
    void navigator.clipboard?.writeText(window.location.href);
    toast.success('Course link copied to clipboard');
  }

  return (
    <div className="bg-bg pb-16">
      <Container className="py-6 lg:py-8">
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-ink-3">
          <Link href="/" className="transition hover:text-primary">
            Home
          </Link>
          <ChevronRight className="size-3.5" />
          <Link href="/courses" className="transition hover:text-primary">
            Courses
          </Link>
          <ChevronRight className="size-3.5" />
          <span className="line-clamp-1 font-medium text-ink-2">{course.title}</span>
        </nav>

        <div className="mt-6 grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
          <div className="min-w-0">
            <div className="rounded-lg border border-line bg-bg-elev p-5 shadow-card sm:p-6">
              <span className="inline-flex rounded-md bg-primary-deep px-2.5 py-1 text-sm font-semibold text-white">
                {course.category}
              </span>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                {course.title}
              </h1>

              <div className="mt-5 grid gap-4 border-y border-line py-5 sm:grid-cols-2 lg:grid-cols-3">
                <MetaItem label="Students" value={String(course.enrollmentCount)} sub="Enrolled learners" />
                <MetaItem label="Lessons" value={String(lessonTotal)} sub={`${moduleTotal} modules`} />
                <MetaItem label="Level" value={formatLevel(course.level)} sub="Recommended skill" />
              </div>

              <div className="mt-5 overflow-hidden rounded-lg border border-line">
                <div className="flex overflow-x-auto">
                  {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          'inline-flex min-w-[120px] flex-1 items-center justify-center gap-2 border-b-2 px-4 py-3.5 text-sm font-semibold transition-colors',
                          active
                            ? 'border-primary bg-primary-soft/40 text-primary'
                            : 'border-transparent text-ink-2 hover:bg-bg-soft hover:text-ink',
                        )}
                      >
                        <Icon className="size-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="p-5 sm:p-6">
                  {activeTab === 'overview' ? (
                    <div className="space-y-8">
                      <section>
                        <h2 className="text-lg font-bold text-ink">Course overview</h2>
                        <p className="mt-3 text-base leading-7 text-ink-2 sm:text-lg">
                          {course.description ||
                            'A structured learning path with AI-generated modules, lessons, and practical exercises.'}
                        </p>
                      </section>

                      {course.topics.length > 0 ? (
                        <section>
                          <h2 className="text-lg font-bold text-ink">What you&apos;ll learn</h2>
                          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                            {course.topics.map((topic) => (
                              <li
                                key={topic}
                                className="flex items-start gap-2.5 rounded-lg border border-line bg-bg-soft px-3 py-2.5 text-base leading-7 text-ink-2 sm:text-lg"
                              >
                                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-good" />
                                <span>{topic}</span>
                              </li>
                            ))}
                          </ul>
                        </section>
                      ) : null}
                    </div>
                  ) : null}

                  {activeTab === 'curriculum' ? (
                    <div>
                      <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                          <h2 className="text-lg font-bold text-ink">Course curriculum</h2>
                          <p className="mt-1 text-base text-ink-2 sm:text-lg">
                            {moduleTotal} modules · {lessonTotal} lessons
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 space-y-3">
                        {modules.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-line-2 bg-bg-soft px-4 py-8 text-center">
                            <p className="text-base font-medium text-ink sm:text-lg">Curriculum coming soon</p>
                            <p className="mt-1 text-base text-ink-2 sm:text-lg">
                              Modules and lessons will appear here once published.
                            </p>
                          </div>
                        ) : (
                        modules.map((module, index) => {
                          const open = openModules.has(module.id);
                          return (
                            <div key={module.id} className="overflow-hidden rounded-lg border border-line">
                              <button
                                type="button"
                                onClick={() => toggleModule(module.id)}
                                className="flex w-full items-center justify-between gap-4 bg-bg-soft px-4 py-4 text-left transition hover:bg-bg"
                              >
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold uppercase tracking-wide text-ink-3">
                                    Module {index + 1}
                                  </p>
                                  <p className="mt-1 font-semibold text-ink">{module.title}</p>
                                  <p className="mt-1 text-sm text-ink-2">
                                    {module.lessons.length} lesson
                                    {module.lessons.length === 1 ? '' : 's'}
                                  </p>
                                </div>
                                <ChevronDown
                                  className={cn(
                                    'size-5 shrink-0 text-ink-3 transition-transform',
                                    open && 'rotate-180',
                                  )}
                                />
                              </button>

                              {open ? (
                                <ul className="border-t border-line bg-bg-elev">
                                  {module.lessons.map((lesson, lessonIndex) => (
                                    <li
                                      key={lesson.id}
                                      className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0"
                                    >
                                      <span className="grid size-7 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                                        {lessonIndex + 1}
                                      </span>
                                      <span className="text-sm text-ink">{lesson.title}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                            </div>
                          );
                        })
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <aside className="xl:sticky xl:top-20">
            <div className="rounded-lg border border-line bg-bg-elev p-5 shadow-card sm:p-6">
              <div>
                <p className="text-3xl font-bold text-primary">
                  {formatPrice(course.priceCents, course.currency)}
                </p>
                <p className="mt-1 text-sm text-ink-2">
                  {isInstructor
                    ? isCourseOwner
                      ? 'Your published marketplace course'
                      : 'Listed for learners on AIStudy'
                    : 'One-time payment · Lifetime access'}
                </p>
              </div>

              {isInstructor ? (
                isCourseOwner ? (
                  <Link
                    href={`/instructor/courses/${course.id}`}
                    className={buttonClasses({
                      size: 'lg',
                      className: 'mt-5 h-12 w-full rounded-full text-base font-semibold',
                    })}
                  >
                    Manage this course
                    <ChevronsRight className="size-5" />
                  </Link>
                ) : (
                  <div className="mt-5 rounded-2xl border border-line bg-bg-soft p-4 text-center">
                    <p className="text-sm font-semibold text-ink">Instructor account</p>
                    <p className="mt-1 text-xs leading-5 text-ink-2">
                      Marketplace enrollment is for learners only. Create and manage your own courses
                      from the instructor dashboard.
                    </p>
                    <Link
                      href="/instructor/courses"
                      className={buttonClasses({
                        variant: 'soft',
                        size: 'md',
                        className: 'mt-4 w-full rounded-full',
                      })}
                    >
                      Go to instructor courses
                    </Link>
                  </div>
                )
              ) : hasLearnerAccess ? (
                <Link
                  href={learnerCoursePath(course.id)}
                  className={buttonClasses({
                    size: 'lg',
                    className: 'mt-5 h-12 w-full rounded-full text-base font-semibold',
                  })}
                >
                  Continue learning
                  <ChevronsRight className="size-5" />
                </Link>
              ) : (
                <Button
                  type="button"
                  className="mt-5 h-12 w-full rounded-full text-base font-semibold"
                  onClick={handleEnroll}
                  disabled={purchase.isPending || accessLoading}
                >
                  {purchase.isPending || accessLoading ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <>
                      {isAuthenticated ? 'Enroll now' : 'Sign up to enroll'}
                      <ChevronsRight className="size-5" />
                    </>
                  )}
                </Button>
              )}

                {purchaseError ? (
                  <p className="mt-3 text-sm text-bad">{purchaseError}</p>
                ) : null}

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
                  <span className="text-sm font-medium text-ink-2">Share course</span>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex size-9 items-center justify-center rounded-full border border-line text-ink-2 transition hover:border-primary hover:text-primary"
                    aria-label="Share course"
                  >
                    <Share2 className="size-4" />
                  </button>
                </div>

                <SidebarIncludes
                  lessonTotal={lessonTotal}
                  moduleTotal={moduleTotal}
                  level={course.level}
                />

                <div className="mt-5 flex items-start gap-2 rounded-lg bg-primary-soft/50 p-4 text-sm text-ink-2">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                  AI-built curriculum with quizzes, exercises, and structured lesson flow.
                </div>
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
}
