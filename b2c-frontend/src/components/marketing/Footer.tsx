'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { FOOTER_LINKS } from './data';
import { Container } from './Container';
import { FOOTER_SOCIAL_LINKS } from './SocialIcons';

function FooterLogo() {
  return (
    <Link href="/" className="relative inline-flex flex-col leading-none" aria-label="AIStudy Home">
      <span className="text-[28px] font-bold tracking-[-0.02em] sm:text-[34px]">
        <span className="text-primary">AI</span>
        <span className="text-ink">Study</span>
      </span>
      <svg
        className="absolute -bottom-1 left-[28px] h-[10px] w-[72px] text-primary sm:left-[34px]"
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
    <h4 className="relative mb-4 text-lg font-semibold leading-6 text-ink after:absolute after:-bottom-2 after:left-0 after:h-0.5 after:w-10 after:rounded-sm after:bg-primary after:content-[''] sm:mb-6 sm:text-[22px] sm:font-medium sm:after:w-[52px]">
      {children}
    </h4>
  );
}

function FooterLinkList({ items }: { items: readonly { label: string; href: string }[] }) {
  return (
    <ul className="space-y-2.5 sm:space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <Link
            href={item.href}
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-2 transition-colors hover:text-primary sm:text-base"
          >
            <Plus className="size-2.5 shrink-0 text-primary" strokeWidth={3} />
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function FooterCategoryList({ items }: { items: readonly string[] }) {
  return (
    <ul className="space-y-2.5 sm:space-y-3">
      {items.map((item) => (
        <li key={item}>
          <Link
            href={`/courses?category=${encodeURIComponent(item)}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-2 transition-colors hover:text-primary sm:text-base"
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
    <span className="inline-flex h-11 min-w-[132px] flex-col justify-center rounded-lg border border-line bg-bg-elev px-3.5 py-2 transition-colors hover:border-primary/40 sm:h-12 sm:min-w-[148px] sm:px-4">
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
        <Container className="relative py-10 sm:py-12 lg:py-16">
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-8 xl:gap-x-10">
            <div className="col-span-2 lg:col-span-5">
              <FooterLogo />
              <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-2 sm:text-base">
                Turn any topic into a full AI-built course — then practice in real, hands-on labs.
              </p>

              <div className="mt-5 flex flex-wrap gap-2.5 sm:gap-3">
                {FOOTER_SOCIAL_LINKS.map(({ label, Icon }) => (
                  <Link
                    key={label}
                    href="/contact"
                    aria-label={label}
                    className="grid size-9 place-items-center rounded-full border border-line bg-bg-elev text-ink-2 transition-colors hover:border-primary hover:bg-primary hover:text-primary-ink sm:size-10"
                  >
                    <Icon className="size-4" />
                  </Link>
                ))}
              </div>

              <div className="mt-6 sm:mt-8">
                <h4 className="text-lg font-semibold text-ink sm:text-[22px] sm:font-medium">
                  Download Apps
                </h4>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href="/contact" className="inline-block">
                    <AppStoreBadge variant="google" />
                  </Link>
                  <Link href="/contact" className="inline-block">
                    <AppStoreBadge variant="apple" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="min-w-0 lg:col-span-3 lg:pl-2 xl:pl-4">
              <FooterWidgetTitle>Quick Links</FooterWidgetTitle>
              <FooterLinkList items={FOOTER_LINKS.quick} />
            </div>

            <div className="min-w-0 lg:col-span-4 lg:pl-2 xl:pl-4">
              <FooterWidgetTitle>Our Category</FooterWidgetTitle>
              <FooterCategoryList items={FOOTER_LINKS.categories} />
            </div>
          </div>
        </Container>

        <div className="border-t border-ink/[0.06] bg-bg-soft dark:border-white/[0.05]">
          <Container className="flex flex-col items-center gap-4 py-5 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <p className="text-sm text-ink-2 sm:text-base">
              Copyright © {new Date().getFullYear()}{' '}
              <Link href="/" className="font-medium text-primary transition-colors hover:text-primary-dark">
                AIStudy
              </Link>
              . All Rights Reserved
            </p>
            <ul className="flex flex-wrap items-center justify-center gap-2 sm:justify-end sm:gap-3">
              {['Visa', 'Mastercard', 'Amex'].map((label) => (
                <li key={label}>
                  <Link href="/contact">
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
        className={`fixed right-2 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 bg-transparent px-2 py-4 transition-all sm:right-0 lg:flex ${
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
