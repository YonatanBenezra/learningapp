'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Brain,
  Briefcase,
  Check,
  Cloud,
  Code2,
  DollarSign,
  Loader2,
  Network,
  Palette,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { cn } from '@/src/lib/utils';
import { formatMoney } from '@/src/domain/instructor';
import { useCreateInstructorCourse } from '@/src/features/instructor/useInstructor';

const STEPS = [
  { id: 1, label: 'Course details', hint: 'Title and description' },
  { id: 2, label: 'Curriculum focus', hint: 'Category, topics, and level' },
  { id: 3, label: 'Pricing & launch', hint: 'Set price and review' },
] as const;

const CATEGORIES: {
  name: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}[] = [
  { name: 'Programming', icon: Code2, iconBg: 'bg-primary-soft', iconColor: 'text-primary' },
  { name: 'Artificial Intelligence', icon: Brain, iconBg: 'bg-tint-lav', iconColor: 'text-[#7C3AED]' },
  { name: 'Cyber Security', icon: ShieldCheck, iconBg: 'bg-tint-mint', iconColor: 'text-good' },
  { name: 'Networking', icon: Network, iconBg: 'bg-tint-blue', iconColor: 'text-[#2563EB]' },
  { name: 'Data Science', icon: BarChart3, iconBg: 'bg-tint-peach', iconColor: 'text-secondary' },
  { name: 'Business', icon: Briefcase, iconBg: 'bg-bg-soft', iconColor: 'text-ink' },
  { name: 'Design', icon: Palette, iconBg: 'bg-tint-pink', iconColor: 'text-[#DB2777]' },
  { name: 'Cloud', icon: Cloud, iconBg: 'bg-tint-blue', iconColor: 'text-primary-deep' },
];

const LEVELS: {
  value: 'beginner' | 'intermediate' | 'advanced';
  title: string;
  desc: string;
}[] = [
  {
    value: 'beginner',
    title: 'Beginner',
    desc: 'Foundational modules for learners new to the subject.',
  },
  {
    value: 'intermediate',
    title: 'Intermediate',
    desc: 'Structured progression for learners with some experience.',
  },
  {
    value: 'advanced',
    title: 'Advanced',
    desc: 'Expert-level content with challenging scenarios.',
  },
];

