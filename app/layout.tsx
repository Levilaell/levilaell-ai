import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { siteConfig } from "@/lib/site";
import { PageViewTracker } from "@/components/tracking/page-view-tracker";
import { MetaPixelStub } from "@/components/tracking/meta-pixel-stub";
import { MetaPixelLoader } from "@/components/tracking/meta-pixel-loader";
import { GoogleTagStub } from "@/components/tracking/google-tag-stub";
import { GoogleTagLoader } from "@/components/tracking/google-tag-loader";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "automação",
    "IA",
    "agentes",
    "n8n",
    "operações",
    "Claude",
    "Levi Lael",
  ],
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  other: {
    "facebook-domain-verification": "g7o9hfjnxm1lhvue0y9vsefmng8rio",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans min-h-screen flex flex-col`}
      >
        <MetaPixelStub />
        <GoogleTagStub />
        {children}
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        <MetaPixelLoader />
        <GoogleTagLoader />
        <Analytics />
      </body>
    </html>
  );
}
