"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { routes } from "@/config/routes";
import { catalogueApi } from "@/features/catalogue/catalogue-api";
import { ApiError } from "@/lib/api-client";
import type { Exercise } from "@/types/exercise";
import { ExerciseCard } from "./exercise-card";

export function CatalogueGrid() {
  const [items, setItems] = useState<Exercise[] | null>(null);
  const [error, setError] = useState<"auth" | "load" | null>(null);

  useEffect(() => {
    let cancelled = false;
    catalogueApi
      .list()
      .then((result) => {
        if (!cancelled) {
          setItems(result.items);
        }
      })
      .catch((caught: unknown) => {
        if (cancelled) {
          return;
        }
        setError(
          caught instanceof ApiError && caught.status === 401 ? "auth" : "load",
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error === "auth") {
    return (
      <p className="text-sm">
        Sign in to see the catalogue.{" "}
        <Link href={routes.login} className="underline">
          Sign in
        </Link>
      </p>
    );
  }

  if (error === "load") {
    return <p className="text-sm">Could not load exercises.</p>;
  }

  if (!items) {
    return <p className="text-sm opacity-70">Loading…</p>;
  }

  if (items.length === 0) {
    return <p className="text-sm">No published exercises yet.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((exercise) => (
        <ExerciseCard key={exercise.slug} exercise={exercise} />
      ))}
    </div>
  );
}
