'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Container } from './Container';
import { cn } from '@/src/lib/utils';

const faqs = [
  {
    q: 'How does ABC build a course?',
    a: 'You give it a subject, level and a few topics. The AI generates a structured Course → Module → Lesson tree, plus quizzes and exams, usually in about 12 seconds.',
  },
  {
    q: 'Are the labs real or just videos?',
    a: 'Real. Code runs in network-isolated, resource-capped sandboxes; SOC and network labs are interactive scenarios; the terminal is a safe emulated shell. You do the work and get graded.',
  },
  {
    q: 'Do I need to pay to start?',
    a: 'No. The free tier lets you generate a course and use daily labs, quizzes and exams — no card required. Upgrade to Premium only when you want more.',
  },
  {
    q: 'Can I export or delete my data?',
    a: 'Anytime. One click exports everything you have created; deleting your account soft-deletes immediately and permanently purges after a short retention window.',
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-bg-soft py-20">
      <Container>
        <div className="mx-auto mb-11 flex max-w-[640px] flex-col items-center gap-3.5 text-center">
          <span className="inline-flex rounded-full bg-primary-soft px-3.5 py-1.5 text-[12.5px] font-semibold text-primary">
            FAQ
          </span>
          <h2 className="text-[clamp(1.75rem,4vw,2.6rem)] font-bold tracking-tight">
            Frequently asked questions.
          </h2>
        </div>

        <div className="mx-auto flex max-w-[760px] flex-col gap-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="overflow-hidden rounded-2xl border border-line bg-bg">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 px-5 py-[18px] text-left text-[15.5px] font-semibold"
                >
                  {f.q}
                  <span className="grid size-6 flex-none place-items-center rounded-md bg-primary-soft text-primary">
                    <Plus className={cn('size-4 transition-transform', isOpen && 'rotate-45')} />
                  </span>
                </button>
                <div
                  className={cn(
                    'grid transition-all duration-300',
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-[18px] text-[14.5px] text-ink-2">{f.a}</p>
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
