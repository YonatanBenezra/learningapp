'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Bell,
  ChevronRight,
  Download,
  Globe,
  Settings,
  Sparkles,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useMe } from '@/src/features/auth';
import { ApiError } from '@/src/infrastructure/apiClient';
import { useIsRtl, useTranslation } from '@/src/i18n';
import type { Tier } from '@/src/domain/user';
import { LanguageSelector } from '@/src/components/layout/LanguageSelector';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Skeleton } from '@/src/components/ui/skeleton';
import { Switch } from '@/src/components/ui/switch';
import { listAiModels } from '@/src/features/ai/aiApi';
import { useDeleteAccount, useExportUserData, useUpdatePreferences } from './useSettings';

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Dhaka',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

const selectClassName =
  'mt-2 w-full rounded-lg border border-line-2 bg-bg px-4 py-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

function mutationMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

function tierLabel(t: ReturnType<typeof useTranslation>['t'], tier: Tier) {
  if (tier === 'premium') return t('profile.tierPremium');
  if (tier === 'standard') return t('profile.tierStandard');
  return t('profile.tierFree');
}

function SettingsSkeleton() {
  return (
    <div className="min-h-full bg-gradient-to-b from-primary/[0.04] via-bg to-bg">
      <div className="mx-auto w-full max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-36 w-full rounded-lg" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-56 rounded-lg" />
          <Skeleton className="h-56 rounded-lg" />
        </div>
        <Skeleton className="h-[420px] rounded-lg" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-40 rounded-lg" />
          <Skeleton className="h-52 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-line bg-bg-elev p-6 shadow-soft sm:p-7">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-bg-soft text-primary">
          <Icon className="size-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <p className="mt-1 text-sm text-ink-2">{description}</p>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function PreferenceRow({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-line bg-bg-soft/40 px-4 py-4">
      <div className="min-w-0">
        <p className="font-medium text-ink">{title}</p>
        <p className="mt-0.5 text-sm text-ink-2">{hint}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function SettingsPage() {
  const { t } = useTranslation();
  const isRtl = useIsRtl();
  const meQ = useMe();
  const updateMut = useUpdatePreferences();
  const exportMut = useExportUserData();
  const deleteMut = useDeleteAccount();
  const modelsQ = useQuery({
    queryKey: ['ai-models'],
    queryFn: listAiModels,
    staleTime: 10 * 60_000,
  });

  const [visualsPreferred, setVisualsPreferred] = useState(true);
  const [dailyNotification, setDailyNotification] = useState(true);
  const [timezone, setTimezone] = useState('UTC');
  const [aiModel, setAiModel] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState('');

  useEffect(() => {
    const prefs = meQ.data?.user.preferences;
    if (!prefs) return;
    setVisualsPreferred(prefs.visualsPreferred);
    setDailyNotification(prefs.dailyNotification);
    setTimezone(prefs.timezone ?? 'UTC');
    setAiModel(prefs.aiModel ?? '');
  }, [meQ.data?.user.preferences]);

  if (meQ.isLoading) return <SettingsSkeleton />;

  if (meQ.isError || !meQ.data) {
    return (
      <div className="min-h-full bg-gradient-to-b from-primary/[0.04] via-bg to-bg p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl rounded-lg border border-line bg-bg-elev p-10 text-center shadow-soft">
          <p className="text-lg font-semibold text-ink">{t('settings.loadError')}</p>
          <Button variant="soft" className="mt-4 rounded-lg" onClick={() => meQ.refetch()}>
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  const user = meQ.data.user;
  const saveDisabled = updateMut.isPending;
  const planLabel = tierLabel(t, user.tier);

  return (
    <div className="min-h-full bg-gradient-to-b from-primary/[0.04] via-bg to-bg">
      <div className="mx-auto w-full max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
        <section className="rounded-lg border border-line bg-bg-elev p-6 shadow-soft sm:p-8">
          <nav className="flex flex-wrap items-center gap-1.5 text-sm text-ink-3">
            <Link href="/dashboard" className="transition hover:text-primary">
              {t('nav.dashboard')}
            </Link>
            <ChevronRight className={`size-3.5${isRtl ? ' rotate-180' : ''}`} />
            <span className="font-medium text-ink">{t('settings.title')}</span>
          </nav>

          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary-soft text-primary">
                <Settings className="size-5" />
              </span>
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                  {t('settings.account')}
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                  {t('settings.title')}
                </h1>
                <p className="mt-3 text-base leading-7 text-ink-2">{t('settings.subtitle')}</p>
              </div>
            </div>
            <Link href="/profile">
              <Button variant="soft" className="rounded-lg">
                <UserRound className="size-4" />
                {t('settings.editProfile')}
              </Button>
            </Link>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard
            title={t('settings.profile')}
            description={t('settings.accountDesc')}
            icon={UserRound}
          >
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">{t('settings.email')}</Label>
                <Input id="email" value={user.email} readOnly className="mt-2 bg-bg-soft" />
              </div>
              <div>
                <Label htmlFor="tier">{t('settings.plan')}</Label>
                <div className="mt-2 flex items-center gap-3">
                  <Input
                    id="tier"
                    value={planLabel}
                    readOnly
                    className="bg-bg-soft capitalize"
                  />
                  <Badge variant={user.tier === 'premium' ? 'primary' : 'outline'}>
                    {planLabel}
                  </Badge>
                </div>
              </div>
              {user.tier !== 'premium' ? (
                <Link href="/upgrade" className="inline-block text-sm font-medium text-primary hover:underline">
                  {t('settings.viewUpgrade')}
                </Link>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard
            title={t('settings.regional')}
            description={t('settings.regionalDesc')}
            icon={Globe}
          >
            <div className="space-y-4">
              <PreferenceRow title={t('settings.language')} hint={t('settings.languageHint')}>
                <LanguageSelector compact />
              </PreferenceRow>
              <div>
                <Label htmlFor="timezone">{t('settings.timezone')}</Label>
                <select
                  id="timezone"
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                  className={selectClassName}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title={t('settings.preferences')}
          description={t('settings.customizeLearn')}
          icon={Sparkles}
        >
          <div className="space-y-4">
            <PreferenceRow title={t('settings.visualsTitle')} hint={t('settings.visualsHint')}>
              <Switch checked={visualsPreferred} onChange={setVisualsPreferred} />
            </PreferenceRow>
            <PreferenceRow
              title={t('settings.dailyReminderTitle')}
              hint={t('settings.dailyReminderHint')}
            >
              <Switch checked={dailyNotification} onChange={setDailyNotification} />
            </PreferenceRow>

            <div className="rounded-lg border border-line bg-bg-soft/40 px-4 py-4">
              <Label htmlFor="aiModel">{t('settings.aiModel')}</Label>
              <p className="mt-1 text-sm text-ink-2">{t('settings.aiModelHint')}</p>
              <Input
                id="aiModel"
                list="openrouter-models"
                value={aiModel}
                onChange={(event) => setAiModel(event.target.value)}
                placeholder="anthropic/claude-sonnet-4"
                className="mt-3 font-mono text-sm"
              />
              <datalist id="openrouter-models">
                {modelsQ.data?.models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </datalist>
              <p className="mt-2 text-xs text-ink-3">{t('settings.aiModelCustom')}</p>
              <Button
                type="button"
                variant="ghost"
                className="mt-2 h-8 px-2 text-xs"
                onClick={() => setAiModel('')}
              >
                {t('settings.aiModelDefault')}
              </Button>
            </div>
          </div>

          {updateMut.isError ? (
            <p className="mt-4 text-sm text-bad">{mutationMessage(updateMut.error, t('settings.mutationError'))}</p>
          ) : null}
          {updateMut.isSuccess ? (
            <p className="mt-4 text-sm font-medium text-good">{t('settings.saved')}</p>
          ) : null}

          <Button
            className="mt-6 rounded-lg"
            disabled={saveDisabled}
            onClick={() =>
              updateMut.mutate({
                visualsPreferred,
                dailyNotification,
                timezone,
                aiModel: aiModel.trim() || null,
              })
            }
          >
            {saveDisabled ? t('common.loading') : t('common.save')}
          </Button>
        </SectionCard>

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard
            title={t('settings.privacy')}
            description={t('settings.privacyHint')}
            icon={Download}
          >
            <Button
              variant="soft"
              className="rounded-lg"
              disabled={exportMut.isPending}
              onClick={() => exportMut.mutate()}
            >
              <Download className="size-4" />
              {exportMut.isPending ? t('common.loading') : t('settings.exportData')}
            </Button>
            {exportMut.isError ? (
              <p className="mt-3 text-sm text-bad">{mutationMessage(exportMut.error, t('settings.mutationError'))}</p>
            ) : null}
          </SectionCard>

          <section className="rounded-lg border border-bad/20 bg-bad-soft/20 p-6 shadow-soft sm:p-7">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-bad/20 bg-bad-soft text-bad">
                <AlertTriangle className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-ink">{t('settings.deleteAccount')}</h2>
                <p className="mt-1 text-sm leading-6 text-ink-2">{t('settings.deleteWarning')}</p>

                {!confirmDelete ? (
                  <Button
                    variant="soft"
                    className="mt-5 rounded-lg border border-bad/20 text-bad hover:bg-bad-soft"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="size-4" />
                    {t('settings.deleteAccount')}
                  </Button>
                ) : (
                  <div className="mt-5 space-y-3">
                    <p className="text-sm text-ink-2">
                      {t('settings.deleteConfirm')}
                    </p>
                    <Input
                      value={deletePhrase}
                      onChange={(event) => setDeletePhrase(event.target.value)}
                      placeholder="DELETE"
                    />
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="soft"
                        className="rounded-lg border border-bad/20 text-bad hover:bg-bad-soft"
                        disabled={deleteMut.isPending || deletePhrase !== 'DELETE'}
                        onClick={() => deleteMut.mutate()}
                      >
                        {deleteMut.isPending ? t('settings.deleting') : t('settings.confirmDelete')}
                      </Button>
                      <Button
                        variant="ghost"
                        className="rounded-lg"
                        onClick={() => {
                          setConfirmDelete(false);
                          setDeletePhrase('');
                        }}
                      >
                        {t('common.cancel')}
                      </Button>
                    </div>
                    {deleteMut.isError ? (
                      <p className="text-sm text-bad">{mutationMessage(deleteMut.error, t('settings.mutationError'))}</p>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-line bg-bg-elev px-4 py-4 text-sm text-ink-2 shadow-soft">
          <Bell className="mt-0.5 size-4 shrink-0 text-primary" />
          {t('notifications.footerNote')}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
