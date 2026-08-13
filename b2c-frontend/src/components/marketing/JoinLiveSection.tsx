'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BookOpen, Clock3, Radio } from 'lucide-react';
import { useTranslation } from '@/src/i18n';
import { LIVE_CLASSES, TESTIMONIALS } from './data';
import { Container } from './Container';
import { SectionHeading } from './SectionHeading';

export function JoinLiveSection() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="bg-white py-16 lg:py-24">
      <Container>
        <SectionHeading
          eyebrow={t('marketing.joinLiveEyebrow')}
          title={t('marketing.joinLiveTitle')}
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-3">
            {LIVE_CLASSES.map((item, index) => {
              const active = activeTab === index;
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setActiveTab(index)}
                  className={`w-full rounded-[18px] border p-5 text-left transition-all ${
                    active
                      ? 'border-primary bg-primary-soft shadow-[0_8px_24px_rgba(0,127,142,0.12)]'
                      : 'border-line bg-bg-soft hover:border-primary/30'
                  }`}
                >
                  <div className="flex flex-wrap gap-3 text-xs font-medium text-ink-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1">
                      <BookOpen className="size-3.5" />
                      {t('marketing.lessonSingular', { count: String(item.lessons) })}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1">
                      <Clock3 className="size-3.5" />
                      {item.duration}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-bold leading-snug text-ink">{item.title}</h3>
                </button>
              );
            })}
          </div>

          <div className="rounded-[24px] border border-line bg-bg-soft p-6 lg:p-8">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
              <Radio className="size-3.5" />
              {t('marketing.liveTimer')}
            </div>
            <p className="text-base leading-relaxed text-ink-2">{t('marketing.joinLiveBody')}</p>
            <div className="mt-8 flex items-center gap-4">
              <Image
                src={TESTIMONIALS[activeTab]?.avatar ?? TESTIMONIALS[0].avatar}
                alt={TESTIMONIALS[activeTab]?.name ?? TESTIMONIALS[0].name}
                width={56}
                height={56}
                className="size-14 rounded-full object-cover"
              />
              <div>
                <p className="font-bold text-ink">
                  {TESTIMONIALS[activeTab]?.name ?? TESTIMONIALS[0].name}
                </p>
                <p className="text-sm text-ink-2">{t('marketing.roleTechSpecialist')}</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
