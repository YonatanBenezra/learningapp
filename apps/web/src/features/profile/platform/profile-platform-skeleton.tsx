"use client";

import { PlatformWorkspaceSkeleton } from "@/components/ui/platform-workspace-skeleton";
import { SkeletonBlock } from "@/components/ui/skeleton-block";

export function ProfilePlatformSkeleton() {
  return (
    <PlatformWorkspaceSkeleton label="Loading profile">
      <main className="lp-dash-figma-main !gap-6 !pb-24 !pt-6">
        <section aria-hidden>
          <SkeletonBlock width="100%" height={180} style={{ borderRadius: 8 }} />
          <div className="-mt-16 flex flex-col gap-4 px-1 sm:flex-row sm:items-start sm:px-4">
            <SkeletonBlock width={112} height={112} circle className="shrink-0 border-4 border-[#101927]" />
            <div className="min-w-0 flex-1 space-y-3 pt-2">
              <SkeletonBlock width="min(280px, 80vw)" height={28} style={{ borderRadius: 6 }} />
              <SkeletonBlock width={160} height={20} style={{ borderRadius: 6 }} />
              <SkeletonBlock width={140} height={16} style={{ borderRadius: 6 }} />
            </div>
            <div className="flex flex-wrap gap-2 sm:pt-2">
              <SkeletonBlock width={88} height={44} style={{ borderRadius: 8 }} />
              <SkeletonBlock width={100} height={44} style={{ borderRadius: 8 }} />
            </div>
          </div>
        </section>

        <div className="flex gap-8 border-b border-platform-border pb-0" aria-hidden>
          <SkeletonBlock width={56} height={20} style={{ marginBottom: 12, borderRadius: 4 }} />
          <SkeletonBlock width={64} height={20} style={{ marginBottom: 12, borderRadius: 4 }} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]" aria-hidden>
          <div className="flex flex-col gap-6">
            <SkeletonBlock width="100%" height={120} style={{ borderRadius: 8 }} />
            <SkeletonBlock width="min(760px, 100%)" height={200} style={{ borderRadius: 8 }} />
            <SkeletonBlock width="100%" height={160} style={{ borderRadius: 8 }} />
          </div>
          <aside className="flex flex-col gap-6">
            <SkeletonBlock width="100%" height={140} style={{ borderRadius: 8 }} />
            <SkeletonBlock width="100%" height={120} style={{ borderRadius: 8 }} />
          </aside>
        </div>
      </main>
    </PlatformWorkspaceSkeleton>
  );
}
