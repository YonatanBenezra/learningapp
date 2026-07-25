'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Brain,
  Check,
  Cloud,
  Code2,
  Loader2,
  Network,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Switch } from '@/src/components/ui/switch';
import { ApiError } from '@/src/infrastructure/apiClient';
import { useCreateCourse, useCourse, useCourses } from '@/src/features/courses';
import type { CourseLevel } from '@/src/domain/course';
import { readLearningPathPrefill } from '@/src/features/learning-path/learningPathRecommendation';
import { useAuthStore } from '@/src/store/authStore';
import { activeCourseLimitForTier } from '@/src/constants/tierLimits';
import { cn } from '@/src/lib/utils';

const STEPS = [
  { id: 1, label: 'Subject & topics', hint: 'Define your learning focus' },
  { id: 2, label: 'Skill level', hint: 'Set course difficulty' },
  { id: 3, label: 'Review & generate', hint: 'Confirm and submit' },
] as const;

const CATEGORIES: {
  name: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}[] = [
  {
    name: 'Cybersecurity',
    icon: ShieldCheck,
    iconBg: 'bg-tint-mint',
    iconColor: 'text-good',
  },
  {
    name: 'Networking',
    icon: Network,
    iconBg: 'bg-tint-blue',
    iconColor: 'text-[#2563EB]',
  },
  {
    name: 'Programming',
    icon: Code2,
    iconBg: 'bg-primary-soft',
    iconColor: 'text-primary',
  },
  {
    name: 'Data',
    icon: BarChart3,
    iconBg: 'bg-tint-peach',
    iconColor: 'text-secondary',
  },
  {
    name: 'AI',
    icon: Brain,
    iconBg: 'bg-tint-lav',
    iconColor: 'text-[#7C3AED]',
  },
  {
    name: 'Cloud',
    icon: Cloud,
    iconBg: 'bg-tint-blue',
    iconColor: 'text-primary-deep',
  },
];

const LEVELS: { value: CourseLevel; title: string; desc: string; badge: string }[] = [
  {
    value: 'beginner',
    title: 'Beginner',
    desc: 'Foundational concepts with guided progression.',
    badge: 'Starter track',
  },
  {
    value: 'intermediate',
    title: 'Intermediate',
    desc: 'Build on existing knowledge with applied modules.',
    badge: 'Professional track',
  },
  {
    value: 'advanced',
    title: 'Advanced',
    desc: 'In-depth coverage for experienced learners.',
    badge: 'Expert track',
  },
];

const ACTIVE_STATUSES = new Set(['generating', 'ready', 'completed']);

