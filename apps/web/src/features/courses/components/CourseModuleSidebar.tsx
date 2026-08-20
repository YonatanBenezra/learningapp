'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { Check, ChevronRight, GraduationCap, Loader2, Network } from 'lucide-react';
import type { StructureModule } from '@/src/features/courses/coursesApi';
import { buttonClasses } from '@/src/components/ui/button';
import { useIsRtl, useTranslation } from '@/src/i18n';
import { cn } from '@/src/lib/utils';

interface CourseModuleSidebarProps {
  modules: StructureModule[];
  activeLessonId: string | null;
  expandedModuleId: string | null;
  completedLessonIds: Set<string>;
  diagramHref: string;
  examPending: boolean;
  onFinalExam: () => void;
  onToggleModule: (moduleId: string) => void;
  onSelectLesson: (lessonId: string) => void;
}

const RING_R = 11;
const RING_C = 2 * Math.PI * RING_R;

export function CourseModuleSidebar({
  modules,
  activeLessonId,
  expandedModuleId,
  completedLessonIds,
  diagramHref,
  examPending,
  onFinalExam,
  onToggleModule,
  onSelectLesson,
}: CourseModuleSidebarProps) {
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const totalLessons = modules.reduce((sum, module) => sum + module.lessons.length, 0);
  const totalDone = modules.reduce(
    (sum, module) => sum + module.lessons.filter((lesson) => completedLessonIds.has(lesson.id)).length,
    0,
  );
  const overall = totalLessons > 0 ? Math.round((totalDone / totalLessons) * 100) : 0;

  return (
    <aside className="flex h-full min-h-0 w-full flex-col">
      <div className="shrink-0 border-b border-line/70 px-3 py-2.5">
        <div className="flex items-center gap-1">
          <Link
            href={diagramHref}
            className={buttonClasses({
              variant: 'ghost',
              size: 'sm',
              className: 'h-9 flex-1 rounded-md px-2 text-sm font-medium',
            })}
          >
            <Network className="size-4" />
            {t('player.diagram')}
          </Link>
          <button
            type="button"
            onClick={onFinalExam}
            disabled={examPending}
            className={buttonClasses({
              variant: 'ghost',
              size: 'sm',
              className: 'h-9 flex-1 rounded-md px-2 text-sm font-medium',
            })}
          >
            {examPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <GraduationCap className="size-4" />
            )}
            {t('player.finalExam')}
          </button>
        </div>
      </div>

      <div className="shrink-0 px-5 pb-4 pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-heading text-base font-medium tracking-[-0.02em] text-ink">
            {t('player.courseContent')}
          </h2>
          <span className="text-xs tabular-nums text-ink/40">
            {totalDone}/{totalLessons || modules.length}
          </span>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-primary/15">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={false}
            animate={{ width: `${overall}%` }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-5">
        {modules.length === 0 ? (
          <p className="px-2 py-4 text-sm text-ink/45">{t('player.noModules')}</p>
        ) : (
          <div className="relative">
            <div className="absolute start-[21px] top-5 bottom-5 w-px bg-line/60" aria-hidden />
            <ul className="space-y-1">
              {modules.map((module, index) => {
                const expanded = expandedModuleId === module.id;
                const doneCount = module.lessons.filter((lesson) =>
                  completedLessonIds.has(lesson.id),
                ).length;
                const containsActive = module.lessons.some((lesson) => lesson.id === activeLessonId);
                const complete = module.lessonCount > 0 && doneCount === module.lessonCount;
                const ratio = module.lessonCount > 0 ? doneCount / module.lessonCount : 0;

                return (
                  <li key={module.id}>
                    <button
                      type="button"
                      onClick={() => onToggleModule(module.id)}
                      className={cn(
                        'group relative flex w-full items-start gap-3 rounded-md px-2 py-2.5 text-left transition-colors',
                        expanded || containsActive
                          ? 'bg-bg-elev/90'
                          : 'hover:bg-bg-elev/70',
                      )}
                    >
                      <ModuleMark
                        index={index}
                        progress={ratio}
                        complete={complete}
                        active={expanded || containsActive}
                      />
                      <span className="min-w-0 flex-1 pt-0.5">
                        <span className="block text-sm font-medium leading-5 text-ink">
                          {module.title}
                        </span>
                        <span className="mt-1 flex items-center gap-2 text-xs text-ink/45">
                          {t('player.lessonCount', { count: String(module.lessonCount) })}
                          {doneCount > 0 ? (
                            <span className="tabular-nums text-primary/80">
                              {doneCount}/{module.lessonCount}
                            </span>
                          ) : null}
                        </span>
                      </span>
                      <motion.span
                        animate={{ rotate: expanded ? 90 : 0 }}
                        transition={{ duration: 0.22 }}
                        className="mt-1.5 shrink-0 text-ink/35"
                      >
                        <ChevronRight className={cn('size-4', isRtl && 'rtl-flip')} />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {expanded ? (
                        <motion.ul
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="ms-[21px] space-y-0.5 border-s border-transparent pb-2 pt-1">
                            {module.lessons.map((lesson, lessonIndex) => {
                              const active = lesson.id === activeLessonId;
                              const done = completedLessonIds.has(lesson.id);
                              return (
                                <motion.li
                                  key={lesson.id}
                                  initial={{ opacity: 0, x: isRtl ? 8 : -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: lessonIndex * 0.04, duration: 0.22 }}
                                >
                                  <button
                                    type="button"
                                    onClick={() => onSelectLesson(lesson.id)}
                                    className={cn(
                                      'relative flex w-full items-center gap-2.5 rounded-md py-2 pe-2 ps-4 text-left text-sm transition-colors',
                                      active
                                        ? 'bg-primary/[0.1] font-medium text-primary'
                                        : 'text-ink/70 hover:bg-bg-elev hover:text-ink',
                                    )}
                                  >
                                    {active ? (
                                      <span className="absolute inset-y-1 start-0 w-0.5 rounded-full bg-primary" />
                                    ) : null}
                                    <span
                                      className={cn(
                                        'grid size-[18px] shrink-0 place-items-center rounded-full border transition-colors',
                                        done && 'border-good bg-good text-white',
                                        active && !done && 'border-primary bg-primary text-primary-ink',
                                        !active && !done && 'border-line-2 bg-transparent text-transparent',
                                      )}
                                    >
                                      {done ? (
                                        <Check className="size-2.5" strokeWidth={3} />
                                      ) : active ? (
                                        <span className="size-1.5 rounded-full bg-primary-ink" />
                                      ) : null}
                                    </span>
                                    <span className="min-w-0 flex-1 truncate leading-5">
                                      {lesson.title}
                                    </span>
                                  </button>
                                </motion.li>
                              );
                            })}
                          </div>
                        </motion.ul>
                      ) : null}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}

function ModuleMark({
  index,
  progress,
  complete,
  active,
}: {
  index: number;
  progress: number;
  complete: boolean;
  active: boolean;
}) {
  return (
    <span className="relative z-[1] grid size-8 shrink-0 place-items-center">
      <svg viewBox="0 0 32 32" className="absolute inset-0 -rotate-90">
        <circle
          cx="16"
          cy="16"
          r={RING_R}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-line/70"
        />
        <circle
          cx="16"
          cy="16"
          r={RING_R}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className={complete ? 'text-good' : 'text-primary'}
          strokeDasharray={RING_C}
          strokeDashoffset={RING_C * (1 - progress)}
        />
      </svg>
      <span
        className={cn(
          'grid size-6 place-items-center rounded-full text-[10px] font-medium tabular-nums',
          complete && 'bg-good text-white',
          active && !complete && 'bg-primary-soft text-primary',
          !active && !complete && 'bg-[var(--marketing-hero)] text-ink/55',
        )}
      >
        {complete ? <Check className="size-3" strokeWidth={2.6} /> : String(index + 1).padStart(2, '0')}
      </span>
    </span>
  );
}
