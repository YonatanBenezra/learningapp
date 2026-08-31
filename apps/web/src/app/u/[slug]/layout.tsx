import { AppShell } from "@/components/layout/app-shell";

export default function PublicProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
