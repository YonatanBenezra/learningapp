"use client";

import dynamic from "next/dynamic";
import type { PipelineTrack } from "@/components/hero/layers";

const PipelineStack3D = dynamic(
  () => import("@/components/hero/PipelineStack3D").then((m) => m.PipelineStack3D),
  { ssr: false },
);

export function HomeHeroPipeline({ activeTrack }: { activeTrack: PipelineTrack | null }) {
  return <PipelineStack3D activeTrack={activeTrack} />;
}
