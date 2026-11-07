"use client";

import Image from "next/image";
import { avatarColorForName, avatarInitialsForName } from "@/features/contests/arena/lib/categories";
import { cn } from "@/lib/utils";

type TeamAvatarProps = {
  name: string;
  avatarUrl?: string;
  size?: number;
  className?: string;
};

export function TeamAvatar({ name, avatarUrl, size = 24, className }: TeamAvatarProps) {
  const initials = avatarInitialsForName(name);
  const bg = avatarColorForName(name);

  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt=""
        width={size}
        height={size}
        className={cn("shrink-0 rounded-full object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-[#0F1520]",
        className,
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: bg,
        fontSize: Math.max(10, size * 0.38),
      }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
