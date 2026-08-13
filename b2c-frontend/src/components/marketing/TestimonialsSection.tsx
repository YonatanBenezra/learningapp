'use client';

import Image from 'next/image';
import { Quote } from 'lucide-react';
import { useTranslation } from '@/src/i18n';
import { TESTIMONIALS } from './data';
import { Container } from './Container';
import { SectionHeading } from './SectionHeading';

export function TestimonialsSection() {
  const { t } = useTranslation();

  return (
    <section id="testimonials" className="overflow-hidden bg-bg-soft py-16 lg:py-24">
      <Container>
        <SectionHeading
          eyebrow={t('marketing.testimonialEyebrow')}
          title={t('marketing.testimonialTitle')}
        />
      </Container>

      <div className="mt-12 flex gap-6 overflow-x-auto px-4 pb-4 sm:px-6 lg:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[...TESTIMONIALS, ...TESTIMONIALS].map((item, index) => (
          <article
            key={`${item.name}-${index}`}
            className="min-w-[320px] max-w-[380px] shrink-0 rounded-[22px] border border-line bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:min-w-[360px]"
          >
            <Quote className="size-8 text-secondary" />
            <p className="mt-4 text-base leading-relaxed text-ink-2">&ldquo;{item.quote}&rdquo;</p>
            <div className="mt-6 flex items-center gap-3 border-t border-[#F1F5F9] pt-5">
              <Image
                src={item.avatar}
                alt={item.name}
                width={48}
                height={48}
                className="size-12 rounded-full object-cover"
              />
              <div>
                <p className="font-bold text-ink">{item.name}</p>
                <p className="text-sm text-ink-2">{t('marketing.roleTechSpecialist')}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
