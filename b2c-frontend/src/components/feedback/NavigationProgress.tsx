'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    setProgress(12);

    const advance = window.setTimeout(() => setProgress(55), 120);
    const nearDone = window.setTimeout(() => setProgress(88), 320);
    const finish = window.setTimeout(() => {
      setProgress(100);
      window.setTimeout(() => setVisible(false), 240);
    }, 520);

    return () => {
      window.clearTimeout(advance);
      window.clearTimeout(nearDone);
      window.clearTimeout(finish);
    };
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px] bg-transparent"
      aria-hidden="true"
    >
      <div
        className="relative h-full overflow-hidden rounded-r-full bg-gradient-to-r from-primary via-primary-2 to-secondary shadow-[0_0_12px_color-mix(in_srgb,var(--primary)_45%,transparent)] transition-[width] duration-300 ease-out"
        style={{ width: `${progress}%` }}
      >
        <span className="absolute inset-y-0 right-0 w-24 animate-shimmer bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      </div>
    </div>
  );
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressBar />
    </Suspense>
  );
}
