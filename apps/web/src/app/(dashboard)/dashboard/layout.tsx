import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export default function DashboardHomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(inter.variable, "font-[family-name:var(--font-inter)]")}>{children}</div>
  );
}
