import type { Metadata } from 'next';
import { StartAssessmentPage } from '@/src/features/skill-assessment/CreateAssessmentFlow';

export const metadata: Metadata = {
  title: 'Start assessment | LabPath',
  description: 'Choose your subject and learning goal to begin a personalized skill assessment.',
};

export default function Page() {
  return <StartAssessmentPage />;
}
