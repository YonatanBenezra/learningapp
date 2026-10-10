import type { Metadata } from "next";
import Script from "next/script";
import { Caveat, Figtree, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { AppToaster } from "@/components/ui/app-toaster";
import { RootNav } from "@/components/layout/root-nav";
import { brand } from "@/config/brand";
import { themeInitScript } from "@/features/theme/theme-script";
import "./globals.css";
import { cn } from "@/lib/utils";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: brand.name,
  description: `${brand.description} ${brand.endorsement}.`,
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
        jakarta.variable,
        figtree.variable,
        caveat.variable,
        geistMono.variable,
      )}
    >
      <body className={`${jakarta.className} flex min-h-full flex-col`}>
        <Script id="labpath-theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <RootNav />
        <AppToaster />
        {children}
      </body>
    </html>
  );
}
