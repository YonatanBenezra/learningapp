'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import {
  isMarketingTourCompleted,
  isMarketingTourPath,
  markMarketingTourCompleted,
} from './constants';
import { getTourStepsForPath } from './tourSteps';

const TOUR_START_DELAY_MS = 900;

export function MarketingTour() {
  const pathname = usePathname();
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);
  const startedForPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isMarketingTourPath(pathname)) return;
    if (isMarketingTourCompleted()) return;
    if (startedForPathRef.current === pathname) return;

    const timer = window.setTimeout(() => {
      if (isMarketingTourCompleted()) return;

      const steps = getTourStepsForPath(pathname);
      if (steps.length === 0) return;

      startedForPathRef.current = pathname;

      const tourDriver = driver({
        showProgress: true,
        progressText: '{{current}} of {{total}}',
        nextBtnText: 'Next',
        prevBtnText: 'Back',
        doneBtnText: 'Done',
        allowClose: true,
        smoothScroll: true,
        skipMissingElement: true,
        stagePadding: 10,
        stageRadius: 10,
        popoverClass: 'b2c-marketing-tour',
        overlayOpacity: 0.55,
        steps,
        onDestroyed: () => {
          markMarketingTourCompleted();
          driverRef.current = null;
        },
      });

      driverRef.current = tourDriver;
      tourDriver.drive();
    }, TOUR_START_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      if (driverRef.current?.isActive()) {
        driverRef.current.destroy();
      }
    };
  }, [pathname]);

  return null;
}
