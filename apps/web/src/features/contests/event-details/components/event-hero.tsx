"use client";

import { useEffect, useId, useRef, useState } from "react";
import { brand } from "@/config/brand";
import "./event-hero.css";

export type EventHeroProps = {
  title: string;
  brand?: string;
  flagText?: string;
};

type Parallax = { x: number; y: number };

const BLOB_SHIFTS = [
  { x: 1, y: 0.85 },
  { x: -0.9, y: 1 },
  { x: 0.7, y: -0.75 },
  { x: -0.65, y: 0.6 },
  { x: 0.85, y: 0.9 },
  { x: -0.55, y: -0.8 },
] as const;

function BrandHexIcon() {
  return (
    <svg width={34} height={34} viewBox="0 0 34 34" fill="none" aria-hidden>
      <path
        d="M17 4L28 10.5V23.5L17 30L6 23.5V10.5L17 4Z"
        stroke="#9FEF00"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      <path
        d="M17 11L23 14.5V20.5L17 24L11 20.5V14.5L17 11Z"
        stroke="#9FEF00"
        strokeWidth={1.75}
        strokeLinejoin="round"
        opacity={0.85}
      />
    </svg>
  );
}

function FlagScene({ uid }: { uid: string }) {
  const pole = `pole-${uid}`;
  const ball = `ball-${uid}`;
  return (
    <svg viewBox="0 0 200 200" fill="none" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id={pole} x1="0" x2="1">
          <stop offset="0" stopColor="#4A5670" />
          <stop offset="1" stopColor="#262F42" />
        </linearGradient>
        <radialGradient id={ball} cx="0.35" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#AAB6D0" />
          <stop offset="1" stopColor="#4A5670" />
        </radialGradient>
      </defs>
      <ellipse
        cx="123"
        cy="162"
        rx="44"
        ry="14"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeDasharray="0.5 6"
        strokeLinecap="round"
        opacity="0.9"
      />
      <rect x="116" y="42" width="14" height="124" rx="7" fill="#1A2133" />
      <rect x="118" y="44" width="10" height="120" rx="5" fill={`url(#${pole})`} />
      <circle cx="123" cy="36" r="12" fill={`url(#${ball})`} />
      <ellipse cx="119" cy="31" rx="4" ry="2.5" fill="#fff" opacity="0.6" />
      <g className="lp-event-hero-flag-wave">
        <path
          d="M118 58 C108 52 100 54 96 60 L96 104 C100 98 108 96 118 102 Z"
          fill="#6FA800"
        />
        <path
          d="M96 60 C88 70 76 66 66 58 L66 102 C76 110 88 112 96 104 Z"
          fill="#9FEF00"
        />
      </g>
    </svg>
  );
}

export default function EventHero({ title, brand: brandName = brand.name, flagText = "flag{try_0ut}" }: EventHeroProps) {
  const uid = useId().replace(/:/g, "");
  const bannerRef = useRef<HTMLDivElement>(null);
  const [parallax, setParallax] = useState<Parallax>({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (window.matchMedia("(pointer: coarse)").matches) {
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let frame = 0;
    const onMove = (event: MouseEvent) => {
      const el = bannerRef.current;
      if (!el) {
        return;
      }
      const rect = el.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setParallax({ x: nx * 12, y: ny * 12 });
      });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  const blobs = [
    { cls: "lp-event-hero-blob--1", color: "bg-[#9FEF00]/60", size: 320, style: { top: -40, right: "12%" } },
    { cls: "lp-event-hero-blob--2", color: "bg-[#7BC700]/40", size: 260, style: { bottom: -80, left: -40 } },
    { cls: "lp-event-hero-blob--3", color: "bg-[#8A94A8]/35", size: 280, style: { top: -60, left: "8%" } },
    { cls: "lp-event-hero-blob--4", color: "bg-[#6B7488]/25", size: 220, style: { top: -50, left: "40%" } },
    { cls: "lp-event-hero-blob--5", color: "bg-[#2EE6A6]/20", size: 200, style: { bottom: -60, right: "5%" } },
    { cls: "lp-event-hero-blob--6", color: "bg-[#4A5468]/30", size: 240, style: { bottom: -40, left: "42%" } },
  ] as const;

  return (
    <div
      ref={bannerRef}
      className="lp-event-hero relative h-[240px] w-full overflow-hidden rounded-[28px] border border-white/5 bg-[#0F1520] md:h-[400px]"
    >
      {/* Layer 1 — mesh blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {blobs.map((blob, i) => {
          const shift = BLOB_SHIFTS[i] ?? BLOB_SHIFTS[0];
          const px = parallax.x * shift.x;
          const py = parallax.y * shift.y;
          return (
            <div
              key={blob.cls}
              className="absolute"
              style={{
                ...blob.style,
                transform: `translate(${px}px, ${py}px)`,
              }}
            >
              <div
                className={`lp-event-hero-blob rounded-full blur-[80px] ${blob.cls} ${blob.color}`}
                style={{ width: blob.size, height: blob.size }}
              />
            </div>
          );
        })}
      </div>

      {/* Layer 2 — dot grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage: "radial-gradient(ellipse at center, #000 42%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, #000 42%, transparent 78%)",
        }}
        aria-hidden
      />

      {/* Layer 3 — vignette */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(15,21,32,0.7)_100%)]"
        aria-hidden
      />

      {/* Center card */}
      <div
        className="absolute left-1/2 top-1/2 h-[180px] w-[88%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[30px] border border-white/10 bg-[#141B29]/95 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl md:h-[270px] md:w-[480px]"
      >
        <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#9FEF00] to-transparent opacity-70" aria-hidden />

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#5C8A00] via-[#7FB800]/70 to-transparent"
          style={{ clipPath: "polygon(62% 100%, 100% 30%, 100% 100%)" }}
          aria-hidden
        />

        <div className="relative z-[1] flex h-full max-w-[58%] flex-col justify-center pl-6 md:pl-9">
          <h2
            className="text-[24px] font-extrabold leading-none tracking-tight text-white md:text-[38px]"
            style={{ fontFamily: "var(--font-inter, Inter), 'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            {title}
          </h2>
          <div className="mt-4 h-[2px] w-full rounded-full bg-white/70 md:mt-5" aria-hidden />
          <div className="mt-4 flex items-center gap-2.5 md:mt-5">
            <BrandHexIcon />
            <span className="text-[18px] md:text-[22px]">
              <span className="font-bold tracking-wide text-white">{brandName}</span>
              <span className="font-normal text-[#A4B1CD]"> CTF</span>
            </span>
          </div>
          <p className="mt-3 hidden items-center gap-0.5 rounded-md border border-[#9FEF00]/25 bg-[#9FEF00]/10 px-2 py-0.5 font-mono text-[11px] text-[#9FEF00] md:mt-4 md:inline-flex">
            <span>{flagText}</span>
            <span className="lp-event-hero-caret" aria-hidden>
              |
            </span>
          </p>
        </div>

        <div className="absolute right-4 top-1/2 z-[2] h-[140px] w-[126px] -translate-y-1/2 md:right-6 md:h-[200px] md:w-[180px]">
          <FlagScene uid={uid} />
        </div>
      </div>
    </div>
  );
}
