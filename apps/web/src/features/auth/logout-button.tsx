"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { routes } from "@/config/routes";
import { authApi } from "@/features/auth/auth-api";
import { authToastSuccess } from "@/features/auth/auth-toast";
import { clearAuthSnapshot } from "@/features/auth/auth-session";

type LogoutButtonProps = {
  className?: string;
  label?: string;
  pendingLabel?: string;
  /** Runs before the redirect — the sidebar uses it to close the mobile menu. */
  onDone?: () => void;
};

export function LogoutButton({
  className,
  label = "Sign out",
  pendingLabel = "Signing out…",
  onDone,
}: LogoutButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      await authApi.logout();
    } catch {
      // The refresh cookie may already be gone or the API unreachable.
      // Either way the local session has to be dropped, not left behind.
    }
    // RequireAuth reads this snapshot before it calls the API, so a stale
    // "authenticated" here would walk the user straight back in.
    clearAuthSnapshot();
    authToastSuccess("Signed out.");
    onDone?.();
    router.replace(routes.signIn);
    router.refresh();
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => void signOut()}
      disabled={busy}
    >
      {busy ? pendingLabel : label}
    </button>
  );
}
