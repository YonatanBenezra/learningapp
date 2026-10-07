import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type WorkspaceBackLinkProps = {
  href: string;
  label?: string;
  className?: string;
  /** `button` = bordered chip; `inline` = breadcrumb text link with icon. */
  variant?: "button" | "inline";
};

export function WorkspaceBackLink({
  href,
  label = "Problems",
  className,
  variant = "button",
}: WorkspaceBackLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        variant === "button" ? "lp-workspace-back" : "lp-workspace-back-inline",
        className,
      )}
    >
      <ArrowLeft
        className={cn("shrink-0", variant === "button" ? "size-[1.125rem]" : "size-3.5")}
        strokeWidth={2.25}
        aria-hidden
      />
      <span>{label}</span>
    </Link>
  );
}
