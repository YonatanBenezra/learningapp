'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { buttonClasses } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { ApiError } from '@/src/infrastructure/apiClient';
import { useAuthStore } from '@/src/store/authStore';
import { useCreateCourse } from '@/src/features/courses';
import { learnerCoursePath } from '@/src/features/auth/learnerRoutes';
import { TRIAL_PERIOD_MONTHS } from '@/src/constants/pricing';
import type { LearningPathPrefill } from './learningPathRecommendation';
import { ensureMinCourseTopics } from './learningPathRecommendation';

export function CreateCourseFromRecommendation({
  prefill,
  align = 'start',
}: {
  prefill: LearningPathPrefill;
  align?: 'start' | 'end';
}) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const create = useCreateCourse();
  const [error, setError] = useState<string | null>(null);

  const alignClass = align === 'end' ? 'sm:justify-end' : '';

  if (!isAuthenticated) {
    const redirect = encodeURIComponent('/create-course?auto=1');
    return (
      <div className={cn('flex shrink-0 flex-col gap-3 sm:flex-row', alignClass)}>
        <Link
          href={`/signup?redirect=${redirect}`}
          className={buttonClasses({
            size: 'lg',
            className: 'h-11 w-full rounded-md px-5 text-sm font-medium shadow-none sm:w-auto',
          })}
        >
          Sign up free — {TRIAL_PERIOD_MONTHS} months
        </Link>
        <Link
          href={`/login?redirect=${redirect}`}
          className={buttonClasses({
            variant: 'outline',
            size: 'lg',
            className: 'h-11 w-full rounded-md bg-transparent px-5 text-sm font-medium sm:w-auto',
          })}
        >
          Log in to generate course
        </Link>
      </div>
    );
  }

  function formatCreateError(err: unknown): string {
    if (err instanceof ApiError) {
      if (err.status === 400 && err.details && typeof err.details === 'object') {
        const fieldErrors = err.details as Record<string, string[] | undefined>;
        const messages = Object.entries(fieldErrors).flatMap(([field, msgs]) =>
          (msgs ?? []).map((message) => `${field}: ${message}`),
        );
        if (messages.length > 0) return messages.join(' · ');
      }
      return err.message;
    }
    return 'Could not generate your course. Please try again.';
  }

  function generateCourse() {
    setError(null);
    create.mutate(
      {
        category: prefill.category,
        topics: ensureMinCourseTopics(prefill.topics, {
          topicLabel: prefill.topicLabel,
          skillLevel: prefill.skillLevel,
        }),
        level: prefill.courseLevel,
        visualsPreferred: true,
        dailyNotification: false,
      },
      {
        onSuccess: (data) => {
          router.push(learnerCoursePath(data.course.id));
        },
        onError: (err) => {
          setError(formatCreateError(err));
        },
      },
    );
  }

  return (
    <div className={cn('shrink-0', alignClass && `flex flex-col ${alignClass}`)}>
      <button
        type="button"
        className={buttonClasses({
          size: 'lg',
          className: 'h-11 rounded-md px-5 text-sm font-medium shadow-none',
        })}
        onClick={generateCourse}
        disabled={create.isPending}
      >
        {create.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        Generate my personalized course
      </button>
      {error && (
        <p className="mt-3 text-sm text-bad" role="alert">
          {error}{' '}
          {create.error instanceof ApiError && create.error.status === 403 && (
            <Link href="/my-courses" className="font-medium underline underline-offset-2">
              View your courses
            </Link>
          )}
        </p>
      )}
    </div>
  );
}

export default CreateCourseFromRecommendation;
