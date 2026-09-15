import { AppShell } from "@/components/layout/app-shell";

export default function VerifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
