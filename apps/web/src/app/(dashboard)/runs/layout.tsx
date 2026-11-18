import { Inter, Oswald } from "next/font/google";
import { DashboardHtbShell } from "@/features/dashboard/components/dashboard-htb-shell";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  display: "swap",
});

/** Run and trace pages carry the signed-in app navbar, like the practice hub. */
export default function RunsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(inter.variable, oswald.variable)}>
      <DashboardHtbShell>{children}</DashboardHtbShell>
    </div>
  );
}
