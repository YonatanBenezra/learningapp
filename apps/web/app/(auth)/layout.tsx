import { RedirectIfAuthed } from '@/src/features/auth';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <RedirectIfAuthed>{children}</RedirectIfAuthed>;
}
