"use client";

import { Cormorant_Garamond } from "next/font/google";

import { AgentsSection } from "@/components/AgentsSection";
import { CinematicVideo } from "@/components/CinematicVideo";
import { FinalCta } from "@/components/FinalCta";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { Industries } from "@/components/Industries";
import { Navbar } from "@/components/Navbar";
import { PageLoader } from "@/components/PageLoader";
import { Pricing } from "@/components/homepage/Pricing";
import { ScrollStory } from "@/components/ScrollStory";
import { SocialProof } from "@/components/SocialProof";
import { WhatWeDo } from "@/components/WhatWeDo";
import { WorkflowDemo } from "@/components/WorkflowDemo";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-display",
  display: "swap",
});

export function MarketingHome() {
  return (
    <div
      className={`${display.variable} marketing-void min-h-screen text-zinc-100 antialiased selection:bg-sky-500/20 selection:text-white`}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[400] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-black"
      >
        Skip to main content
      </a>
      <PageLoader />
      <Navbar />
      <main id="main-content">
        <Hero />
        <CinematicVideo />
        <WhatWeDo />
        <ScrollStory />
        <HowItWorks />
        <AgentsSection />
        <WorkflowDemo />
        <Industries />
        <Pricing />
        <SocialProof />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
