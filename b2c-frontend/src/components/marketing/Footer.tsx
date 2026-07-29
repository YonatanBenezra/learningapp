'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { FOOTER_LINKS } from './data';
import { Container } from './Container';
import { FOOTER_SOCIAL_LINKS } from './SocialIcons';

function FooterLogo() {
  return (
    <Link href="#top" className="relative inline-flex flex-col leading-none" aria-label="AIStudy Home">
      <span className="text-[34px] font-bold tracking-[-0.02em]">
        <span className="text-primary">AI</span>
        <span className="text-ink">Study</span>
      </span>
      <svg
        className="absolute -bottom-1 left-[34px] h-[10px] w-[72px] text-primary"
        viewBox="0 0 72 10"
        fill="none"
        aria-hidden="true"
      >
        <path d="M2 8C18 2 34 1 70 6" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </Link>
  );
}

function FooterWidgetTitle({ children }: { children: ReactNode }) {
  return (
    <h4 className="relative mb-6 text-[22px] font-medium leading-6 text-ink after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-[52px] after:rounded-sm after:bg-primary after:content-['']">
      {children}
    </h4>
  );
}

function FooterLinkList({ items, hrefPrefix }: { items: readonly string[]; hrefPrefix: string }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item}>
          <Link
            href={hrefPrefix}
            className="inline-flex items-center gap-2 text-base font-medium text-ink-2 transition-colors hover:text-primary"
          >
            <Plus className="size-2.5 shrink-0 text-primary" strokeWidth={3} />
            {item}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function FooterCategoryList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item}>
          <Link
            href={`/courses?category=${encodeURIComponent(item)}`}
            className="inline-flex items-center gap-2 text-base font-medium text-ink-2 transition-colors hover:text-primary"
          >
            <Plus className="size-2.5 shrink-0 text-primary" strokeWidth={3} />
            {item}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function AppStoreBadge({ variant }: { variant: 'google' | 'apple' }) {
  const isGoogle = variant === 'google';
  return (
    <span className="inline-flex h-12 min-w-[148px] flex-col justify-center rounded-lg border border-line bg-bg-elev px-4 py-2 transition-colors hover:border-primary/40">
      <span className="text-[10px] uppercase tracking-wide text-ink-3">
        {isGoogle ? 'Get it on' : 'Download on the'}
      </span>
      <span className="text-sm font-semibold text-ink">{isGoogle ? 'Google Play' : 'App Store'}</span>
    </span>
  );
}

function PaymentBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex h-7 items-center rounded border border-line bg-bg-soft px-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-2">
      {label}
    </span>
  );
}

export function Footer() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <footer id="contact" className="relative mt-auto shrink-0 bg-bg">
      <div className="relative overflow-hidden border-t border-ink/[0.06] dark:border-white/[0.05]">
        <Container className="relative py-14 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-6">
            <div className="lg:col-span-4">
              <FooterLogo />
              <p className="mt-4 max-w-sm text-base leading-relaxed text-ink-2">
                Lorem Ipsum is simply dummy text of the printing and typesetting
              </p>

              <div className="mt-4 flex gap-3">
                {FOOTER_SOCIAL_LINKS.map(({ label, Icon }) => (
                  <Link
                    key={label}
                    href="#contact"
                    aria-label={label}
                    className="grid size-10 place-items-center rounded-full border border-line bg-bg-elev text-ink-2 transition-colors hover:border-primary hover:bg-primary hover:text-primary-ink"
                  >
                    <Icon className="size-4" />
                  </Link>
                ))}
              </div>

              <div className="mt-8">
                <h4 className="text-[22px] font-medium leading-6 text-ink">Download Apps</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link href="#contact" className="inline-block">
                    <AppStoreBadge variant="google" />
                  </Link>
                  <Link href="#contact" className="inline-block">
                    <AppStoreBadge variant="apple" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 lg:pl-3">
              <FooterWidgetTitle>Quick Links</FooterWidgetTitle>
              <FooterLinkList items={FOOTER_LINKS.quick} hrefPrefix="#top" />
            </div>

            <div className="lg:col-span-3 lg:pl-3">
              <FooterWidgetTitle>Support</FooterWidgetTitle>
              <FooterLinkList items={FOOTER_LINKS.support} hrefPrefix="#contact" />
            </div>

            <div className="lg:col-span-2 lg:pl-3">
              <FooterWidgetTitle>Our Category</FooterWidgetTitle>
              <FooterCategoryList items={FOOTER_LINKS.categories} />
            </div>
          </div>
        </Container>

        <div className="border-t border-ink/[0.06] bg-bg-soft dark:border-white/[0.05]">
          <Container className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-base text-ink-2">
              Copyright © {new Date().getFullYear()}{' '}
              <Link href="#top" className="font-medium text-primary transition-colors hover:text-primary-dark">
                AIStudy
              </Link>
              . All Rights Reserved
            </p>
            <ul className="flex flex-wrap items-center gap-3">
              {['Visa', 'Mastercard', 'Amex'].map((label) => (
                <li key={label}>
                  <Link href="#contact">
                    <PaymentBadge label={label} />
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </div>
      </div>

      <button
        type="button"
        aria-label="Go back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 bg-transparent px-2 py-4 transition-all lg:flex ${
          showTop ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <span className="inline-block h-[30px] w-1 rounded-full bg-primary/30">
          <span className="block h-full w-full rounded-full bg-primary" />
        </span>
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-primary [writing-mode:vertical-rl]">
          Go Back Top
        </span>
      </button>
    </footer>
  );
}
