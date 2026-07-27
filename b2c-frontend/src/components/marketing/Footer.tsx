'use client';

import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Mail, MapPin, Phone, Plus } from 'lucide-react';
import { FOOTER_CONTACT, FOOTER_LINKS } from './data';
import { Container } from './Container';
import { FOOTER_SOCIAL_LINKS } from './SocialIcons';

function FooterLogo() {
  return (
    <Link href="#top" className="relative inline-flex flex-col leading-none" aria-label="FiStudy Home">
      <span className="text-[34px] font-bold tracking-[-0.02em]">
        <span className="text-primary">AI</span>
        <span className="text-ink">Study</span>
      </span>
      <svg
        className="absolute -bottom-1 left-[34px] h-[10px] w-[72px] text-secondary"
        viewBox="0 0 72 10"
        fill="none"
        aria-hidden="true"
      >
        <path d="M2 8C18 2 34 1 70 6" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </Link>
  );
}

function ContactIcon({ type }: { type: (typeof FOOTER_CONTACT)[number]['icon'] }) {
  const Icon = type === 'mail' ? Mail : type === 'phone' ? Phone : MapPin;
  return <Icon className="size-5 text-primary" strokeWidth={2} />;
}

function FooterWidgetTitle({ children }: { children: ReactNode }) {
  return (
    <h4 className="relative mb-10 text-[24px] font-medium leading-6 text-ink after:absolute after:-bottom-2.5 after:left-0 after:h-0.5 after:w-[60px] after:rounded-sm after:bg-secondary after:content-['']">
      {children}
    </h4>
  );
}

function FooterLinkList({ items, hrefPrefix }: { items: readonly string[]; hrefPrefix: string }) {
  return (
    <ul className="space-y-5">
      {items.map((item) => (
        <li key={item}>
          <Link
            href={hrefPrefix}
            className="inline-flex items-center gap-2 text-[18px] font-medium text-ink-2 transition-colors hover:text-primary"
          >
            <Plus className="size-2.5 shrink-0 text-secondary" strokeWidth={3} />
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
    <span className="inline-flex h-12 min-w-[148px] flex-col justify-center rounded-lg border border-line bg-bg-elev px-4 py-2 transition-colors hover:border-primary">
      <span className="text-[10px] uppercase tracking-wide text-ink-3">
        {isGoogle ? 'Get it on' : 'Download on the'}
      </span>
      <span className="text-sm font-semibold text-ink">{isGoogle ? 'Google Play' : 'App Store'}</span>
    </span>
  );
}

function PaymentBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex h-7 items-center rounded border border-line bg-bg px-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-2">
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
    <footer id="contact" className="relative bg-bg-elev">
      {/* Contact bar */}
      {/* <section className="bg-secondary py-10">
        <Container>
          <ul className="grid gap-8 md:grid-cols-3 md:gap-6">
            {FOOTER_CONTACT.map((item, index) => (
              <li
                key={item.label}
                className={index > 0 ? 'relative md:border-l md:border-white/25 md:pl-8 lg:pl-12' : undefined}
              >
                <div className="flex items-center gap-5">
                  <span className="grid size-11 shrink-0 place-items-center rounded-lg border border-line bg-white text-primary">
                    <ContactIcon type={item.icon} />
                  </span>
                  <div>
                    <p className="text-sm leading-none text-white/85">{item.label}</p>
                    {item.href ? (
                      <a
                        href={item.href}
                        className="mt-1 block text-[22px] font-medium leading-tight text-white transition-colors hover:text-primary-deep sm:text-2xl"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="mt-1 text-[22px] font-medium leading-tight text-white sm:text-2xl">{item.value}</p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section> */}

      {/* Main footer */}
      <div className="relative overflow-hidden border-t border-line bg-[var(--marketing-surface)]">
        <Container className="relative py-24 lg:py-[116px] lg:pb-[120px]">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <FooterLogo />
              <p className="mt-6 max-w-sm text-base leading-relaxed text-ink-2">
                Lorem Ipsum is simply dummy text of the printing and typesetting
              </p>

              <div className="mt-6 flex gap-4">
                {FOOTER_SOCIAL_LINKS.map(({ label, Icon }) => (
                  <Link
                    key={label}
                    href="#contact"
                    aria-label={label}
                    className="grid size-10 place-items-center rounded-full border border-line bg-bg-elev text-ink-2 transition-colors hover:border-primary hover:bg-primary hover:text-white"
                  >
                    <Icon className="size-4" />
                  </Link>
                ))}
              </div>

              <div className="mt-14">
                <h4 className="text-[24px] font-medium leading-6 text-ink">Download Apps</h4>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Link href="#contact" className="inline-block">
                    <AppStoreBadge variant="google" />
                  </Link>
                  <Link href="#contact" className="inline-block">
                    <AppStoreBadge variant="apple" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 lg:pl-5">
              <FooterWidgetTitle>Quick Links</FooterWidgetTitle>
              <FooterLinkList items={FOOTER_LINKS.quick} hrefPrefix="#top" />
            </div>

            <div className="lg:col-span-3 lg:pl-5">
              <FooterWidgetTitle>Support</FooterWidgetTitle>
              <FooterLinkList items={FOOTER_LINKS.support} hrefPrefix="#contact" />
            </div>

            <div className="lg:col-span-2 lg:pl-5">
              <FooterWidgetTitle>Our Courses</FooterWidgetTitle>
              <FooterLinkList items={FOOTER_LINKS.courses} hrefPrefix="#courses" />
            </div>
          </div>
        </Container>

        <div className="border-t border-dashed border-line bg-bg-elev">
          <Container className="flex flex-col gap-6 py-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-base text-ink-2">
              Copyright © 2024{' '}
              <Link href="#top" className="text-secondary transition-colors hover:text-primary">
                FiStudy
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
        <span className="relative inline-block h-[30px] w-1 overflow-hidden rounded-full bg-primary">
          <span className="absolute inset-0 bg-secondary" />
        </span>
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-primary [writing-mode:vertical-rl]">
          Go Back Top
        </span>
      </button>
    </footer>
  );
}
