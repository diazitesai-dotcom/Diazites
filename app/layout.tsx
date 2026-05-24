import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SupabaseAuthHashHandler } from "@/components/auth/supabase-auth-hash-handler";
import { ThemeProvider } from "@/components/providers/theme-provider";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://diazites.com"),
  title: {
    default: "Diazites | AI Marketing Automation for Every Niche",
    template: "%s | Diazites",
  },
  description:
    "Diazites unifies ads, landing pages, and AI follow-up so any business can capture leads, respond instantly, and grow pipeline—without a bloated martech stack.",
  openGraph: {
    title: "Diazites AI Marketing Platform",
    description:
      "Lead generation, AI follow-up, and funnel automation—built for speed-to-lead and measurable ROI.",
    url: "https://diazites.com",
    siteName: "Diazites",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Diazites AI Marketing Platform",
    description:
      "Turn attention into revenue with AI-powered marketing automation—works across industries and offers.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full scroll-smooth`}
    >
      <body
        className={`${geistSans.className} min-h-full flex flex-col antialiased`}
      >
        <ThemeProvider>
          <SupabaseAuthHashHandler />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
