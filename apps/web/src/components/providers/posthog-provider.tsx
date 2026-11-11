"use client";

import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { Suspense, useEffect, useRef, type ReactNode } from "react";
import { useAuthSession } from "@/features/auth/use-auth-session";
import { posthogClientOptions, posthogConfig } from "@/lib/posthog";

function PostHogIdentify() {
  const { user, resolved, signedIn } = useAuthSession();
  const lastIdRef = useRef<string | null>(null);

  useEffect(() => {
    const config = posthogConfig();
    if (!config || !resolved) {
      return;
    }

    if (signedIn && user?.id) {
      if (lastIdRef.current === user.id) {
        return;
      }
      lastIdRef.current = user.id;
      posthog.identify(user.id, {
        email: user.email,
        role: user.role,
        display_name: user.displayName ?? undefined,
      });
      return;
    }

    if (lastIdRef.current !== null) {
      lastIdRef.current = null;
      posthog.reset();
    }
  }, [resolved, signedIn, user?.id, user?.email, user?.role, user?.displayName]);

  return null;
}

function PostHogPageviews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const config = posthogConfig();
    if (!config) {
      return;
    }

    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    const currentUrl =
      typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
    posthog.capture("$pageview", { $current_url: currentUrl });
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: ReactNode }) {
  const initializedRef = useRef(false);

  useEffect(() => {
    const config = posthogConfig();
    if (!config || initializedRef.current) {
      return;
    }
    initializedRef.current = true;
    posthog.init(config.key, posthogClientOptions(config.host));
  }, []);

  const enabled = posthogConfig() !== null;

  return (
    <>
      {enabled ? (
        <>
          <Suspense fallback={null}>
            <PostHogPageviews />
          </Suspense>
          <PostHogIdentify />
        </>
      ) : null}
      {children}
    </>
  );
}
