'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  Cloud,
  Code2,
  Cpu,
  Database,
  Globe,
  GraduationCap,
  Loader2,
  Network,
  PenLine,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Workflow,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Switch } from '@/src/components/ui/switch';
import { ApiError } from '@/src/infrastructure/apiClient';
import { learnerCoursePath } from '@/src/features/auth/learnerRoutes';
import { useCreateCourse, useCourse, useCourses } from '@/src/features/courses';
import type { CourseLevel } from '@/src/domain/course';
import { readLearningPathPrefill, ensureMinCourseTopics } from '@/src/features/learning-path/learningPathRecommendation';
import { AiModelField } from '@/src/features/ai/AiModelField';
import { useMe } from '@/src/features/auth';
import { useAuthStore } from '@/src/store/authStore';
import { activeCourseLimitForTier, MIN_COURSE_TOPICS, topicLimitForTier } from '@/src/constants/tierLimits';
import { cn } from '@/src/lib/utils';
import {
  useTranslation,
  useIsRtl,
  useCreateCourseSteps,
  useCreateCourseLevels,
  useCreateCoursePhases,
  useCreateCourseSubjectLabel,
  useSkillLevelCopy,
  useCourseLevelLabel,
  useCategoryLabel,
} from '@/src/i18n';

const PRESET_SUBJECTS: {
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
    name: 'Machine Learning',
    icon: Cpu,
    iconBg: 'bg-tint-lav',
    iconColor: 'text-[#7C3AED]',
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
    name: 'Data Science',
    icon: BarChart3,
    iconBg: 'bg-tint-peach',
    iconColor: 'text-secondary',
  },
  {
    name: 'Artificial Intelligence',
    icon: Brain,
    iconBg: 'bg-tint-lav',
    iconColor: 'text-[#7C3AED]',
  },
  {
    name: 'Cloud Computing',
    icon: Cloud,
    iconBg: 'bg-tint-blue',
    iconColor: 'text-primary-deep',
  },
  {
    name: 'DevOps',
    icon: Workflow,
    iconBg: 'bg-tint-mint',
    iconColor: 'text-good',
  },
  {
    name: 'Web Development',
    icon: Globe,
    iconBg: 'bg-primary-soft',
    iconColor: 'text-primary',
  },
  {
    name: 'Database',
    icon: Database,
    iconBg: 'bg-tint-peach',
    iconColor: 'text-secondary',
  },
  {
    name: 'Mobile Development',
    icon: Smartphone,
    iconBg: 'bg-tint-blue',
    iconColor: 'text-[#2563EB]',
  },
];

const PRESET_SUBJECT_NAMES = new Set(PRESET_SUBJECTS.map((subject) => subject.name));

const ACTIVE_STATUSES = new Set(['generating', 'ready', 'completed']);

type WizardStep = ReturnType<typeof useCreateCourseSteps>[number];

