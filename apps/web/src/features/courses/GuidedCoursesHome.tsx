'use client';

import { useEffect, useState } from 'react';
import { ApiError } from '@/src/infrastructure/apiClient';
import { Spinner } from '@/src/components/ui/spinner';
import { cn } from '@/src/lib/utils';
import { platformContainerClass } from '@/src/features/platform/platformLayout';
import { fetchCuratedCourses, type CuratedCoursePublic } from './curatedCoursesApi';
import { GuidedCourseCard } from './components/GuidedCourseCard';

export function GuidedCoursesHome() {
  const [courses, setCourses] = useState<CuratedCoursePublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchCuratedCourses()
      .then(setCourses)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load guided courses.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  return (
    <div className={cn(platformContainerClass, 'flex-1 py-6')}>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-ink">Guided Courses</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-2">
          Structured learning paths with readings, hands-on simulations, and knowledge checks — no
          enrollment required.
        </p>
      </div>

      {error ? <p className="mb-4 text-sm text-bad">{error}</p> : null}

      {courses.length === 0 ? (
        <div className="rounded-2xl border border-line bg-bg-elev px-6 py-12 text-center">
          <p className="text-sm text-ink-2">No guided courses are available yet. Check back soon.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {courses.map((course) => (
            <GuidedCourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
