"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api-client";
import type { PathListItem } from "@/types/path";
import { pathsApi } from "../paths-api";
import { PathCard } from "./path-card";
import { PathStripSkeleton } from "./path-strip-skeleton";
import "@/features/catalogue/catalogue.css";

export function PathStrip() {
  const [items, setItems] = useState<PathListItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    pathsApi
      .list()
      .then((result) => {
        if (!cancelled) {
          setItems(result.items);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setItems(caught instanceof ApiError && caught.status === 401 ? [] : []);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!items) {
    return <PathStripSkeleton />;
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="lp-path-strip" aria-label="Guided paths">
      <div className="lp-path-strip-head">
        <h2>Guided paths</h2>
        <p className="lp-path-strip-lead">One exercise at a time · quotas apply</p>
      </div>
      <div className="lp-path-rail">
        {items.map((path) => (
          <PathCard key={path.slug} path={path} />
        ))}
      </div>
    </section>
  );
}
