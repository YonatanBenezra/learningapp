'use client';

import { DashboardPage } from '@/src/features/dashboard';
import { RequireLearnerDashboard } from '@/src/features/auth';

export default function Page() {
  return (
    <RequireLearnerDashboard>
      <DashboardPage />
    </RequireLearnerDashboard>
  );
}
