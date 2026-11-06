"use client";

import { CheckCircle2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { CountrySelect } from "@/components/ui/country-select";
import { GlobalLoader } from "@/components/ui/global-loader";
import { routes } from "@/config/routes";
import { authApi } from "@/features/auth/auth-api";
import { useAuthSession } from "@/features/auth/use-auth-session";
import { profileWorkspaceApi } from "@/features/profile/platform/profile-workspace-api";
import {
  SettingsField,
  SettingsSection,
  SettingsToggle,
  settingsFieldClass,
} from "@/features/profile/platform/components/settings-form-parts";
import { ApiError } from "@/lib/api-client";
import type { User } from "@/types/user";

export function SettingsPlatformView() {
  const { user: sessionUser } = useAuthSession();
  const [user, setUser] = useState<User | null>(sessionUser);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("");
  const [published, setPublished] = useState(false);
  const [error, setError] = useState<"auth" | "load" | string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.workspace = "dashboard";
    return () => {
      delete document.documentElement.dataset.workspace;
    };
  }, []);

  useEffect(() => {
    setUser(sessionUser);
  }, [sessionUser]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [me, workspace] = await Promise.all([authApi.me(), profileWorkspaceApi.get()]);
        if (cancelled) return;
        setUser(me);
        setDisplayName(me.displayName ?? workspace.name);
        setUsername(workspace.username);
        setCountry(workspace.country);
        setPublished(workspace.published);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof ApiError && e.status === 401 ? "auth" : "load");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const profilePath = useMemo(() => {
    const slug = username.trim() || user?.profile?.slug || "you";
    return routes.profile(slug);
  }, [username, user?.profile?.slug]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    setPending(true);
    setSaved(false);
    setError(null);
    try {
      await authApi.updateProfile({
        displayName: displayName.trim() || null,
        slug: username.trim() || null,
        enabled: published,
      });
      await profileWorkspaceApi.updateMeta({ country: country.trim() });
      setSaved(true);
    } catch (caught: unknown) {
      setError(caught instanceof ApiError ? caught.message : "Could not save settings.");
    } finally {
      setPending(false);
    }
  }

  async function togglePublic() {
    if (!user) return;
    setPending(true);
    setSaved(false);
    setError(null);
    try {
      const next = !published;
      await authApi.updateProfile({
        displayName: displayName.trim() || null,
        slug: username.trim() || null,
        enabled: next,
      });
      setPublished(next);
      setSaved(true);
    } catch (caught: unknown) {
      setError(caught instanceof ApiError ? caught.message : "Could not update visibility.");
    } finally {
      setPending(false);
    }
  }

  if (error === "auth") {
    return (
      <div className="min-h-screen bg-platform-page px-6 py-20 text-platform-text">
        <Link href={`${routes.login}?next=${encodeURIComponent(routes.dashboardSettings)}`}>
          Sign in
        </Link>{" "}
        to manage settings.
      </div>
    );
  }

  if (!user) {
    if (error === "load") {
      return (
        <div className="min-h-screen bg-platform-page px-6 py-20 text-platform-muted">
          Could not load settings.
        </div>
      );
    }
    return <GlobalLoader platform contained label="Loading settings…" />;
  }

  return (
      <main className="lp-dash-figma-main !gap-8 !pb-28 !pt-6">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-platform-accent">
            Account
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-platform-text sm:text-[1.75rem]">
            Settings
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-platform-muted">
            Manage how you appear on LabPath — display name, public profile URL, location, and
            visibility.
          </p>
        </header>

        {saved ? (
          <div
            className="flex items-center gap-2 rounded-md border border-platform-accent/25 bg-platform-accent/10 px-4 py-3 text-sm font-medium text-platform-text"
            role="status"
          >
            <CheckCircle2 className="size-4 shrink-0 text-platform-accent" aria-hidden />
            Changes saved successfully.
          </div>
        ) : null}

        {typeof error === "string" ? (
          <p className="rounded-md border border-platform-danger/30 bg-platform-danger/10 px-4 py-3 text-sm text-platform-danger">
            {error}
          </p>
        ) : null}

        <form onSubmit={onSubmit} className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
          <div className="flex flex-col gap-6">
            <SettingsSection
              title="Public profile"
              description="This information is shown on your profile and ranking entries."
            >
              <SettingsField label="Display name" htmlFor="settings-display-name">
                <input
                  id="settings-display-name"
                  className={settingsFieldClass}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={40}
                  autoComplete="nickname"
                  placeholder="Your name"
                />
              </SettingsField>

              <SettingsField
                label="Username"
                hint="Used in your public profile URL."
                htmlFor="settings-username"
              >
                <div className="flex overflow-hidden rounded-md border border-platform-border bg-platform-page focus-within:border-platform-accent focus-within:ring-1 focus-within:ring-platform-accent/30">
                  <span
                    className="flex shrink-0 items-center border-r border-platform-border bg-platform-input px-3 text-xs font-medium text-platform-muted sm:text-sm"
                    aria-hidden
                  >
                    labpath.com/u/
                  </span>
                  <input
                    id="settings-username"
                    className="h-11 min-w-0 flex-1 bg-transparent px-3 font-[family-name:var(--font-roboto-mono)] text-sm text-platform-text outline-none"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/^@/, "").toLowerCase())}
                    maxLength={32}
                    autoComplete="username"
                    placeholder="username"
                  />
                </div>
                <p className="mt-2 text-xs text-platform-muted">
                  Preview:{" "}
                  <Link href={profilePath} className="text-platform-accent hover:underline">
                    {profilePath}
                  </Link>
                </p>
              </SettingsField>

              <SettingsField
                label="Country"
                hint="From REST Countries — shown on your profile."
                htmlFor="settings-country"
              >
                <CountrySelect
                  id="settings-country"
                  value={country}
                  onChange={setCountry}
                  disabled={pending}
                />
              </SettingsField>
            </SettingsSection>

            <SettingsSection
              title="Sign-in & email"
              description="Email is managed by your account provider and cannot be changed here."
            >
              <SettingsField label="Email address" htmlFor="settings-email">
                <input
                  id="settings-email"
                  className={settingsFieldClass}
                  value={user.email}
                  readOnly
                  disabled
                />
              </SettingsField>
            </SettingsSection>
          </div>

          <aside className="flex flex-col gap-6">
            <SettingsSection title="Profile visibility">
              <SettingsToggle
                label="Public profile"
                description={
                  published
                    ? "Anyone with your link can view your profile, stats, and badges."
                    : "Your profile is private until you turn this on."
                }
                checked={published}
                disabled={pending}
                onChange={togglePublic}
              />
            </SettingsSection>

            <section className="rounded-lg border border-platform-border bg-platform-card p-6">
              <h2 className="text-sm font-semibold text-platform-text">Quick links</h2>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link
                    href={routes.account}
                    className="inline-flex items-center gap-2 text-sm font-medium text-platform-accent hover:underline"
                  >
                    View profile
                    <ExternalLink className="size-3.5 opacity-80" aria-hidden />
                  </Link>
                </li>
                {published ? (
                  <li>
                    <Link
                      href={profilePath}
                      className="inline-flex items-center gap-2 text-sm font-medium text-platform-muted transition-colors hover:text-platform-text"
                    >
                      Open public page
                      <ExternalLink className="size-3.5 opacity-80" aria-hidden />
                    </Link>
                  </li>
                ) : null}
              </ul>
            </section>
          </aside>

          <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-platform-border bg-[#101927]/95 px-4 py-3 backdrop-blur-md xl:static xl:z-auto xl:border-0 xl:bg-transparent xl:p-0 xl:backdrop-blur-none xl:col-span-2">
            <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-end gap-3">
              <Link
                href={routes.account}
                className="inline-flex h-11 items-center rounded-md border border-platform-border bg-platform-input px-5 text-sm font-semibold text-platform-text transition-colors hover:bg-[#2a3548]"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex h-11 min-w-[140px] items-center justify-center rounded-md bg-platform-accent px-6 text-sm font-bold text-platform-accent-on shadow-sm transition-opacity disabled:opacity-60"
              >
                {pending ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </main>
  );
}
