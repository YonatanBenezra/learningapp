'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Menu, X } from 'lucide-react';
import { buttonClasses } from '@/src/components/ui/button';
import { ThemeToggle } from '@/src/components/ui/theme-toggle';
import { Container } from './Container';
import { cn } from '@/src/lib/utils';

const links = [
  { label: 'Home', href: '#top' },
  { label: 'Features', href: '#features', caret: true },
  { label: 'Domains', href: '#domains', caret: true },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-transparent transition-colors',
        scrolled && 'border-line bg-bg/80 backdrop-blur-md',
      )}
    >
      <Container className="flex h-[70px] items-center justify-between">
        <Link href="#top" className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight">
          <span className="grid size-8 place-items-center rounded-[10px] bg-linear-to-br from-primary to-primary-2 font-extrabold text-primary-ink shadow-card">
            A
          </span>
          ABC
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="inline-flex items-center gap-1 text-[15px] font-medium text-ink transition-colors hover:text-primary"
            >
              {l.label}
              {l.caret && <ChevronDown className="size-3.5 opacity-50" />}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/signup"
            className={buttonClasses({ size: 'sm', className: 'hidden sm:inline-flex' })}
          >
            Start Free Trial
          </Link>
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="grid size-10 place-items-center rounded-xl border border-line-2 text-ink-2 md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </Container>

      {open && (
        <nav className="border-t border-line bg-bg px-6 py-3 md:hidden">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-2.5 text-[15px] font-medium text-ink-2 hover:text-primary"
            >
              {l.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
