import { cn } from "@/lib/utils";

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

export function LobbySkeleton() {
  return (
    <div
      className="arena-hub arena-lobby relative flex flex-col gap-5 pb-24 pt-4 sm:gap-6 sm:pb-20 sm:pt-5"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading event lobby"
    >
      <Skel className="h-3 w-56" />

      <div className="overflow-hidden rounded-xl border border-[var(--arena-line)] bg-[var(--arena-surface)] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <Skel className="h-6 w-32" />
            <Skel className="h-8 w-full max-w-md" />
            <Skel className="h-4 w-full max-w-xl" />
          </div>
          <Skel className="h-24 w-full max-w-[280px] rounded-lg lg:w-[280px]" />
        </div>
      </div>

      <div className="arena-lobby-columns flex flex-col lg:flex-row lg:items-start">
        <div className="arena-lobby-main order-2 flex min-w-0 flex-1 flex-col gap-5 lg:order-1">
          <Skel className="h-40 w-full rounded-xl" />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Skel className="h-52 rounded-xl" />
            <Skel className="h-52 rounded-xl" />
          </div>
          <div>
            <div className="mb-3 flex items-center justify-between gap-2">
              <Skel className="h-6 w-28" />
              <Skel className="h-7 w-40 rounded-full" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-3 rounded-[10px] border border-[var(--arena-line)] bg-[var(--arena-surface)] p-4"
                >
                  <div className="flex gap-3">
                    <Skel className="size-9 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <Skel className="h-4 w-full" />
                      <Skel className="h-2.5 w-16" />
                    </div>
                  </div>
                  <Skel className="h-6 w-2/3" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="arena-lobby-side order-1 flex w-full shrink-0 flex-col gap-4 lg:order-2 lg:w-[400px]">
          <Skel className="hidden h-72 rounded-xl sm:block" />
          <Skel className="h-64 rounded-xl" />
        </aside>
      </div>
    </div>
  );
}
