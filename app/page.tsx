import { CinematicVideo } from "@/components/CinematicVideo";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { MarketingNavbar } from "@/components/layout/marketing-navbar";
import { HomeHero } from "@/components/marketing/home-hero";
import {
  MarketingModulesSection,
  MarketingPlatformSection,
} from "@/components/marketing/marketing-section";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingNavbar />
      <HomeHero />
      <CinematicVideo />
      <MarketingPlatformSection />
      <MarketingModulesSection />
      <MarketingFooter />
    </div>
  );
}
