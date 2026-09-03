import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Baydin — Astrologer, Tarot & Fortune",
  description:
    "Baydin merges AI astrology (Vedic, Western, Mahabote), tarot, horoscopes and rituals into one daily-use spiritual companion. Pay-as-you-go with Luck credits.",
  applicationName: "Baydin",
  authors: [{ name: "Baydin" }],
  keywords: ["astrology", "tarot", "horoscope", "vedic", "mahabote", "fortune", "myanmar"],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.svg"],
  },
  appleWebApp: {
    capable: true,
    title: "Baydin",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
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
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${inter.variable} ${cormorant.variable} antialiased bg-background text-foreground`}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
