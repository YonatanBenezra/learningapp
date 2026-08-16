'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUp } from 'lucide-react';
import { CATEGORIES } from './data';
import { Container } from './Container';
import { FOOTER_SOCIAL_LINKS } from './SocialIcons';
import { APP_NAME } from '@/src/lib/brand';
import { BrandWordmark, LabPathMark } from '@/src/components/ui/brand-wordmark';
import { cn } from '@/src/lib/utils';
import { useTranslation, useMarketingNavLinks, useCategoryLabel } from '@/src/i18n';

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold tracking-tight text-ink dark:text-white">{children}</h3>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm leading-6 text-ink-2 transition-colors hover:text-ink dark:text-white/65 dark:hover:text-white"
    >
      {children}
    </Link>
  );
}

function FooterLinkList({ items }: { items: readonly { label: string; href: string }[] }) {
  return (
    <ul className="mt-4 space-y-3">
      {items.map((item) => (
        <li key={`${item.href}-${item.label}`}>
          <FooterLink href={item.href}>{item.label}</FooterLink>
        </li>
      ))}
    </ul>
  );
}

function FooterCategoryItem({ title }: { title: string }) {
  const label = useCategoryLabel(title);
  return (
    <li>
      <FooterLink href={`/courses?category=${encodeURIComponent(title)}`}>{label}</FooterLink>
    </li>
  );
}

function FooterCategoryLinks() {
  return (
    <ul className="mt-4 space-y-3">
      {CATEGORIES.slice(0, 6).map((category) => (
        <FooterCategoryItem key={category.title} title={category.title} />
      ))}
    </ul>
  );
}

export function Footer() {
  const { t } = useTranslation();
  const navLinks = useMarketingNavLinks();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 480);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const supportLinks = useMemo(
    () => [
      { label: t('marketing.footerHelpContact'), href: '/contact' },
      { label: t('nav.pricing'), href: '/pricing' },
      { label: t('marketing.footerCreateAccount'), href: '/signup' },
    ],
    [t],
  );

  const legalLinks = useMemo(
    () => [
      { label: t('marketing.footerPrivacy'), href: '/contact' },
      { label: t('marketing.footerTerms'), href: '/contact' },
    ],
    [t],
  );

  const platformLinks = useMemo(
    () => navLinks.map((link) => ({ label: link.label, href: link.href })),
    [navLinks],
  );

  return (
    <footer id="contact" className="mt-auto shrink-0 border-t border-line bg-bg">
      <Container className="py-14 lg:py-16">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between lg:gap-16 xl:gap-20">
          <div className="max-w-md shrink-0">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5"
              aria-label={`${APP_NAME} home`}
            >
              <LabPathMark size="md" />
              <BrandWordmark size="md" />
            </Link>
            <p className="mt-4 text-sm leading-7 text-ink-2 dark:text-white/65">
              {t('marketing.footerTagline')}
            </p>
            <div className="mt-6 flex items-center gap-3">
              {FOOTER_SOCIAL_LINKS.map(({ label, Icon }) => (
                <Link
                  key={label}
                  href="/contact"
                  aria-label={label}
                  className="text-ink-3 transition-colors hover:text-primary dark:text-white/45 dark:hover:text-white"
                >
                  <Icon className="size-[18px]" />
                </Link>
              ))}
            </div>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:max-w-3xl">
            <div>
              <FooterHeading>{t('marketing.footerPlatform')}</FooterHeading>
              <FooterLinkList items={platformLinks} />
            </div>

            <div>
              <FooterHeading>{t('marketing.footerCategories')}</FooterHeading>
              <FooterCategoryLinks />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <FooterHeading>{t('marketing.footerSupport')}</FooterHeading>
              <FooterLinkList items={supportLinks} />
            </div>
          </div>
        </div>
      </Container>

      <div className="border-t border-line bg-bg-soft dark:bg-white/[0.03]">
        <Container className="flex flex-col-reverse gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-3 dark:text-white/45">
            {t('marketing.footerCopyright', {
              year: String(new Date().getFullYear()),
              appName: APP_NAME,
            })}
          </p>
          <nav aria-label={t('marketing.footerLegalNav')}>
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
              {legalLinks.map((item) => (
                <li key={item.label}>
                  <FooterLink href={item.href}>{item.label}</FooterLink>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </div>

      <button
        type="button"
        aria-label={t('marketing.footerBackToTop')}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={cn(
          'fixed bottom-24 end-5 z-40 grid size-10 place-items-center rounded-full border border-line bg-bg-elev text-ink-2 shadow-sm transition-all hover:text-primary dark:border-white/10 dark:bg-slate-900 dark:text-white/60 dark:hover:text-white sm:bottom-6 sm:end-6',
          showTop ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0',
        )}
      >
        <ArrowUp className="size-4" />
      </button>
    </footer>
  );
}
