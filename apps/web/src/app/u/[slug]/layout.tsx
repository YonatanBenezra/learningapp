import { DashboardHtbShell } from "@/features/dashboard/components/dashboard-htb-shell";
import { URouteFontScope } from "../u-route-fonts";

export default function PublicProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardHtbShell>
      <URouteFontScope>{children}</URouteFontScope>
    </DashboardHtbShell>
  );
}
