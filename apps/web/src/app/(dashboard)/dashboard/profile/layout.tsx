import { Inter, Roboto_Mono } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  display: "swap",
});

export default function DashboardProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(inter.variable, robotoMono.variable, "font-[family-name:var(--font-inter)]")}>
      {children}
    </div>
  );
}
