'use client';

import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import type { LessonContent } from '@/src/features/lessons/lessonsApi';
import { parseLessonContent } from '@/src/features/lessons/lessonContent';
import { LessonVisualBlock } from '@/src/features/lessons/components/LessonVisualBlock';
import { useTranslation } from '@/src/i18n';

interface LessonContentBodyProps {
  content: LessonContent | null | undefined;
  emptyMessage?: string;
}

export function LessonContentBody({
  content,
  emptyMessage,
}: LessonContentBodyProps) {
  const { t } = useTranslation();
  const parsed = parseLessonContent(content);
  const empty = emptyMessage ?? t('player.noWrittenContent');

  if (!parsed.hasBody) {
    return (
      <div className="rounded-md border border-dashed border-line/80 px-6 py-14 text-center">
        <BookOpen className="mx-auto size-7 text-ink/35" strokeWidth={1.6} />
        <p className="mt-4 text-sm leading-6 text-ink/55">{empty}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-14">
      {parsed.intro ? (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="font-heading text-lg font-medium leading-8 tracking-[-0.02em] text-ink sm:text-xl sm:leading-9"
        >
          {parsed.intro}
        </motion.p>
      ) : null}

      {parsed.sections.map((section, sectionIndex) => (
        <motion.section
          key={`${section.title}-${sectionIndex}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.04 * (sectionIndex + 1) }}
        >
          {section.title ? (
            <div className="flex gap-4 sm:gap-5">
              <span className="font-heading text-3xl font-medium leading-none tabular-nums text-primary/80 sm:text-4xl">
                {String(sectionIndex + 1).padStart(2, '0')}
              </span>
              <h2 className="font-heading text-[1.35rem] font-medium leading-snug tracking-[-0.02em] text-ink sm:text-[1.55rem]">
                {section.title}
              </h2>
            </div>
          ) : null}

          {section.visual ? (
            <div className={section.title ? 'mt-6' : undefined}>
              <LessonVisualBlock visual={section.visual} />
            </div>
          ) : null}

          {section.paragraphs.length > 0 ? (
            <div className={section.title || section.visual ? 'mt-5' : undefined}>
              <div className="flex flex-col gap-4 text-[15px] leading-8 text-ink/75 sm:text-base">
                {section.paragraphs.map((paragraph, paragraphIndex) => (
                  <p key={paragraphIndex} className="whitespace-pre-line">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </motion.section>
      ))}

      {parsed.keyPoints.length > 0 ? (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="border-t border-line/70 pt-10"
        >
          <h2 className="font-heading text-[1.35rem] font-medium tracking-[-0.02em] text-ink">
            Key takeaways
          </h2>
          <ol className="mt-6 space-y-5">
            {parsed.keyPoints.map((point, index) => (
              <li key={index} className="flex gap-4">
                <span className="font-heading w-8 shrink-0 text-lg font-medium tabular-nums text-primary/80">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <p className="pt-0.5 text-[15px] leading-7 text-ink/75 sm:text-base">{point}</p>
              </li>
            ))}
          </ol>
        </motion.section>
      ) : null}
    </div>
  );
}
