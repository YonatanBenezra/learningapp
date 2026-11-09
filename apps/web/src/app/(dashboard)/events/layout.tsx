import { Inter, JetBrains_Mono, Oswald } from "next/font/google";
import { DashboardHtbShell } from "@/features/dashboard/components/dashboard-htb-shell";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  display: "swap",
});

/** HTB dashboard chrome (top nav) — same as Contests hub. */
export default function CtfEventsDetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        inter.variable,
        jetbrainsMono.variable,
        oswald.variable,
        "font-[family-name:var(--font-inter)]",
      )}
    >
      <DashboardHtbShell>{children}</DashboardHtbShell>
    </div>
  );
}
