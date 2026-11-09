"use client";

import { authUserInitials, useAuthSession } from "@/features/auth/use-auth-session";
import { avatarColorForName } from "@/features/contests/arena/lib/categories";

export function OperatorAvatarCard() {
  const { user, signedIn } = useAuthSession();
  const label = user?.displayName?.trim() || user?.email?.split("@")[0] || "Operator";
  const initials = signedIn && user ? authUserInitials(user) : "LP";

  return (
    <div className="flex aspect-square w-full max-w-[150px] flex-col items-center justify-center rounded-md bg-[#151C2B] p-3">
      <span
        className="flex size-20 items-center justify-center rounded-md text-2xl font-bold text-[#0F1520]"
        style={{ backgroundColor: avatarColorForName(label) }}
        aria-hidden
      >
        {initials}
      </span>
      <p className="mt-3 max-w-full truncate text-center text-xs font-semibold text-white">
        {label}
      </p>
      <p className="text-[11px] text-[#6B7891]">Solo operator</p>
    </div>
  );
}
