"use client";

import type { CSSProperties } from "react";
import "@/features/dashboard/dashboard-figma.css";

function Skel({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return <span className={`lp-dash-figma-skel-block block ${className}`} style={style} aria-hidden />;
}

export function EventDetailsSkeleton() {
  return (
    <div
      className="lp-dash-figma-main lp-ctf-event-detail lp-dash-figma-skel !gap-8 min-h-0 flex-1 !pb-16 !pt-6"
      aria-busy="true"
      aria-label="Loading event details"
    >
      {/* Back link */}
      <Skel className="!h-4 !w-36 !rounded-md opacity-80" />

      {/* Hero shell + centered card */}
      <div className="w-full">
        <div className="relative flex h-[240px] w-full items-center justify-center overflow-hidden rounded-[28px] border border-white/5 bg-[#0F1520] md:h-[400px]">
          <div className="pointer-events-none absolute -right-[8%] top-[-6%] h-[78%] w-[52%] rounded-full bg-[#9FEF00]/12 blur-[96px]" aria-hidden />
          <div className="flex h-[180px] w-[88%] flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[#141B29]/95 sm:flex-row md:h-[270px] md:w-[480px]">
            <div className="flex flex-1 flex-col justify-center gap-4 px-6 py-6 sm:px-8">
              <Skel className="!h-8 !w-[85%] max-w-[280px] !rounded-md" />
              <Skel className="!h-px !w-full !rounded-none opacity-60" />
              <div className="flex items-center gap-2.5">
                <Skel className="!size-[22px] !rounded-md" />
                <Skel className="!h-4 !w-28 !rounded-md" />
              </div>
            </div>
            <div className="relative hidden min-h-full w-[42%] max-w-[200px] sm:block">
              <Skel className="absolute !inset-0 !h-full !w-full !rounded-none opacity-40" />
              <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
                <Skel className="!size-[72px] !rounded-full" />
                <Skel className="!h-2 !w-20 !rounded-full opacity-70" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Skel className="!h-6 !w-[76px] !rounded-md" />
          <Skel className="!h-6 !w-[52px] !rounded-md" />
        </div>
      </div>

      {/* Title + meta + actions */}
      <div className="space-y-6">
        <Skel className="!h-9 !w-full max-w-md !rounded-md" />

        <div className="flex flex-col gap-6 sm:flex-row sm:gap-10">
          <div className="space-y-2">
            <Skel className="!h-3 !w-16 !rounded-sm opacity-70" />
            <Skel className="!h-5 !w-48 !rounded-md" />
          </div>
          <div className="space-y-2">
            <Skel className="!h-3 !w-14 !rounded-sm opacity-70" />
            <Skel className="!h-5 !w-48 !rounded-md" />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Skel className="!h-12 !w-full !rounded-md sm:!w-36" />
          <Skel className="!h-12 !w-full !rounded-md sm:!w-44" />
          <Skel className="!h-12 !w-full !rounded-md sm:!w-28" />
        </div>
      </div>

      {/* About + sidebar */}
      <div className="mt-6 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_310px] lg:gap-16">
        <div className="space-y-4">
          <Skel className="!h-5 !w-40 !rounded-md" />
          <Skel className="!h-4 !w-full !rounded-sm" />
          <Skel className="!h-4 !w-full !rounded-sm" />
          <Skel className="!h-4 !w-[92%] !rounded-sm" />
          <Skel className="!h-4 !w-full !rounded-sm" />
          <Skel className="!h-4 !w-[78%] !rounded-sm" />
        </div>

        <div className="space-y-0 divide-y divide-[#232C3D] border-t border-[#232C3D] lg:border-t-0">
          <div className="space-y-3 py-6 pt-0">
            <Skel className="!h-4 !w-24 !rounded-md" />
            <div className="flex items-center gap-3">
              <Skel className="!size-8 !rounded-md" />
              <Skel className="!h-4 !w-28 !rounded-md" />
            </div>
            <Skel className="!h-3 !w-24 !rounded-sm" />
          </div>
          <div className="space-y-3 py-6">
            <Skel className="!h-4 !w-16 !rounded-md" />
            <Skel className="!h-4 !w-full !rounded-sm" />
            <Skel className="!h-4 !w-full !rounded-sm" />
          </div>
          <div className="space-y-4 py-6">
            <Skel className="!h-4 !w-28 !rounded-md" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skel className="!h-3 !w-20 !rounded-sm opacity-70" />
                <Skel className="!h-4 !w-40 !rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