export function CreateCourseWizard() {
  const searchParams = useSearchParams();
  const autoStart = searchParams.get('auto') === '1';
  const prefill = readLearningPathPrefill();

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState(prefill?.category ?? '');
  const [topics, setTopics] = useState<string[]>(prefill?.topics ?? []);
  const [topicInput, setTopicInput] = useState('');
  const [level, setLevel] = useState<CourseLevel | null>(prefill?.courseLevel ?? null);
  const [visualsPreferred, setVisualsPreferred] = useState(true);
  const [dailyNotification, setDailyNotification] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [autoTriggered, setAutoTriggered] = useState(false);

  const create = useCreateCourse();
  const { data: coursesData } = useCourses();
  const tier = useAuthStore((s) => s.user?.tier ?? 'free');
  const activeCourseLimit = activeCourseLimitForTier(tier);

  const activeCourseCount = useMemo(
    () => (coursesData?.courses ?? []).filter((c) => ACTIVE_STATUSES.has(c.status)).length,
    [coursesData?.courses],
  );

  const atCourseLimit = activeCourseLimit !== null && activeCourseCount >= activeCourseLimit;

  useEffect(() => {
    if (!autoStart || autoTriggered || createdId || !level || !category.trim() || topics.length === 0) {
      return;
    }
    setAutoTriggered(true);
    create.mutate(
      {
        category: category.trim(),
        topics,
        level,
        visualsPreferred,
        dailyNotification,
      },
      { onSuccess: (data) => setCreatedId(data.course.id) },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto-start once when prefill is ready
  }, [autoStart, autoTriggered, createdId, level, category, topics]);

  function addTopic() {
    const t = topicInput.trim();
    if (t && !topics.includes(t)) setTopics((prev) => [...prev, t]);
    setTopicInput('');
  }

  function submit() {
    if (!level) return;
    create.mutate(
      { category: category.trim(), topics, level, visualsPreferred, dailyNotification },
      { onSuccess: (data) => setCreatedId(data.course.id) },
    );
  }

  if (createdId) {
    return (
      <CreateCoursePageShell>
        <GeneratingPanel id={createdId} onRetry={() => setCreatedId(null)} />
      </CreateCoursePageShell>
    );
  }

  if (autoStart && prefill && (create.isPending || autoTriggered)) {
    return (
      <CreateCoursePageShell>
        <StatusPanel
          title="Creating your personalized course"
          description={`${prefill.topicLabel} · ${prefill.skillLevel} track — generating modules from your assessment results.`}
        />
      </CreateCoursePageShell>
    );
  }

  const canNext1 = category.trim().length > 0 && topics.length > 0;
  const progress = Math.round((step / STEPS.length) * 100);
  const errorMsg = create.error instanceof ApiError ? create.error.message : null;

  return (
    <CreateCoursePageShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/my-courses"
          className="inline-flex items-center gap-1.5 text-sm text-ink-2 transition hover:text-primary"
        >
          <ArrowLeft className="size-4" /> My courses
        </Link>
        <StepTabs step={step} />
      </div>

      {prefill ? (
        <NoticeBanner tone="primary" title="Based on your skill assessment">
          {prefill.topicLabel} · {prefill.skillLevel} — course details have been pre-filled. Review
          and adjust before generating.
        </NoticeBanner>
      ) : null}

      {atCourseLimit ? (
        <NoticeBanner tone="warn" title="Active course limit reached">
          Your {tier} plan allows {activeCourseLimit ?? 'unlimited'} active course
          {activeCourseLimit === 1 ? '' : 's'}.{' '}
          <Link href="/my-courses" className="font-semibold text-primary hover:underline">
            Manage existing courses
          </Link>{' '}
          or{' '}
          <Link href="/upgrade" className="font-semibold text-primary hover:underline">
            upgrade your plan
          </Link>{' '}
          to create another.
        </NoticeBanner>
      ) : null}

      <section className="mt-6 min-w-0 border border-line bg-bg-elev">
        <div className="border-b border-line px-4 py-4 sm:px-6">
          <StepProgress step={step} progress={progress} />
        </div>

        <div className="px-4 py-6 sm:px-6 sm:py-8">
            {step === 1 && (
              <StepSubjectTopics
                category={category}
                setCategory={setCategory}
                topics={topics}
                setTopics={setTopics}
                topicInput={topicInput}
                setTopicInput={setTopicInput}
                onAddTopic={addTopic}
              />
            )}

            {step === 2 && <StepSkillLevel level={level} setLevel={setLevel} />}

            {step === 3 && (
              <StepReview
                category={category}
                topics={topics}
                level={level}
                visualsPreferred={visualsPreferred}
                setVisualsPreferred={setVisualsPreferred}
                dailyNotification={dailyNotification}
                setDailyNotification={setDailyNotification}
                errorMsg={errorMsg}
                is403={create.error instanceof ApiError && create.error.status === 403}
              />
            )}
          </div>

        <div className="flex flex-col-reverse gap-3 border-t border-line bg-bg-soft px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="size-4" /> Back
            </Button>
          ) : (
            <div className="hidden sm:block" />
          )}

          {step < 3 ? (
            <Button
              disabled={step === 1 ? !canNext1 : !level}
              onClick={() => setStep((s) => s + 1)}
              className="sm:min-w-40"
            >
              Continue <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button
              onClick={submit}
              loading={create.isPending}
              disabled={!level || atCourseLimit}
              className="sm:min-w-48"
            >
              <Sparkles className="size-4" /> Generate course
            </Button>
          )}
        </div>
      </section>
    </CreateCoursePageShell>
  );
}

