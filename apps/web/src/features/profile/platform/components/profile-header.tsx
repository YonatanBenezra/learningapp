"use client";

import { MapPin, MoreHorizontal, Pencil } from "lucide-react";
import Link from "next/link";
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

  return (
    <section className="relative mb-10 overflow-visible">
      <div
        className="relative h-[168px] w-full overflow-hidden rounded-lg border border-platform-border sm:h-[180px]"
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
      </div>

      <div className="relative z-10 -mt-[3.75rem] flex flex-col gap-4 px-1 sm:-mt-16 sm:flex-row sm:flex-wrap sm:items-start sm:gap-x-5 sm:px-4 md:gap-x-6">
        <div
          className="flex size-[7.25rem] shrink-0 items-center justify-center rounded-full border-4 border-platform-page bg-platform-card text-3xl font-bold text-platform-accent sm:size-28"
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
          <h1 className="text-2xl font-semibold leading-tight text-platform-text">{data.name}</h1>
          <p
            className="mt-1 text-base text-platform-muted"
            style={{ fontFamily: "var(--font-roboto-mono)" }}
          >
            @{data.username}
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm text-platform-muted">
            <MapPin className="size-4 shrink-0 opacity-90" aria-hidden />
            {showCountryPlaceholder ? "Add your country" : data.country}
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2.5 sm:ml-auto sm:w-auto sm:pt-2">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-11 items-center gap-2.5 rounded bg-platform-input px-4 text-sm font-semibold text-[#e8edf5] transition-colors duration-150 hover:bg-[#2a3548]"
          >
            <Pencil className="size-[1.125rem]" strokeWidth={2.25} aria-hidden />
            Edit
          </button>
          {!data.published ? (
            <button
              type="button"
              disabled={publishPending}
              onClick={onPublish}
              className="inline-flex h-11 items-center rounded bg-platform-accent px-4 text-sm font-bold text-platform-accent-on transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              Make your profile public
            </button>
          ) : publicHref ? (
            <Link
              href={publicHref}
              className="inline-flex h-11 items-center rounded bg-platform-accent px-4 text-sm font-bold text-platform-accent-on"
            >
              View public profile
            </Link>
          ) : null}
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded bg-platform-input text-[#e8edf5] transition-colors hover:bg-[#2a3548]"
            aria-label="Public view options"
          >
            <MoreHorizontal className="size-[1.375rem]" strokeWidth={2.25} aria-hidden />
          </button>
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
    <div className="mb-8 flex gap-8 border-b border-platform-border" role="tablist">
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
            "relative pb-3 text-base font-semibold transition-colors duration-150",
            tab === id ? "text-platform-text" : "text-platform-muted hover:text-platform-text",
          )}
          onClick={() => onTab(id)}
        >
          {label}
          {tab === id ? (
            <span className="absolute bottom-0 left-0 h-0.5 w-full bg-platform-accent" aria-hidden />
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
