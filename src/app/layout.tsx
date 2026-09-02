import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Baydin — Astrologer, Tarot & Fortune",
  description:
    "Baydin merges AI astrology (Vedic, Western, Mahabote), tarot, horoscopes and rituals into one daily-use spiritual companion. Pay-as-you-go with Luck credits.",
  applicationName: "Baydin",
  authors: [{ name: "Baydin" }],
  keywords: ["astrology", "tarot", "horoscope", "vedic", "mahabote", "fortune", "myanmar"],
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Baydin — Astrologer, Tarot & Fortune",
    description: "AI astrology, tarot and rituals. Pay-as-you-go with Luck credits.",
    type: "website",
  },
};

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${inter.variable} antialiased bg-background text-foreground`}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