function CreateCoursePageShell({ children }: { children: React.ReactNode }) {
  return <div className="w-full p-4 sm:p-6 lg:p-8 xl:px-10">{children}</div>;
}

function NoticeBanner({
  tone,
  title,
  children,
}: {
  tone: 'primary' | 'warn';
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'mt-4 border px-4 py-3 text-sm sm:px-5',
        tone === 'primary'
          ? 'border-primary/20 bg-primary-soft/30 text-ink-2'
          : 'border-warn/25 bg-warn-soft text-ink-2',
      )}
    >
      <p className="font-medium text-ink">{title}</p>
      <p className="mt-1 leading-relaxed">{children}</p>
    </div>
  );
}

function StepTabs({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto">
      {STEPS.map((s, index) => {
        const active = s.id === step;
        const done = s.id < step;
        return (
          <div key={s.id} className="flex items-center">
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-2 px-3 py-1.5 text-xs font-medium sm:text-sm',
                active && 'text-primary',
                done && !active && 'text-ink',
                !active && !done && 'text-ink-3',
              )}
            >
              <span
                className={cn(
                  'grid size-6 place-items-center rounded-full text-[11px] font-semibold',
                  (active || done) && 'bg-primary text-white',
                  !active && !done && 'border border-line bg-bg-soft text-ink-3',
                )}
              >
                {done ? <Check className="size-3" strokeWidth={3} /> : s.id}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </span>
            {index < STEPS.length - 1 ? (
              <span className="mx-1 hidden h-px w-6 bg-line sm:block" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function StepProgress({ step, progress }: { step: number; progress: number }) {
  const current = STEPS[step - 1];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-medium text-ink">{current.label}</span>
        <span className="text-ink-3">
          Step {step}/{STEPS.length} · {progress}%
        </span>
      </div>
      <div className="h-1 overflow-hidden bg-line">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm text-ink-2">{current.hint}</p>
    </div>
  );
}

function StepHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6 border-b border-line pb-4">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-ink-2">{description}</p>
    </div>
  );
}

function StepSubjectTopics({
  category,
  setCategory,
  topics,
  setTopics,
  topicInput,
  setTopicInput,
  onAddTopic,
}: {
  category: string;
  setCategory: (v: string) => void;
  topics: string[];
  setTopics: React.Dispatch<React.SetStateAction<string[]>>;
  topicInput: string;
  setTopicInput: (v: string) => void;
  onAddTopic: () => void;
}) {
  return (
    <div className="space-y-8">
      <StepHeading
        title="Subject area"
        description="Select a primary subject or enter a custom category for your course."
      />

      <div>
        <Label htmlFor="category" className="text-sm font-medium text-ink">
          Subject name
        </Label>
        <Input
          id="category"
          placeholder="e.g. Cybersecurity"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="mt-2"
        />

        <p className="mt-6 text-xs font-medium uppercase tracking-widest text-ink-3">
          Popular subjects
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map(({ name, icon: Icon, iconBg, iconColor }) => {
            const selected = category === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => setCategory(name)}
                className={cn(
                  'flex items-center gap-3 border px-3 py-3 text-left text-sm transition-colors',
                  selected
                    ? 'border-primary bg-primary-soft/40'
                    : 'border-line bg-bg-soft hover:border-primary/30',
                )}
              >
                <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg', iconBg)}>
                  <Icon className={cn('size-4', iconColor)} />
                </span>
                <span className="font-medium text-ink">{name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-line pt-8">
        <Label htmlFor="topics" className="text-sm font-medium text-ink">
          Topics
        </Label>
        <p className="mt-1 text-sm text-ink-2">
          Add specific areas to cover. Press Enter after each topic.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input
            id="topics"
            placeholder="e.g. Network security fundamentals"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                onAddTopic();
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={onAddTopic}
            disabled={!topicInput.trim()}
            className="sm:min-w-24"
          >
            Add
          </Button>
        </div>

        {topics.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {topics.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-2 border border-primary/20 bg-primary-soft px-3 py-1 text-sm text-primary"
              >
                {t}
                <button
                  type="button"
                  onClick={() => setTopics((prev) => prev.filter((x) => x !== t))}
                  aria-label={`Remove ${t}`}
                  className="text-primary/70 hover:text-primary"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-4 border border-dashed border-line px-4 py-5 text-center text-sm text-ink-3">
            Add at least one topic to continue.
          </p>
        )}
      </div>
    </div>
  );
}

function StepSkillLevel({
  level,
  setLevel,
}: {
  level: CourseLevel | null;
  setLevel: (v: CourseLevel) => void;
}) {
  return (
    <div>
      <StepHeading
        title="Skill level"
        description="Choose the difficulty that best matches your current experience."
      />
      <div className="grid gap-3 sm:grid-cols-3">
        {LEVELS.map((l) => {
          const selected = level === l.value;
          return (
            <button
              key={l.value}
              type="button"
              onClick={() => setLevel(l.value)}
              className={cn(
                'flex h-full flex-col border p-4 text-left transition-colors',
                selected
                  ? 'border-primary bg-primary-soft/40'
                  : 'border-line bg-bg-soft hover:border-primary/30',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    'grid size-5 place-items-center rounded-full border',
                    selected ? 'border-primary bg-primary text-white' : 'border-line bg-bg-elev',
                  )}
                >
                  {selected ? <Check className="size-3" strokeWidth={3} /> : null}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wide text-ink-3">
                  {l.badge}
                </span>
              </div>
              <p className="mt-4 font-semibold text-ink">{l.title}</p>
              <p className="mt-2 text-sm leading-6 text-ink-2">{l.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepReview({
  category,
  topics,
  level,
  visualsPreferred,
  setVisualsPreferred,
  dailyNotification,
  setDailyNotification,
  errorMsg,
  is403,
}: {
  category: string;
  topics: string[];
  level: CourseLevel | null;
  visualsPreferred: boolean;
  setVisualsPreferred: (v: boolean) => void;
  dailyNotification: boolean;
  setDailyNotification: (v: boolean) => void;
  errorMsg: string | null;
  is403: boolean;
}) {
  return (
    <div className="space-y-8">
      <StepHeading
        title="Review configuration"
        description="Confirm your selections and adjust optional learning preferences."
      />

      <dl className="divide-y divide-line border border-line text-sm">
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-[120px_1fr] sm:gap-4">
          <dt className="font-medium text-ink-3">Subject</dt>
          <dd className="text-ink">{category || '—'}</dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-[120px_1fr] sm:gap-4">
          <dt className="font-medium text-ink-3">Topics</dt>
          <dd>
            {topics.length ? (
              <div className="flex flex-wrap gap-2">
                {topics.map((t) => (
                  <span key={t} className="border border-line bg-bg-soft px-2 py-0.5 text-xs text-ink-2">
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              '—'
            )}
          </dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-[120px_1fr] sm:gap-4">
          <dt className="font-medium text-ink-3">Skill level</dt>
          <dd className="capitalize text-ink">{level ?? '—'}</dd>
        </div>
      </dl>

      <div className="space-y-3 border-t border-line pt-6">
        <p className="text-sm font-medium text-ink">Preferences</p>
        <PreferenceCard
          title="Visual lesson content"
          description="Include diagrams and structured visuals where applicable."
          checked={visualsPreferred}
          onChange={setVisualsPreferred}
        />
        <PreferenceCard
          title="Daily learning reminder"
          description="Receive a notification to maintain your learning streak."
          checked={dailyNotification}
          onChange={setDailyNotification}
        />
      </div>

      {errorMsg ? (
        <p className="border border-bad/30 bg-bad-soft px-4 py-3 text-sm text-bad" role="alert">
          {errorMsg}{' '}
          {is403 ? (
            <>
              <Link href="/my-courses" className="font-semibold underline">
                View your courses
              </Link>{' '}
              or{' '}
              <Link href="/upgrade" className="font-semibold underline">
                upgrade
              </Link>
              .
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

function PreferenceCard({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border border-line bg-bg-soft px-4 py-3">
      <div>
        <p className="font-medium text-ink">{title}</p>
        <p className="mt-0.5 text-sm text-ink-2">{description}</p>
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  );
}

function StatusPanel({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto w-full max-w-xl border border-line bg-bg-elev px-6 py-12 text-center">
      <div className="mx-auto grid size-14 place-items-center border border-primary/20 bg-primary-soft text-primary">
        <Loader2 className="size-7 animate-spin" />
      </div>
      <h2 className="mt-6 text-xl font-semibold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">{description}</p>
    </div>
  );
}

function GeneratingPanel({ id, onRetry }: { id: string; onRetry: () => void }) {
  const router = useRouter();
  const { data, isError, refetch } = useCourse(id);
  const status = data?.course.status;

  useEffect(() => {
    if (status === 'ready' || status === 'completed') {
      router.push(`/courses/${id}`);
    }
  }, [status, id, router]);

  if (isError && !status) {
    return (
      <StatusCard
        tone="warn"
        title="Connection interrupted"
        description="We could not verify the course generation status. Your course may still be processing."
        actions={
          <>
            <Button onClick={() => refetch()}>Retry</Button>
            <Link href="/my-courses">
              <Button variant="outline">My courses</Button>
            </Link>
          </>
        }
      />
    );
  }

  if (status === 'failed') {
    return (
      <StatusCard
        tone="bad"
        title="Generation failed"
        description={
          data?.course.failureReason ?? 'Something went wrong while building your course.'
        }
        actions={
          <>
            <Button onClick={onRetry}>Try again</Button>
            <Link href="/my-courses">
              <Button variant="outline">My courses</Button>
            </Link>
          </>
        }
      />
    );
  }

  const phases = [
    'Structuring modules',
    'Writing lesson content',
    'Preparing quizzes and assessments',
  ];

  return (
    <div className="mx-auto w-full max-w-xl border border-line bg-bg-elev">
      <div className="border-b border-line px-6 py-10 text-center">
        <div className="mx-auto grid size-14 place-items-center border border-primary/20 bg-primary-soft text-primary">
          <Loader2 className="size-7 animate-spin" />
        </div>
        <h2 className="mt-6 text-xl font-semibold text-ink">Generating your course</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">
          AIStudy is building modules, lessons, quizzes, and exams. This typically takes 10–15
          seconds.
        </p>
      </div>
      <ul className="divide-y divide-line">
        {phases.map((label) => (
          <li key={label} className="flex items-center gap-3 px-6 py-3 text-sm text-ink-2">
            <Loader2 className="size-4 animate-spin text-primary" />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusCard({
  tone,
  title,
  description,
  actions,
}: {
  tone: 'warn' | 'bad';
  title: string;
  description: string;
  actions: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-xl border border-line bg-bg-elev px-6 py-12 text-center">
      <div
        className={cn(
          'mx-auto grid size-14 place-items-center border',
          tone === 'warn'
            ? 'border-warn/30 bg-warn-soft text-warn'
            : 'border-bad/30 bg-bad-soft text-bad',
        )}
      >
        <X className="size-7" />
      </div>
      <h2 className="mt-6 text-xl font-semibold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">{description}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">{actions}</div>
    </div>
  );
}

export default CreateCourseWizard;
