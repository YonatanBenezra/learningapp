'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, BarChart3, BookOpen, DollarSign, Plus } from 'lucide-react';
import { useTranslation } from '@/src/i18n';
import { cn } from '@/src/lib/utils';

const links = [
  { href: '/instructor/dashboard', icon: BarChart3, labelKey: 'nav.instructorDashboard' as const },
  { href: '/instructor/courses', icon: BookOpen, labelKey: 'nav.instructorCourses' as const },
  { href: '/instructor/sales', icon: DollarSign, labelKey: 'nav.instructorSales' as const },
];

export function InstructorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-line bg-bg-elev">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-medium text-ink-2 hover:text-primary"
            >
              <ArrowLeft className="size-4" />
              {t('common.backToApp')}
            </Link>
            <h1 className="mt-2 text-xl font-bold text-ink">{t('nav.instructor')}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <nav className="flex flex-wrap gap-2">
              {links.map((link) => {
                const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary/[0.08] text-primary'
                        : 'text-ink-2 hover:bg-bg-soft hover:text-ink',
                    )}
                  >
                    <link.icon className="size-4" />
                    {t(link.labelKey)}
                  </Link>
                );
              })}
            </nav>
            <Link
              href="/instructor/courses/new"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-ink hover:bg-primary-dark"
            >
              <Plus className="size-4" />
              {t('instructor.newCourse')}
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
