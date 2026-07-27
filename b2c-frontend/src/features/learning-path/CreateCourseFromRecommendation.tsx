'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { ApiError } from '@/src/infrastructure/apiClient';
import { useAuthStore } from '@/src/store/authStore';
import { useCreateCourse } from '@/src/features/courses';
import { learnerCoursePath } from '@/src/features/auth/learnerRoutes';
import { TRIAL_PERIOD_MONTHS } from '@/src/constants/pricing';
import type { LearningPathPrefill } from './learningPathRecommendation';

export function CreateCourseFromRecommendation({ prefill }: { prefill: LearningPathPrefill }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const create = useCreateCourse();
  const [error, setError] = useState<string | null>(null);

  if (!isAuthenticated) {
    const redirect = encodeURIComponent('/create-course?auto=1');
    return (
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href={`/signup?redirect=${redirect}`}>
          <Button size="lg" className="w-full bg-primary hover:bg-primary-dark sm:w-auto">
            <Sparkles className="size-4" />
            Sign up free — {TRIAL_PERIOD_MONTHS} months
          </Button>
        </Link>
        <Link href={`/login?redirect=${redirect}`}>
          <Button size="lg" variant="soft" className="w-full sm:w-auto">
            Log in to generate course
          </Button>
        </Link>
      </div>
    );
  }

  function generateCourse() {
    setError(null);
    create.mutate(
      {
        category: prefill.category,
        topics: prefill.topics,
        level: prefill.courseLevel,
        visualsPreferred: true,
        dailyNotification: false,
      },
      {
        onSuccess: (data) => {
          router.push(learnerCoursePath(data.course.id));
        },
        onError: (err) => {
          if (err instanceof ApiError) {
            setError(err.message);
            return;
          }
          setError('Could not generate your course. Please try again.');
        },
      },
    );
  }

  return (
    <div>
      <Button
        size="lg"
        className="bg-primary hover:bg-primary-dark"
        onClick={generateCourse}
        disabled={create.isPending}
      >
        {create.isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Sparkles className="size-4" />
        )}
        Generate my personalized course
      </Button>
      {error && (
        <p className="mt-3 text-sm text-bad" role="alert">
          {error}{' '}
          {create.error instanceof ApiError && create.error.status === 403 && (
            <Link href="/my-courses" className="font-semibold underline">
              View your courses
            </Link>
          )}
        </p>
      )}
    </div>
  );
}

export default CreateCourseFromRecommendation;
