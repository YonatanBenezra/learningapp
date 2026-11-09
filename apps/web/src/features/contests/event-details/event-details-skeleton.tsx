"use client";

import { cn } from "@/lib/utils";

function Skel({ className }: { className?: string }) {
  return (
    <div
      className={cn("block animate-pulse rounded-md bg-[#232C3D]/70", className)}
      aria-hidden
    />
  );
}

export function EventDetailsSkeleton() {
  return (
    <div
      className="min-h-dvh bg-[#0F1520] text-white"
      aria-busy="true"
      aria-live="polite"
      aria-label="Loading event details"
    >
      <section className="relative overflow-hidden border-b border-[#1A2232]">
        <div className="relative mx-auto max-w-[1200px] px-6 pb-12 pt-10">
          <Skel className="h-4 w-36" />
          <div className="mt-7 grid items-center gap-10 lg:grid-cols-[1fr_520px] lg:gap-12">
            <div className="order-2 space-y-5 lg:order-1">
              <div className="flex flex-wrap gap-2">
                <Skel className="h-6 w-[76px]" />
                <Skel className="h-6 w-14" />
                <Skel className="h-6 w-24" />
              </div>
              <Skel className="h-11 w-full max-w-lg md:h-12" />
              <div className="space-y-2">
                <Skel className="h-4 w-full max-w-[560px]" />
                <Skel className="h-4 w-[92%] max-w-[520px]" />
              </div>
              <div className="flex w-full max-w-xl flex-col overflow-hidden rounded-[10px] border border-[#232C3D] sm:flex-row sm:divide-x sm:divide-[#232C3D]">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2 px-4 py-3 sm:px-5">
                    <Skel className="h-3 w-14" />
                    <Skel className="h-5 w-32" />
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Skel className="h-[46px] w-40 rounded-md" />
                <Skel className="h-[46px] w-44 rounded-md" />
                <Skel className="size-[46px] rounded-md" />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <Skel className="h-[300px] w-full rounded-[24px] bg-[#1B2434]/80" />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] px-6">
        <section
          className="mt-7 grid grid-cols-2 divide-y divide-[#232C3D] overflow-hidden rounded-[10px] border border-[#232C3D] bg-[#151C2B] sm:grid-cols-3 lg:grid-cols-5 lg:divide-x lg:divide-y-0"
          aria-hidden
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-3.5 p-[18px_22px]",
                i === 4 ? "col-span-2 sm:col-span-1" : "",
              )}
            >
              <Skel className="size-10 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skel className="h-3 w-16" />
                <Skel className="h-5 w-24" />
              </div>
            </div>
          ))}
        </section>

        <div className="mt-10 flex gap-7 border-b border-[#232C3D] pb-3" aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skel key={i} className={cn("h-4", i === 0 ? "w-20" : "w-24")} />
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-10 pb-20 lg:grid-cols-[1fr_340px]">
          <div className="space-y-8">
            <div className="space-y-4">
              <Skel className="h-5 w-36" />
              {Array.from({ length: 3 }).map((_, i) => (
                <Skel key={i} className="h-4 w-full" />
              ))}
              <Skel className="h-4 w-[78%]" />
            </div>
            <div className="space-y-3">
              <Skel className="h-5 w-28" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skel key={i} className="h-9 w-28 rounded-lg" />
                ))}
              </div>
            </div>
            <div className="overflow-hidden rounded-[10px] border border-[#232C3D] bg-[#0C111B]">
              <Skel className="h-10 w-full rounded-none bg-[#151C2B]/90" />
              <div className="grid gap-px bg-[#232C3D] sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-[#0C111B] p-[18px]">
                    <div className="flex gap-3">
                      <Skel className="size-[26px] shrink-0 rounded-md" />
                      <div className="flex-1 space-y-2">
                        <Skel className="h-4 w-[85%]" />
                        <Skel className="h-3 w-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-[10px] border border-[#232C3D] bg-[#151C2B] p-5"
              >
                <Skel className="mb-3.5 h-3 w-24" />
                <Skel className="h-4 w-full" />
                <Skel className="mt-2 h-4 w-2/3" />
              </div>
            ))}
            <div className="overflow-hidden rounded-[10px] border border-[#232C3D] bg-[#151C2B]">
              <div className="border-b border-[#232C3D] p-5 pb-3.5">
                <Skel className="h-3 w-28" />
              </div>
              <div className="grid grid-cols-2 gap-px bg-[#232C3D]">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="space-y-2 bg-[#151C2B] px-4 py-3.5">
                    <Skel className="h-3 w-16" />
                    <Skel className="h-4 w-20" />
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
