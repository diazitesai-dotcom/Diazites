import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  WebsiteBuilderAnalyticsSummary,
  WebsiteBuilderAssetRecord,
  WebsiteBuilderDashboardData,
  WebsiteBuilderDomainRecord,
  WebsiteBuilderPageRecord,
  WebsiteBuilderSiteRecord,
  WebsiteBuilderTemplateRecord,
} from "@/lib/website-builder/types";
import { createBusinessRepository } from "@/repositories/business.repository";

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function profileText(profile: unknown, key: string): string {
  if (!profile || typeof profile !== "object") return "";
  return text((profile as Record<string, unknown>)[key]);
}

export async function loadWebsiteBuilderDashboardData(): Promise<WebsiteBuilderDashboardData> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);

  if (!business) {
    return {
      businessId: null,
      businessProfile: {
        name: "",
        niche: "",
        location: "",
        services: "",
        keywords: "",
        targetAudience: "",
      },
      websites: [],
      pages: [],
      templates: [],
      domains: [],
      assets: [],
      analytics: emptyAnalytics(),
    };
  }

  const businessId = String(business.id);
  const [
    { data: websites },
    { data: pages },
    { data: templates },
    { data: domains },
    { data: assets },
    { data: analytics },
  ] = await Promise.all([
    supabase
      .from("websites")
      .select("*")
      .eq("business_id", businessId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("website_pages")
      .select("*")
      .eq("business_id", businessId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("website_templates")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("website_domains")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false }),
    supabase
      .from("website_assets")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("website_analytics")
      .select("website_id,page_id,visitors,leads,form_submissions,conversion_rate,source,website_pages(title)")
      .eq("business_id", businessId),
  ]);

  return {
    businessId,
    businessProfile: {
      name: text(business.name),
      niche: profileText(business.profile, "industry"),
      location: text(business.city_state) || text(business.service_area),
      services: text(business.services) || profileText(business.profile, "services"),
      keywords: profileText(business.profile, "keywords"),
      targetAudience: profileText(business.profile, "targetCustomer"),
    },
    websites: ((websites ?? []) as unknown[]) as WebsiteBuilderSiteRecord[],
    pages: ((pages ?? []) as unknown[]) as WebsiteBuilderPageRecord[],
    templates: ((templates ?? []) as unknown[]) as WebsiteBuilderTemplateRecord[],
    domains: ((domains ?? []) as unknown[]) as WebsiteBuilderDomainRecord[],
    assets: ((assets ?? []) as unknown[]) as WebsiteBuilderAssetRecord[],
    analytics: summarizeAnalytics((analytics ?? []) as Array<Record<string, unknown>>),
  };
}

export async function loadWebsiteBuilderEditorData(pageId: string) {
  const data = await loadWebsiteBuilderDashboardData();
  const page = data.pages.find((item) => item.id === pageId) ?? null;
  if (!page) return { ...data, page: null, versions: [] };

  const supabase = await createServerSupabaseClient();
  const { data: versions } = await supabase
    .from("website_versions")
    .select("*")
    .eq("page_id", pageId)
    .order("version_number", { ascending: false })
    .limit(20);

  return { ...data, page, versions: versions ?? [] };
}

function emptyAnalytics(): WebsiteBuilderAnalyticsSummary {
  return {
    visitors: 0,
    leads: 0,
    formSubmissions: 0,
    conversionRate: 0,
    topPages: [],
    trafficSources: [],
  };
}

function summarizeAnalytics(rows: Array<Record<string, unknown>>): WebsiteBuilderAnalyticsSummary {
  const totals = rows.reduce<{
    visitors: number;
    leads: number;
    formSubmissions: number;
  }>(
    (acc, row) => {
      acc.visitors += Number(row.visitors ?? 0);
      acc.leads += Number(row.leads ?? 0);
      acc.formSubmissions += Number(row.form_submissions ?? 0);
      return acc;
    },
    { visitors: 0, leads: 0, formSubmissions: 0 },
  );

  const pages = new Map<string, { title: string; visitors: number; leads: number }>();
  const sources = new Map<string, number>();

  for (const row of rows) {
    const pageId = text(row.page_id) || "unknown";
    const nestedPage = row.website_pages;
    const title =
      nestedPage && typeof nestedPage === "object"
        ? text((nestedPage as Record<string, unknown>).title)
        : "Website page";
    const current = pages.get(pageId) ?? { title: title || "Website page", visitors: 0, leads: 0 };
    current.visitors += Number(row.visitors ?? 0);
    current.leads += Number(row.leads ?? 0);
    pages.set(pageId, current);

    const source = text(row.source) || "Direct";
    sources.set(source, (sources.get(source) ?? 0) + Number(row.visitors ?? 0));
  }

  return {
    ...totals,
    conversionRate: totals.visitors > 0 ? totals.leads / totals.visitors : 0,
    topPages: [...pages.values()].sort((a, b) => b.visitors - a.visitors).slice(0, 5),
    trafficSources: [...sources.entries()]
      .map(([source, visitors]) => ({ source, visitors }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 6),
  };
}
