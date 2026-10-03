import { AuthShell } from "@/features/auth/components/auth-shell";
import "@/features/auth/auth.css";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthShell>{children}</AuthShell>;
}
