'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { CATEGORIES } from './data';
import { Container } from './Container';
import { buildCategoryCounts } from './categoryCounts';
import { useMarketplaceCourses } from '@/src/features/marketplace';
import {
  useTranslation,
  useCategoryLabel,
  useFormatCourseCount,
  useIsRtl,
} from '@/src/i18n';
import { buttonClasses } from '@/src/components/ui/button';

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
    <Link
      href={categoryHref(title)}
      className="group flex h-full flex-col rounded-md border border-line/80 bg-bg-elev/90 p-6 transition-colors hover:border-primary/35 hover:bg-bg-elev"
    >
      <span className={`grid size-10 place-items-center rounded-md ${iconBg}`}>
        <Icon className={`size-5 ${iconColor}`} strokeWidth={1.75} />
      </span>

      <h3 className="mt-5 text-base font-medium leading-snug text-ink">{categoryLabel}</h3>

      <p className="mt-2 text-sm text-ink/65">{formatCourseCount(courseCount)}</p>

      <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-medium text-primary">
        {t('marketing.browseCourses')}
        <ArrowRight
          className={`size-4 transition-transform group-hover:translate-x-0.5${isRtl ? ' rtl-flip' : ''}`}
        />
      </span>
    </Link>
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
      className="bg-[var(--marketing-hero)] py-20 lg:py-28"
    >
      <Container>
        <div className="mx-auto mb-12 max-w-2xl text-center lg:mb-16">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-ink-2">
            {t('marketing.categoriesEyebrow')}
          </p>
          <h2 className="mt-4 font-heading text-[1.85rem] font-medium leading-[1.2] tracking-[-0.02em] text-ink sm:text-[2.2rem] lg:text-[2.4rem]">
            {t('marketing.categoriesTitle')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-ink/70">
            {t('marketing.categoriesDescription')}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {CATEGORIES.map((category) => (
            <CategoryCard
              key={category.title}
              {...category}
              courseCount={isLoading ? undefined : countsByCategory.get(category.title) ?? 0}
            />
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            href="/courses"
            className={buttonClasses({
              variant: 'outline',
              size: 'lg',
              className: 'h-11 rounded-md bg-transparent px-5 text-sm font-medium',
            })}
          >
            {t('marketing.viewAllCourses')}
            <ArrowRight className={isRtl ? 'size-4 rtl-flip' : 'size-4'} />
          </Link>
        </div>
      </Container>
    </section>
  );
}
