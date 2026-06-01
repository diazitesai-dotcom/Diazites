import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";

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
    default: "Diazites | The AI Growth Operating System",
    template: "%s | Diazites",
  },
  description:
    "Deploy AI agents to run ads, capture leads, automate follow-up, manage CRM pipelines, launch landing pages, connect payments, and track performance from one command center.",
  openGraph: {
    title: "Diazites — AI Growth Operating System",
    description:
      "Turn ads, leads, follow-up, payments, and reporting into one automated AI workflow for agencies and businesses.",
    url: "https://diazites.com",
    siteName: "Diazites",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Diazites — AI Growth Operating System",
    description:
      "Deploy AI agents to run ads, capture leads, automate follow-up, and scale from one command center.",
  },
  verification: {
    google: "eNYYGoN1BcfGRuJ5RxxjFFDVkheBbv5HBN7SGPAj6-I",
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
      <GoogleAnalytics gaId="G-LJ308R5F8Q" />
    </html>
  );
}
