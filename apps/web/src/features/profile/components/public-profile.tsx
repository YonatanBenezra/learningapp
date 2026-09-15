"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GlobalLoader } from "@/components/ui/global-loader";
import { routes } from "@/config/routes";
import { EmployerProfileContent } from "@/features/profile/components/employer-profile-content";
import { profileApi } from "@/features/profile/profile-api";
import { ApiError } from "@/lib/api-client";
import type { PublicProfile } from "@/types/profile";
import "../public-profile.css";

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
      <div className="lp-page lp-page-catalogue lp-page-profile">
        <div className="lp-pp">
          <header className="lp-pp-hero">
            <div className="lp-pp-copy">
              <p className="lp-pp-kicker">Employer view</p>
              <h1 className="lp-pp-title">Profile unavailable</h1>
              <p className="lp-pp-lead">
                This profile is private or does not exist.
              </p>
            </div>
          </header>
        </div>
      </div>
    );
  }

  if (error === "load") {
    return (
      <div className="lp-page lp-page-catalogue lp-page-profile">
        <div className="lp-pp">
          <div className="lp-pp-error">
            <strong>Could not load this profile</strong>
            <p>Check that the API is running, then refresh this page.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <GlobalLoader fullPage />;
  }

  return (
    <div className="lp-page lp-page-catalogue lp-page-profile">
      <EmployerProfileContent profile={profile} />
    </div>
  );
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

  return (
    <div className="lp-page lp-page-catalogue lp-page-profile lp-page-report">
      <EmployerProfileContent profile={profile} printable />
    </div>
  );
}
