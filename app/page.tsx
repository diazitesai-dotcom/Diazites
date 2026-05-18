import Link from "next/link";

import { MarketingNavbar } from "@/components/layout/marketing-navbar";
import { HomeHero } from "@/components/marketing/home-hero";
import {
  MarketingModulesSection,
  MarketingPlatformSection,
} from "@/components/marketing/marketing-section";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingNavbar />
      <HomeHero />
      <MarketingPlatformSection />
      <MarketingModulesSection />

      <footer className="border-t border-border/60 py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-4 sm:flex-row sm:items-center sm:px-6">
          <div>
            <p className="text-sm font-semibold tracking-tight">Diazites</p>
            <p className="mt-1 text-sm text-muted-foreground">
              AI marketing OS for roofing contractors.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/docs/agents"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Agent API docs
            </Link>
            <Link
              href="/login"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className={buttonVariants({ variant: "gradient", size: "sm" })}
            >
              Get started
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
