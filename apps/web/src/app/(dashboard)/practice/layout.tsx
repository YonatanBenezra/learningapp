import { Inter, Oswald } from "next/font/google";
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

export default function PracticeHubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(inter.variable, oswald.variable, "font-[family-name:var(--font-inter)]")}>
      {children}
    </div>
  );
}
