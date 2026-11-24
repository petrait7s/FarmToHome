import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Noto_Serif_Bengali, Hind_Siliguri } from "next/font/google";
import "@/styles/globals.css";
import { getLocale } from "@/i18n";
import { env } from "@/lib/env";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap", axes: ["opsz"], style: ["normal", "italic"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const bnSerif = Noto_Serif_Bengali({ subsets: ["bengali"], variable: "--font-bn-serif", display: "swap" });
const bnSans = Hind_Siliguri({ subsets: ["bengali"], weight: ["400", "500", "600"], variable: "--font-bn-sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(env.APP_URL),
  title: { default: "FarmToHome — Thoughtfully Sourced. Honestly Delivered.", template: "%s · FarmToHome" },
  description: "A premium digital grocery concierge. Plan your household's weekly market or monthly stock from directly sourced, traceable producers, delivered on schedule.",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#FF4B33",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${fraunces.variable} ${inter.variable} ${bnSerif.variable} ${bnSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
