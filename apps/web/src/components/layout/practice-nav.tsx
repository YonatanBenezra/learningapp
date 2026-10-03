"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, FlaskConical, Radio } from "lucide-react";
import { LabpathLogo } from "@/components/brand/labpath-logo";
import { brand } from "@/config/brand";
import { routes } from "@/config/routes";
import { simulatorLabel } from "@/config/simulators";
import { problemsApi } from "@/features/problems/problems-api";
import { exerciseSlugFromPath } from "./nav-routes";

export function PracticeNav() {
  const pathname = usePathname();
  const slug = exerciseSlugFromPath(pathname);
  const [title, setTitle] = useState<string | null>(null);
  const [simulator, setSimulator] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.dataset.workspace = "practice";
    return () => {
      delete document.documentElement.dataset.workspace;
    };
  }, []);

  useEffect(() => {
    if (!slug) {
      setTitle(null);
      setSimulator(null);
      return;
    }
    let cancelled = false;
    problemsApi
      .getBySlug(slug)
      .then((exercise) => {
        if (!cancelled) {
          setTitle(exercise.title);
          setSimulator(exercise.simulator);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTitle(slug);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const contextLabel = pathname.startsWith("/runs/")
    ? "Run trace"
    : pathname.startsWith("/demo/")
      ? "Demo"
      : title ?? "Practice";

  const trackLabel = simulator ? simulatorLabel(simulator) : null;

  return (
    <header className="lp-site-nav lp-site-nav--practice">
      <div className="lp-site-nav-glow" aria-hidden />
      <div className="lp-site-nav-inner lp-dash-nav-inner">
        <div className="flex min-w-0 items-center gap-3">
          <Link href={routes.problems} className="lp-practice-back" aria-label="Back to problems">
            <ArrowLeft className="size-[1.125rem]" strokeWidth={2.25} />
            <span className="max-sm:hidden">Problems</span>
          </Link>

          <span className="lp-site-nav-vrule" aria-hidden />

          <div className="flex min-w-0 flex-col gap-0.35">
            <span className="lp-practice-kicker">
              <FlaskConical className="size-3.5 opacity-80" strokeWidth={2.2} aria-hidden />
              Simulator practice
              {trackLabel ? (
                <>
                  <span aria-hidden>·</span>
                  {trackLabel}
                </>
              ) : null}
            </span>
            <p className="lp-practice-title">{contextLabel}</p>
          </div>
        </div>

        <div className="lp-site-nav-right">
          <span className="lp-practice-live">
            <Radio className="size-4" strokeWidth={2.25} aria-hidden />
            Live session
          </span>
          <Link href={routes.simulations} className="lp-practice-exit max-[640px]:hidden">
            All simulators
          </Link>
          <Link href={routes.home} aria-label={brand.name}>
            <LabpathLogo size="sm" />
          </Link>
        </div>
      </div>
    </header>
  );
}
