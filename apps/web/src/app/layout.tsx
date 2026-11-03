import type { Metadata } from "next";
import { Caveat, DM_Sans, Instrument_Serif } from "next/font/google";
import { AppToaster } from "@/components/ui/app-toaster";
import { QueryProvider } from "@/components/providers/query-provider";
import { RootNav } from "@/components/layout/root-nav";
import { brand } from "@/config/brand";
import { adobeFontsKitId } from "@/config/fonts";
import { themeInitScript } from "@/features/theme/theme-script";
import "./globals.css";
import { cn } from "@/lib/utils";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
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
        dmSans.variable,
        instrumentSerif.variable,
        caveat.variable,
      )}
    >
      <head>
        {adobeFontsKitId ? (
          <link
            rel="stylesheet"
            href={`https://use.typekit.net/${adobeFontsKitId}.css`}
          />
        ) : null}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <QueryProvider>
          <RootNav />
          <AppToaster />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
