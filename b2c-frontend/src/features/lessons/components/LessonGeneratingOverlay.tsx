'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { Check, Loader2, X } from 'lucide-react';
import { buttonClasses } from '@/src/components/ui/button';
import { cn } from '@/src/lib/utils';
import { useTranslation } from '@/src/i18n';

const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;

export type LessonGeneratingKind = 'exercise' | 'quiz';

interface LessonGeneratingOverlayProps {
  open: boolean;
  kind: LessonGeneratingKind;
  lessonTitle?: string | null;
  labLabel?: string | null;
  pending: boolean;
  errorMessage?: string | null;
  onRetry: () => void;
  onClose: () => void;
}

export function LessonGeneratingOverlay({
  open,
  kind,
  lessonTitle,
  labLabel,
  pending,
  errorMessage,
  onRetry,
  onClose,
}: LessonGeneratingOverlayProps) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [activePhase, setActivePhase] = useState(0);

  const phases = useMemo(
    () =>
      kind === 'quiz'
        ? [
            t('player.genPracticePhase1'),
            t('player.genQuizPhase2'),
            t('player.genQuizPhase3'),
            t('player.genQuizPhase4'),
          ]
        : [
            t('player.genPracticePhase1'),
            t('player.genExercisePhase2'),
            t('player.genExercisePhase3'),
            t('player.genExercisePhase4'),
          ],
    [kind, t],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setActivePhase(0);
      return;
    }
    if (!pending) return;

    const timers = [
      window.setTimeout(() => setActivePhase(1), 1800),
      window.setTimeout(() => setActivePhase(2), 4200),
      window.setTimeout(() => setActivePhase(3), 7800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [open, pending, kind]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open || pending || !errorMessage) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, pending, errorMessage, onClose]);

  const failed = Boolean(errorMessage) && !pending;
  const progress = failed
    ? 0
    : pending
      ? Math.min(92, 16 + activePhase * 22)
      : 100;
  const currentPhase = phases[Math.min(activePhase, phases.length - 1)] ?? phases[0];

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-[var(--marketing-hero)]/96 px-4 py-10 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lesson-generating-title"
    >
      <div className="mx-auto flex w-full max-w-xl flex-col items-center">
        {failed ? (
          <>
            <span className="grid size-12 place-items-center rounded-md bg-bad-soft text-bad">
              <X className="size-5" strokeWidth={1.8} />
            </span>
            <h2
              id="lesson-generating-title"
              className="mt-5 text-center font-heading text-xl font-medium tracking-[-0.02em] text-ink"
            >
              {kind === 'quiz' ? t('player.generateQuizError') : t('player.generateExerciseError')}
            </h2>
            <p className="mt-2 max-w-md text-center text-sm leading-6 text-ink/65">{errorMessage}</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                className={buttonClasses({
                  size: 'lg',
                  className: 'h-11 rounded-md px-5 text-sm font-medium shadow-none',
                })}
                onClick={onRetry}
              >
                {t('common.retry')}
              </button>
              <button
                type="button"
                className={buttonClasses({
                  variant: 'outline',
                  size: 'lg',
                  className: 'h-11 rounded-md bg-transparent px-5 text-sm font-medium',
                })}
                onClick={onClose}
              >
                {t('common.cancel')}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="relative">
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

              <svg viewBox="0 0 128 128" className="size-[132px] -rotate-90 sm:size-[148px]">
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

            <h2
              id="lesson-generating-title"
              className="mt-7 text-center font-heading text-[1.65rem] font-medium leading-tight tracking-[-0.03em] text-ink sm:text-[1.9rem]"
            >
              {kind === 'quiz' ? t('player.generatingQuizTitle') : t('player.generatingExerciseTitle')}
            </h2>
            {lessonTitle ? (
              <p className="mt-2 text-center text-sm font-medium text-ink/70">{lessonTitle}</p>
            ) : null}
            <p className="mt-1 max-w-md text-center text-sm text-ink/45">
              {kind === 'quiz'
                ? t('player.generatingQuizDesc')
                : labLabel
                  ? t('player.generateExerciseLab', { lab: labLabel })
                  : t('player.generatingExerciseDesc')}
            </p>

            <div className="mt-4 h-6 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentPhase}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.28 }}
                  className="text-center text-sm text-ink/55"
                >
                  {currentPhase}
                </motion.p>
              </AnimatePresence>
            </div>

            <ol className="mt-8 flex w-full max-w-lg items-start">
              {phases.map((phase, index) => {
                const done = index < activePhase || !pending;
                const active = pending && index === activePhase;
                return (
                  <li key={phase} className="flex flex-1 items-center">
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
                          'mt-2 hidden max-w-[7.5rem] text-center text-[11px] leading-4 sm:block',
                          active || done ? 'font-medium text-ink/70' : 'text-ink/35',
                        )}
                      >
                        {phase}
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

            <div className="mt-8 flex w-full items-center gap-4 rounded-md border border-dashed border-primary/30 bg-primary/[0.04] px-4 py-3">
              <span className="grid size-7 place-items-center">
                {pending ? (
                  <Loader2 className="size-4 animate-spin text-primary" />
                ) : (
                  <Check className="size-4 text-primary" strokeWidth={2.6} />
                )}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-ink/60">{currentPhase}</span>
              {pending ? <TypingDots /> : null}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

function AnimatedPercent({ value }: { value: number }) {
  const spring = useSpring(value, { stiffness: 90, damping: 20, mass: 0.6 });
  const label = useTransform(spring, (latest) => `${Math.round(latest)}%`);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <motion.span className="font-heading text-3xl font-medium tabular-nums tracking-[-0.04em] text-ink sm:text-[2rem]">
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