export function CreateCourseWizard() {
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const steps = useCreateCourseSteps();
  const autoStart = searchParams.get('auto') === '1';
  const prefill = readLearningPathPrefill();
  const skillLevelCopy = useSkillLevelCopy(prefill?.skillLevel ?? 'Beginner');

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState(prefill?.category ?? '');
  const [topics, setTopics] = useState<string[]>(() => {
    if (!prefill) return [];
    return ensureMinCourseTopics(prefill.topics, {
      topicLabel: prefill.topicLabel,
      skillLevel: prefill.skillLevel,
    });
  });
  const [topicInput, setTopicInput] = useState('');
  const [level, setLevel] = useState<CourseLevel | null>(prefill?.courseLevel ?? null);
  const [visualsPreferred, setVisualsPreferred] = useState(true);
  const [dailyNotification, setDailyNotification] = useState(false);
  const [aiModel, setAiModel] = useState('');
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [autoTriggered, setAutoTriggered] = useState(false);

  const create = useCreateCourse();
  const meQ = useMe();
  const { data: coursesData } = useCourses();
  const tier = useAuthStore((s) => s.user?.tier ?? 'free');
  const activeCourseLimit = activeCourseLimitForTier(tier);
  const maxTopics = topicLimitForTier(tier);

  const activeCourseCount = useMemo(
    () => (coursesData?.courses ?? []).filter((c) => ACTIVE_STATUSES.has(c.status)).length,
    [coursesData?.courses],
  );

  const atCourseLimit = activeCourseLimit !== null && activeCourseCount >= activeCourseLimit;

  useEffect(() => {
    setAiModel(meQ.data?.user.preferences.aiModel ?? '');
  }, [meQ.data?.user.preferences.aiModel]);

  useEffect(() => {
    if (
      !autoStart ||
      autoTriggered ||
      createdId ||
      !level ||
      !category.trim() ||
      topics.length < MIN_COURSE_TOPICS
    ) {
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
        aiModel: aiModel.trim() || null,
      },
      { onSuccess: (data) => setCreatedId(data.course.id) },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto-start once when prefill is ready
  }, [autoStart, autoTriggered, createdId, level, category, topics]);

  function addTopic() {
    const t = topicInput.trim();
    if (!t || topics.includes(t)) {
      setTopicInput('');
      return;
    }
    if (maxTopics !== null && topics.length >= maxTopics) return;
    setTopics((prev) => [...prev, t]);
    setTopicInput('');
  }

  function submit() {
    if (!level || topics.length < MIN_COURSE_TOPICS) return;
    if (maxTopics !== null && topics.length > maxTopics) return;
    create.mutate(
      {
        category: category.trim(),
        topics,
        level,
        visualsPreferred,
        dailyNotification,
        aiModel: aiModel.trim() || null,
      },
      { onSuccess: (data) => setCreatedId(data.course.id) },
    );
  }

  if (createdId) {
    return (
      <CreateCoursePageShell centered>
        <GeneratingPanel id={createdId} onRetry={() => setCreatedId(null)} />
      </CreateCoursePageShell>
    );
  }

  if (autoStart && prefill && (create.isPending || autoTriggered)) {
    return (
      <CreateCoursePageShell centered>
        <StatusPanel
          title={t('subscription.creatingPersonalized')}
          description={t('subscription.autoStartDesc', {
            topic: prefill.topicLabel,
            level: skillLevelCopy.level,
          })}
          topicLabel={prefill.topicLabel}
        />
      </CreateCoursePageShell>
    );
  }

  const canNext1 =
    category.trim().length > 0 &&
    topics.length >= MIN_COURSE_TOPICS &&
    (maxTopics === null || topics.length <= maxTopics);
  const progress = Math.round((step / steps.length) * 100);
  const errorMsg = create.error instanceof ApiError ? create.error.message : null;

  return (
    <CreateCoursePageShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <Link
            href="/my-courses"
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-ink-2 transition hover:text-primary"
          >
            <ArrowLeft className={isRtl ? 'size-4 rtl-flip' : 'size-4'} /> {t('createCourse.backToCourses')}
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{t('createCourse.title')}</h1>
          <p className="mt-2 text-sm leading-7 text-ink-2 sm:text-base">{t('createCourse.subtitle')}</p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-bg-soft text-primary">
          <Sparkles className="size-5" />
        </span>
      </div>

      {prefill ? (
        <NoticeBanner tone="primary" title={t('createCourse.prefillTitle')}>
          {t('createCourse.prefillBody', {
            topic: prefill.topicLabel,
            level: skillLevelCopy.level,
          })}
        </NoticeBanner>
      ) : null}

      {atCourseLimit ? (
        <NoticeBanner tone="warn" title={t('createCourse.limitTitle')}>
          {activeCourseLimit === 1
            ? t('createCourse.limitIntroOne', { tier })
            : t('createCourse.limitIntroMany', { tier, limit: String(activeCourseLimit ?? '') })}{' '}
          <Link href="/my-courses" className="font-semibold text-primary hover:underline">
            {t('createCourse.manageCourses')}
          </Link>{' '}
          {t('createCourse.limitOr')}{' '}
          <Link href="/upgrade" className="font-semibold text-primary hover:underline">
            {t('createCourse.upgradePlan')}
          </Link>{' '}
          {t('createCourse.limitOutro')}
        </NoticeBanner>
      ) : null}

      <section className="mt-6 min-w-0 overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-card">
        <div className="border-b border-line px-5 py-4 sm:px-6">
          <div className="mb-4 flex justify-end">
            <StepTabs step={step} steps={steps} />
          </div>
          <StepProgress step={step} progress={progress} steps={steps} />
        </div>

        <div className="px-5 py-6 sm:px-6 sm:py-8">
            {step === 1 && (
              <StepSubjectTopics
                category={category}
                setCategory={setCategory}
                topics={topics}
                setTopics={setTopics}
                topicInput={topicInput}
                setTopicInput={setTopicInput}
                onAddTopic={addTopic}
                minTopics={MIN_COURSE_TOPICS}
                maxTopics={maxTopics}
                tier={tier}
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
                aiModel={aiModel}
                setAiModel={setAiModel}
                errorMsg={errorMsg}
                is403={create.error instanceof ApiError && create.error.status === 403}
              />
            )}
          </div>

        <div className="flex flex-col-reverse gap-3 border-t border-line bg-bg-soft px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          {step > 1 ? (
            <Button variant="outline" className="rounded-full px-5" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className={isRtl ? 'size-4 rtl-flip' : 'size-4'} /> {t('createCourse.back')}
            </Button>
          ) : (
            <div className="hidden sm:block" />
          )}

          {step < 3 ? (
            <Button
              disabled={step === 1 ? !canNext1 : !level}
              onClick={() => setStep((s) => s + 1)}
              className="rounded-full px-5 sm:min-w-40"
            >
              {t('createCourse.continue')} <ArrowRight className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
            </Button>
          ) : (
            <Button
              onClick={submit}
              loading={create.isPending}
              disabled={!level || atCourseLimit}
              className="rounded-full px-5 sm:min-w-48"
            >
              <Sparkles className="size-4" /> {t('createCourse.generate')}
            </Button>
          )}
        </div>
      </section>
    </CreateCoursePageShell>
  );
}

