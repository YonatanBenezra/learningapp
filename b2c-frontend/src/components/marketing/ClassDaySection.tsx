'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslation, useClassDays } from '@/src/i18n';
import { Container } from './Container';

export function ClassDaySection() {
  const { t } = useTranslation();
  const classDays = useClassDays();

  return (
    <section className="py-16 lg:py-20">
      <Container>
        <div className="grid items-center gap-10 rounded-[28px] border border-line bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
          <div className="relative overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#EDE9FE,#DBEAFE)] p-8 lg:p-10">
            <div className="absolute -right-8 -top-8 size-32 rounded-full bg-secondary/20 blur-2xl" />
            <blockquote className="relative text-lg leading-relaxed text-[#334155] sm:text-xl">
              &ldquo;{t('marketing.classDayQuote')}&rdquo;
            </blockquote>
            <div className="relative mt-8 flex items-center gap-4">
              <Image
                src="https://i.pravatar.cc/100?img=47"
                alt="Alisa Oliva"
                width={56}
                height={56}
                className="size-14 rounded-full border-2 border-white object-cover shadow-md"
              />
              <div>
                <p className="text-lg font-bold text-ink">Alisa Oliva</p>
                <p className="text-sm text-ink-2">{t('marketing.roleWebDesigner')}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[28px] font-bold text-ink">{t('marketing.ourClassDay')}</h3>
            <ul className="mt-6 space-y-3">
              {classDays.map(({ day, time }) => (
                <li
                  key={day}
                  className="flex items-center justify-between rounded-xl border border-line bg-bg-soft px-4 py-3"
                >
                  <span className="font-semibold text-ink">{day}</span>
                  <span className="text-sm text-ink-2">{time}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="mt-8 inline-flex h-12 items-center rounded-xl bg-secondary px-7 text-sm font-semibold text-white shadow-[var(--shadow-accent)] transition-colors hover:bg-secondary-2"
            >
              {t('marketing.bookFreeClass')}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
