'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { CATEGORIES } from './data';
import { Container } from './Container';
import { SectionHeading } from './SectionHeading';
import { buildCategoryCounts } from './categoryCounts';
import { useMarketplaceCourses } from '@/src/features/marketplace';
import {
  useTranslation,
  useCategoryLabel,
  useFormatCourseCount,
  useIsRtl,
} from '@/src/i18n';

function categoryHref(title: string) {
  return `/courses?category=${encodeURIComponent(title)}`;
}

function CategoryCard({
  title,
  courseCount,
  icon: Icon,
  iconBg,
  iconColor,
}: (typeof CATEGORIES)[number] & { courseCount: number | undefined }) {
  const { t } = useTranslation();
  const categoryLabel = useCategoryLabel(title);
  const formatCourseCount = useFormatCourseCount();
  const isRtl = useIsRtl();

  return (
    <article className="group flex h-full flex-col rounded-lg border border-line bg-bg-elev p-5 transition-colors hover:border-primary/25 hover:bg-bg-soft">
      <span
        className={`grid size-12 place-items-center rounded-lg ${iconBg} transition-transform group-hover:scale-105`}
      >
        <Icon className={`size-6 ${iconColor}`} strokeWidth={1.8} />
      </span>

      <h3 className="mt-5 text-lg font-semibold leading-snug text-ink">
        <Link href={categoryHref(title)} className="transition-colors hover:text-primary">
          {categoryLabel}
        </Link>
      </h3>

      <p className="mt-2 text-sm text-ink-2">{formatCourseCount(courseCount)}</p>

      <Link
        href={categoryHref(title)}
        className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-primary transition-colors hover:text-primary-dark"
      >
        {t('marketing.browseCourses')}
        <ArrowRight
          className={`size-4 transition-transform group-hover:translate-x-0.5${isRtl ? ' rtl-flip' : ''}`}
        />
      </Link>
    </article>
  );
}

export function Categories() {
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const { data, isLoading } = useMarketplaceCourses();

  const countsByCategory = useMemo(
    () => buildCategoryCounts(data?.courses ?? []),
    [data?.courses],
  );

  return (
    <section
      id="categories"
      data-tour="tour-categories"
      className="border-t border-ink/[0.06] bg-bg py-16 dark:border-white/[0.08] lg:py-24"
    >
      <Container>
        <SectionHeading
          title={t('marketing.categoriesTitle')}
          description={t('marketing.categoriesDescription')}
          className="mb-12 lg:mb-14"
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {CATEGORIES.map((category) => (
            <CategoryCard
              key={category.title}
              {...category}
              courseCount={isLoading ? undefined : countsByCategory.get(category.title) ?? 0}
            />
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-bg-elev px-5 py-2.5 text-base font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
          >
            {t('marketing.viewAllCourses')}
            <ArrowRight className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
          </Link>
        </div>
      </Container>
    </section>
  );
}
