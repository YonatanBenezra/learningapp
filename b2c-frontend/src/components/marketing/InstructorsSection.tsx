'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation, useInstructorsWithRoles, useMarketingSocialLabels } from '@/src/i18n';
import { SOCIAL_LINKS } from './SocialIcons';
import { INSTRUCTORS } from './data';
import { Container } from './Container';
import { SectionHeading } from './SectionHeading';

export function InstructorsSection() {
  const { t } = useTranslation();
  const instructors = useInstructorsWithRoles(INSTRUCTORS);
  const socialLabels = useMarketingSocialLabels();

  const socialLabelMap: Record<string, string> = {
    Facebook: socialLabels.facebook,
    Twitter: socialLabels.twitter,
    Instagram: socialLabels.instagram,
    LinkedIn: socialLabels.linkedIn,
  };

  return (
    <section className="bg-bg-soft py-16 lg:py-24">
      <Container>
        <SectionHeading
          eyebrow={t('marketing.teamEyebrow')}
          title={t('marketing.teamTitle')}
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {instructors.map((instructor) => (
            <article
              key={instructor.name}
              className="group overflow-hidden rounded-[22px] border border-line bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition-all hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
            >
              <div className="relative h-[320px] overflow-hidden">
                <Image
                  src={instructor.image}
                  alt={instructor.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="320px"
                />
                <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2 bg-[linear-gradient(to_top,rgba(0,127,142,0.85),transparent)] pb-5 pt-16 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  {SOCIAL_LINKS.map(({ Icon, label }) => (
                    <Link
                      key={label}
                      href="#contact"
                      aria-label={socialLabelMap[label] ?? label}
                      className="grid size-9 place-items-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-secondary"
                    >
                      <Icon className="size-4" />
                    </Link>
                  ))}
                </div>
              </div>
              <div className="p-5 text-center">
                <p className="text-sm font-medium text-ink-2">{instructor.role}</p>
                <h3 className="mt-1 text-xl font-bold text-ink">{instructor.name}</h3>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
