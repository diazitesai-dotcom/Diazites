import { PageHeader } from "@/components/layout/page-header";
import { WebsiteBuilderDashboard } from "@/components/website-builder/website-builder-dashboard";
import { loadWebsiteBuilderDashboardData } from "@/lib/dashboard/load-website-builder";

export default async function WebsitesDashboardPage() {
  const data = await loadWebsiteBuilderDashboardData();

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        eyebrow="Diazites Website Builder"
        title="Websites & Funnels"
        description="Create, edit, publish, and manage Diazites-native websites and landing pages with AI, GrapesJS editing, CRM forms, SEO, domains, media, and analytics."
      />
      <WebsiteBuilderDashboard data={data} />
    </div>
  );
}
