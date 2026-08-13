'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useTranslation } from '@/src/i18n';
import { Button } from '@/src/components/ui/button';
import { Spinner } from '@/src/components/ui/spinner';
import { formatMoney } from '@/src/domain/instructor';
import { CourseGenerationFlowPanel } from '@/src/features/instructor/CourseGenerationFlowPanel';
import {
  useInstructorCourse,
  usePublishInstructorCourse,
  useUnpublishInstructorCourse,
  useUpdateInstructorCourse,
} from '@/src/features/instructor/useInstructor';

export function InstructorCourseDetailPage({ courseId }: { courseId: string }) {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useInstructorCourse(courseId);
  const update = useUpdateInstructorCourse(courseId);
  const publish = usePublishInstructorCourse(courseId);
  const unpublish = useUnpublishInstructorCourse(courseId);

  const course = data?.course;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!course) return;
    setTitle(course.title);
    setDescription(course.description);
    setPrice(String(course.priceCents / 100));
  }, [course]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="rounded-lg border border-line bg-bg-elev p-10 text-center">
        <p className="font-semibold text-ink">{t('instructor.courseNotFound')}</p>
        <Link href="/instructor/courses" className="mt-4 inline-block text-primary hover:underline">
          {t('instructor.backToCourses')}
        </Link>
      </div>
    );
  }

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!course) return;
    setError(null);
    setMessage(null);
    const priceCents = Math.round(Number(price) * 100);
    if (!Number.isFinite(priceCents) || priceCents < 0) {
      setError('Enter a valid price.');
      return;
    }
    update.mutate(
      { title: title.trim(), description: description.trim(), priceCents },
      {
        onSuccess: () => setMessage('Course updated.'),
        onError: () => setError(t('instructor.saveChangesError')),
      },
    );
  }

  function onPublishToggle() {
    if (!course) return;
    setError(null);
    setMessage(null);
    const action = course.isPublished ? unpublish : publish;
    action.mutate(undefined, {
      onSuccess: () =>
        setMessage(course.isPublished ? 'Course unpublished.' : 'Course published for sale.'),
      onError: (err) =>
        setError(err instanceof Error ? err.message : t('instructor.publishStatusError')),
    });
  }

  const busy = update.isPending || publish.isPending || unpublish.isPending;
  const showFlow = course.status === 'generating' || course.status === 'ready';

  return (
    <div className="min-h-full bg-gradient-to-b from-primary/[0.04] via-bg to-bg">
      <div className="w-full space-y-6 p-4 sm:p-6 lg:p-8">
        <Link
          href="/instructor/courses"
          className="inline-flex items-center gap-2 text-sm font-medium text-ink-2 hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Back to courses
        </Link>

        <div className="rounded-lg border border-line bg-bg-elev p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">
                {course.category} · {course.level}
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink">{course.title}</h2>
              <p className="mt-2 text-sm text-ink-2">
                Status:{' '}
                <span className="font-medium text-ink">
                  {course.status === 'generating'
                    ? 'Generating content…'
                    : course.isPublished
                      ? 'Published'
                      : course.status}
                </span>
              </p>
            </div>
            <div className="text-right text-sm text-ink-2">
              <p>
                Sales: <strong className="text-ink">{course.enrollmentCount}</strong>
              </p>
              <p>
                Revenue:{' '}
                <strong className="text-ink">
                  {formatMoney(course.revenueCents, course.currency)}
                </strong>
              </p>
            </div>
          </div>

          {course.status === 'failed' ? (
            <div className="mt-6 rounded-lg border border-bad/30 bg-bad-soft px-4 py-3 text-sm text-bad">
              {course.failureReason ?? 'Generation failed. Update details and create a new course.'}
            </div>
          ) : null}
        </div>

        {showFlow ? (
          <CourseGenerationFlowPanel
            courseId={courseId}
            courseTitle={course.title}
            isGenerating={course.status === 'generating'}
          />
        ) : null}

        <form onSubmit={onSave} className="space-y-5 rounded-lg border border-line bg-bg-elev p-6">
          <h3 className="text-lg font-semibold text-ink">Course details</h3>

          <div>
            <label htmlFor="title" className="mb-2 block text-sm font-medium text-ink">
              Title
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 w-full rounded-lg border border-line px-4 text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-2 block text-sm font-medium text-ink">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-line px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="price" className="mb-2 block text-sm font-medium text-ink">
              Price (USD)
            </label>
            <input
              id="price"
              type="number"
              min="1"
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="h-11 w-full max-w-xs rounded-lg border border-line px-4 text-sm outline-none focus:border-primary"
            />
          </div>

          {message ? (
            <p className="rounded-lg border border-good/30 bg-good-soft px-4 py-3 text-sm text-good">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="rounded-lg border border-bad/30 bg-bad-soft px-4 py-3 text-sm text-bad">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={busy} variant="soft" className="rounded-lg">
              {update.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {t('instructor.saveChanges')}
            </Button>
            <Button
              type="button"
              disabled={busy || course.status !== 'ready'}
              className="rounded-lg bg-primary"
              onClick={onPublishToggle}
            >
              {publish.isPending || unpublish.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : null}
              {course.isPublished ? 'Unpublish' : 'Publish for sale'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => refetch()}>
              Refresh
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InstructorCourseDetailPage;
