"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export type LevelCardProps = {
  level: number;
  xp: number;
  xpMax: number;
  rankName: string;
  /** Filled diamond count 0–3 */
  grade: number;
  emblemSrc?: string;
  className?: string;
};

function GradeDiamond({ filled }: { filled: boolean }) {
  return (
    <span
      className={cn(
        "inline-block size-3 rotate-45 rounded-[1px]",
        filled
          ? "bg-[#F4F4F4]"
          : "border-[1.5px] border-[#C5CFDD] bg-[#8799B5]/60",
      )}
      aria-hidden
    />
  );
}

export function LevelCard({
  level,
  xp,
  xpMax,
  rankName,
  grade,
  emblemSrc = "/emblem.svg",
  className,
}: LevelCardProps) {
  const fillPct = xpMax > 0 ? Math.max(2, Math.min(100, (xp / xpMax) * 100)) : 2;
  const filledGrade = Math.max(0, Math.min(3, grade));

  return (
    <article
      className={cn(
        "lp-level-card relative h-[196px] w-full max-w-[760px] overflow-hidden rounded-lg p-6",
        className,
      )}
      style={{
        background: "linear-gradient(90deg, #1A2436 0%, #222D41 55%, #2B3547 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
        aria-hidden
      />
      <span
        className="pointer-events-none absolute left-[38%] top-5 size-2.5 rounded-full bg-[#2E394C]"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute left-3 top-1/2 size-2.5 -translate-y-1/2 rotate-45 bg-[#2E394C]"
        aria-hidden
      />

      <div className="relative flex h-full items-center gap-6">
        <div className="flex w-[250px] shrink-0 items-center justify-center">
          <Image src={emblemSrc} alt="" width={110} height={110} className="h-[110px] w-[110px]" priority />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-end gap-6">
            <div className="flex w-[70px] shrink-0 items-baseline gap-2">
              <span className="text-base font-medium text-[#8799B5]">Lvl</span>
              <span className="text-[26px] font-semibold leading-none text-[#F4F4F4]">{level}</span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-[#F4F4F4]">Level</span>
                  <span
                    className="inline-flex h-[14px] w-4 items-center justify-center rounded-[3px] bg-[#9F6BFF] text-[9px] font-bold leading-none text-white"
                    aria-hidden
                  >
                    XP
                  </span>
                </div>
                <span
                  className="text-xs text-[#8799B5]"
                  style={{ fontFamily: "var(--font-roboto-mono, ui-monospace, monospace)" }}
                >
                  {xp}/{xpMax}
                </span>
              </div>
              <div
                className="mt-2 h-[4px] overflow-hidden rounded-[2px] bg-[#3A4559]"
                role="progressbar"
                aria-valuenow={xp}
                aria-valuemin={0}
                aria-valuemax={xpMax}
                aria-label="Level progress"
              >
                <div
                  className="h-full rounded-[2px] bg-[#9FEF00] transition-[width] duration-150"
                  style={{ width: `${fillPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-7 flex h-[82px] gap-2">
            <div
              className="flex flex-[2] flex-col justify-center rounded-md px-4 py-5"
              style={{ background: "rgba(16,25,39,0.45)" }}
            >
              <p className="text-lg font-medium text-[#F4F4F4]">{rankName}</p>
              <p className="mt-1.5 text-xs text-[#8799B5]">Rank</p>
            </div>
            <div
              className="flex flex-1 flex-col items-start justify-center rounded-md px-4 py-5"
              style={{ background: "rgba(16,25,39,0.45)" }}
            >
              <div className="flex gap-3" aria-label={`Grade ${filledGrade} out of 3`}>
                {[0, 1, 2].map((i) => (
                  <GradeDiamond key={i} filled={i < filledGrade} />
                ))}
              </div>
              <p className="mt-3 text-xs text-[#8799B5]">Grade</p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
