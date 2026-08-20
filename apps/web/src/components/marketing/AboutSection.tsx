'use client';

import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { useTranslation, useAboutPoints } from '@/src/i18n';
import { Container } from './Container';
import { SectionHeading } from './SectionHeading';

export function AboutSection() {
  const { t } = useTranslation();
  const aboutPoints = useAboutPoints();

  return (
    <section id="about" className="bg-white py-16 lg:py-24">
      <Container className="grid items-center gap-12 lg:grid-cols-2">
        <div className="relative">
          <div className="absolute -left-4 -top-4 size-24 rounded-full bg-secondary/15 blur-2xl" />
          <div className="absolute -bottom-4 -right-4 size-32 rounded-full bg-primary/15 blur-2xl" />
          <div className="relative overflow-hidden rounded-[28px] border-4 border-white shadow-[0_24px_50px_rgba(15,23,42,0.12)]">
            <Image
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=700&h=820&fit=crop"
              alt={t('marketing.aboutImageAlt')}
              width={700}
              height={820}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <div>
          <SectionHeading
            align="left"
            eyebrow={t('marketing.aboutEyebrow')}
            title={t('marketing.aboutTitle')}
            description={t('marketing.aboutDesc')}
          />

          <ul className="mt-8 space-y-4">
            {aboutPoints.flatMap((point) => [point.bold, point.normal]).map((text, index) => (
              <li key={text} className="flex gap-3">
                {index % 2 === 0 ? (
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                ) : (
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#CBD5E1]" />
                )}
                <span
                  className={
                    index % 2 === 0
                      ? 'text-base font-bold text-ink'
                      : 'text-sm leading-relaxed text-ink-2'
                  }
                >
                  {text}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-6">
            <div>
              <p className="text-sm text-ink-2">{t('marketing.aboutHaveQuestions')}</p>
              <p className="text-lg font-bold text-primary">info@domain.com</p>
            </div>
            <Link
              href="/signup"
              className="inline-flex h-12 items-center rounded-xl bg-secondary px-7 text-sm font-semibold text-white transition-colors hover:bg-secondary-2"
            >
              {t('marketing.aboutKnowMore')}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
