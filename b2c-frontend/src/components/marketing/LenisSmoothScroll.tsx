'use client';

import { useEffect, type ReactNode } from 'react';
import Lenis from 'lenis';

const NAVBAR_SCROLL_OFFSET = 80;

export function LenisSmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const lenis = new Lenis({
      autoRaf: true,
      anchors: {
        offset: NAVBAR_SCROLL_OFFSET,
        lerp: 0.1,
      },
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.1,
    });

    document.documentElement.classList.add('lenis', 'lenis-smooth');

    return () => {
      lenis.destroy();
      document.documentElement.classList.remove('lenis', 'lenis-smooth');
    };
  }, []);

  return children;
}
