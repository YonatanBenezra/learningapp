import { Suspense } from "react";
import { PracticeHubView } from "@/features/practice-hub/practice-hub-view";

export default function PracticeHubPage() {
  return (
    <Suspense fallback={null}>
      <PracticeHubView />
    </Suspense>
  );
}
