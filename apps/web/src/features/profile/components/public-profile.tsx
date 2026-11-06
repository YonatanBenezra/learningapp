"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GlobalLoader } from "@/components/ui/global-loader";
import { routes } from "@/config/routes";
import { EmployerProfileContent } from "@/features/profile/components/employer-profile-content";
import { profileApi } from "@/features/profile/profile-api";
import { ApiError } from "@/lib/api-client";
import type { PublicProfile } from "@/types/profile";
export function PublicProfileView({ slug }: { slug: string }) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState<"missing" | "load" | null>(null);

  useEffect(() => {
    let cancelled = false;
    profileApi
      .getPublic(slug)
      .then((result) => {
        if (!cancelled) {
          setProfile(result);
        }
      })
      .catch((caught: unknown) => {
        if (cancelled) {
          return;
        }
        setError(
          caught instanceof ApiError && caught.status === 404
            ? "missing"
            : "load",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (error === "missing") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center bg-[#07090D] px-6 py-16 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#B6F23A]">Employer view</p>
        <h1 className="mt-3 text-2xl font-bold text-[#EDEFF3]" style={{ fontFamily: "var(--font-ep-heading), sans-serif" }}>
          Profile unavailable
        </h1>
        <p className="mt-2 max-w-md text-sm text-[#8A93A3]">This profile is private or does not exist.</p>
      </div>
    );
  }

  if (error === "load") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center bg-[#07090D] px-6 py-16 text-center">
        <strong className="text-[#EDEFF3]">Could not load this profile</strong>
        <p className="mt-2 max-w-md text-sm text-[#8A93A3]">Check that the API is running, then refresh this page.</p>
      </div>
    );
  }

  if (!profile) {
    return <GlobalLoader fullPage />;
  }

  return <EmployerProfileContent profile={profile} />;
}

export function EmployerReportView({ slug }: { slug: string }) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState<"missing" | "load" | null>(null);

  useEffect(() => {
    let cancelled = false;
    profileApi
      .getPublic(slug)
      .then((result) => {
        if (!cancelled) {
          setProfile(result);
        }
      })
      .catch((caught: unknown) => {
        if (cancelled) {
          return;
        }
        setError(
          caught instanceof ApiError && caught.status === 404
            ? "missing"
            : "load",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (error === "missing") {
    return (
      <div className="lp-page lp-page-catalogue lp-page-profile">
        <div className="lp-pp">
          <p className="lp-pp-empty">
            Report unavailable.{" "}
            <Link href={routes.home}>Return home</Link>
          </p>
        </div>
      </div>
    );
  }

  if (error === "load" || !profile) {
    return error === "load" ? (
      <div className="lp-page lp-page-catalogue lp-page-profile">
        <div className="lp-pp-error">
          <strong>Could not load this report</strong>
        </div>
      </div>
    ) : (
      <GlobalLoader fullPage />
    );
  }

  return <EmployerProfileContent profile={profile} printable />;
}