function StepProgress({ step, progress }: { step: number; progress: number }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink">
            Step {step} of {STEPS.length} — {STEPS[step - 1].label}
          </p>
          <p className="mt-1 text-sm text-ink-2">{STEPS[step - 1].hint}</p>
        </div>
        <span className="text-sm font-semibold text-primary">{progress}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-line/80">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="hidden gap-4 sm:flex">
        {STEPS.map((item) => {
          const active = item.id === step;
          const done = item.id < step;
          return (
            <div key={item.id} className="flex items-center gap-2">
              <span
                className={cn(
                  'grid size-7 place-items-center rounded-full text-xs font-semibold',
                  done && 'bg-primary text-primary-ink',
                  active && !done && 'bg-primary text-primary-ink',
                  !active && !done && 'border border-line bg-bg-elev text-ink-3',
                )}
              >
                {done ? <Check className="size-3.5" strokeWidth={3} /> : item.id}
              </span>
              <span className={cn('text-sm', active || done ? 'font-medium text-ink' : 'text-ink-3')}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CreateInstructorCoursePage() {
  const router = useRouter();
  const create = useCreateInstructorCourse();

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [topics, setTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState('');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [price, setPrice] = useState('49');
  const [error, setError] = useState<string | null>(null);

  const progress = Math.round((step / STEPS.length) * 100);
  const canNextStep1 = title.trim().length > 0 && description.trim().length >= 10;
  const canNextStep2 = topics.length > 0;
  const priceCents = Math.round(Number(price) * 100);

  function addTopic() {
    const value = topicInput.trim();
    if (!value || topics.includes(value)) return;
    setTopics((current) => [...current, value]);
    setTopicInput('');
  }

  function removeTopic(value: string) {
    setTopics((current) => current.filter((topic) => topic !== value));
  }

  function onSubmit() {
    setError(null);

    if (!canNextStep1) {
      setError('Add a title and a description of at least 10 characters.');
      setStep(1);
      return;
    }
    if (!canNextStep2) {
      setError('Add at least one topic for the curriculum.');
      setStep(2);
      return;
    }
    if (!Number.isFinite(priceCents) || priceCents <= 0) {
      setError('Set a valid price greater than zero.');
      return;
    }

    create.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        category,
        topics,
        level,
        priceCents,
        currency: 'USD',
      },
      {
        onSuccess: ({ course }) => router.push(`/instructor/courses/${course.id}`),
        onError: () => setError('Could not create the course. Please try again.'),
      },
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-primary/[0.04] via-bg to-bg">
      <div className="w-full p-4 sm:p-6 lg:p-8 xl:px-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/instructor/courses"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 transition hover:text-primary"
          >
            <ArrowLeft className="size-4" />
            Back to courses
          </Link>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Marketplace course
          </p>
        </div>

        <section className="mb-6 rounded-lg border border-line bg-bg-elev p-6 sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight text-ink">Create a course to sell</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-ink-2">
            Build your marketplace listing in three steps. We generate the curriculum with AI, then
            you can publish once generation completes.
          </p>
        </section>

        <section className="rounded-lg border border-line bg-bg-elev">
          <div className="border-b border-line px-5 py-5 sm:px-6">
            <StepProgress step={step} progress={progress} />
          </div>

          <div className="px-5 py-6 sm:px-6 sm:py-8">
            {step === 1 ? (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="title" className="text-base font-semibold text-ink">
                    Course title
                  </Label>
                  <p className="mt-1 text-sm text-ink-2">
                    Choose a clear title learners will recognize in the marketplace.
                  </p>
                  <Input
                    id="title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Advanced React Patterns for Production Apps"
                    className="mt-3 rounded-lg"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-base font-semibold text-ink">
                    Course description
                  </Label>
                  <p className="mt-1 text-sm text-ink-2">
                    Explain the outcome, audience, and what makes this course valuable.
                  </p>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={5}
                    placeholder="Learners will master..."
                    className="mt-3 w-full rounded-lg border border-line-2 bg-bg px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-3 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-8">
                <div>
                  <h2 className="text-base font-semibold text-ink">Category</h2>
                  <p className="mt-1 text-sm text-ink-2">Pick the primary subject area.</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {CATEGORIES.map((item) => {
                      const selected = category === item.name;
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setCategory(item.name)}
                          className={cn(
                            'flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition',
                            selected
                              ? 'border-primary bg-primary-soft/40'
                              : 'border-line bg-bg-soft/40 hover:border-primary/30',
                          )}
                        >
                          <span
                            className={cn(
                              'grid size-10 place-items-center rounded-lg',
                              item.iconBg,
                              item.iconColor,
                            )}
                          >
                            <item.icon className="size-4" />
                          </span>
                          <span className="font-medium text-ink">{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h2 className="text-base font-semibold text-ink">Topics</h2>
                  <p className="mt-1 text-sm text-ink-2">
                    Add the concepts the AI should cover. Press Enter to add each topic.
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <Input
                      value={topicInput}
                      onChange={(event) => setTopicInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          addTopic();
                        }
                      }}
                      placeholder="Hooks, performance, testing"
                      className="rounded-lg"
                    />
                    <Button type="button" variant="soft" className="rounded-lg" onClick={addTopic}>
                      Add topic
                    </Button>
                  </div>
                  {topics.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {topics.map((topic) => (
                        <span
                          key={topic}
                          className="inline-flex items-center gap-2 rounded-lg border border-line bg-bg-soft px-3 py-1.5 text-sm text-ink"
                        >
                          {topic}
                          <button
                            type="button"
                            aria-label={`Remove ${topic}`}
                            onClick={() => removeTopic(topic)}
                            className="text-ink-3 transition hover:text-bad"
                          >
                            <X className="size-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div>
                  <h2 className="text-base font-semibold text-ink">Skill level</h2>
                  <p className="mt-1 text-sm text-ink-2">Set the difficulty for generated modules.</p>
                  <div className="mt-4 grid gap-3 lg:grid-cols-3">
                    {LEVELS.map((item) => {
                      const selected = level === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setLevel(item.value)}
                          className={cn(
                            'rounded-lg border px-4 py-4 text-left transition',
                            selected
                              ? 'border-primary bg-primary-soft/40'
                              : 'border-line bg-bg-soft/40 hover:border-primary/30',
                          )}
                        >
                          <p className="font-semibold text-ink">{item.title}</p>
                          <p className="mt-1 text-sm text-ink-2">{item.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-6">
                <div className="rounded-lg border border-line bg-bg-soft/40 p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid size-11 place-items-center rounded-lg border border-primary/20 bg-primary-soft text-primary">
                      <DollarSign className="size-5" />
                    </span>
                    <div className="flex-1">
                      <Label htmlFor="price" className="text-base font-semibold text-ink">
                        Marketplace price (USD)
                      </Label>
                      <p className="mt-1 text-sm text-ink-2">
                        You must set a price above zero before publishing.
                      </p>
                      <Input
                        id="price"
                        type="number"
                        min="1"
                        step="1"
                        value={price}
                        onChange={(event) => setPrice(event.target.value)}
                        className="mt-3 max-w-xs rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-line bg-bg-soft/40 p-5">
                  <h2 className="text-base font-semibold text-ink">Review before generating</h2>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between gap-4 border-b border-line pb-3">
                      <dt className="text-ink-2">Title</dt>
                      <dd className="text-right font-medium text-ink">{title.trim() || '—'}</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-line pb-3">
                      <dt className="text-ink-2">Category</dt>
                      <dd className="text-right font-medium text-ink">{category}</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-line pb-3">
                      <dt className="text-ink-2">Level</dt>
                      <dd className="text-right font-medium capitalize text-ink">{level}</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-b border-line pb-3">
                      <dt className="text-ink-2">Topics</dt>
                      <dd className="max-w-sm text-right font-medium text-ink">
                        {topics.join(', ')}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-2">Price</dt>
                      <dd className="text-right font-semibold text-ink">
                        {Number.isFinite(priceCents) && priceCents > 0
                          ? formatMoney(priceCents)
                          : '—'}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary-soft/30 px-4 py-4 text-sm leading-6 text-ink-2">
                  After you submit, AI will generate modules and lessons. You can edit details and
                  publish from the course management page once generation finishes.
                </div>
              </div>
            ) : null}

            {error ? (
              <p className="mt-6 rounded-lg border border-bad/20 bg-bad-soft px-4 py-3 text-sm text-bad" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-line bg-bg-soft/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            {step > 1 ? (
              <Button
                type="button"
                variant="soft"
                className="rounded-lg"
                onClick={() => {
                  setError(null);
                  setStep((current) => current - 1);
                }}
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                className="rounded-lg"
                onClick={() => router.push('/instructor/courses')}
              >
                Cancel
              </Button>
            )}

            {step < 3 ? (
              <Button
                type="button"
                className="rounded-lg bg-primary hover:bg-primary-dark sm:min-w-40"
                disabled={step === 1 ? !canNextStep1 : !canNextStep2}
                onClick={() => {
                  setError(null);
                  setStep((current) => current + 1);
                }}
              >
                Continue
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                className="rounded-lg bg-primary hover:bg-primary-dark sm:min-w-48"
                disabled={create.isPending}
                onClick={onSubmit}
              >
                {create.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                Create & generate
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default CreateInstructorCoursePage;
