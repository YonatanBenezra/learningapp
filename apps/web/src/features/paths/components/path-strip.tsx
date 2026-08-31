"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api-client";
import type { PathListItem } from "@/types/path";
import { pathsApi } from "../paths-api";
import { PathCard } from "./path-card";

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
        if (!cancelled && !(caught instanceof ApiError && caught.status === 401)) {
          setItems([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section className="lp-path-strip" aria-label="Guided paths">
      <div className="lp-path-strip-head">
        <p className="lp-panel-eyebrow">Guided paths</p>
        <p className="lp-cat-count lp-path-strip-lead">
          Ordered sets. One exercise at a time. Quotas still apply.
        </p>
      </div>
      <div className="lp-grid lp-grid-catalogue">
        {items.map((path) => (
          <PathCard key={path.slug} path={path} />
        ))}
      </div>
    </section>
  );
}
