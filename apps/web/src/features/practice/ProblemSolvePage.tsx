'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { FREE_PROBLEM_LIMIT } from '@aieng/shared';
import { ApiError } from '@/src/infrastructure/apiClient';
import { useAuthStore } from '@/src/store/authStore';
import { Spinner } from '@/src/components/ui/spinner';
import { buttonClasses } from '@/src/components/ui/button';
import { platformContainerClass } from '@/src/features/platform/platformLayout';
import { cn } from '@/src/lib/utils';
import { ProblemView } from './ProblemView';
import { LoginGateModal } from './LoginGateModal';
import { RequireAssessmentComplete } from '@/src/features/auth/guards';
import {
  getOrCreateGuestBundle,
  guestCompletedCount,
  readGuestBundle,
  recordGuestSubmission,
} from './guestStorage';
import {
  fetchNextProblem,
  fetchProblem,
  getGuestSessionId,
  submitProblem,
  type ProblemPublic,
  type SubmitResult,
} from './practiceApi';

export function ProblemSolvePage({ slug }: { slug: string }) {
  return (
    <RequireAssessmentComplete>
      <ProblemSolveContent slug={slug} />
    </RequireAssessmentComplete>
  );
}

function ProblemSolveContent({ slug }: { slug: string }) {
  const router = useRouter();
  const sessionReady = useAuthStore((s) => s.sessionReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  const [problem, setProblem] = useState<ProblemPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gateOpen, setGateOpen] = useState(false);

  const loadProblem = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      getOrCreateGuestBundle();
      const data = await fetchProblem(slug);
      setProblem(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load problem.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!sessionReady) return;
    void loadProblem();
  }, [sessionReady, loadProblem]);

  async function handleSubmit(answer: string) {
    if (!problem) return;
    setSubmitting(true);
    setError(null);
    const bundle = getOrCreateGuestBundle();
    const completedCount = bundle.completedCount;

    try {
      const graded = await submitProblem(problem.slug, {
        guestSessionId: getGuestSessionId(),
        answer,
        completedCount,
        clientSubmissionId: crypto.randomUUID(),
      });
      setResult(graded);
      recordGuestSubmission({
        problemSlug: problem.slug,
        topic: problem.topic,
        difficulty: problem.difficulty,
        type: problem.type,
        answer,
        score: graded.score,
        correct: graded.correct,
        feedback: graded.feedback,
        submissionId: graded.submissionId,
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setGateOpen(true);
        return;
      }
      setError(err instanceof ApiError ? err.message : 'Submit failed.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNext() {
    const completed = guestCompletedCount();
    if (!isAuthenticated && completed >= FREE_PROBLEM_LIMIT) {
      setGateOpen(true);
      return;
    }
    const bundle = readGuestBundle();
    const next = await fetchNextProblem(bundle?.completedSlugs ?? []);
    if (next) {
      router.push(`/problems/${next.slug}`);
      return;
    }
    router.push('/problems');
  }

  if (!sessionReady || loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-20">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

  if (error && !problem) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <p className="text-ink-2">{error}</p>
        <Link href="/problems" className={buttonClasses({ variant: 'soft', className: 'mt-4 inline-flex' })}>
          Back to problems
        </Link>
      </div>
    );
  }

  if (!problem) return null;

  const nextBlocked = !isAuthenticated && guestCompletedCount() >= FREE_PROBLEM_LIMIT;

  return (
    <>
      <div className="border-b border-line/70 bg-bg-elev/80 backdrop-blur-sm dark:border-line-2">
        <div className={cn(platformContainerClass, 'flex items-center justify-between gap-4 py-3')}>
          <Link
            href="/problems"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-4" />
            Problems
          </Link>
          <p className="hidden truncate text-xs text-ink-3 sm:block">{problem.slug}</p>
        </div>
      </div>
      <div className={cn(platformContainerClass, 'flex-1 py-6 sm:py-8 lg:py-10')}>
        {error ? (
          <p className="mb-4 rounded-xl border border-bad/30 bg-bad-soft/40 px-4 py-3 text-sm text-bad">
            {error}
          </p>
        ) : null}
        <ProblemView
          key={problem.slug}
          problem={problem}
          submitting={submitting}
          onSubmit={handleSubmit}
          result={result}
          onNext={handleNext}
          nextBlocked={nextBlocked}
        />
      </div>
      <LoginGateModal open={gateOpen} onClose={() => setGateOpen(false)} />
    </>
  );
}

/** Random next unsolved problem (legacy /practice route). */
export function PracticePage() {
  return (
    <RequireAssessmentComplete>
      <PracticeRedirect />
    </RequireAssessmentComplete>
  );
}

function PracticeRedirect() {
  const router = useRouter();
  const sessionReady = useAuthStore((s) => s.sessionReady);

  useEffect(() => {
    if (!sessionReady) return;
    getOrCreateGuestBundle();
    const bundle = readGuestBundle();
    void fetchNextProblem(bundle?.completedSlugs ?? []).then((next) => {
      router.replace(next ? `/problems/${next.slug}` : '/problems');
    });
  }, [sessionReady, router]);

  return (
    <div className="flex flex-1 items-center justify-center py-20">
      <Spinner className="size-8 text-primary" />
    </div>
  );
}
