import type { PostHogConfig } from "posthog-js";

export function posthogConfig(): { key: string; host: string } | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim();
  if (!key || !host) {
    return null;
  }
  return { key, host };
}

export function posthogClientOptions(host: string): Partial<PostHogConfig> {
  return {
    api_host: host,
    person_profiles: "identified_only",
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "[data-ph-mask]",
    },
  };
}
