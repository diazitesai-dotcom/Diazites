"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAuth } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  buildDefaultGrapesProjectData,
  buildHtmlFromAiOutput,
  buildTemplateCss,
  buildTemplateHtml,
  getTemplateDefinition,
  slugifyPageTitle,
} from "@/lib/website-builder/templates";
import type { AiLandingPageOutput, GrapesJsProjectData } from "@/lib/website-builder/types";
import { createBusinessRepository } from "@/repositories/business.repository";
import { callJsonResponses, isOpenAiConfigured } from "@/services/engine/ai/openai-client";

const AiLandingPageSchema = z.object({
  title: z.string(),
  slug: z.string(),
  headline: z.string(),
  subheadline: z.string(),
  ctaText: z.string(),
  benefits: z.array(z.string()).min(3).max(6),
  services: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
      }),
    )
    .min(2)
    .max(6),
  testimonials: z
    .array(
      z.object({
        quote: z.string(),
        name: z.string(),
      }),
    )
    .min(1)
    .max(4),
  faqs: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
      }),
    )
    .min(2)
    .max(6),
  seoTitle: z.string(),
  seoDescription: z.string(),
});

type UserBusiness = {
  userId: string;
  business: Record<string, unknown>;
  businessId: string;
};

async function getUserBusiness(): Promise<UserBusiness> {
  const user = await requireAuth();
  const supabase = await createServerSupabaseClient();
  const businesses = createBusinessRepository(supabase);
  const { data: business } = await businesses.getByOwnerUserId(user.id);

  if (!business) redirect("/onboarding");

  return {
    userId: user.id,
    business: business as Record<string, unknown>,
    businessId: String(business.id),
  };
}

