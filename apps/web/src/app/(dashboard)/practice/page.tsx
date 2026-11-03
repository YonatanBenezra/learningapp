import { Suspense } from "react";
import { GlobalLoader } from "@/components/ui/global-loader";
import { PracticeHubView } from "@/features/practice-hub/practice-hub-view";

export default function PracticeHubPage() {
  return (
    <Suspense fallback={<GlobalLoader />}>
      <PracticeHubView />
    </Suspense>
  );
}
