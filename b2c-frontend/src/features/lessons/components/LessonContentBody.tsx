'use client';

import { BookOpen, Sparkles } from 'lucide-react';
import type { LessonContent } from '@/src/features/lessons/lessonsApi';
import { parseLessonContent } from '@/src/features/lessons/lessonContent';
import { LessonVisualBlock } from '@/src/features/lessons/components/LessonVisualBlock';

interface LessonContentBodyProps {
  content: LessonContent | null | undefined;
  emptyMessage?: string;
}

export function LessonContentBody({
  content,
  emptyMessage = 'This lesson does not have written content yet.',
}: LessonContentBodyProps) {
  const parsed = parseLessonContent(content);

  if (!parsed.hasBody) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-bg-soft/60 px-6 py-12 text-center">
        <BookOpen className="mx-auto size-8 text-ink-3" />
        <p className="mt-4 text-sm leading-6 text-ink-2">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {parsed.intro ? (
        <div className="relative overflow-hidden rounded-lg border border-primary/20 bg-gradient-to-br from-primary-soft/80 to-bg-elev p-6 sm:p-7">
          <div className="absolute -right-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
          <div className="relative flex items-start gap-3">
            <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Overview
              </p>
              <p className="mt-3 text-base leading-8 text-ink">{parsed.intro}</p>
            </div>
          </div>
        </div>
      ) : null}

      {parsed.sections.map((section, sectionIndex) => (
        <section
          key={`${section.title}-${sectionIndex}`}
          className="rounded-lg border border-line bg-bg-soft/30 p-5 sm:p-6"
        >
          <div className="mb-5 flex items-center gap-3">
            <span className="grid size-8 place-items-center rounded-lg bg-primary-soft text-xs font-bold text-primary">
              {sectionIndex + 1}
            </span>
            {section.title ? (
              <h2 className="text-xl font-semibold tracking-tight text-ink">{section.title}</h2>
            ) : null}
          </div>

          {section.visual ? <LessonVisualBlock visual={section.visual} /> : null}

          {section.paragraphs.length > 0 ? (
            <div className="mt-5 flex flex-col gap-5 text-base leading-8 text-ink-2">
              {section.paragraphs.map((paragraph, paragraphIndex) => (
                <p key={paragraphIndex} className="whitespace-pre-line">
                  {paragraph}
                </p>
              ))}
            </div>
          ) : null}
        </section>
      ))}

      {parsed.keyPoints.length > 0 ? (
        <section className="rounded-lg border border-line bg-bg-elev p-6 sm:p-7">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-ink-3">
            Key takeaways
          </h2>
          <ul className="mt-5 space-y-3">
            {parsed.keyPoints.map((point, index) => (
              <li key={index} className="flex gap-3 text-base leading-7 text-ink-2">
                <span className="mt-2 size-2 shrink-0 rounded-full bg-primary" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
