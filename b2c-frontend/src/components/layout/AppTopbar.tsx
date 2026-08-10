'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '@/src/store/authStore';
import { useLogout } from '@/src/features/auth';
import { Avatar } from '@/src/components/ui/avatar';
import { Button } from '@/src/components/ui/button';
import { ThemeToggle } from '@/src/components/ui/theme-toggle';
import { APP_NAME } from '@/src/lib/brand';
import { cn } from '@/src/lib/utils';
import { getUserAvatarProps } from '@/src/lib/userDisplay';

const nav = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Courses', href: '/my-courses' },
  { label: 'Achievements', href: '/achievements' },
];

export function AppTopbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-extrabold tracking-tight">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-ink text-sm font-bold">
              L
            </span>
            {APP_NAME}
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((n) => {
              const active = pathname === n.href || pathname.startsWith(`${n.href}/`);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active ? 'bg-primary-soft text-primary' : 'text-ink-2 hover:text-ink',
                  )}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Avatar {...getUserAvatarProps(user)} />
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
