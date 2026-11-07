import "./scoreboard.css";

export function ScoreboardSkeleton() {
  return (
    <div className="bg-[#0F1520] pb-24 font-[family-name:var(--font-inter,Inter,sans-serif)] text-white" aria-busy="true">
      <div className="border-b border-[#232C3D] bg-[#151C2B] py-8">
        <div className="lp-sb-container">
          <div className="flex items-center justify-between gap-4">
            <div className="h-6 w-40 animate-pulse rounded bg-[#232C3D]/80" />
            <div className="h-9 w-48 animate-pulse rounded-md bg-[#0F1520]" />
          </div>
          <div className="mt-4 h-px bg-[#232C3D]" />
          <div className="mt-4 h-[220px] animate-pulse rounded-lg bg-[#1B2434]/50 md:h-[300px]" />
        </div>
      </div>
      <div className="border-t border-[#232C3D] bg-[#151C2B] pb-14 pt-8">
        <div className="lp-sb-container flex flex-col items-center gap-8 md:flex-row md:items-end md:justify-center md:gap-5">
          <div className="h-[340px] w-full max-w-[280px] animate-pulse bg-[#1B2434]/50 lp-sb-podium-outer md:order-1" />
          <div className="h-[368px] w-full max-w-[280px] animate-pulse bg-[#1B2434]/50 lp-sb-podium-outer md:order-2 md:-translate-y-9" />
          <div className="h-[340px] w-full max-w-[280px] animate-pulse bg-[#1B2434]/50 lp-sb-podium-outer md:order-3" />
        </div>
      </div>
      <div className="lp-sb-container mt-12">
        <div className="h-11 animate-pulse rounded-md border border-[#232C3D] bg-transparent" />
      </div>
    </div>
  );
}
