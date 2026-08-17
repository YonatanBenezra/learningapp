'use client';

import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { learnerCoursePath } from '@/src/features/auth/learnerRoutes';
import { categoryLabelFor, useTranslation } from '@/src/i18n';
import { buttonClasses } from '@/src/components/ui/button';
import { Progress } from '@/src/components/ui/progress';
import { AI_CATEGORY_OPTIONS } from '@/src/constants/aiCategories';
import { cn } from '@/src/lib/utils';

export type CatalogCourse = {
  id: string;
  title: string;
  description: string;
  price: number;
  lessons: number;
  students: number;
  category: string;
  level: string;
  topics: string[];
  progressPercent?: number;
};

function formatLevel(level: string): string {
  return level.replace(/\b\w/g, (char) => char.toUpperCase());
}

interface CourseCatalogCardProps {
  course: CatalogCourse;
  enrolled?: boolean;
}

export function CourseCatalogCard({ course, enrolled = false }: CourseCatalogCardProps) {
  const { t } = useTranslation();
  const href = enrolled ? learnerCoursePath(course.id) : `/courses/${course.id}`;
  const category = AI_CATEGORY_OPTIONS.find((option) => option.name === course.category);
  const Icon = category?.icon ?? BookOpen;
  const categoryLabel = categoryLabelFor(t, course.category);
  const tags = (course.topics.length > 0 ? course.topics : [formatLevel(course.level)]).slice(0, 4);
  const ctaLabel = enrolled ? t('marketplace.continueLearning') : t('marketplace.enrollNow');
  const progress = enrolled ? Math.max(0, Math.min(100, course.progressPercent ?? 0)) : 0;

  return (
    <article className="flex h-full flex-col rounded-md border border-line/80 bg-bg-elev/90 p-5 transition-colors hover:border-primary/35 hover:bg-bg-elev">
      <Link href={href} className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={cn(
                'grid size-10 shrink-0 place-items-center rounded-md',
                category?.iconBg ?? 'bg-primary-soft',
              )}
            >
              <Icon
                className={cn('size-5', category?.iconColor ?? 'text-primary')}
                strokeWidth={1.75}
              />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{categoryLabel}</p>
              <p className="mt-0.5 text-xs text-ink/45">{formatLevel(course.level)}</p>
            </div>
          </div>
          {enrolled ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-good/15 px-2.5 py-1 text-[11px] font-medium text-good">
              <span className="size-1.5 rounded-full bg-good" aria-hidden="true" />
              {t('marketing.catalogActive')}
            </span>
          ) : null}
        </div>

        <h3 className="mt-5 line-clamp-2 text-xl font-medium leading-snug text-ink">{course.title}</h3>

        <div className="mt-4">
          <p className="text-xs text-ink/45">{t('marketing.catalogIncludes')}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-6">
          {!enrolled ? (
            <p className="mb-4 text-sm font-medium tabular-nums text-ink">
              ${course.price.toFixed(2)}
            </p>
          ) : null}
          <div className="mb-4">
            <p className="mb-1.5 text-xs font-medium text-ink">
              {t('marketing.catalogComplete', { percent: String(progress) })}
            </p>
            <Progress value={progress} className="h-2 rounded-full bg-primary/20" />
          </div>
          <span
            className={buttonClasses({
              size: 'lg',
              className: 'h-11 w-full rounded-md text-sm font-medium shadow-none',
            })}
          >
            {ctaLabel}
          </span>
        </div>
      </Link>
    </article>
  );
}
