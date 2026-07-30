export const MARKETING_TOUR_STORAGE_KEY = 'b2c-marketing-tour-completed';

export const MARKETING_TOUR_PATHS = new Set([
  '/',
  '/courses',
  '/assessments',
  '/pricing',
  '/contact',
]);

export function isMarketingTourPath(pathname: string | null): pathname is string {
  return pathname !== null && MARKETING_TOUR_PATHS.has(pathname);
}

export function isMarketingTourCompleted(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(MARKETING_TOUR_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function markMarketingTourCompleted(): void {
  try {
    localStorage.setItem(MARKETING_TOUR_STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}
