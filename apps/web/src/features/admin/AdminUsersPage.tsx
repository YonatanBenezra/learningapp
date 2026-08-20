'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Search } from 'lucide-react';
import type { Role } from '@/src/domain/user';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Skeleton } from '@/src/components/ui/skeleton';
import {
  AdminFilterBarSkeleton,
  AdminReportLoadingShell,
  AdminTableSectionSkeleton,
} from './AdminUi';
import { useTranslation } from '@/src/i18n';
import { cn } from '@/src/lib/utils';
import type { AdminUser } from './adminApi';
import { useAdminUsers, useSetUserRole } from './useAdmin';

const ROLES: Role[] = ['user', 'instructor', 'admin'];
const TIERS = ['free', 'standard', 'premium'] as const;

function InlineMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[120px] flex-1 px-5 py-4 sm:px-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-3">{label}</p>
      <p className="mt-1.5 font-heading text-2xl font-semibold tabular-nums text-ink">{value}</p>
    </div>
  );
}

function formatJoined(value?: string) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function roleBadgeVariant(role: Role): 'default' | 'primary' | 'warn' {
  if (role === 'admin') return 'warn';
  if (role === 'instructor') return 'primary';
  return 'default';
}

function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="min-w-[148px]">
      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-ink-3">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className={cn(
          'h-9 w-full rounded-md border border-line bg-bg px-3 text-sm capitalize text-ink',
          'outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15',
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="capitalize">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function UserRow({
  user,
  onRoleChange,
  pending,
}: {
  user: AdminUser;
  onRoleChange: (role: Role) => void;
  pending: boolean;
}) {
  const { t } = useTranslation();
  const deleted = Boolean(user.deletedAt);

  return (
    <tr
      className={cn(
        'border-b border-line last:border-b-0',
        deleted ? 'bg-bad-soft/20' : 'hover:bg-bg-soft/80',
      )}
    >
      <td className="px-5 py-4 sm:px-6">
        <div className="min-w-[200px]">
          <p className={cn('font-medium text-ink', deleted && 'line-through opacity-70')}>
            {user.email}
          </p>
          <p className="mt-0.5 text-sm text-ink-3">{user.name?.trim() || t('adminCommon.noDisplayName')}</p>
        </div>
      </td>
      <td className="px-5 py-4 sm:px-6">
        <Badge variant={roleBadgeVariant(user.role)} className="capitalize">
          {user.role}
        </Badge>
      </td>
      <td className="px-5 py-4 capitalize sm:px-6">
        <span className="text-sm text-ink-2">{user.tier}</span>
      </td>
      <td className="px-5 py-4 sm:px-6">
        {deleted ? (
          <Badge variant="bad">{t('adminCommon.deleted')}</Badge>
        ) : (
          <Badge variant="good">{t('adminCommon.active')}</Badge>
        )}
      </td>
      <td className="px-5 py-4 text-sm tabular-nums text-ink-2 sm:px-6">
        {formatJoined(user.createdAt)}
      </td>
      <td className="px-5 py-4 sm:px-6">
        <select
          value={user.role}
          disabled={pending || deleted}
          onChange={(e) => onRoleChange(e.target.value as Role)}
          className={cn(
            'h-9 min-w-[132px] rounded-md border border-line bg-bg-elev px-3 text-sm text-ink',
            'outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15',
            'disabled:cursor-not-allowed disabled:opacity-50',
          )}
          aria-label={`Change role for ${user.email}`}
        >
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </td>
    </tr>
  );
}

