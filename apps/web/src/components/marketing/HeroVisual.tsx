'use client';

import { Component, type ReactNode, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { HeroNeuralFallback } from './HeroNeuralFallback';

const HeroNeuralCore = dynamic(
  () => import('./HeroNeuralCore').then((module) => module.HeroNeuralCore),
  { ssr: false, loading: () => <HeroNeuralFallback /> },
);

class HeroVisualBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return <HeroNeuralFallback />;
    return this.props.children;
  }
}

export function HeroVisual() {
  const [allowMotion, setAllowMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!media.matches) setAllowMotion(true);
  }, []);

  return (
    <div className="relative h-full w-full" aria-hidden="true">
      <div className="absolute left-1/2 top-1/2 size-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/14 blur-3xl" />
      {allowMotion ? (
        <HeroVisualBoundary>
          <HeroNeuralCore />
        </HeroVisualBoundary>
      ) : (
        <HeroNeuralFallback />
      )}
    </div>
  );
}
