import { Suspense } from "react";
import { GlobalLoader } from "@/components/ui/global-loader";
import { CtfEventsView } from "@/features/ctf-events/ctf-events-view";

export default function ContestHubPage() {
  return (
    <Suspense fallback={<GlobalLoader />}>
      <CtfEventsView />
    </Suspense>
  );
}
