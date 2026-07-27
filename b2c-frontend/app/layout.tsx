import type { Metadata } from "next";
import { Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/src/providers";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bina B2C — Learn, Lab, Level up",
  description:
    "Turn any topic into a full AI-built course — then practice in real, hands-on labs.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${outfit.variable} ${geistMono.variable} h-full font-sans`}
    >
      <body className="min-h-full bg-bg text-ink flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
