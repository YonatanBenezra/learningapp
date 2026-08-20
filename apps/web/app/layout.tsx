import type { Metadata } from "next";
import { Geist_Mono, Noto_Sans_Hebrew, Outfit } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/src/providers";
import { APP_METADATA_TITLE, APP_TAGLINE } from "@/src/lib/brand";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const notoSansHebrew = Noto_Sans_Hebrew({
  variable: "--font-noto-hebrew",
  subsets: ["hebrew"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: APP_METADATA_TITLE,
  description:
    `${APP_TAGLINE} — curated RAG, LLM, agent, and MLOps challenges with instant AI feedback on every submit.`,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${outfit.variable} ${geistMono.variable} ${notoSansHebrew.variable} h-full font-sans`}
    >
      <body className="flex min-h-dvh flex-col bg-bg text-ink">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