export function AdminUsersPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [tierFilter, setTierFilter] = useState<(typeof TIERS)[number] | 'all'>('all');

  const applySearch = () => {
    setSearchQuery(searchInput.trim());
    setPage(1);
  };

  const filtersActive = roleFilter !== 'all' || tierFilter !== 'all' || searchQuery.length > 0;

  const clearFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setRoleFilter('all');
    setTierFilter('all');
    setPage(1);
  };

  const usersQ = useAdminUsers({
    page,
    search: searchQuery || undefined,
    role: roleFilter === 'all' ? undefined : roleFilter,
    tier: tierFilter === 'all' ? undefined : tierFilter,
  });
  const roleMut = useSetUserRole();

  const totalPages = usersQ.data ? Math.max(1, Math.ceil(usersQ.data.total / usersQ.data.limit)) : 1;
  const rangeStart = usersQ.data ? (usersQ.data.page - 1) * usersQ.data.limit + 1 : 0;
  const rangeEnd = usersQ.data
    ? Math.min(usersQ.data.page * usersQ.data.limit, usersQ.data.total)
    : 0;

  const pageStats = useMemo(() => {
    const items = usersQ.data?.items ?? [];
    return {
      active: items.filter((u) => !u.deletedAt).length,
      deleted: items.filter((u) => u.deletedAt).length,
      admins: items.filter((u) => u.role === 'admin').length,
    };
  }, [usersQ.data?.items]);

  if (usersQ.isLoading) {
    return (
      <AdminReportLoadingShell>
        <div className="mt-6 rounded-md border border-line bg-bg-elev p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <Skeleton className="h-10 w-full max-w-md rounded-md" />
            <AdminFilterBarSkeleton filters={2} />
          </div>
        </div>
        <AdminTableSectionSkeleton className="mt-6" filterCount={0} rows={10} />
      </AdminReportLoadingShell>
    );
  }

  if (usersQ.isError || !usersQ.data) {
    return (
      <div className="flex w-full items-center justify-center px-4 py-20">
        <div className="rounded-md border border-line bg-bg-elev px-8 py-10 text-center">
          <p className="text-ink-2">{t('admin.accessDenied')}</p>
          <Button variant="soft" className="mt-4 rounded-md" onClick={() => usersQ.refetch()}>
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  const { data } = usersQ;

  const roleOptions: { value: Role | 'all'; label: string }[] = [
    { value: 'all', label: t('adminCommon.allRoles') },
    ...ROLES.map((role) => ({ value: role, label: role })),
  ];

  const tierOptions: { value: (typeof TIERS)[number] | 'all'; label: string }[] = [
    { value: 'all', label: t('adminCommon.allTiers') },
    ...TIERS.map((tier) => ({ value: tier, label: tier })),
  ];

  return (
    <div className="w-full min-h-full bg-bg">
      <div className="border-b border-line bg-[var(--sidebar-bg)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              User directory
            </p>
            <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {t('admin.usersTitle')}
            </h1>
            <p className="mt-2 text-sm text-ink-2">
              Search accounts, review roles and tiers, and update access levels.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-fit rounded-md bg-bg-elev"
            onClick={() => usersQ.refetch()}
          >
            <RefreshCw className="size-3.5" />
            {t('adminCommon.refresh')}
          </Button>
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col divide-y divide-line rounded-md border border-line bg-bg-elev sm:flex-row sm:divide-x sm:divide-y-0">
          <InlineMetric label="Total matching" value={data.total.toLocaleString()} />
          <InlineMetric
            label="This page"
            value={`${rangeStart}–${rangeEnd}`}
          />
          <InlineMetric label="Active (page)" value={String(pageStats.active)} />
          <InlineMetric label="Admins (page)" value={String(pageStats.admins)} />
        </div>

        <div className="mt-6 rounded-md border border-line bg-bg-elev p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <form
              className="relative min-w-0 flex-1 lg:max-w-md"
              onSubmit={(e) => {
                e.preventDefault();
                applySearch();
              }}
            >
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('adminCommon.searchEnter')}
                className="rounded-md border-line bg-bg-soft pl-9"
              />
            </form>

            <div className="flex flex-wrap items-end gap-3">
              <FilterSelect
                label={t('adminCommon.colRole')}
                value={roleFilter}
                onChange={(value) => {
                  setRoleFilter(value);
                  setPage(1);
                }}
                options={roleOptions}
              />
              <FilterSelect
                label={t('adminCommon.colTier')}
                value={tierFilter}
                onChange={(value) => {
                  setTierFilter(value);
                  setPage(1);
                }}
                options={tierOptions}
              />
              {filtersActive ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 rounded-md px-3 text-sm text-ink-2"
                  onClick={clearFilters}
                >
                  Clear filters
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <section className="mt-6 overflow-hidden rounded-md border border-line bg-bg-elev">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-bg-soft text-[11px] uppercase tracking-[0.14em] text-ink-3">
                  <th className="px-5 py-3 font-semibold sm:px-6">{t('adminCommon.colUser')}</th>
                  <th className="px-5 py-3 font-semibold sm:px-6">{t('adminCommon.colRole')}</th>
                  <th className="px-5 py-3 font-semibold sm:px-6">{t('adminCommon.colTier')}</th>
                  <th className="px-5 py-3 font-semibold sm:px-6">{t('adminCommon.colStatus')}</th>
                  <th className="px-5 py-3 font-semibold sm:px-6">{t('adminCommon.colJoined')}</th>
                  <th className="px-5 py-3 font-semibold sm:px-6">{t('adminCommon.colSetRole')}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.length ? (
                  data.items.map((user) => (
                    <UserRow
                      key={user.id}
                      user={user}
                      pending={roleMut.isPending && roleMut.variables?.userId === user.id}
                      onRoleChange={(role) => {
                        if (role === user.role) return;
                        roleMut.mutate({ userId: user.id, role });
                      }}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-ink-3">
                      {t('adminCommon.noMatchFilter')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-line bg-bg-soft/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm text-ink-3">
              Page {page} of {totalPages} · {data.total.toLocaleString()} users
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-md bg-bg-elev"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-md bg-bg-elev"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminUsersPage;
