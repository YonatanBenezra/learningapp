'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Briefcase, Camera, Loader2, MapPin, Save, UserRound } from 'lucide-react';
import { useMe } from '@/src/features/auth';
import { Avatar } from '@/src/components/ui/avatar';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Skeleton } from '@/src/components/ui/skeleton';
import { ApiError } from '@/src/infrastructure/apiClient';
import { useTranslation } from '@/src/i18n';
import { useUpdateProfile, useUploadProfileAvatar } from './useSettings';
import { getUserDisplayName } from '@/src/lib/userDisplay';

const textareaClassName =
  'mt-2 w-full rounded-lg border border-line-2 bg-bg px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-3 focus:border-primary focus:ring-2 focus:ring-primary/20';

function ProfileSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
      <Skeleton className="h-10 w-40" />
      <Skeleton className="mt-8 h-96 rounded-lg" />
    </div>
  );
}

export function ProfilePage() {
  const { t } = useTranslation();
  const meQ = useMe();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadProfileAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [address, setAddress] = useState('');
  const [profession, setProfession] = useState('');
  const [experience, setExperience] = useState('');
  const [saved, setSaved] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    const user = meQ.data?.user;
    if (!user) return;
    setName(user.name ?? '');
    setImageUrl(user.imageUrl ?? '');
    setAddress(user.address ?? '');
    setProfession(user.profession ?? '');
    setExperience(user.experience ?? '');
  }, [meQ.data?.user]);

  if (meQ.isLoading) return <ProfileSkeleton />;

  if (meQ.isError || !meQ.data) {
    return (
      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
        <div className="rounded-lg border border-line bg-bg-elev p-10 text-center">
          <p className="text-ink-2">{t('profile.loadError')}</p>
          <Button variant="soft" className="mt-4" onClick={() => meQ.refetch()}>
            {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  const user = meQ.data.user;
  const displayName = getUserDisplayName({ ...user, name: name.trim() || user.name });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    updateProfile.mutate(
      {
        name: name.trim(),
        address: address.trim(),
        profession: profession.trim(),
        experience: experience.trim(),
      },
      {
        onSuccess: () => setSaved(true),
      },
    );
  }

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploadError(null);
    setSaved(false);
    uploadAvatar.mutate(file, {
      onSuccess: (data) => {
        setImageUrl(data.user.imageUrl ?? '');
      },
      onError: (error) =>
        setUploadError(
          error instanceof ApiError ? error.message : t('profile.uploadError'),
        ),
    });
  }

  const errorMessage =
    updateProfile.error instanceof ApiError
      ? updateProfile.error.message
      : updateProfile.error
        ? t('profile.saveError')
        : null;

  return (
    <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-lg bg-primary-soft text-primary">
            <UserRound className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{t('profile.title')}</h1>
            <p className="mt-1 text-sm text-ink-2">{t('profile.subtitle')}</p>
          </div>
        </div>
        <Link href="/settings" className="text-sm font-medium text-primary hover:underline">
          {t('profile.accountSettings')}
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-8 overflow-hidden rounded-lg border border-line bg-bg-elev shadow-soft"
      >
        <div className="border-b border-line bg-gradient-to-r from-primary/[0.06] via-transparent to-transparent px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative w-fit">
              <Avatar name={displayName} src={imageUrl.trim() || undefined} className="size-20 text-lg" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadAvatar.isPending}
                className="absolute -bottom-1 -right-1 grid size-9 place-items-center rounded-full border border-line bg-bg-elev text-ink-2 shadow-soft transition hover:border-primary hover:text-primary disabled:opacity-60"
                aria-label={t('profile.uploadPhoto')}
              >
                {uploadAvatar.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Camera className="size-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-ink">{displayName}</p>
              <p className="mt-1 text-sm text-ink-2">{user.email}</p>
              {profession.trim() ? (
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-ink-2">
                  <Briefcase className="size-4 text-ink-3" />
                  {profession.trim()}
                </p>
              ) : null}
              <p className="mt-3 text-xs text-ink-3">{t('profile.photoHint')}</p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-6 sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="name">{t('profile.fullName')}</Label>
              <Input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t('profile.fullNamePlaceholder')}
                className="mt-2"
                maxLength={120}
              />
            </div>

            <div>
              <Label htmlFor="profession">{t('profile.profession')}</Label>
              <Input
                id="profession"
                value={profession}
                onChange={(event) => setProfession(event.target.value)}
                placeholder={t('profile.professionPlaceholder')}
                className="mt-2"
                maxLength={120}
              />
            </div>

            <div>
              <Label htmlFor="email">{t('profile.email')}</Label>
              <Input id="email" value={user.email} readOnly className="mt-2 bg-bg-soft" />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="address">{t('profile.address')}</Label>
              <textarea
                id="address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                rows={3}
                placeholder={t('profile.addressPlaceholder')}
                className={textareaClassName}
                maxLength={500}
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="experience">{t('profile.experience')}</Label>
              <textarea
                id="experience"
                value={experience}
                onChange={(event) => setExperience(event.target.value)}
                rows={4}
                placeholder={t('profile.experiencePlaceholder')}
                className={textareaClassName}
                maxLength={2000}
              />
            </div>
          </div>

          {uploadError ? <p className="text-sm text-bad">{uploadError}</p> : null}
          {errorMessage ? <p className="text-sm text-bad">{errorMessage}</p> : null}
          {saved && !updateProfile.isPending ? (
            <p className="text-sm font-medium text-good">{t('profile.saved')}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
            <Button type="submit" disabled={updateProfile.isPending} className="rounded-lg">
              {updateProfile.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {t('profile.saveProfile')}
            </Button>
            {address.trim() ? (
              <p className="inline-flex items-center gap-1.5 text-sm text-ink-2">
                <MapPin className="size-4 text-ink-3" />
                {address.trim()}
              </p>
            ) : null}
          </div>
        </div>
      </form>
    </div>
  );
}
