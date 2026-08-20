import type { Metadata } from 'next';
import { PlatformShell } from '@/src/features/platform';
import { AssessmentsPage } from '@/src/features/skill-assessment/AssessmentsPage';

export const metadata: Metadata = {
  title: 'Assessments | LabPath',
  description:
    'Take skill assessments to discover your level and unlock a personalized LabPath learning plan.',
};

export default function AssessmentsRoutePage() {
  return (
    <PlatformShell showFooter={false}>
      <AssessmentsPage />
    </PlatformShell>
  );
}
