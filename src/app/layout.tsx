import type { Metadata, Viewport } from "next";
import { Montserrat, Tiro_Bangla } from "next/font/google";
import "@/styles/globals.css";
import { getLocale } from "@/i18n";
import { env } from "@/lib/env";

// English: Montserrat. Bangla: Tiro Bangla. Montserrat has no Bengali glyphs, so mixed text falls back per character.
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat", display: "swap" });
const tiroBangla = Tiro_Bangla({ subsets: ["bengali", "latin"], weight: "400", style: ["normal"], variable: "--font-tiro", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(env.APP_URL),
  title: { default: "FarmToHome — Thoughtfully Sourced. Honestly Delivered.", template: "%s · FarmToHome" },
  description: "A premium digital grocery concierge. Plan your household's weekly market or monthly stock from directly sourced, traceable producers, delivered on schedule.",
  icons: { icon: "/favicon.svg", apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "FarmToHome", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#164A83",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${montserrat.variable} ${tiroBangla.variable}`}>
      <body>{children}</body>
    </html>
  );
}
