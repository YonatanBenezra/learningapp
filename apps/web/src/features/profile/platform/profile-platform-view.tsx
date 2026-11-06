"use client";

import { Fragment } from "react";
import { Flame, Shield } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ProfilePlatformSkeleton } from "@/features/profile/platform/profile-platform-skeleton";
import { routes } from "@/config/routes";
import { authApi } from "@/features/auth/auth-api";
import { useAuthSession } from "@/features/auth/use-auth-session";
import { BadgesGrid, BadgeCategoryIcon } from "@/features/profile/platform/components/badges-grid";
import {
  GhostAddButton,
  PlatformCard,
  ProfileHeader,
  ProfileTabs,
} from "@/features/profile/platform/components/profile-header";
import { LevelCard } from "@/features/profile/platform/components/level-card";
import { AddItemModal, EditProfileModal } from "@/features/profile/platform/components/platform-modals";
import { XpActivityCard } from "@/features/profile/platform/components/xp-activity-card";
import { brand } from "@/config/brand";
import {
  aggregateDaysIntoWeeks,
  mockWeeksEmpty,
  mockWeeksRandom,
} from "@/features/profile/platform/xp-weeks-utils";
import { profileWorkspaceApi } from "@/features/profile/platform/profile-workspace-api";
import type { AddItemKind, ProfileWorkspace } from "@/features/profile/platform/types";
import { FILLED_PREVIEW_WORKSPACE } from "@/features/profile/platform/types";
import { ApiError } from "@/lib/api-client";
import type { User } from "@/types/user";

