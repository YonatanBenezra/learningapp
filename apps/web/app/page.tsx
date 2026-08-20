import { PlatformShell } from '@/src/features/platform';
import { Hero } from '@/src/components/marketing/Hero';

export default function HomePage() {
  return (
    <PlatformShell>
      <Hero />
    </PlatformShell>
  );
}
