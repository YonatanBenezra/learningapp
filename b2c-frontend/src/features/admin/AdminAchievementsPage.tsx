'use client';

import { useMemo, useState } from 'react';
import { Award, Pencil, RefreshCw, Trophy } from 'lucide-react';
import { useTranslation } from '@/src/i18n';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import {
  AdminFormTableSkeleton,
  AdminReportLoadingShell,
} from './AdminUi';
import { cn } from '@/src/lib/utils';
import type { AdminAchievement } from './adminApi';
import { useAdminAchievements, useUpsertAchievement } from './useAdmin';

const EMPTY_FORM = { key: '', title: '', description: '', icon: '' };

function InlineMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[120px] flex-1 px-5 py-4 sm:px-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-3">{label}</p>
      <p className="mt-1.5 font-heading text-2xl font-semibold tabular-nums text-ink">{value}</p>
    </div>
  );
}

function formatDate(value?: string) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function AchievementIcon({ icon }: { icon?: string }) {
  return (
    <span className="grid size-10 place-items-center rounded-lg border border-line bg-primary/10 text-lg text-primary">
      {icon ? icon : <Award className="size-5" />}
    </span>
  );
}

export function AdminAchievementsPage() {
  const { t } = useTranslation();
  const achievementsQ = useAdminAchievements();
  const upsertMut = useUpsertAchievement();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const derived = useMemo(() => {
    const items = achievementsQ.data?.achievements ?? [];
    return {
      total: items.length,
      withIcon: items.filter((item) => item.icon?.trim()).length,
      withDescription: items.filter((item) => item.description?.trim()).length,
    };
  }, [achievementsQ.data?.achievements]);

  function loadIntoForm(item: AdminAchievement) {
    setForm({
      key: item.key,
      title: item.title,
      description: item.description ?? '',
      icon: item.icon ?? '',
    });
    setEditingKey(item.key);
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingKey(null);
  }

  if (achievementsQ.isLoading) {
    return (
      <AdminReportLoadingShell>
        <AdminFormTableSkeleton className="mt-6" />
      </AdminReportLoadingShell>
    );
  }

  if (achievementsQ.isError) {
    return (
      <div className="flex w-full items-center justify-center px-4 py-20">
        <div className="rounded-md border border-line bg-bg-elev px-8 py-10 text-center">
          <p className="text-ink-2">{t('admin.accessDenied')}</p>
          <Button variant="soft" className="mt-4 rounded-md" onClick={() => achievementsQ.refetch()}>
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  const achievements = achievementsQ.data?.achievements ?? [];

  return (
    <div className="w-full min-h-full bg-bg">
      <div className="border-b border-line bg-[var(--sidebar-bg)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Gamification registry
            </p>
            <h1 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {t('admin.achievementsTitle')}
            </h1>
            <p className="mt-2 text-sm text-ink-2">
              Define and maintain platform badge definitions for learner milestones
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-fit rounded-md bg-bg-elev"
            onClick={() => achievementsQ.refetch()}
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col divide-y divide-line rounded-md border border-line bg-bg-elev sm:flex-row sm:divide-x sm:divide-y-0">
          <InlineMetric label="Total badges" value={String(derived.total)} />
          <InlineMetric label="With icon" value={String(derived.withIcon)} />
          <InlineMetric label="With description" value={String(derived.withDescription)} />
          <InlineMetric
            label="Mode"
            value={editingKey ? 'Editing' : 'Create'}
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-md border border-line bg-bg-elev p-5">
            <div className="flex items-center gap-2">
              <Trophy className="size-4 text-primary" />
              <h2 className="font-heading text-lg font-semibold text-ink">
                {editingKey ? 'Update badge' : 'Create badge'}
              </h2>
            </div>
            <p className="mt-1 text-sm text-ink-2">
              {editingKey
                ? `Editing "${editingKey}" — saving will update the existing definition.`
                : 'Add a new achievement key and metadata.'}
            </p>

            <form
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                upsertMut.mutate(
                  {
                    key: form.key.trim(),
                    title: form.title.trim(),
                    description: form.description.trim() || undefined,
                    icon: form.icon.trim() || undefined,
                  },
                  {
                    onSuccess: () => resetForm(),
                  },
                );
              }}
            >
              <div>
                <Label htmlFor="ach-key">Key</Label>
                <Input
                  id="ach-key"
                  value={form.key}
                  onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
                  placeholder="first-lesson"
                  className="mt-1.5 rounded-md border-line bg-bg-soft"
                  required
                  readOnly={Boolean(editingKey)}
                />
              </div>
              <div>
                <Label htmlFor="ach-title">Title</Label>
                <Input
                  id="ach-title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="mt-1.5 rounded-md border-line bg-bg-soft"
                  required
                />
              </div>
              <div>
                <Label htmlFor="ach-desc">Description</Label>
                <Input
                  id="ach-desc"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="mt-1.5 rounded-md border-line bg-bg-soft"
                />
              </div>
              <div>
                <Label htmlFor="ach-icon">Icon</Label>
                <Input
                  id="ach-icon"
                  value={form.icon}
                  onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                  placeholder="🏆"
                  className="mt-1.5 rounded-md border-line bg-bg-soft"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button type="submit" className="rounded-md" disabled={upsertMut.isPending}>
                  {editingKey ? 'Update badge' : 'Create badge'}
                </Button>
                {editingKey ? (
                  <Button type="button" variant="ghost" className="rounded-md" onClick={resetForm}>
                    Cancel edit
                  </Button>
                ) : null}
              </div>
            </form>
          </aside>

          <section className="overflow-hidden rounded-md border border-line bg-bg-elev">
            <div className="border-b border-line bg-bg-soft/30 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-2">
                <Award className="size-4 text-primary" />
                <h2 className="font-heading text-lg font-semibold text-ink">Badge definitions</h2>
              </div>
              <p className="mt-1 text-sm text-ink-2">
                {achievements.length} achievement{achievements.length === 1 ? '' : 's'} configured
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-bg-soft text-[11px] uppercase tracking-[0.14em] text-ink-3">
                    <th className="px-5 py-3 font-semibold sm:px-6">Badge</th>
                    <th className="px-5 py-3 font-semibold sm:px-6">Key</th>
                    <th className="px-5 py-3 font-semibold sm:px-6">Description</th>
                    <th className="px-5 py-3 font-semibold sm:px-6">Created</th>
                    <th className="px-5 py-3 font-semibold sm:px-6">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {achievements.length ? (
                    achievements.map((item) => (
                      <tr
                        key={item.key}
                        className={cn(
                          'border-b border-line last:border-b-0 hover:bg-bg-soft/80',
                          editingKey === item.key && 'bg-primary/5',
                        )}
                      >
                        <td className="px-5 py-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <AchievementIcon icon={item.icon} />
                            <div>
                              <p className="font-medium text-ink">{item.title}</p>
                              {item.icon ? (
                                <Badge variant="default" className="mt-1">
                                  Custom icon
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-ink-2 sm:px-6">
                          {item.key}
                        </td>
                        <td className="max-w-sm px-5 py-4 text-ink-2 sm:px-6">
                          {item.description?.trim() || '—'}
                        </td>
                        <td className="px-5 py-4 text-sm tabular-nums text-ink-2 sm:px-6">
                          {formatDate(item.createdAt)}
                        </td>
                        <td className="px-5 py-4 sm:px-6">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-md bg-bg-elev"
                            onClick={() => loadIntoForm(item)}
                          >
                            <Pencil className="size-3.5" />
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-ink-3">
                        No achievements defined yet. Create the first badge using the form.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default AdminAchievementsPage;
