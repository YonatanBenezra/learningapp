import { cn } from "@/lib/utils";

type ProblemBadgeProps = {
  children: string;
  tone?: "featured" | "mcp" | "solved" | "difficulty";
};

export function ProblemBadge({ children, tone = "mcp" }: ProblemBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center rounded px-2 text-[11px] font-semibold uppercase tracking-[0.5px]",
        tone === "featured" && "bg-platform-badge-featured-bg text-platform-badge-featured-text",
        tone === "mcp" && "bg-platform-badge-mcp-bg text-platform-badge-mcp-text",
        tone === "solved" && "bg-[#0f3b2b] text-[#2ee59d]",
        tone === "difficulty" && "bg-[#2a3445] text-[#a4b1c6]",
      )}
    >
      {children}
    </span>
  );
}
