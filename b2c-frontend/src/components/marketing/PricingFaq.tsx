'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Container } from './Container';
import { PRICING_FAQ } from '@/src/constants/pricing';
import { cn } from '@/src/lib/utils';

export function PricingFaq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-line bg-bg pt-10 pb-14 sm:pb-16">
      <Container>
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Frequently asked questions
          </h2>
          <p className="mt-2 text-sm leading-7 text-ink-2 sm:text-base">
            Common questions about trials, billing, and plan limits.
          </p>
        </div>

        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {PRICING_FAQ.map((item, index) => {
            const isOpen = open === index;
            return (
              <div
                key={item.q}
                className="overflow-hidden rounded-xl border border-line bg-bg-elev shadow-card"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
                >
                  <span className="text-sm font-semibold text-ink sm:text-base">{item.q}</span>
                  <ChevronDown
                    className={cn(
                      'size-5 shrink-0 text-ink-3 transition-transform duration-200',
                      isOpen && 'rotate-180',
                    )}
                  />
                </button>
                <div
                  className={cn(
                    'grid transition-all duration-200',
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="border-t border-line px-5 pb-5 pt-4 text-sm leading-7 text-ink-2 sm:px-6">
                      {item.a}
                    </p>
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
