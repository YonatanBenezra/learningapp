"use client";

import { cn } from "@/lib/utils";
import { motion } from "@/lib/motion";

type BackgroundBeamsProps = {
  className?: string;
};

const paths = [
  "M-380 -189C-380 -189 -312 216 152 343C616 470 684 875 684 875",
  "M-373 -197C-373 -197 -305 208 159 335C623 462 691 867 691 867",
  "M-376 -193C-376 -193 -308 212 156 339C620 466 688 871 688 871",
];

/** Lightweight Aceternity-inspired beams (Motion). */
export function BackgroundBeams({ className }: BackgroundBeamsProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 flex h-full w-full items-center justify-center overflow-hidden",
        className,
      )}
      aria-hidden
    >
      <svg
        className="absolute h-full w-full opacity-40"
        width="100%"
        height="100%"
        viewBox="0 0 696 316"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {paths.map((path, index) => (
          <motion.path
            key={path}
            d={path}
            stroke="url(#beam-gradient)"
            strokeOpacity="0.4"
            strokeWidth="0.5"
            initial={{ pathLength: 0.3, opacity: 0.3 }}
            animate={{
              pathLength: [0.3, 1, 0.3],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 8 + index * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
        <defs>
          <linearGradient id="beam-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop stopColor="var(--color-brand)" stopOpacity="0" />
            <stop stopColor="var(--color-brand-glow)" />
            <stop offset="1" stopColor="var(--color-brand)" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