function text(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function businessText(business: Record<string, unknown>, key: string): string {
  const value = business[key];
  return typeof value === "string" ? value.trim() : "";
}

function businessProfileText(business: Record<string, unknown>, key: string): string {
  const profile = business.profile;
  if (!profile || typeof profile !== "object") return "";
  const value = (profile as Record<string, unknown>)[key];
  return typeof value === "string" ? value.trim() : "";
}

async function getOrCreateDefaultWebsite(input: {
  businessId: string;
  userId: string;
  businessName: string;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: existing } = await supabase
    .from("websites")
    .select("*")
    .eq("business_id", input.businessId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing) return existing as Record<string, unknown>;

  const { data, error } = await supabase
    .from("websites")
    .insert({
      business_id: input.businessId,
      name: `${input.businessName || "Business"} Website`,
      description: "Native Diazites website and funnel builder workspace.",
      status: "draft",
      created_by: input.userId,
      brand_config: {},
      settings: {},
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Could not create website");
  return data as Record<string, unknown>;
}

async function createVersionSnapshot(input: {
  businessId: string;
  websiteId: string;
  pageId: string;
  userId: string;
  label: string;
  changeSummary: string;
  grapesjsData: GrapesJsProjectData;
  html: string;
  css: string;
  published?: boolean;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: latest } = await supabase
    .from("website_versions")
    .select("version_number")
    .eq("page_id", input.pageId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const versionNumber = Number((latest as { version_number?: number } | null)?.version_number ?? 0) + 1;

  await supabase.from("website_versions").insert({
    business_id: input.businessId,
    website_id: input.websiteId,
    page_id: input.pageId,
    version_number: versionNumber,
    label: input.label,
    change_summary: input.changeSummary,
    grapesjs_data: input.grapesjsData,
    html: input.html,
    css: input.css,
    created_by: input.userId,
    published_at: input.published ? new Date().toISOString() : null,
  });
}

async function ensureLeadForm(input: {
  businessId: string;
  websiteId: string;
  pageId: string;
  pageSlug: string;
}) {
  const supabase = await createServerSupabaseClient();
  await supabase.from("website_forms").upsert(
    {
      business_id: input.businessId,
      website_id: input.websiteId,
      page_id: input.pageId,
      name: "Lead Capture",
      slug: `${input.pageSlug}-lead-capture`,
      fields: [
        { name: "name", label: "Name", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "phone", label: "Phone", type: "tel", required: false },
        { name: "message", label: "How can we help?", type: "textarea", required: false },
      ],
      active: true,
    },
    { onConflict: "website_id,slug" },
  );
}

export async function createWebsitePageAction(formData: FormData) {
  const { userId, business, businessId } = await getUserBusiness();
  const templateSlug = text(formData.get("templateSlug")) || "local-business";
  const title = text(formData.get("title")) || getTemplateDefinition(templateSlug).name;
  const slug = slugifyPageTitle(text(formData.get("slug")) || title);
  const businessName = businessText(business, "name") || "Your Business";
  const services = businessText(business, "services") || businessProfileText(business, "services");
  const location = businessText(business, "city_state") || businessText(business, "service_area");

  const website = await getOrCreateDefaultWebsite({ businessId, userId, businessName });
  const html = buildTemplateHtml({
    templateSlug,
    businessName,
    headline: `${businessName}: ${getTemplateDefinition(templateSlug).description}`,
    ctaText: getTemplateDefinition(templateSlug).primaryCta,
    services,
    location,
  });
  const css = buildTemplateCss();
  const grapesjsData = buildDefaultGrapesProjectData(html, css);
  const supabase = await createServerSupabaseClient();

  const { data: template } = await supabase
    .from("website_templates")
    .select("id")
    .eq("slug", templateSlug)
    .maybeSingle();

  const { data: page, error } = await supabase
    .from("website_pages")
    .insert({
      business_id: businessId,
      website_id: website.id,
      template_id: (template as { id?: string } | null)?.id ?? null,
      title,
      slug,
      page_type: "landing",
      status: "draft",
      html,
      css,
      grapesjs_data: grapesjsData,
      created_by: userId,
    })
    .select("*")
    .single();

  if (error || !page) throw new Error(error?.message ?? "Could not create page");

  await ensureLeadForm({
    businessId,
    websiteId: String(website.id),
    pageId: String(page.id),
    pageSlug: slug,
  });
  await createVersionSnapshot({
    businessId,
    websiteId: String(website.id),
    pageId: String(page.id),
    userId,
    label: "Draft",
    changeSummary: "Initial page created",
    grapesjsData,
    html,
    css,
  });

  revalidatePath("/dashboard/websites");
  redirect(`/dashboard/websites/${page.id}/editor`);
}

export async function saveWebsitePageAction(input: {
  pageId: string;
  html: string;
  css: string;
  grapesjsData: GrapesJsProjectData;
  customCss?: string;
  customHtml?: string;
}) {
  const { userId, businessId } = await getUserBusiness();
  const supabase = await createServerSupabaseClient();
  const { data: page } = await supabase
    .from("website_pages")
    .select("*")
    .eq("id", input.pageId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (!page) return { success: false as const, error: "Page not found" };

  const { error } = await supabase
    .from("website_pages")
    .update({
      html: input.html,
      css: input.css,
      custom_css: input.customCss ?? null,
      custom_html: input.customHtml ?? null,
      grapesjs_data: input.grapesjsData,
      status: page.status === "published" ? "unpublished" : page.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.pageId)
    .eq("business_id", businessId);

  if (error) return { success: false as const, error: error.message };

  await createVersionSnapshot({
    businessId,
    websiteId: String(page.website_id),
    pageId: input.pageId,
    userId,
    label: "Draft",
    changeSummary: "Saved draft from builder",
    grapesjsData: input.grapesjsData,
    html: input.html,
    css: input.css,
  });

  revalidatePath("/dashboard/websites");
  return { success: true as const };
}

export async function publishWebsitePageAction(formData: FormData) {
  const { userId, businessId } = await getUserBusiness();
  const pageId = text(formData.get("pageId"));
  const supabase = await createServerSupabaseClient();
  const { data: page } = await supabase
    .from("website_pages")
    .select("*")
    .eq("id", pageId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (!page) return;

  await supabase
    .from("website_pages")
    .update({
      status: "published",
      published_html: page.html,
      published_css: page.css,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", pageId)
    .eq("business_id", businessId);

  await createVersionSnapshot({
    businessId,
    websiteId: String(page.website_id),
    pageId,
    userId,
    label: "Published",
    changeSummary: "Published page",
    grapesjsData: (page.grapesjs_data ?? {}) as GrapesJsProjectData,
    html: String(page.html ?? ""),
    css: String(page.css ?? ""),
    published: true,
  });

  revalidatePath("/dashboard/websites");
}

export async function unpublishWebsitePageAction(formData: FormData) {
  const { businessId } = await getUserBusiness();
  const pageId = text(formData.get("pageId"));
  const supabase = await createServerSupabaseClient();
  await supabase
    .from("website_pages")
    .update({ status: "unpublished", updated_at: new Date().toISOString() })
    .eq("id", pageId)
    .eq("business_id", businessId);
  revalidatePath("/dashboard/websites");
}

export async function duplicateWebsitePageAction(formData: FormData) {
  const { userId, businessId } = await getUserBusiness();
  const pageId = text(formData.get("pageId"));
  const supabase = await createServerSupabaseClient();
  const { data: page } = await supabase
    .from("website_pages")
    .select("*")
    .eq("id", pageId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (!page) return;

  const slug = `${String(page.slug)}-copy-${Date.now().toString(36)}`;
  const { data: copy } = await supabase
    .from("website_pages")
    .insert({
      business_id: businessId,
      website_id: page.website_id,
      template_id: page.template_id,
      title: `${String(page.title)} Copy`,
      slug,
      page_type: page.page_type,
      status: "draft",
      grapesjs_data: page.grapesjs_data ?? {},
      html: page.html ?? "",
      css: page.css ?? "",
      custom_html: page.custom_html ?? null,
      custom_css: page.custom_css ?? null,
      created_by: userId,
    })
    .select("*")
    .single();

  if (copy) {
    await ensureLeadForm({
      businessId,
      websiteId: String(copy.website_id),
      pageId: String(copy.id),
      pageSlug: slug,
    });
  }

  revalidatePath("/dashboard/websites");
}

export async function deleteWebsitePageAction(formData: FormData) {
  const { businessId } = await getUserBusiness();
  const pageId = text(formData.get("pageId"));
  const supabase = await createServerSupabaseClient();
  await supabase.from("website_pages").delete().eq("id", pageId).eq("business_id", businessId);
  revalidatePath("/dashboard/websites");
}

export async function createWebsiteDomainAction(formData: FormData) {
  const { businessId } = await getUserBusiness();
  const websiteId = text(formData.get("websiteId"));
  const hostname = text(formData.get("hostname")).toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!websiteId || !hostname) return;
  const supabase = await createServerSupabaseClient();
  await supabase.from("website_domains").insert({
    business_id: businessId,
    website_id: websiteId,
    hostname,
    domain_type: hostname.endsWith(".diazites.com") ? "subdomain" : "custom",
    status: "pending",
    ssl_status: "pending",
    dns_instructions: {
      customDomain: [
        "Add a CNAME record pointing www to cname.vercel-dns.com.",
        "Add an A record for the root domain to Vercel's recommended IP from your Vercel project.",
        "Return here and mark verification after DNS propagates.",
      ],
      subdomain: "Diazites subdomains are reserved and can be activated from the publishing workflow.",
    },
  });
  revalidatePath("/dashboard/websites");
}

export async function generateAiLandingPageAction(input: {
  pageId: string;
  instruction?: string;
}) {
  const { userId, business, businessId } = await getUserBusiness();
  if (!isOpenAiConfigured()) {
    return { success: false as const, error: "OPENAI_API_KEY is not configured." };
  }

  const supabase = await createServerSupabaseClient();
  const { data: page } = await supabase
    .from("website_pages")
    .select("*")
    .eq("id", input.pageId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (!page) return { success: false as const, error: "Page not found" };

  const profile = {
    businessName: businessText(business, "name"),
    niche: businessProfileText(business, "industry") || businessText(business, "industry"),
    location: businessText(business, "city_state") || businessText(business, "service_area"),
    services: businessText(business, "services") || businessProfileText(business, "services"),
    keywords: businessProfileText(business, "keywords"),
    targetAudience: businessProfileText(business, "targetCustomer"),
  };

  const aiResult = await callJsonResponses<AiLandingPageOutput>({
    supabase,
    businessId,
    purpose: "website_builder.ai_landing_page",
    schema: AiLandingPageSchema,
    system:
      "You are Diazites' native AI landing page agent. Generate conversion-focused page copy for a GrapesJS website builder. Keep copy specific to the business profile, niche, location, services, keywords, and target audience. Return JSON only.",
    prompt: `Business profile:
${JSON.stringify(profile, null, 2)}

Current page:
${JSON.stringify({ title: page.title, slug: page.slug }, null, 2)}

User instruction:
${input.instruction?.trim() || "Build a high-converting landing page for this business."}

Return title, slug, headline, subheadline, ctaText, benefits, services, testimonials placeholders, faqs, seoTitle, and seoDescription.`,
  });

  if (!aiResult.success) return { success: false as const, error: aiResult.error };

  const html = buildHtmlFromAiOutput(aiResult.data);
  const css = buildTemplateCss();
  const grapesjsData = buildDefaultGrapesProjectData(html, css);
  const slug = slugifyPageTitle(aiResult.data.slug || aiResult.data.title);

  const { error } = await supabase
    .from("website_pages")
    .update({
      title: aiResult.data.title,
      slug,
      html,
      css,
      grapesjs_data: grapesjsData,
      status: "draft",
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.pageId)
    .eq("business_id", businessId);

  if (error) return { success: false as const, error: error.message };

  await supabase.from("website_seo").upsert(
    {
      business_id: businessId,
      website_id: page.website_id,
      page_id: input.pageId,
      meta_title: aiResult.data.seoTitle,
      meta_description: aiResult.data.seoDescription,
      schema_markup: {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: profile.businessName,
        areaServed: profile.location,
      },
    },
    { onConflict: "page_id" },
  );

  await createVersionSnapshot({
    businessId,
    websiteId: String(page.website_id),
    pageId: input.pageId,
    userId,
    label: "AI Draft",
    changeSummary: "AI generated landing page copy and structure",
    grapesjsData,
    html,
    css,
  });

  revalidatePath("/dashboard/websites");
  return { success: true as const, data: { ...aiResult.data, html, css, grapesjsData } };
}

export async function registerWebsiteAssetAction(input: {
  websiteId?: string | null;
  pageId?: string | null;
  assetType: "image" | "video" | "pdf" | "logo" | "font" | "other";
  storagePath: string;
  publicUrl?: string | null;
  fileName: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
}) {
  const { businessId, userId } = await getUserBusiness();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("website_assets").insert({
    business_id: businessId,
    website_id: input.websiteId ?? null,
    page_id: input.pageId ?? null,
    asset_type: input.assetType,
    bucket: "website-assets",
    storage_path: input.storagePath,
    public_url: input.publicUrl ?? null,
    file_name: input.fileName,
    mime_type: input.mimeType ?? null,
    size_bytes: input.sizeBytes ?? null,
    uploaded_by: userId,
  });

  if (error) return { success: false as const, error: error.message };
  revalidatePath("/dashboard/websites");
  return { success: true as const };
}
