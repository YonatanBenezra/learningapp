"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { ProblemsFigmaSkeleton } from "@/features/problems/components/problems-figma-skeleton";

const viewModule = import("@/features/problems/components/problems-figma-view");

const ProblemsFigmaView = dynamic(
  () => viewModule.then((mod) => ({ default: mod.ProblemsFigmaView })),
  { ssr: false, loading: () => <ProblemsFigmaSkeleton /> },
);

const MIN_SKELETON_MS = 560;

function minSkeletonDelay(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function ProblemsPageContent() {
  const [phase, setPhase] = useState<"skeleton" | "view">("skeleton");

  useEffect(() => {
    let cancelled = false;

    void Promise.all([viewModule, minSkeletonDelay(MIN_SKELETON_MS)]).then(() => {
      if (!cancelled) {
        setPhase("view");
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (phase === "skeleton") {
    return <ProblemsFigmaSkeleton />;
  }

  return <ProblemsFigmaView />;
}
