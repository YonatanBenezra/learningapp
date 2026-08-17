'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { ArrowLeft, Check, Loader2, X } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { buttonClasses } from '@/src/components/ui/button';
import type { Course } from '@/src/domain/course';
import { useCourseStructure } from '@/src/features/courses';
import { countStructureItems } from '@/src/features/courses/courseFlowLayout';
import {
  useTranslation,
  useIsRtl,
  useCreateCoursePhases,
  useCategoryLabel,
  useCourseLevelLabel,
} from '@/src/i18n';

const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;

export function CourseGeneratingPanel({ course }: { course: Course }) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const reduceMotion = useReducedMotion();
  const phases = useCreateCoursePhases();
  const categoryLabel = useCategoryLabel(course.category);
  const levelLabel = useCourseLevelLabel(course.level);
  const [activePhase, setActivePhase] = useState(0);
  const structureQ = useCourseStructure(course.id, { pollWhileGenerating: true });
  const modules = structureQ.data?.modules ?? [];
  const counts = countStructureItems(modules);

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setActivePhase(1), 3200),
      window.setTimeout(() => setActivePhase(2), 7200),
      window.setTimeout(() => setActivePhase(3), 11800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [course.id]);

  const progress = useMemo(() => {
    const fromStructure = Math.min(88, counts.moduleCount * 16 + counts.lessonCount * 4);
    const fromPhase = Math.round(((activePhase + 1) / phases.length) * 72);
    return Math.min(95, Math.max(14, fromStructure, fromPhase));
  }, [activePhase, counts.lessonCount, counts.moduleCount, phases.length]);

  const currentPhase = phases[activePhase] ?? phases[0];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center">
      <Link
        href="/my-courses"
        className="inline-flex self-start items-center gap-2 text-sm font-medium text-ink/55 transition-colors hover:text-ink"
      >
        <ArrowLeft className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
        {t('player.backToCourseList')}
      </Link>

      <div className="relative mt-10">
        {!reduceMotion ? (
          <>
            <span className="absolute inset-[-18%] rounded-full border border-primary/20 animate-live-pulse-ring" />
            <span className="absolute inset-[-18%] rounded-full border border-primary/15 animate-live-pulse-ring-delay-1" />
            <span
              className="pointer-events-none absolute inset-[-6px] animate-[spin_10s_linear_infinite]"
              aria-hidden
            >
              <span className="absolute left-1/2 top-0 size-1.5 -translate-x-1/2 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]" />
            </span>
          </>
        ) : null}

        <svg viewBox="0 0 128 128" className="size-[148px] -rotate-90 sm:size-[168px]">
          <circle
            cx="64"
            cy="64"
            r={RING_R}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-primary/15"
          />
          <motion.circle
            cx="64"
            cy="64"
            r={RING_R}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            className="text-primary"
            strokeDasharray={RING_C}
            initial={false}
            animate={{ strokeDashoffset: RING_C * (1 - progress / 100) }}
            transition={{ duration: reduceMotion ? 0 : 0.85, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <AnimatedPercent value={progress} />
        </div>
      </div>

      <h1 className="mt-8 text-center font-heading text-[1.85rem] font-medium leading-tight tracking-[-0.03em] text-ink sm:text-[2.15rem]">
        {t('createCourse.generatingTitle')}
      </h1>
      <p className="mt-2 text-center text-sm font-medium text-ink/70">{course.title}</p>
      <p className="mt-1 text-center text-sm text-ink/45">
        {categoryLabel || course.category}
        <span className="mx-1.5 text-ink/20">·</span>
        {levelLabel}
      </p>

      <div className="mt-4 h-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentPhase.label}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
            className="text-center text-sm text-ink/55"
          >
            {currentPhase.label}
          </motion.p>
        </AnimatePresence>
      </div>

      <ol className="mt-8 flex w-full max-w-2xl items-start">
        {phases.map((phase, index) => {
          const done = index < activePhase;
          const active = index === activePhase;
          return (
            <li key={phase.label} className="flex flex-1 items-center">
              <div className="flex min-w-0 flex-col items-center">
                <span
                  className={cn(
                    'relative grid size-8 place-items-center rounded-full border text-[11px] font-medium tabular-nums transition-colors duration-500',
                    done && 'border-primary bg-primary text-primary-ink',
                    active && 'border-primary bg-primary-soft text-primary',
                    !done && !active && 'border-line/80 text-ink/35',
                  )}
                >
                  {active && !reduceMotion ? (
                    <span className="absolute inset-0 rounded-full border border-primary/40 animate-live-pulse-ring" />
                  ) : null}
                  {done ? <Check className="size-3.5" strokeWidth={2.6} /> : String(index + 1)}
                </span>
                <span
                  className={cn(
                    'mt-2 hidden max-w-[7rem] text-center text-[11px] leading-4 sm:block',
                    active || done ? 'font-medium text-ink/70' : 'text-ink/35',
                  )}
                >
                  {phase.label}
                </span>
              </div>
              {index < phases.length - 1 ? (
                <span className="mb-6 mx-1.5 h-px min-w-[12px] flex-1 overflow-hidden bg-line/70 sm:mb-8">
                  <motion.span
                    className="block h-full origin-left bg-primary rtl:origin-right"
                    initial={false}
                    animate={{ scaleX: done ? 1 : 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className="mt-10 w-full">
        <div className="mb-3 flex items-center justify-between text-xs font-medium text-ink/45">
          <span>{t('createCourse.buildingTitle')}</span>
          <span className="tabular-nums">
            {counts.moduleCount > 0
              ? `${counts.moduleCount} · ${counts.lessonCount}`
              : t('createCourse.buildingEstimatedValue')}
          </span>
        </div>

        <ul className="space-y-2">
          <AnimatePresence initial={false}>
            {modules.map((module, index) => (
              <motion.li
                key={module.id}
                layout
                initial={reduceMotion ? false : { opacity: 0, y: 12, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-4 rounded-md border border-line/70 bg-bg-elev/40 px-4 py-3"
              >
                <span className="font-heading text-lg font-medium tabular-nums text-primary/80">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{module.title}</span>
                <span className="text-xs tabular-nums text-ink/40">{module.lessons.length}</span>
              </motion.li>
            ))}
          </AnimatePresence>

          <li className="flex items-center gap-4 rounded-md border border-dashed border-primary/30 bg-primary/[0.04] px-4 py-3">
            <span className="grid size-7 place-items-center">
              <Loader2 className="size-4 animate-spin text-primary" />
            </span>
            <span className="flex-1 text-sm text-ink/60">{currentPhase.detail}</span>
            <TypingDots />
          </li>
        </ul>
      </div>
    </div>
  );
}

function AnimatedPercent({ value }: { value: number }) {
  const spring = useSpring(value, { stiffness: 90, damping: 20, mass: 0.6 });
  const label = useTransform(spring, (latest) => `${Math.round(latest)}%`);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <motion.span className="font-heading text-3xl font-medium tabular-nums tracking-[-0.04em] text-ink sm:text-4xl">
      {label}
    </motion.span>
  );
}

function TypingDots() {
  return (
    <span className="flex gap-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1 rounded-full bg-primary/70"
          style={{ animation: `pulse-soft 1.1s ease-in-out ${i * 0.16}s infinite` }}
        />
      ))}
    </span>
  );
}

export function CourseGenerationFailedPanel({ course }: { course: Course }) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center">
      <Link
        href="/my-courses"
        className="inline-flex self-start items-center gap-2 text-sm font-medium text-ink/55 transition-colors hover:text-ink"
      >
        <ArrowLeft className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
        {t('player.backToCourseList')}
      </Link>

      <div className="mt-20 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-bad-soft text-bad">
          <X className="size-5" strokeWidth={1.8} />
        </span>
        <h1 className="mt-5 font-heading text-xl font-medium text-ink">{t('player.genFailed')}</h1>
        <p className="mt-2 text-sm leading-6 text-ink/65">
          {course.failureReason ?? t('player.genFailedDefault')}
        </p>
        <p className="mt-2 text-sm text-ink/45">{course.title}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/create-course"
            className={buttonClasses({
              size: 'lg',
              className: 'h-11 rounded-md px-5 text-sm font-medium shadow-none',
            })}
          >
            {t('player.createNewCourse')}
          </Link>
          <Link
            href="/my-courses"
            className={buttonClasses({
              variant: 'outline',
              size: 'lg',
              className: 'h-11 rounded-md bg-transparent px-5 text-sm font-medium',
            })}
          >
            {t('player.backToCourseList')}
          </Link>
        </div>
      </div>
    </div>
  );
}
