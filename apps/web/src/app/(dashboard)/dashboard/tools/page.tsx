import type { Metadata } from "next";
import { Suspense } from "react";
import { ToolLadderView } from "@/features/tool-ladder/tool-ladder-view";

export const metadata: Metadata = {
  title: "Your tools",
};

export default function DashboardToolsPage() {
  return (
    <Suspense fallback={null}>
      <ToolLadderView />
    </Suspense>
  );
}