function CreateCoursePageShell({
  children,
  centered = false,
}: {
  children: React.ReactNode;
  centered?: boolean;
}) {
  return (
    <div
      className={cn(
        'w-full p-4 sm:p-6 lg:p-8 xl:px-10',
        centered && 'flex min-h-[calc(100dvh-4rem)] items-center py-8',
      )}
    >
      {children}
    </div>
  );
}

function GenerationProgressBar({ progress }: { progress: number }) {
  const { t } = useTranslation();
  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-ink-3">
        <span>{t('createCourse.genProgress')}</span>
        <span className="tabular-nums text-primary">{progress}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function GenerationHero({
  title,
  description,
  progress,
}: {
  title: string;
  description: string;
  progress?: number;
}) {
  const { t } = useTranslation();
  return (
    <div className="border-b border-line px-5 py-6 sm:px-8 sm:py-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
            <Sparkles className="size-4" />
            {t('createCourse.genBadge')}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-2 sm:text-base">{description}</p>
          {typeof progress === 'number' ? <GenerationProgressBar progress={progress} /> : null}
        </div>

        <div className="grid size-14 shrink-0 place-items-center rounded-xl border border-line bg-bg-soft sm:size-16">
          <Loader2 className="size-7 animate-spin text-primary sm:size-8" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}

function GenerationPhaseList({ activePhase }: { activePhase: number }) {
  const phases = useCreateCoursePhases();
  return (
    <ul className="divide-y divide-line border-b border-line lg:border-b-0 lg:border-r">
      {phases.map((phase, index) => {
        const done = index < activePhase;
        const active = index === activePhase;

        return (
          <li
            key={phase.label}
            className={cn(
              'flex items-start gap-3 px-5 py-4 sm:px-6',
              active && 'bg-primary/[0.04]',
            )}
          >
            <span
              className={cn(
                'mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl border',
                done && 'border-good/30 bg-good-soft text-good',
                active && 'border-primary/30 bg-primary/10 text-primary',
                !done && !active && 'border-line bg-bg-soft text-ink-3',
              )}
            >
              {done ? (
                <CheckCircle2 className="size-4" />
              ) : active ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Circle className="size-3.5" />
              )}
            </span>
            <div className="min-w-0">
              <p className={cn('text-sm font-medium', active ? 'text-ink' : 'text-ink-2')}>
                {phase.label}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-ink-3">{phase.detail}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function GenerationExpectations({
  courseTitle,
  category,
  level,
  topics,
}: {
  courseTitle?: string;
  category?: string;
  level?: string;
  topics?: string[];
}) {
  const { t } = useTranslation();
  const levelLabel = useCourseLevelLabel((level ?? 'beginner') as CourseLevel);
  const categoryLabel = useCategoryLabel(category ?? '');

  return (
    <aside className="bg-bg-soft px-5 py-6 sm:px-6 sm:py-7">
      <p className="text-sm font-medium text-ink">{t('createCourse.buildingTitle')}</p>
      <dl className="mt-4 space-y-4 text-sm">
        {courseTitle ? (
          <div>
            <dt className="text-ink-3">{t('createCourse.buildingCourse')}</dt>
            <dd className="mt-1 font-medium text-ink">{courseTitle}</dd>
          </div>
        ) : null}
        {category ? (
          <div>
            <dt className="text-ink-3">{t('createCourse.buildingSubject')}</dt>
            <dd className="mt-1 font-medium text-ink">{categoryLabel || category}</dd>
          </div>
        ) : null}
        {level ? (
          <div>
            <dt className="text-ink-3">{t('createCourse.buildingSkillLevel')}</dt>
            <dd className="mt-1 text-ink-2">{levelLabel}</dd>
          </div>
        ) : null}
        {topics && topics.length > 0 ? (
          <div>
            <dt className="text-ink-3">{t('createCourse.buildingTopics')}</dt>
            <dd className="mt-2 flex flex-wrap gap-2">
              {topics.slice(0, 4).map((topic) => (
                <span
                  key={topic}
                  className="rounded-full border border-line bg-bg-elev px-2.5 py-0.5 text-xs text-ink-2"
                >
                  {topic}
                </span>
              ))}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-ink-3">{t('createCourse.buildingEstimated')}</dt>
          <dd className="mt-1 flex items-center gap-1.5 text-ink-2">
            <Clock className="size-3.5 text-primary" />
            {t('createCourse.buildingEstimatedValue')}
          </dd>
        </div>
        <div>
          <dt className="text-ink-3">{t('createCourse.buildingIncludes')}</dt>
          <dd className="mt-2 space-y-2 text-ink-2">
            <span className="flex items-center gap-2">
              <BookOpen className="size-3.5 shrink-0 text-primary" /> {t('createCourse.buildingModules')}
            </span>
            <span className="flex items-center gap-2">
              <GraduationCap className="size-3.5 shrink-0 text-primary" /> {t('createCourse.buildingQuizzes')}
            </span>
          </dd>
        </div>
      </dl>
    </aside>
  );
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
        'mt-6 rounded-xl border px-4 py-3.5 text-sm sm:px-5',
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

function StepTabs({ step, steps }: { step: number; steps: WizardStep[] }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto rounded-full border border-line bg-bg-soft p-1">
      {steps.map((s) => {
        const active = s.id === step;
        const done = s.id < step;
        return (
          <span
            key={s.id}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition sm:text-sm',
              active && 'bg-primary-soft text-primary',
              done && !active && 'text-ink',
              !active && !done && 'text-ink-3',
            )}
          >
            <span
              className={cn(
                'grid size-5 place-items-center rounded-full text-[10px] font-semibold',
                (active || done) && 'bg-primary text-white',
                !active && !done && 'border border-line bg-bg-elev text-ink-3',
              )}
            >
              {done ? <Check className="size-3" strokeWidth={3} /> : s.id}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </span>
        );
      })}
    </div>
  );
}

function StepProgress({
  step,
  progress,
  steps,
}: {
  step: number;
  progress: number;
  steps: WizardStep[];
}) {
  const { t } = useTranslation();
  const current = steps[step - 1];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-medium text-ink">{current.label}</span>
        <span className="text-ink-3">
          {t('createCourse.stepProgress', {
            step: String(step),
            total: String(steps.length),
            progress: String(progress),
          })}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm text-ink-2">{current.hint}</p>
    </div>
  );
}

function StepHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-ink-2">{description}</p>
    </div>
  );
}

function PresetSubjectButton({
  name,
  icon: Icon,
  iconBg,
  iconColor,
  selected,
  onSelect,
}: {
  name: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const label = useCreateCourseSubjectLabel(name);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm transition-colors',
        selected ? 'border-primary bg-primary-soft/40' : 'border-line bg-bg-soft hover:border-primary/30',
      )}
    >
      <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg', iconBg)}>
        <Icon className={cn('size-4', iconColor)} />
      </span>
      <span className="font-medium text-ink">{label}</span>
    </button>
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
  minTopics,
  maxTopics,
  tier,
}: {
  category: string;
  setCategory: (v: string) => void;
  topics: string[];
  setTopics: React.Dispatch<React.SetStateAction<string[]>>;
  topicInput: string;
  setTopicInput: (v: string) => void;
  onAddTopic: () => void;
  minTopics: number;
  maxTopics: number | null;
  tier: string;
}) {
  const { t } = useTranslation();
  const [otherSelected, setOtherSelected] = useState(
    () => category.length > 0 && !PRESET_SUBJECT_NAMES.has(category),
  );

  const atTopicMax = maxTopics !== null && topics.length >= maxTopics;
  const belowTopicMin = topics.length < minTopics;
  const topicsRemaining = Math.max(0, minTopics - topics.length);

  function selectPreset(name: string) {
    setOtherSelected(false);
    setCategory(name);
  }

  function selectOther() {
    setOtherSelected(true);
    setCategory('');
  }

  return (
    <div className="space-y-8">
      <StepHeading
        title={t('createCourse.subjectTitle')}
        description={t('createCourse.subjectDesc')}
      />

      <div>
        <p className="text-sm font-medium text-ink-2">{t('createCourse.popularSubjects')}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PRESET_SUBJECTS.map(({ name, icon: Icon, iconBg, iconColor }) => (
            <PresetSubjectButton
              key={name}
              name={name}
              icon={Icon}
              iconBg={iconBg}
              iconColor={iconColor}
              selected={!otherSelected && category === name}
              onSelect={() => selectPreset(name)}
            />
          ))}

          <button
            type="button"
            onClick={selectOther}
            className={cn(
              'flex items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm transition-colors',
              otherSelected
                ? 'border-primary bg-primary-soft/40'
                : 'border-line bg-bg-soft hover:border-primary/30',
            )}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-bg-elev">
              <PenLine className="size-4 text-ink-2" />
            </span>
            <span className="font-medium text-ink">{t('createCourse.other')}</span>
          </button>
        </div>

        {otherSelected ? (
          <div className="mt-4">
            <Label htmlFor="custom-category" className="text-sm font-medium text-ink">
              {t('createCourse.customSubject')}
            </Label>
            <Input
              id="custom-category"
              placeholder={t('createCourse.customSubjectPlaceholder')}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-2"
              autoFocus
            />
            <p className="mt-2 text-sm text-ink-3">{t('createCourse.customSubjectHint')}</p>
          </div>
        ) : null}
      </div>

      <div className="border-t border-line pt-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Label htmlFor="topics" className="text-sm font-medium text-ink">
              {t('createCourse.topics')}
            </Label>
            <p className="mt-1 text-sm text-ink-2">
              {t('createCourse.topicsDesc', {
                min: String(minTopics),
                limit:
                  maxTopics !== null
                    ? t('createCourse.topicsLimit', { max: String(maxTopics), tier })
                    : '',
              })}
            </p>
          </div>
          <span
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium tabular-nums',
              belowTopicMin && 'border-warn/30 bg-warn-soft text-warn',
              !belowTopicMin && atTopicMax && 'border-primary/30 bg-primary-soft text-primary',
              !belowTopicMin && !atTopicMax && 'border-line bg-bg-soft text-ink-2',
            )}
          >
            {t('createCourse.topicsCount', {
              count: String(topics.length),
              max: maxTopics !== null ? t('createCourse.topicsMax', { max: String(maxTopics) }) : '',
            })}
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input
            id="topics"
            placeholder={t('createCourse.topicPlaceholder')}
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            disabled={atTopicMax}
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
            disabled={!topicInput.trim() || atTopicMax}
            className="rounded-full px-5 sm:min-w-24"
          >
            {t('createCourse.addTopic')}
          </Button>
        </div>

        {atTopicMax && maxTopics !== null ? (
          <p className="mt-3 text-sm text-ink-2">
            {t('createCourse.topicLimitReached', {
              max: String(maxTopics),
              tier,
            })}
          </p>
        ) : null}

        {topics.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {topics.map((topic) => (
              <span
                key={topic}
                className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-sm text-primary"
              >
                {topic}
                <button
                  type="button"
                  onClick={() => setTopics((prev) => prev.filter((x) => x !== topic))}
                  aria-label={t('createCourse.removeTopic', { topic })}
                  className="text-primary/70 hover:text-primary"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-line px-4 py-5 text-center text-sm text-ink-3">
            {t('createCourse.topicsMinEmpty', { min: String(minTopics) })}
          </p>
        )}

        {topics.length > 0 && belowTopicMin ? (
          <p className="mt-3 text-sm text-warn">
            {t('createCourse.topicsMinRemaining', {
              remaining: String(topicsRemaining),
              plural: topicsRemaining === 1 ? '' : 's',
              min: String(minTopics),
            })}
          </p>
        ) : null}
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
  const { t } = useTranslation();
  const levels = useCreateCourseLevels();

  return (
    <div>
      <StepHeading title={t('createCourse.skillTitle')} description={t('createCourse.skillDesc')} />
      <div className="grid gap-3 sm:grid-cols-3">
        {levels.map((l) => {
          const selected = level === l.value;
          return (
            <button
              key={l.value}
              type="button"
              onClick={() => setLevel(l.value)}
              className={cn(
                'flex h-full flex-col rounded-xl border p-4 text-left transition-colors',
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
                <span className="rounded-full border border-line bg-bg-elev px-2 py-0.5 text-[10px] font-medium text-ink-3">
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
  aiModel,
  setAiModel,
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
  aiModel: string;
  setAiModel: (v: string) => void;
  errorMsg: string | null;
  is403: boolean;
}) {
  const { t } = useTranslation();
  const categoryLabel = useCategoryLabel(category);
  const levelLabel = level ? useCourseLevelLabel(level) : '—';

  return (
    <div className="space-y-8">
      <StepHeading title={t('createCourse.reviewTitle')} description={t('createCourse.reviewDesc')} />

      <dl className="divide-y divide-line overflow-hidden rounded-xl border border-line text-sm">
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-[120px_1fr] sm:gap-4">
          <dt className="font-medium text-ink-3">{t('createCourse.reviewSubject')}</dt>
          <dd className="text-ink">{category ? categoryLabel : '—'}</dd>
        </div>
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-[120px_1fr] sm:gap-4">
          <dt className="font-medium text-ink-3">{t('createCourse.reviewTopics')}</dt>
          <dd>
            {topics.length ? (
              <div className="flex flex-wrap gap-2">
                {topics.map((t) => (
                  <span key={t} className="rounded-full border border-line bg-bg-soft px-2.5 py-0.5 text-xs text-ink-2">
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
          <dt className="font-medium text-ink-3">{t('createCourse.reviewSkillLevel')}</dt>
          <dd className="text-ink">{levelLabel}</dd>
        </div>
      </dl>

      <div className="space-y-3 border-t border-line pt-6">
        <p className="text-sm font-medium text-ink">{t('createCourse.preferences')}</p>
        <PreferenceCard
          title={t('createCourse.visualContent')}
          description={t('createCourse.visualContentDesc')}
          checked={visualsPreferred}
          onChange={setVisualsPreferred}
        />
        <PreferenceCard
          title={t('createCourse.dailyReminder')}
          description={t('createCourse.dailyReminderDesc')}
          checked={dailyNotification}
          onChange={setDailyNotification}
        />
        <AiModelField className="rounded-xl border border-line bg-bg-soft px-4 py-3" value={aiModel} onChange={setAiModel} compact />
      </div>

      {errorMsg ? (
        <p className="rounded-xl border border-bad/30 bg-bad-soft px-4 py-3 text-sm text-bad" role="alert">
          {errorMsg}{' '}
          {is403 ? (
            <>
              <Link href="/my-courses" className="font-semibold underline">
                {t('createCourse.viewCourses')}
              </Link>{' '}
              {t('createCourse.limitOr')}{' '}
              <Link href="/upgrade" className="font-semibold underline">
                {t('createCourse.upgradeLink')}
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
    <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-bg-soft px-4 py-3">
      <div>
        <p className="font-medium text-ink">{title}</p>
        <p className="mt-0.5 text-sm text-ink-2">{description}</p>
      </div>
      <Switch checked={checked} onChange={onChange} />
    </div>
  );
}

function StatusPanel({
  title,
  description,
  topicLabel,
}: {
  title: string;
  description: string;
  topicLabel?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-card">
      <GenerationHero title={title} description={description} />
      <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
        <GenerationPhaseList activePhase={0} />
        <GenerationExpectations courseTitle={topicLabel} category={topicLabel} />
      </div>
    </div>
  );
}

function GeneratingPanel({ id, onRetry }: { id: string; onRetry: () => void }) {
  const router = useRouter();
  const { t } = useTranslation();
  const phases = useCreateCoursePhases();
  const { data, isError, refetch } = useCourse(id);
  const status = data?.course.status;
  const course = data?.course;
  const [activePhase, setActivePhase] = useState(0);

  useEffect(() => {
    if (status === 'ready' || status === 'completed') {
      router.push(learnerCoursePath(id));
    }
  }, [status, id, router]);

  useEffect(() => {
    if (status === 'failed') return;
    const timers = [
      window.setTimeout(() => setActivePhase(1), 3500),
      window.setTimeout(() => setActivePhase(2), 7500),
      window.setTimeout(() => setActivePhase(3), 11500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [status, id]);

  const progress = Math.min(95, Math.round(((activePhase + 1) / phases.length) * 100));

  if (isError && !status) {
    return (
      <StatusCard
        tone="warn"
        title={t('createCourse.connectionInterrupted')}
        description={t('createCourse.connectionInterruptedDesc')}
        actions={
          <>
            <Button onClick={() => refetch()}>{t('common.retry')}</Button>
            <Link href="/my-courses">
              <Button variant="outline">{t('createCourse.backToCourses')}</Button>
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
        title={t('createCourse.generationFailed')}
        description={course?.failureReason ?? t('createCourse.generationFailedDefault')}
        actions={
          <>
            <Button onClick={onRetry}>{t('createCourse.tryAgain')}</Button>
            <Link href="/my-courses">
              <Button variant="outline">{t('createCourse.backToCourses')}</Button>
            </Link>
          </>
        }
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-card">
      <GenerationHero
        title={t('createCourse.generatingTitle')}
        description={
          course?.title
            ? t('createCourse.generatingDescNamed', { title: course.title })
            : t('createCourse.generatingDesc')
        }
        progress={progress}
      />

      <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
        <GenerationPhaseList activePhase={activePhase} />
        <GenerationExpectations
          courseTitle={course?.title}
          category={course?.category}
          level={course?.level}
          topics={course?.topics}
        />
      </div>
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
    <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-line bg-bg-elev px-6 py-12 text-center shadow-card sm:px-10">
      <div
        className={cn(
          'mx-auto grid size-16 place-items-center rounded-xl border',
          tone === 'warn'
            ? 'border-warn/30 bg-warn-soft text-warn'
            : 'border-bad/30 bg-bad-soft text-bad',
        )}
      >
        <X className="size-8" strokeWidth={1.8} />
      </div>
      <h2 className="mt-6 text-2xl font-bold text-ink">{title}</h2>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-ink-2">{description}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3 [&_button]:rounded-full [&_button]:px-5">{actions}</div>
    </div>
  );
}

export default CreateCourseWizard;
