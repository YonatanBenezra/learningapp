import Link from 'next/link';
import { PlatformShell } from '@/src/features/platform';
import { platformContainerClass } from '@/src/features/platform/platformLayout';
import { cn } from '@/src/lib/utils';

export default function ContestPage() {
  return (
    <PlatformShell>
      <div className={cn(platformContainerClass, 'flex-1 py-10')}>
        <h1 className="text-xl font-semibold text-ink">Contest</h1>
        <p className="mt-2 max-w-lg text-sm text-ink-2">
          Weekly AI engineering contests are coming soon. Get ready on{' '}
          <Link href="/problems" className="text-primary hover:underline">
            Problems
          </Link>{' '}
          — RAG, LLMs, coding, and more.
        </p>
      </div>
    </PlatformShell>
  );
}
