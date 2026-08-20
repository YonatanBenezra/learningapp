'use client';

import { useState, type ButtonHTMLAttributes } from 'react';
import { Menu, PanelLeft, Search } from 'lucide-react';
import { useTranslation } from '@/src/i18n';
import { ThemeToggle } from '@/src/components/ui/theme-toggle';
import { useSidebar } from './Sidebar';
import { LanguageSelector } from './LanguageSelector';
import { ProfileDropdown } from './ProfileDropdown';
import { NotificationDropdown } from './NotificationDropdown';
import { cn } from '@/src/lib/utils';

function TopbarIconButton({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        'relative inline-grid size-9 shrink-0 place-items-center rounded-xl border border-line text-ink-2 transition',
        'hover:border-line-2 hover:bg-bg-soft hover:text-ink',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function AdminTopbar() {
  const { t } = useTranslation();
  const { openMobile, toggle: toggleSidebar } = useSidebar();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg-elev/90 backdrop-blur-md">
      <div className="flex h-[60px] w-full items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <TopbarIconButton
            onClick={openMobile}
            className="lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="size-[18px]" />
          </TopbarIconButton>

          <TopbarIconButton
            onClick={toggleSidebar}
            className="hidden lg:inline-grid"
            aria-label="Toggle sidebar"
          >
            <PanelLeft className="size-[18px]" />
          </TopbarIconButton>

          <div className="relative hidden min-w-0 flex-1 md:block md:max-w-md lg:max-w-xl">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
            <input
              type="search"
              placeholder={t('common.search')}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={cn(
                'h-10 w-full rounded-full border bg-bg-soft pl-10 pr-4 text-sm text-ink outline-none transition placeholder:text-ink-3',
                searchFocused
                  ? 'border-primary/30 bg-bg-elev ring-2 ring-primary/10'
                  : 'border-line hover:border-line-2',
              )}
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <TopbarIconButton className="md:hidden" aria-label={t('common.search')}>
            <Search className="size-[18px]" />
          </TopbarIconButton>

          <ThemeToggle className="size-9 rounded-xl" />

          <LanguageSelector compact />

          <NotificationDropdown />

          <div className="mx-0.5 hidden h-6 w-px bg-line sm:block" />

          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
}
