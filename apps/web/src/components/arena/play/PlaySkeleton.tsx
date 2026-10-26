import { cn } from "@/lib/utils";
import "./play-dashboard.css";
import "./play-hero.css";

function Skel({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[color-mix(in_srgb,var(--arena-ink)_8%,transparent)]",
        className,
      )}
      aria-hidden
    />
  );
}

export function PlaySkeleton() {
  return (
    <div
      className="arena-hub arena-play relative flex flex-col gap-5 pb-16 pt-4 sm:gap-6 sm:pb-20 sm:pt-5"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading play dashboard"
    >
      <div className="play-hero-bar">
        <div className="play-hero-bar__row">
          <div className="play-hero-bar__seg play-hero-bar__seg--title">
            <Skel className="h-2.5 w-40" />
            <Skel className="mt-3 h-5 w-full max-w-[220px]" />
          </div>
          <div className="play-hero-bar__seg play-hero-bar__seg--stat">
            <Skel className="h-2 w-10" />
            <Skel className="mt-2 h-7 w-14" />
          </div>
          <div className="play-hero-bar__seg play-hero-bar__seg--stat">
            <Skel className="h-2 w-12" />
            <Skel className="mt-2 h-7 w-24" />
          </div>
          <div className="play-hero-bar__seg play-hero-bar__seg--pair">
            <div>
              <Skel className="h-2 w-10" />
              <Skel className="mt-2 h-7 w-16" />
            </div>
            <div>
              <Skel className="h-2 w-16" />
              <Skel className="mt-2 h-7 w-8" />
            </div>
          </div>
          <div className="play-hero-bar__seg play-hero-bar__seg--clock">
            <div className="flex justify-between gap-2">
              <Skel className="h-2 w-24" />
              <Skel className="h-2 w-12" />
            </div>
            <Skel className="mt-2 h-8 w-32" />
            <Skel className="mt-3 h-[3px] w-full rounded-full" />
          </div>
        </div>
      </div>

      <div className="play-layout">
        <aside className="play-filters w-full shrink-0">
          <Skel className="mb-3 h-2.5 w-16" />
          <div className="space-y-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skel key={i} className="h-8 w-full" />
            ))}
          </div>
          <Skel className="mb-2 mt-6 h-2.5 w-20" />
          <div className="space-y-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skel key={i} className="h-5 w-full max-w-[160px]" />
            ))}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Skel className="h-5 w-32" />
            <Skel className="h-9 w-full max-w-sm" />
          </div>
          <div className="play-challenge-grid">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className="flex flex-col gap-3 rounded-[10px] border border-[var(--arena-line)] bg-[var(--arena-surface)] p-4"
              >
                <div className="flex gap-3">
                  <Skel className="size-9 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skel className="h-4 w-full" />
                    <Skel className="h-2.5 w-20" />
                  </div>
                </div>
                <Skel className="h-6 w-3/4 max-w-[200px]" />
                <Skel className="h-px w-full" />
                <Skel className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-4 xl:w-[280px]">
          <div className="overflow-hidden rounded-xl border border-[var(--arena-line)] bg-[var(--arena-surface)]">
            <Skel className="h-10 w-full rounded-none" />
            {Array.from({ length: 5 }, (_, i) => (
              <Skel key={i} className="mx-4 my-2 h-8 w-auto" />
            ))}
            <Skel className="mx-4 mb-3 h-4 w-3/4" />
          </div>
          <div className="overflow-hidden rounded-xl border border-[var(--arena-line)] bg-[var(--arena-surface)]">
            <Skel className="h-10 w-full rounded-none" />
            {Array.from({ length: 4 }, (_, i) => (
              <Skel key={i} className="mx-4 my-3 h-10 w-auto" />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
