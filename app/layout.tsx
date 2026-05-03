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
  title: "Diazites AI Marketing Platform",
  description: "AI-powered roofing lead generation and CRM automation.",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
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
