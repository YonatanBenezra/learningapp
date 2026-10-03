"use client";

import { useRef, type RefObject } from "react";
import { AnimatedBeam } from "@/components/ui/animated-beam";

const TARGET_COUNT = 10;

function useRefArray(length: number): RefObject<HTMLDivElement | null>[] {
  const refs = useRef<RefObject<HTMLDivElement | null>[]>([]);
  if (refs.current.length !== length) {
    refs.current = Array.from({ length }, () => ({ current: null }));
  }
  return refs.current;
}

export function AuthHeroBeams() {
  const containerRef = useRef<HTMLDivElement>(null);
  const fromRef = useRef<HTMLDivElement>(null);
  const targetRefs = useRefArray(TARGET_COUNT);

  return (
    <div ref={containerRef} className="lc-auth-hero-beams" aria-hidden>
      <div ref={fromRef} className="lc-auth-beam-anchor lc-auth-beam-anchor--from" />
      {targetRefs.map((targetRef, index) => (
        <div
          key={index}
          ref={(node) => {
            targetRef.current = node;
          }}
          className="lc-auth-beam-anchor lc-auth-beam-anchor--to"
          style={{ top: `${8 + index * (84 / (TARGET_COUNT - 1))}%` }}
        />
      ))}
      {targetRefs.map((targetRef, index) => (
        <AnimatedBeam
          key={index}
          containerRef={containerRef}
          fromRef={fromRef}
          toRef={targetRef}
          curvature={-120 - index * 18}
          pathWidth={1.5}
          pathOpacity={0.22}
          pathColor="color-mix(in srgb, var(--color-brand) 55%, transparent)"
          gradientStartColor="#2dd4bf"
          gradientStopColor="#5eead4"
          delay={index * 0.35}
          duration={4 + (index % 3)}
        />
      ))}
    </div>
  );
}
