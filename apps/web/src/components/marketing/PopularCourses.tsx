'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Clock3, Star } from 'lucide-react';
import {
  useTranslation,
  usePopularCoursesFilters,
  type PopularCourseFilter,
} from '@/src/i18n';
import { COURSES } from './data';
import { Container } from './Container';
import { SectionHeading } from './SectionHeading';

export function PopularCourses() {
  const { t } = useTranslation();
  const filters = usePopularCoursesFilters();
  const [activeFilter, setActiveFilter] = useState<PopularCourseFilter>('All Categories');

  function categoryLabel(category: string) {
    const map: Record<string, string> = {
      'Artificial Intelligence': t('marketing.catArtificialIntelligence'),
      'Machine Learning': t('marketing.catMachineLearning'),
      'Generative AI': t('marketing.catGenerativeAI'),
      'Data Science': t('marketing.catDataScience'),
    };
    return map[category] ?? category;
  }

  function levelLabel(level: string) {
    const map: Record<string, string> = {
      Beginner: t('marketing.levelBeginner'),
      Advance: t('marketing.levelAdvance'),
      'Entry Level': t('marketing.levelEntry'),
      Medium: t('marketing.levelMedium'),
    };
    return map[level] ?? level;
  }

  const filteredCourses = useMemo(
    () =>
      activeFilter === 'All Categories'
        ? COURSES
        : COURSES.filter((course) => course.category === activeFilter),
    [activeFilter],
  );

  return (
    <section id="courses" className="bg-bg-soft py-16 lg:py-24">
      <Container>
        <SectionHeading
          eyebrow={t('marketing.coursesEyebrow')}
          title={t('marketing.coursesTitle')}
        />

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {filters.map((filter) => {
            const active = activeFilter === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                  active
                    ? 'bg-primary text-white shadow-[var(--shadow-primary)]'
                    : 'border border-line bg-white text-[#475569] hover:border-primary hover:text-primary'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => (
            <article
              key={course.id}
              className="overflow-hidden rounded-[22px] border border-line bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
            >
              <div className="relative h-[210px]">
                <Image src={course.image} alt={course.title} fill className="object-cover" sizes="400px" />
                <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-primary shadow-sm">
                  {categoryLabel(course.category)}
                </span>
                <span className="absolute right-4 top-4 rounded-lg bg-primary px-3 py-1.5 text-sm font-bold text-white">
                  ${course.price.toFixed(2)}
                </span>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2 text-sm text-ink-2">
                  <Star className="size-4 fill-[#FBBF24] text-[#FBBF24]" />
                  <span className="font-semibold text-ink">{course.rating}</span>
                  <span>
                    ({course.reviews} {t('marketing.reviews')})
                  </span>
                </div>

                <h3 className="mt-3 min-h-[56px] text-lg font-bold leading-snug text-ink">
                  {course.title}
                </h3>

                <div className="mt-4 flex items-center gap-3 border-b border-[#F1F5F9] pb-4">
                  <Image
                    src={course.avatar}
                    alt={course.instructor}
                    width={40}
                    height={40}
                    className="size-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-ink">{course.instructor}</p>
                    <p className="text-xs text-ink-2">
                      {t('marketing.yearsExperience', {
                        years: course.experience.replace(/\D+/g, '').slice(0, 2) || '10',
                      })}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-ink-2">
                  <span className="rounded-full bg-primary-soft px-3 py-1 text-primary">
                    {levelLabel(course.level)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-bg-soft px-3 py-1">
                    <BookOpen className="size-3.5" />
                    {t('marketing.lessonSingular', { count: String(course.lessons) })}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-bg-soft px-3 py-1">
                    <Clock3 className="size-3.5" />
                    {course.duration}
                  </span>
                </div>

                <Link
                  href="/signup"
                  className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-secondary text-sm font-semibold text-white transition-colors hover:bg-secondary-2"
                >
                  {t('marketing.enrollNow')}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
