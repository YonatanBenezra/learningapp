'use client';

import { ClipboardList, Puzzle } from 'lucide-react';
import Link from 'next/link';
import { buttonClasses } from '@/src/components/ui/button';
import type { LessonActivity } from '@/src/features/lessons/lessonActivity';
import { InlineSimulationEmbed } from '@/src/features/lessons/components/InlineSimulationEmbed';

export function LessonActivityPanel({ activity }: { activity: LessonActivity }) {
  if (activity.kind === 'simulation') {
    return (
      <section className="mt-12 border-t border-line/70 pt-8">
        <p className="max-w-xl text-sm leading-6 text-ink/55">{activity.instructions}</p>
        <div className="mt-6">
          <InlineSimulationEmbed slug={activity.simulationSlug} />
        </div>
      </section>
    );
  }

  return (
    <section className="mt-12 border-t border-line/70 pt-8">
      <p className="max-w-xl text-sm leading-6 text-ink/55">{activity.instructions}</p>
      <div className="mt-6 grid gap-3">
        {activity.problemSlugs.map((slug, index) => (
          <article
            key={slug}
            className="flex flex-col gap-4 rounded-xl border border-line/80 bg-bg-elev/90 p-5 transition-colors hover:border-primary/30 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary-soft text-secondary">
                <Puzzle className="size-5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-3">
                  Problem {index + 1}
                </p>
                <h3 className="mt-1 font-medium text-ink">{slug.replace(/-/g, ' ')}</h3>
              </div>
            </div>
            <Link
              href={`/problems/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({
                variant: 'outline',
                className: 'inline-flex h-10 rounded-xl bg-transparent px-4 text-sm font-medium shadow-none',
              })}
            >
              <ClipboardList className="size-4" />
              Open problem
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
