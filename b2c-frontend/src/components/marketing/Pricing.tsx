'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { buttonClasses } from '@/src/components/ui/button';
import { Container } from './Container';

const freeFeatures = [
  '1 active AI course',
  'Daily labs, quizzes & exams',
  'Streaks & achievements',
  'Full data export & deletion',
];
const proFeatures = [
  'Up to 25 active courses',
  'Much higher daily AI limits',
  'Priority generation & grading',
  'Extended lab sessions',
];

function Feature({ children }: { children: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[20px_1fr] gap-2.5 text-sm text-ink-2">
      <Check className="mt-0.5 size-4 text-good" strokeWidth={2.6} />
      {children}
    </li>
  );
}

export function Pricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="py-20">
      <Container>
        <div className="mx-auto mb-11 flex max-w-[640px] flex-col items-center gap-3.5 text-center">
          <span className="inline-flex rounded-full bg-primary-soft px-3.5 py-1.5 text-[12.5px] font-semibold text-primary">
            Pricing
          </span>
          <h2 className="text-[clamp(1.75rem,4vw,2.6rem)] font-bold tracking-tight">
            Simple plans for every stage.
          </h2>
        </div>

        <div className="rounded-[26px] bg-bg-lav p-6 sm:p-11">
          <div className="mb-8 flex justify-center">
            <div className="inline-flex rounded-full border border-line bg-bg p-1">
              <button
                type="button"
                onClick={() => setYearly(false)}
                className={`rounded-full px-4.5 py-2 text-[13px] font-semibold transition ${!yearly ? 'bg-primary text-primary-ink' : 'text-ink-2'}`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setYearly(true)}
                className={`rounded-full px-4.5 py-2 text-[13px] font-semibold transition ${yearly ? 'bg-primary text-primary-ink' : 'text-ink-2'}`}
              >
                Yearly · save 20%
              </button>
            </div>
          </div>

          <div className="mx-auto grid max-w-[800px] gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-4 rounded-[20px] border border-line bg-bg p-8">
              <div className="text-sm font-semibold text-ink-2">Free</div>
              <div className="text-4xl font-extrabold tracking-tight">
                $0<span className="text-sm font-medium text-ink-3"> / forever</span>
              </div>
              <ul className="flex flex-col gap-2.5">
                {freeFeatures.map((f) => (
                  <Feature key={f}>{f}</Feature>
                ))}
              </ul>
              <Link
                href="/signup"
                className={buttonClasses({ variant: 'soft', className: 'mt-auto w-full' })}
              >
                Start free
              </Link>
            </div>

            <div className="relative flex flex-col gap-4 rounded-[20px] border-2 border-primary bg-bg p-8 shadow-card">
              <span className="absolute -top-3 left-8 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-ink">
                Recommended
              </span>
              <div className="text-sm font-semibold text-ink-2">Premium</div>
              <div className="text-4xl font-extrabold tracking-tight">
                {yearly ? '$115' : '$12'}
                <span className="text-sm font-medium text-ink-3"> / {yearly ? 'year' : 'month'}</span>
              </div>
              <ul className="flex flex-col gap-2.5">
                {proFeatures.map((f) => (
                  <Feature key={f}>{f}</Feature>
                ))}
              </ul>
              <Link href="/signup" className={buttonClasses({ className: 'mt-auto w-full' })}>
                Go Premium
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
