import type { ReactNode } from "react";
import "./arena.css";
import { ArenaHub } from "./ArenaHub";

export function ArenaPage({ children }: { children?: ReactNode }) {
  return (
    <div className="arena-page relative min-h-full overflow-hidden bg-[var(--arena-bg)] text-[var(--arena-ink)]">
      <div
        className="pointer-events-none absolute inset-x-0 -top-[var(--lp-dash-nav-offset,4.5rem)] h-[calc(560px+var(--lp-dash-nav-offset,4.5rem))] opacity-100 [background-image:linear-gradient(to_right,rgba(11,18,32,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(11,18,32,0.04)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent)] dark:[background-image:linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-1/2 top-[-200px] h-[480px] w-[min(1100px,100vw)] -translate-x-1/2 rounded-full bg-[color-mix(in_srgb,var(--arena-lime)_11%,transparent)] blur-[170px]"
        aria-hidden
      />
      <div className="relative z-[1]">{children ?? <ArenaHub />}</div>
    </div>
  );
}