function ChipList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full bg-platform-input px-3 py-1 text-xs font-medium text-platform-text"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function ProfilePlatformView() {
  const searchParams = useSearchParams();
  const previewFilled = searchParams.get("preview") === "filled";
  const previewRandom = searchParams.get("preview") === "random";
  const { user: sessionUser } = useAuthSession();
  const [user, setUser] = useState<User | null>(sessionUser);
  const [data, setData] = useState<ProfileWorkspace | null>(
    previewFilled ? FILLED_PREVIEW_WORKSPACE : null,
  );
  const [tab, setTab] = useState<"about" | "badges">("about");
  const [addKind, setAddKind] = useState<AddItemKind | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.dataset.workspace = "dashboard";
    return () => {
      delete document.documentElement.dataset.workspace;
    };
  }, []);

  const load = useCallback(async () => {
    if (previewFilled) {
      setData(FILLED_PREVIEW_WORKSPACE);
      return;
    }
    try {
      const [me, workspace] = await Promise.all([authApi.me(), profileWorkspaceApi.get()]);
      setUser(me);
      setData(workspace);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setError("auth");
        return;
      }
      setError("load");
    }
  }, [previewFilled]);

  useEffect(() => {
    setUser(sessionUser);
  }, [sessionUser]);

  useEffect(() => {
    void load();
  }, [load]);

  const persistMeta = async (patch: Parameters<typeof profileWorkspaceApi.updateMeta>[0]) => {
    await profileWorkspaceApi.updateMeta(patch);
    const workspace = await profileWorkspaceApi.get();
    setData(workspace);
  };

  const onAddSave = async (kind: AddItemKind, value: string) => {
    if (!data || previewFilled) return;
    const parts = value.split(",").map((s) => s.trim()).filter(Boolean);
    try {
      if (kind === "summary") {
        await persistMeta({ summary: value });
      } else if (kind === "socials") {
        await persistMeta({
          socials: [...data.socials, { platform: "Link", url: value }],
        });
      } else if (kind === "interests") {
        await persistMeta({ interests: [...new Set([...data.interests, ...parts])] });
      } else if (kind === "skills") {
        await persistMeta({ skills: [...new Set([...data.skills, ...parts])] });
      } else if (kind === "tools") {
        await persistMeta({ tools: [...new Set([...data.tools, ...parts])] });
      } else if (kind === "languages") {
        await persistMeta({ languages: [...new Set([...data.languages, ...parts])] });
      } else if (kind === "certifications") {
        await persistMeta({
          certifications: [...data.certifications, { name: value }],
        });
      } else if (kind === "achievements") {
        await persistMeta({
          achievements: [...data.achievements, { name: value }],
        });
      } else if (kind === "events") {
        await persistMeta({ events: [...data.events, { name: value }] });
      }
    } catch {
      /* keep UI */
    }
  };

  const onEditSave = async (form: { name: string; username: string; country: string }) => {
    if (!data || previewFilled) return;
    setPending(true);
    try {
      await authApi.updateProfile({
        displayName: form.name,
        slug: form.username || null,
        enabled: data.published,
      });
      await persistMeta({ country: form.country });
      await load();
      setEditOpen(false);
    } finally {
      setPending(false);
    }
  };

  const onPublish = async () => {
    if (!data || previewFilled) return;
    setPending(true);
    try {
      const slug = data.settings.slug ?? data.username;
      await authApi.updateProfile({
        displayName: data.name,
        slug,
        enabled: true,
      });
      await load();
    } finally {
      setPending(false);
    }
  };

  if (error === "auth") {
    return (
      <div className="min-h-screen bg-platform-page px-6 py-20 text-platform-text">
        <Link href={`${routes.login}?next=${encodeURIComponent(routes.account)}`} className="text-platform-accent">
          Sign in
        </Link>{" "}
        to view your profile.
      </div>
    );
  }

  if (!data || !user) {
    if (error === "load") {
      return (
        <div className="min-h-screen bg-platform-page px-6 py-20 text-platform-muted">
          Could not load profile workspace. Is the API running?
        </div>
      );
    }
    return <ProfilePlatformSkeleton />;
  }

  const weeklyPct = Math.min(100, (data.weeklyXp / data.weeklyGoal) * 100);
  const activityWeeks = previewRandom
    ? mockWeeksRandom()
    : previewFilled && !data.xpHistory.length
      ? mockWeeksEmpty()
      : aggregateDaysIntoWeeks(data.xpHistory);

  return (
    <Fragment>
    <main className="lp-dash-figma-main !gap-6 !pb-24 !pt-6 text-platform-text">
        <ProfileHeader
          data={data}
          onEdit={() => setEditOpen(true)}
          onPublish={onPublish}
          publishPending={pending}
        />

        <ProfileTabs tab={tab} onTab={setTab} />

        {tab === "about" ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
            <div className="flex flex-col gap-6">
              <PlatformCard title="Summary">
                {data.summary ? (
                  <p className="text-sm leading-relaxed text-platform-muted">{data.summary}</p>
                ) : (
                  <p className="text-sm text-platform-muted">
                    Tell the world about yourself and your hacking super powers…
                  </p>
                )}
                <GhostAddButton label="Add summary" onClick={() => setAddKind("summary")} />
              </PlatformCard>

              <div className="flex w-full max-w-[760px] flex-col gap-8">
                <LevelCard
                  level={data.level}
                  xp={data.xp}
                  xpMax={data.xpToNext}
                  rankName={data.rank}
                  grade={data.grade}
                />
                <XpActivityCard brand={brand.name} weeks={activityWeeks} />
              </div>

              <PlatformCard title="Certifications">
                {data.certifications.length ? (
                  <ul className="space-y-2 text-sm text-platform-text">
                    {data.certifications.map((c) => (
                      <li key={c.name}>{c.name}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-platform-muted">Share with us your biggest achievements.</p>
                )}
                <GhostAddButton label="Add certifications" onClick={() => setAddKind("certifications")} />
              </PlatformCard>

              <PlatformCard title="Achievements">
                {data.achievements.length ? (
                  <ul className="space-y-2 text-sm">{data.achievements.map((a) => <li key={a.name}>{a.name}</li>)}</ul>
                ) : (
                  <p className="text-sm text-platform-muted">You haven&apos;t earned any achievements yet…</p>
                )}
                <Link
                  href={routes.problems}
                  className="mt-4 inline-flex h-10 items-center rounded bg-platform-input px-4 text-sm font-semibold text-platform-text transition-colors hover:bg-[#2a3548]"
                >
                  Explore Pro Labs
                </Link>
              </PlatformCard>

              <PlatformCard title="Events Certificates">
                {data.events.length ? (
                  <ul className="space-y-2 text-sm">{data.events.map((e) => <li key={e.name}>{e.name}</li>)}</ul>
                ) : (
                  <p className="text-sm text-platform-muted">You haven&apos;t joined any events yet…</p>
                )}
                <Link
                  href={routes.contests}
                  className="mt-4 inline-flex h-10 items-center rounded bg-platform-input px-4 text-sm font-semibold text-platform-text"
                >
                  Browse CTFs
                </Link>
              </PlatformCard>
            </div>

            <aside className="flex flex-col gap-6">
              <PlatformCard title="Socials">
                {data.socials.length ? (
                  <ul className="space-y-1 text-sm">
                    {data.socials.map((s) => (
                      <li key={s.url}>
                        <a href={s.url} className="text-platform-accent hover:underline">
                          {s.platform}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-platform-muted">Add your social profiles and a website link.</p>
                )}
                <GhostAddButton label="Add socials" onClick={() => setAddKind("socials")} />
              </PlatformCard>

              <PlatformCard title="Weekly Streak">
                <div className="flex items-center gap-2">
                  <Flame className="size-8 text-platform-accent" aria-hidden />
                  <span
                    className="text-2xl font-bold"
                    style={{ fontFamily: "var(--font-roboto-mono)" }}
                  >
                    {data.streakWeeks} weeks
                  </span>
                </div>
                <p className="mt-3 text-sm text-platform-muted">
                  Weekly{" "}
                  <span style={{ fontFamily: "var(--font-roboto-mono)" }}>
                    {data.weeklyXp}/{data.weeklyGoal}
                  </span>
                </p>
                <div
                  className="mt-2 h-2 rounded-full bg-platform-input"
                  role="progressbar"
                  aria-valuenow={data.weeklyXp}
                  aria-valuemin={0}
                  aria-valuemax={data.weeklyGoal}
                >
                  <div className="h-full rounded-full bg-platform-accent" style={{ width: `${weeklyPct}%` }} />
                </div>
                <div className="mt-4 flex gap-2" aria-label="Streak savers">
                  {Array.from({ length: data.streakSavers }).map((_, i) => (
                    <Shield key={i} className="size-6 text-platform-input" aria-hidden />
                  ))}
                </div>
                <p className="mt-3 text-xs text-platform-muted">
                  Personal best: {data.personalBestWeeks} weeks · {data.streakDays} day streak
                </p>
              </PlatformCard>

              <PlatformCard title="Top Interests">
                <ChipList items={data.interests} />
                {!data.interests.length ? (
                  <p className="text-sm text-platform-muted">Show what you are learning.</p>
                ) : null}
                <GhostAddButton label="Add interests" onClick={() => setAddKind("interests")} />
              </PlatformCard>

              <PlatformCard title="Badges">
                {data.badges.length > 0 ? (
                  <>
                    <div className="mt-1 grid grid-cols-4 gap-2">
                      {data.badges.slice(0, 8).map((b) => (
                        <div
                          key={b.id}
                          className="flex min-h-[4.5rem] flex-col items-center justify-center gap-1 rounded-lg border border-platform-border bg-platform-input/60 px-1 py-2"
                          title={b.name}
                        >
                          <BadgeCategoryIcon category={b.category} className="size-5 text-platform-accent" />
                          <span className="line-clamp-2 w-full text-center text-[10px] font-medium leading-tight text-platform-text">
                            {b.name}
                          </span>
                        </div>
                      ))}
                    </div>
                    {data.badges.length > 8 ? (
                      <p className="mt-2 text-xs text-platform-muted">
                        +{data.badges.length - 8} more — open the Badges tab to see all.
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setTab("badges")}
                      className="mt-3 w-full rounded border border-dashed border-platform-border px-3 py-2 text-sm font-semibold text-platform-muted transition-colors duration-150 hover:border-platform-muted hover:text-platform-text"
                    >
                      View all badges
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-platform-muted">
                      Complete challenges in{" "}
                      <Link href={routes.practiceHub} className="text-platform-accent hover:underline">
                        Practice
                      </Link>{" "}
                      to earn your first badges.
                    </p>
                    <Link
                      href={routes.practiceHub}
                      className="mt-4 inline-flex h-10 w-full items-center justify-center rounded bg-platform-input text-sm font-semibold text-platform-text transition-colors hover:bg-[#2a3548]"
                    >
                      Go to Practice
                    </Link>
                  </>
                )}
              </PlatformCard>

              <PlatformCard title="Skills">
                <ChipList items={data.skills} />
                {!data.skills.length ? <p className="text-sm text-platform-muted">Practice to build skills.</p> : null}
                <GhostAddButton label="Add skills" onClick={() => setAddKind("skills")} />
              </PlatformCard>

              <PlatformCard title="Toolstack">
                <ChipList items={data.tools} />
                <GhostAddButton label="Add tools" onClick={() => setAddKind("tools")} />
              </PlatformCard>

              <PlatformCard title="Languages">
                <ChipList items={data.languages} />
                <GhostAddButton label="Add languages" onClick={() => setAddKind("languages")} />
              </PlatformCard>
            </aside>
          </div>
        ) : (
          <BadgesGrid badges={data.badges} />
        )}

        {previewFilled ? (
          <p className="mt-8 text-xs text-platform-muted">
            Preview mode — use <code>?preview=filled</code> on this URL.
          </p>
        ) : null}
      </main>

      <AddItemModal
        kind={addKind}
        open={addKind !== null}
        onClose={() => setAddKind(null)}
        onSave={onAddSave}
      />
      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={{
          name: data.name,
          username: data.username,
          country: data.country,
        }}
        onSave={onEditSave}
        pending={pending}
      />
    </Fragment>
  );
}
