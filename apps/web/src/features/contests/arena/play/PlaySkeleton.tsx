import { cn } from "@/lib/utils";
import "./play-category-sidebar.css";
import "./play-dashboard.css";
import "./play-htb.css";

function Skel({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-[#232C3D]/55", className)}
      aria-hidden
    />
  );
}

function CategoryRowSkel() {
  return (
    <div className="play-category-row pointer-events-none opacity-90">
      <span className="play-category-row__tile flex items-center justify-center !rounded-md !border-[#232C3D] !bg-[#1C2537]">
        <Skel className="size-5 !rounded-sm !bg-[#232C3D]/80" />
      </span>
      <div className="play-category-row__body space-y-1.5">
        <Skel className="h-3.5 w-[85%]" />
        <Skel className="h-0.5 w-full !rounded-full" />
      </div>
    </div>
  );
}

function StatCardSkel({ wide }: { wide?: boolean }) {
  if (wide) {
    return (
      <div className="col-span-2 flex h-[78px] items-center gap-3 rounded-md bg-[#151C2B] px-4 sm:col-span-3 xl:col-span-1">
        <Skel className="size-11 shrink-0 !rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skel className="h-4 w-28" />
          <Skel className="h-3 w-20" />
        </div>
      </div>
    );
  }
  return (
    <div className="relative flex h-[78px] flex-col items-center justify-center rounded-md bg-[#151C2B] px-3">
      <Skel className="h-5 w-16" />
      <Skel className="mt-2 h-2.5 w-14" />
    </div>
  );
}

function TableRowSkel() {
  return (
    <div className="grid h-[38px] grid-cols-[minmax(0,1fr)_80px_110px_1fr] items-center gap-2 border-b border-[#1A2232] px-4">
      <Skel className="h-3.5 w-[70%]" />
      <Skel className="h-3.5 w-10 justify-self-start" />
      <Skel className="h-3 w-14" />
      <Skel className="ml-auto h-3 w-16" />
    </div>
  );
}

function TableSectionSkel({
  accent,
  rows,
  titleWidth,
}: {
  accent: "#FFAF00" | "#9FEF00";
  rows: number;
  titleWidth: string;
}) {
  return (
    <section className="mt-7 first:mt-0">
      <div className="flex h-9 items-end gap-3">

        <div
          className="flex h-9 w-28 items-center justify-center rounded-t-sm opacity-90"
          style={{ backgroundColor: accent }}
          aria-hidden
        >
          <Skel className="h-3 w-14 !rounded-sm !bg-black/20" />
        </div>
        <Skel className={cn("mb-1 h-3", titleWidth)} />
      </div>
      <div className="overflow-hidden bg-[#151C2B]">
        {Array.from({ length: rows }).map((_, i) => (
          <TableRowSkel key={i} />
        ))}
      </div>
    </section>
  );
}

export function PlaySkeleton() {
  return (
    <div
      className="arena-play flex min-h-[calc(100dvh-3.5rem)] w-full flex-1 flex-col bg-[#0F1520] pb-10 text-[#A4B1CD]"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading scenarios"
    >
      <main className="lp-play-container mt-6 flex min-h-0 flex-1 flex-col px-6">
        <div className="mb-3 flex gap-2 overflow-x-hidden pb-1 lg:hidden">
          {Array.from({ length: 4 }, (_, i) => (
            <Skel key={i} className="h-8 w-24 shrink-0 !rounded-full" />
          ))}
        </div>

        <div className="play-layout-htb min-h-0 flex-1">
          <aside className="play-col-left hidden lg:block">
            <div className="sticky top-20">
              <div className="flex aspect-square w-full max-w-[150px] flex-col items-center justify-center rounded-md bg-[#151C2B] p-3">
                <Skel className="size-20 !rounded-md" />
                <Skel className="mt-3 h-3 w-20" />
                <Skel className="mt-1.5 h-2.5 w-16" />
              </div>
              <nav className="play-category-sidebar mt-6" aria-hidden>
                <ul className="play-category-sidebar__list !mt-0">
                  {Array.from({ length: 6 }, (_, i) => (
                    <li key={i}>
                      <CategoryRowSkel />
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </aside>

          <div className="play-col-center flex min-w-0 flex-col">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
              <StatCardSkel wide />
              <StatCardSkel />
              <StatCardSkel />
              <StatCardSkel />
              <StatCardSkel />
            </div>

            <Skel className="mt-5 h-10 w-full max-w-[420px] !rounded-full !border !border-[#2A3446] !bg-transparent" />

            <TableSectionSkel accent="#FFAF00" rows={6} titleWidth="w-40" />
            <TableSectionSkel accent="#9FEF00" rows={2} titleWidth="w-24" />
          </div>

          <aside
            className={cn(
              "play-col-right hidden h-[calc(100vh-110px)] max-h-[720px] min-h-[280px] flex-col overflow-hidden rounded-md bg-[#151C2B] xl:flex",
            )}
          >
            <div className="flex h-14 shrink-0 items-center gap-4 border-b border-[#232C3D] px-4">
              <Skel className="h-3.5 w-[45%] flex-1" />
              <Skel className="h-3.5 w-[40%] flex-1" />
            </div>
            <div className="flex flex-1 flex-col p-0">
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  className="flex h-14 items-center gap-3 border-t border-[#232C3D] px-5 first:border-t-0"
                >
                  <Skel className="size-7 !rounded-full" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skel className="h-3 w-full max-w-[180px]" />
                    <Skel className="h-2.5 w-24" />
                  </div>
                  <Skel className="h-3 w-8" />
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
