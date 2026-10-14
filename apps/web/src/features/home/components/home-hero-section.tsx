"use client";

import {
  ArrowRight,
  BarChart3,
  Check,
  Database,
  ImageIcon,
  Play,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { PipelineTrack } from "@/components/hero/layers";
import { routes } from "@/config/routes";
import { AuthLink } from "@/features/auth/auth-link";
import { HomeHeroPipeline } from "@/features/home/components/home-hero-pipeline";

const TRUST = ["Free during beta", "No card", "15-min first set"] as const;

const TRACKS: {
  id: PipelineTrack;
  label: string;
  stat: string;
  icon: typeof Database;
  active?: boolean;
}[] = [
  { id: "rag", label: "RAG", stat: "212 sets", icon: Database, active: true },
  { id: "eval", label: "Eval", stat: "86", icon: BarChart3 },
  { id: "guard", label: "Guard", stat: "140", icon: Shield },
  { id: "prompt", label: "Prompt", stat: "64", icon: ImageIcon },
];

export function HomeHeroSection() {
  const [activeTrack, setActiveTrack] = useState<PipelineTrack | null>(null);

  return (
    <div className="lp-home-hero-inner">
      <div className="lp-home-hero-copy-col">
      <div className="lp-home-hero-copy lp-home-hero-copy--top lp-home-hero-enter">
        <p className="lp-home-hero-badge">
          <span className="lp-home-hero-badge-mark">BETA</span>
          <span className="lp-home-hero-badge-text">Practice platform for AI engineering</span>
          <ArrowRight className="lp-icon lp-icon--sm" strokeWidth={1.5} aria-hidden />
        </p>

        <h1 id="home-hero-title" className="lp-home-hero-title lp-type-display">
          <span className="lp-home-hero-title-line">The gym for AI</span>
          <span className="lp-type-display-accent">engineers.</span>
        </h1>

        <p className="lp-home-hero-lead lp-type-body-lg">
          Graded RAG, Guardrails, Eval and Prompt exercises with hidden test sets and full traces. A
          score that only moves when your work does.
        </p>

        <div className="lp-home-hero-actions">
          <AuthLink href={routes.problems} className="lp-btn lp-btn--primary">
            Open problems
            <ArrowRight className="lp-icon lp-icon--sm" strokeWidth={1.5} aria-hidden />
          </AuthLink>
          <Link href={routes.demoRagTrace} className="lp-btn lp-btn--secondary">
            Watch a 60s run
            <Play className="lp-icon lp-icon--sm" strokeWidth={1.5} aria-hidden />
          </Link>
        </div>
      </div>

      <div className="lp-home-hero-copy lp-home-hero-copy--bottom lp-home-hero-enter">
        <ul className="lp-home-hero-trust">
          {TRUST.map((item) => (
            <li key={item}>
              <Check className="lp-home-hero-trust-icon" strokeWidth={2} aria-hidden />
              {item}
            </li>
          ))}
        </ul>

        <div className="lp-home-hero-tracks">
          <p className="lp-type-mono-label">GRADED ACROSS 4 PRACTICE TRACKS</p>
          <div className="lp-home-track-pills">
            {TRACKS.map(({ id, label, stat, icon: Icon, active }) => (
              <span
                key={id}
                role="presentation"
                className={`lp-home-track-pill${active ? " is-active" : ""}`}
                onMouseEnter={() => setActiveTrack(id)}
                onMouseLeave={() => setActiveTrack(null)}
                onFocus={() => setActiveTrack(id)}
                onBlur={() => setActiveTrack(null)}
              >
                <Icon
                  className={`lp-icon lp-icon--sm${active ? " lp-icon--accent" : ""}`}
                  strokeWidth={1.5}
                  aria-hidden
                />
                <span className="lp-home-track-pill-label">{label}</span>
                <span className="lp-home-track-pill-stat">{stat}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
      </div>

      <div className="lp-home-hero-visual-col">
        <HomeHeroPipeline activeTrack={activeTrack} />
      </div>

    </div>
  );
}
