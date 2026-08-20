'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { RequireAssessmentComplete } from '@/src/features/auth/guards';
import { PlatformShell } from './PlatformShell';
import { ProblemsHome } from './ProblemsHome';

export function ProblemsHomePage() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearch(q);
  }, [searchParams]);

  return (
    <RequireAssessmentComplete>
      <PlatformShell searchQuery={search} onSearchChange={setSearch}>
        <ProblemsHome searchQuery={search} onSearchChange={setSearch} />
      </PlatformShell>
    </RequireAssessmentComplete>
  );
}
