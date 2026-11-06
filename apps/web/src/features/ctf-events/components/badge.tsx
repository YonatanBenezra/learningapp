import type { CtfEventBadge } from "@/features/ctf-events/types";
import { cn } from "@/lib/utils";

const LABEL: Record<CtfEventBadge, string> = {
  featured: "Featured",
  mcp: "MCP Only",
};

export function CtfBadge({ kind }: { kind: CtfEventBadge }) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center rounded px-2 text-[11px] font-semibold uppercase tracking-[0.5px]",
        kind === "featured"
          ? "bg-platform-badge-featured-bg text-platform-badge-featured-text"
          : "bg-platform-badge-mcp-bg text-platform-badge-mcp-text",
      )}
    >
      {LABEL[kind]}
    </span>
  );
}
