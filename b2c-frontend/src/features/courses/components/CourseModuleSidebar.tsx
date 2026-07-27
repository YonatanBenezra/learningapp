'use client';

import { ChevronDown, ChevronRight, Circle, CircleCheck } from 'lucide-react';
import type { StructureModule } from '@/src/features/courses/coursesApi';
import { cn } from '@/src/lib/utils';

interface CourseModuleSidebarProps {
  modules: StructureModule[];
  activeLessonId: string | null;
  expandedModuleId: string | null;
  completedLessonIds: Set<string>;
  onToggleModule: (moduleId: string) => void;
  onSelectLesson: (lessonId: string) => void;
}

export function CourseModuleSidebar({
  modules,
  activeLessonId,
  expandedModuleId,
  completedLessonIds,
  onToggleModule,
  onSelectLesson,
}: CourseModuleSidebarProps) {
  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-b border-line bg-bg-elev lg:w-[360px] lg:border-b-0 lg:border-l">
      <div className="shrink-0 border-b border-line px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
          Course content
        </p>
        <h2 className="mt-1 text-sm font-semibold text-ink">Modules</h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {modules.length === 0 ? (
          <p className="px-2 py-4 text-sm text-ink-3">No modules available yet.</p>
        ) : (
          <div className="space-y-1">
            {modules.map((module, index) => {
              const expanded = expandedModuleId === module.id;
              return (
                <div key={module.id} className="overflow-hidden rounded-lg border border-line">
                  <button
                    type="button"
                    onClick={() => onToggleModule(module.id)}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-3 text-left transition hover:bg-bg-soft',
                      expanded && 'bg-bg-soft',
                    )}
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-md border border-line bg-bg-elev font-mono text-[11px] font-bold text-primary">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {module.title}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-ink-3">
                        {module.lessonCount} lessons
                      </span>
                    </span>
                    {expanded ? (
                      <ChevronDown className="size-4 shrink-0 text-ink-3" />
                    ) : (
                      <ChevronRight className="size-4 shrink-0 text-ink-3" />
                    )}
                  </button>

                  {expanded ? (
                    <ul className="border-t border-line bg-bg-elev py-1">
                      {module.lessons.map((lesson, lessonIndex) => {
                        const active = lesson.id === activeLessonId;
                        const done = completedLessonIds.has(lesson.id);
                        return (
                          <li key={lesson.id}>
                            <button
                              type="button"
                              onClick={() => onSelectLesson(lesson.id)}
                              className={cn(
                                'flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition',
                                active
                                  ? 'bg-primary-soft text-primary'
                                  : 'text-ink-2 hover:bg-bg-soft hover:text-ink',
                              )}
                            >
                              {done ? (
                                <CircleCheck className="size-4 shrink-0 text-good" />
                              ) : (
                                <Circle className="size-4 shrink-0 text-ink-3" />
                              )}
                              <span className="min-w-0 flex-1 truncate">
                                {lessonIndex + 1}. {lesson.title}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
