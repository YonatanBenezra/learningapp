import { Suspense } from "react";
import { ProfilePlatformSkeleton } from "@/features/profile/platform/profile-platform-skeleton";
import { ProfilePlatformView } from "@/features/profile/platform/profile-platform-view";

export default function DashboardProfilePage() {
  return (
    <Suspense fallback={<ProfilePlatformSkeleton />}>
      <ProfilePlatformView />
    </Suspense>
  );
}
