"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ArenaCategoryId } from "@/lib/arena/categories";
import type { PlayFilterState } from "./FilterSidebar";

export function usePlayUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const challengeId = searchParams.get("c");

  const filters: PlayFilterState = useMemo(() => {
    const cat = searchParams.get("cat") ?? "all";
    const diffRaw = searchParams.get("diff");
    const statusRaw = searchParams.get("status");
    return {
      category: cat as ArenaCategoryId | "all",
      difficulties: new Set(diffRaw ? diffRaw.split(",").filter(Boolean) : []),
      status: new Set(
        statusRaw
          ? (statusRaw.split(",").filter(Boolean) as ("unsolved" | "solved")[])
          : [],
      ),
      query: searchParams.get("q") ?? "",
      sort: (searchParams.get("sort") as "points" | "solves" | "difficulty" | "newest") ?? "points",
    };
  }, [searchParams]);

  const replaceParams = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams.toString());
      mutate(next);
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, searchParams],
  );

  const setChallengeId = useCallback(
    (id: string | null) => {
      replaceParams((p) => {
        if (id) {
          p.set("c", id);
        } else {
          p.delete("c");
        }
      });
    },
    [replaceParams],
  );

  const setFilters = useCallback(
    (state: PlayFilterState) => {
      replaceParams((p) => {
        if (state.category === "all") {
          p.delete("cat");
        } else {
          p.set("cat", state.category);
        }
        if (state.difficulties.size === 0) {
          p.delete("diff");
        } else {
          p.set("diff", [...state.difficulties].join(","));
        }
        if (state.status.size === 0) {
          p.delete("status");
        } else {
          p.set("status", [...state.status].join(","));
        }
        if (state.query.trim()) {
          p.set("q", state.query.trim());
        } else {
          p.delete("q");
        }
        if (state.sort !== "points") {
          p.set("sort", state.sort);
        } else {
          p.delete("sort");
        }
      });
    },
    [replaceParams],
  );

  return { challengeId, setChallengeId, filters, setFilters };
}
