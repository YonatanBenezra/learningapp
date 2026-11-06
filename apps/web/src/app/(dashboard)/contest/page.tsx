import { Suspense } from "react";
import { CtfEventsView } from "@/features/ctf-events/ctf-events-view";

export default function ContestHubPage() {
  return (
    <Suspense fallback={null}>
      <CtfEventsView />
    </Suspense>
  );
}
