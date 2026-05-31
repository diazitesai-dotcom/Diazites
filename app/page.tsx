import { CinematicVideo } from "@/components/CinematicVideo";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { MarketingNavbar } from "@/components/layout/marketing-navbar";
import { CapabilityMetricsSection } from "@/components/marketing/capability-metrics-section";
import { FinalCtaSection } from "@/components/marketing/final-cta-section";
import { HomeHero } from "@/components/marketing/home-hero";
import { PlatformModulesSection } from "@/components/marketing/platform-modules-section";
import { PricingPreviewSection } from "@/components/marketing/pricing-preview-section";
import { SecurityTrustSection } from "@/components/marketing/security-trust-section";
import { TrustIntegrationsSection } from "@/components/marketing/trust-integrations-section";
import {
  MarketingPlatformSection,
} from "@/components/marketing/marketing-section";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingNavbar />
      <HomeHero />
      <TrustIntegrationsSection />
      <CinematicVideo />
      <section id="platform">
        <MarketingPlatformSection />
      </section>
      <PlatformModulesSection />
      <CapabilityMetricsSection />
      <PricingPreviewSection />
      <SecurityTrustSection />
      <FinalCtaSection />
      <MarketingFooter />
    </div>
  );
}
