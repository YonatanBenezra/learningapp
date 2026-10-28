import type { Metadata } from "next";
import { Caveat, Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { AppToaster } from "@/components/ui/app-toaster";
import { QueryProvider } from "@/components/providers/query-provider";
import { RootNav } from "@/components/layout/root-nav";
import { brand } from "@/config/brand";
import { themeInitScript } from "@/features/theme/theme-script";
import "./globals.css";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: brand.name,
  description: brand.description,
  icons: {
    icon: "/brand/labpath-logo.png",
    apple: "/brand/labpath-logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-theme="dark"
      className={cn(
        "dark h-full antialiased font-sans",
        geistSans.variable,
        instrumentSerif.variable,
        caveat.variable,
        geistMono.variable,
      )}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${geistSans.className} flex min-h-full flex-col`}>
        <QueryProvider>
          <RootNav />
          <AppToaster />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
