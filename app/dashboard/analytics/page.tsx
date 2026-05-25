import { GrowthModulePage } from "@/components/layout/growth-module-page";
import { ROUTES } from "@/lib/navigation/platform-nav";

export default function AnalyticsPage() {
  return (
    <GrowthModulePage
      eyebrow="Analytics"
      title="Growth analytics"
      description="Traffic, conversions, CPL, ad spend, revenue, ROAS, landing page CVR, agent and channel performance."
      purposeTitle="Command center metrics"
      purposeDescription="Mission Control widgets and Reports & Intelligence share the same data layer — charts expand here in Phase 2."
      phase={2}
      primaryHref={ROUTES.reportsIntelligence}
      primaryLabel="Reports & Intelligence"
    />
  );
}
