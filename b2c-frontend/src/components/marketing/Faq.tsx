'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Container } from './Container';
import { SectionHeading } from './SectionHeading';
import { cn } from '@/src/lib/utils';

const FAQ_ITEMS = [
  {
    q: 'How does AIStudy build a course?',
    a: 'You choose a subject, skill level, and topics. AIStudy generates a structured course with modules, lessons, quizzes, and exams — usually in about 10–15 seconds.',
  },
  {
    q: 'Are the labs real or just videos?',
    a: 'Real. Code runs in sandboxed environments; network and SOC labs are interactive scenarios; the terminal is a safe emulated shell. You practice and get graded on your work.',
  },
  {
    q: 'Do I need to pay to start?',
    a: 'No. Start with a 3-month free trial — generate courses, take assessments, and use daily labs, quizzes, and exams without a credit card.',
  },
  {
    q: 'Can I export or delete my data?',
    a: 'Yes. Export everything you have created in one click from Settings. Deleting your account soft-deletes immediately and permanently purges data after a short retention window.',
  },
  {
    q: 'What skill assessments are available?',
    a: 'Take a quick assessment in Programming, AI, Cyber Security, Networking, Data Science, and more. Your results can pre-fill a personalized course path.',
  },
] as const;

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section
      id="faq"
      data-tour="tour-faq"
      className="border-t border-ink/[0.06] bg-bg-soft py-16 dark:border-white/[0.08] lg:py-24"
    >
      <Container>
        <SectionHeading
          eyebrow="FAQ"
          title="Frequently asked questions"
          description="Everything you need to know about AI-generated courses, hands-on labs, and getting started."
          className="mb-12 lg:mb-14"
        />

        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = open === index;
            return (
              <div
                key={item.q}
                className="overflow-hidden rounded-2xl border border-line bg-bg-elev shadow-card"
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
