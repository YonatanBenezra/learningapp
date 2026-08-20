import { PlatformShell } from '@/src/features/platform';

export default function AssessmentLayout({ children }: { children: React.ReactNode }) {
  return <PlatformShell showFooter={false}>{children}</PlatformShell>;
}
