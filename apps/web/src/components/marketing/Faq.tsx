'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation, useMarketingFaqItems } from '@/src/i18n';
import { Container } from './Container';
import { SectionHeading } from './SectionHeading';
import { cn } from '@/src/lib/utils';

export function Faq() {
  const { t } = useTranslation();
  const faqItems = useMarketingFaqItems();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="relative overflow-hidden border-t border-white/10 py-16 lg:py-24"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/70 to-slate-950/90 dark:from-slate-950/85 dark:via-slate-950/75 dark:to-black/90" />
        <div className="absolute inset-0 backdrop-blur-[2px]" />
        <div className="absolute -right-32 top-16 size-96 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute -left-24 bottom-0 size-80 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <Container className="relative">
        <SectionHeading
          variant="glass"
          eyebrow={t('marketing.faqEyebrow')}
          title={t('marketing.faqTitle')}
          description={t('marketing.faqDesc')}
          className="mb-12 lg:mb-14"
        />

        <div className="mx-auto w-full max-w-3xl divide-y divide-white/10">
          {faqItems.map((item, index) => {
            const isOpen = open === index;
            return (
              <div key={item.q} className="py-1">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 py-4 text-left sm:py-5"
                >
                  <span className="text-sm font-semibold text-white sm:text-base">{item.q}</span>
                  <ChevronDown
                    className={cn(
                      'size-5 shrink-0 text-white/60 transition-transform duration-300',
                      isOpen && 'rotate-180 text-sky-200',
                    )}
                  />
                </button>
                <div
                  className={cn(
                    'grid transition-all duration-300',
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="pb-5 text-sm leading-7 text-white/70">{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
