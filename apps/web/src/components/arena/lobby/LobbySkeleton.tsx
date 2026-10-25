export function LobbySkeleton() {
  return (
    <div className="arena-hub arena-lobby flex flex-col gap-7 py-10" aria-busy="true">
      <div className="h-4 w-48 animate-pulse rounded bg-[color-mix(in_srgb,var(--arena-ink)_8%,transparent)]" />
      <div className="space-y-3">
        <div className="h-6 w-64 animate-pulse rounded bg-[color-mix(in_srgb,var(--arena-ink)_8%,transparent)]" />
        <div className="h-10 w-full max-w-xl animate-pulse rounded bg-[color-mix(in_srgb,var(--arena-ink)_6%,transparent)]" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_400px]">
        <div className="h-64 animate-pulse rounded-xl bg-[color-mix(in_srgb,var(--arena-ink)_6%,transparent)]" />
        <div className="h-72 animate-pulse rounded-xl bg-[color-mix(in_srgb,var(--arena-ink)_6%,transparent)]" />
      </div>
    </div>
  );
}
