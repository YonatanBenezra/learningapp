import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { routes } from "@/config/routes";

export function LobbyBreadcrumb({ title }: { title: string }) {
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5">
      <Link
        href={routes.contests}
        className="text-[12.5px] text-[var(--arena-text-3)] transition-colors hover:text-[var(--arena-text-2)]"
      >
        Arena
      </Link>
      <ChevronRight className="size-3 shrink-0 text-[var(--arena-text-3)]" aria-hidden />
      <span className="truncate text-[12.5px] text-[var(--arena-text-2)]">{title}</span>
    </nav>
  );
}
