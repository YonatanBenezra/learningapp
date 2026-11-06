"use client";

import { MapPin, Pencil } from "lucide-react";
import Link from "next/link";
import { routes } from "@/config/routes";
import type { ProfileWorkspace } from "@/features/profile/platform/types";
import { cn } from "@/lib/utils";

type ProfileHeaderProps = {
  data: ProfileWorkspace;
  onEdit: () => void;
  onPublish: () => void;
  publishPending?: boolean;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function ProfileHeader({ data, onEdit, onPublish, publishPending }: ProfileHeaderProps) {
  const publicHref = data.settings.urlPath;

  const showCountryPlaceholder = !data.country?.trim();
  const jobTitle = data.accountSettings?.jobTitle?.trim() ?? "";

  return (
    <section className="relative mb-10 overflow-visible">
      <div
        className="relative h-[168px] w-full overflow-hidden rounded-xl border border-platform-border shadow-[inset_0_1px_0_rgb(255_255_255/6%)] sm:h-[180px]"
        style={{
          background: data.cover
            ? `url(${data.cover}) center/cover`
            : "linear-gradient(135deg, #151f2e 0%, #101927 50%, rgb(159 239 0 / 12%) 100%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "repeating-linear-gradient(60deg, transparent, transparent 12px, rgb(159 239 0 / 0.06) 12px, rgb(159 239 0 / 0.06) 13px)",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#101927]/90 via-transparent to-transparent"
          aria-hidden
        />
      </div>

      <div className="relative z-10 -mt-[3.75rem] flex flex-col gap-4 px-1 sm:-mt-16 sm:flex-row sm:flex-wrap sm:items-start sm:gap-x-5 sm:px-4 md:gap-x-6">
        <div
          className="flex size-[7.25rem] shrink-0 items-center justify-center rounded-full border-4 border-platform-page bg-platform-card text-3xl font-bold text-platform-accent shadow-[0_12px_40px_rgb(0_0_0/35%)] ring-2 ring-platform-accent/15 sm:size-28"
          aria-hidden
        >
          {data.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.avatar} alt="" className="size-full rounded-full object-cover" />
          ) : (
            initials(data.name)
          )}
        </div>

        <div className="min-w-0 flex-1 pt-0 sm:min-w-[200px] sm:pt-2">
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-platform-text sm:text-[1.65rem]">
            {data.name}
          </h1>
          <p
            className="mt-1 text-base text-platform-muted"
            style={{ fontFamily: "var(--font-roboto-mono)" }}
          >
            @{data.username}
          </p>
          <p className="mt-2 text-sm leading-snug text-platform-muted">
            {jobTitle ? (
              <span className="font-medium text-platform-text/90">{jobTitle}</span>
            ) : (
              <Link
                href={`${routes.dashboardSettings}#career`}
                className="text-platform-muted underline decoration-platform-border underline-offset-2 transition-colors hover:text-platform-text hover:decoration-platform-accent/50"
              >
                Add job title
              </Link>
            )}
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm text-platform-muted">
            <MapPin className="size-4 shrink-0 text-platform-accent/80 opacity-90" aria-hidden />
            {showCountryPlaceholder ? (
              <Link
                href={`${routes.dashboardSettings}#basic-information`}
                className="underline decoration-platform-border underline-offset-2 transition-colors hover:text-platform-text hover:decoration-platform-accent/50"
              >
                Add your country
              </Link>
            ) : (
              <span className="text-platform-text/85">{data.country}</span>
            )}
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2.5 sm:ml-auto sm:w-auto sm:justify-end sm:pt-2">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-11 items-center gap-2.5 rounded-md border border-platform-border/80 bg-platform-input px-4 text-sm font-semibold text-[#e8edf5] transition-colors duration-150 hover:border-[#3a4559] hover:bg-[#2a3548] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-platform-accent"
          >
            <Pencil className="size-[1.125rem]" strokeWidth={2.25} aria-hidden />
            Edit
          </button>
          {!data.published ? (
            <button
              type="button"
              disabled={publishPending}
              onClick={onPublish}
              className="inline-flex h-11 items-center rounded-md bg-platform-accent px-4 text-sm font-bold text-platform-accent-on shadow-[0_8px_28px_rgb(159_239_0/18%)] transition-[opacity,filter] hover:brightness-105 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-platform-accent"
            >
              Make your profile public
            </button>
          ) : publicHref ? (
            <Link
              href={publicHref}
              className="inline-flex h-11 items-center rounded-md bg-platform-accent px-4 text-sm font-bold text-platform-accent-on shadow-[0_8px_28px_rgb(159_239_0/18%)] transition-[filter] hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-platform-accent"
            >
              View public profile
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function ProfileTabs({
  tab,
  onTab,
}: {
  tab: "about" | "badges";
  onTab: (t: "about" | "badges") => void;
}) {
  return (
    <div className="mb-8 flex gap-2 border-b border-platform-border sm:gap-10" role="tablist">
      {(
        [
          ["about", "About"],
          ["badges", "Badges"],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={tab === id}
          className={cn(
            "relative -mb-px rounded-t-md px-1 pb-3 pt-1 text-base font-semibold transition-colors duration-150",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-platform-accent",
            tab === id ? "text-platform-text" : "text-platform-muted hover:text-platform-text",
          )}
          onClick={() => onTab(id)}
        >
          {label}
          {tab === id ? (
            <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-platform-accent shadow-[0_0_12px_rgb(159_239_0/35%)]" aria-hidden />
          ) : null}
        </button>
      ))}
    </div>
  );
}

export function PlatformCard({
  title,
  children,
  className,
  id,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-lg border border-platform-border bg-platform-card p-6",
        className,
      )}
    >
      {title ? (
        <h2 className="mb-4 text-base font-semibold text-platform-text">{title}</h2>
      ) : null}
      {children}
    </section>
  );
}

export function GhostAddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 inline-flex items-center gap-2 rounded border border-dashed border-platform-border px-4 py-2 text-sm font-semibold text-platform-muted transition-colors duration-150 hover:border-platform-muted hover:text-platform-text"
    >
      <span className="text-platform-accent" aria-hidden>
        +
      </span>
      {label}
    </button>
  );
}
