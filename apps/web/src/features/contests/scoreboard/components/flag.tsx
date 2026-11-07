"use client";

import Image from "next/image";
import { Box } from "lucide-react";
import { cn } from "@/lib/utils";

type FlagProps = {
  country: string;
  size?: number;
  className?: string;
};

export function Flag({ country, size = 18, className }: FlagProps) {
  const code = country.toUpperCase();
  if (code === "WO" || code === "XX" || code.length !== 2) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full border border-[#9FEF00]/30 bg-[#9FEF00]/10",
          className,
        )}
        style={{ width: size, height: size }}
        title="Worldwide"
      >
        <Box className="size-[55%] text-[#9FEF00]" strokeWidth={2.25} aria-hidden />
      </span>
    );
  }

  return (
    <Image
      src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`}
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0 rounded-full object-cover", className)}
      style={{ width: size, height: size }}
      unoptimized
    />
  );
}
