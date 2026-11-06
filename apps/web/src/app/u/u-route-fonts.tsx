import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
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

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export function URouteFontScope({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        inter.variable,
        jetbrainsMono.variable,
        spaceGrotesk.variable,
        "min-h-full bg-[#07090D] font-[family-name:var(--font-inter),ui-sans-serif,system-ui,sans-serif] [--font-ep-body:var(--font-inter)] [--font-ep-heading:var(--font-space-grotesk)] [--font-ep-mono:var(--font-jetbrains-mono)]",
      )}
    >
      {children}
    </div>
  );
}
