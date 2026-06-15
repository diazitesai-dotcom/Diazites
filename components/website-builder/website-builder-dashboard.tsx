"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  BarChart3,
  Bot,
  Copy,
  ExternalLink,
  FileImage,
  Globe2,
  Layers3,
  Pencil,
  Plus,
  Rocket,
  Search,
  Settings2,
  Trash2,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { WEBSITE_TEMPLATE_DEFINITIONS } from "@/lib/website-builder/templates";
import type { WebsiteBuilderDashboardData } from "@/lib/website-builder/types";
import {
  createWebsiteDomainAction,
  createWebsitePageAction,
  deleteWebsitePageAction,
  duplicateWebsitePageAction,
  generateAiLandingPageAction,
  publishWebsitePageAction,
  registerWebsiteAssetAction,
  unpublishWebsitePageAction,
} from "@/services/website-builder/actions";

const TABS = [
  { id: "all", label: "All Websites", icon: Globe2 },
  { id: "templates", label: "Templates", icon: Layers3 },
  { id: "domains", label: "Domains", icon: Rocket },
  { id: "media", label: "Media Library", icon: FileImage },
  { id: "ai", label: "AI Landing Page Generator", icon: Bot },
  { id: "seo", label: "SEO", icon: Search },
  { id: "forms", label: "Forms", icon: Settings2 },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
] as const;

type TabId = (typeof TABS)[number]["id"];

type WebsiteBuilderDashboardProps = {
  data: WebsiteBuilderDashboardData;
};

export function WebsiteBuilderDashboard({ data }: WebsiteBuilderDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [selectedPageId, setSelectedPageId] = useState(data.pages[0]?.id ?? "");
  const [aiInstruction, setAiInstruction] = useState("");
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedWebsiteId = data.websites[0]?.id ?? "";
  const selectedPage = data.pages.find((page) => page.id === selectedPageId) ?? data.pages[0];

  const pageStats = useMemo(
    () => ({
      total: data.pages.length,
      published: data.pages.filter((page) => page.status === "published").length,
      drafts: data.pages.filter((page) => page.status !== "published").length,
    }),
    [data.pages],
  );

  const generateWithAi = () => {
    if (!selectedPageId) {
      setAiMessage("Create a page first, then run the AI generator.");
      return;
    }
    setAiMessage(null);
    startTransition(async () => {
      const result = await generateAiLandingPageAction({
        pageId: selectedPageId,
        instruction: aiInstruction,
      });
      setAiMessage(
        result.success
          ? "AI generated the page. Open the editor to review and publish."
          : result.error,
      );
    });
  };

  const uploadAsset = async (file: File) => {
    if (!data.businessId) return;
    setUploadMessage("Uploading media...");
    const supabase = createClient();
    const storagePath = `${data.businessId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const { error } = await supabase.storage.from("website-assets").upload(storagePath, file);
    if (error) {
      setUploadMessage(error.message);
      return;
    }
    const { data: urlData } = supabase.storage.from("website-assets").getPublicUrl(storagePath);
    const assetType = inferAssetType(file.type);
    const result = await registerWebsiteAssetAction({
      websiteId: selectedWebsiteId || null,
      assetType,
      storagePath,
      publicUrl: urlData.publicUrl,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    });
    setUploadMessage(result.success ? "Media uploaded." : result.error);
  };

  if (!data.businessId) {
    return (
      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8">
        <h2 className="text-xl font-semibold text-white">Finish onboarding first</h2>
        <p className="mt-2 text-sm text-slate-400">
          Diazites needs a business profile before it can build websites and funnels.
        </p>
        <Link
          href="/onboarding"
          className="mt-5 inline-flex rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Start onboarding
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["Pages", pageStats.total],
          ["Published", pageStats.published],
          ["Drafts", pageStats.drafts],
          ["Leads", data.analytics.leads],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
          </div>
        ))}
      </section>

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#0b1020] p-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm transition ${
                active
                  ? "bg-violet-600 text-white"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "all" ? (
        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {data.pages.length ? (
              data.pages.map((page) => (
                <article
                  key={page.id}
                  className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">{page.title}</h3>
                        <span className="rounded-full border border-white/[0.08] px-2 py-0.5 text-xs capitalize text-slate-300">
                          {page.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">/{page.slug}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/dashboard/websites/${page.id}/editor`}
                        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </Link>
                      <form action={duplicateWebsitePageAction}>
                        <input type="hidden" name="pageId" value={page.id} />
                        <button className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2 text-sm text-slate-200">
                          <Copy className="h-4 w-4" />
                          Duplicate
                        </button>
                      </form>
                      <form
                        action={
                          page.status === "published"
                            ? unpublishWebsitePageAction
                            : publishWebsitePageAction
                        }
                      >
                        <input type="hidden" name="pageId" value={page.id} />
                        <button className="rounded-xl border border-white/[0.08] px-3 py-2 text-sm text-slate-200">
                          {page.status === "published" ? "Unpublish" : "Publish"}
                        </button>
                      </form>
                      <form action={deleteWebsitePageAction}>
                        <input type="hidden" name="pageId" value={page.id} />
                        <button className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 px-3 py-2 text-sm text-rose-200">
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState title="No pages yet" body="Create your first Diazites website page from a template." />
            )}
          </div>
          <CreatePageCard />
        </section>
      ) : null}

      {activeTab === "templates" ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {WEBSITE_TEMPLATE_DEFINITIONS.map((template) => (
            <article key={template.slug} className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-violet-300">{template.category}</p>
              <h3 className="mt-3 text-lg font-semibold text-white">{template.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{template.description}</p>
              <div className="mt-4 space-y-1 text-xs text-slate-400">
                <p>
                  <span className="text-slate-300">Best for:</span> {template.bestFor}
                </p>
                <p>
                  <span className="text-slate-300">Main CTA:</span> {template.primaryCta}
                </p>
              </div>
              <form action={createWebsitePageAction} className="mt-5">
                <input type="hidden" name="templateSlug" value={template.slug} />
                <input type="hidden" name="title" value={`${template.name} Page`} />
                <button className="w-full rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white">
                  Use Template
                </button>
              </form>
            </article>
          ))}
        </section>
      ) : null}

      {activeTab === "domains" ? (
        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {data.domains.length ? (
              data.domains.map((domain) => (
                <div key={domain.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{domain.hostname}</p>
                      <p className="mt-1 text-xs text-slate-500">SSL: {domain.ssl_status}</p>
                    </div>
                    <span className="rounded-full bg-white/[0.06] px-2 py-1 text-xs capitalize text-slate-300">
                      {domain.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState title="No domains connected" body="Connect a custom domain or reserve a Diazites subdomain." />
            )}
          </div>
          <form action={createWebsiteDomainAction} className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5">
            <h3 className="font-semibold text-white">Connect domain</h3>
            <input type="hidden" name="websiteId" value={selectedWebsiteId} />
            <input
              name="hostname"
              placeholder="www.customer.com or customer.diazites.com"
              className="mt-4 w-full rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2 text-sm text-white"
            />
            <button className="mt-3 w-full rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white">
              Add domain
            </button>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Diazites stores verification tokens and DNS instructions. Vercel SSL automation can be
              wired to these records in the next deployment phase.
            </p>
          </form>
        </section>
      ) : null}

      {activeTab === "media" ? (
        <section className="space-y-4">
          <div className="rounded-3xl border border-dashed border-white/[0.14] bg-white/[0.03] p-6">
            <h3 className="font-semibold text-white">Upload media</h3>
            <p className="mt-1 text-sm text-slate-400">Images, logos, PDFs, and videos are stored in Supabase Storage.</p>
            <input
              type="file"
              className="mt-4 block text-sm text-slate-300"
              accept="image/*,video/*,application/pdf"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadAsset(file);
              }}
            />
            {uploadMessage ? <p className="mt-3 text-sm text-violet-200">{uploadMessage}</p> : null}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {data.assets.map((asset) => (
              <a
                key={asset.id}
                href={asset.public_url ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-sm text-slate-300"
              >
                <FileImage className="mb-3 h-5 w-5 text-violet-300" />
                <p className="truncate font-medium text-white">{asset.file_name}</p>
                <p className="mt-1 text-xs uppercase text-slate-500">{asset.asset_type}</p>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === "ai" ? (
        <section className="rounded-3xl border border-violet-500/20 bg-violet-500/10 p-6">
          <h3 className="text-lg font-semibold text-white">AI Landing Page Generator</h3>
          <p className="mt-2 text-sm text-violet-100/80">
            Reads your business profile, niche, location, services, keywords, and target audience,
            then writes directly into the selected builder page.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-[260px_1fr_auto]">
            <select
              value={selectedPageId}
              onChange={(event) => setSelectedPageId(event.target.value)}
              className="rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2 text-sm text-white"
            >
              {data.pages.map((page) => (
                <option key={page.id} value={page.id} className="bg-[#0b1020]">
                  {page.title}
                </option>
              ))}
            </select>
            <input
              value={aiInstruction}
              onChange={(event) => setAiInstruction(event.target.value)}
              placeholder="Example: Build a nonprofit donor and volunteer landing page"
              className="rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2 text-sm text-white"
            />
            <button
              type="button"
              onClick={generateWithAi}
              disabled={isPending}
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isPending ? "Generating..." : "Generate"}
            </button>
          </div>
          {aiMessage ? <p className="mt-4 text-sm text-violet-100">{aiMessage}</p> : null}
        </section>
      ) : null}

      {activeTab === "seo" ? (
        <InfoPanel
          title="SEO System"
          body="Each website page has SEO records for meta title, meta description, Open Graph image, canonical URL, schema markup, URL slug, and sitemap controls. AI generation fills SEO title and description automatically."
          cta={selectedPage ? { href: `/dashboard/websites/${selectedPage.id}/editor`, label: "Edit SEO in builder" } : undefined}
        />
      ) : null}

      {activeTab === "forms" ? (
        <InfoPanel
          title="Form Builder"
          body="Diazites forms are attached to pages and connect to CRM contacts, leads, opportunities, pipelines, workflows, AI follow-up config, and notifications through the website_forms and website_submissions tables."
          cta={selectedPage ? { href: `/dashboard/websites/${selectedPage.id}/editor`, label: "Open page forms" } : undefined}
        />
      ) : null}

      {activeTab === "analytics" ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5">
            <h3 className="font-semibold text-white">Top Pages</h3>
            <div className="mt-4 space-y-3">
              {data.analytics.topPages.length ? (
                data.analytics.topPages.map((page) => (
                  <div key={page.title} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{page.title}</span>
                    <span className="text-slate-500">{page.visitors} visitors · {page.leads} leads</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No analytics yet.</p>
              )}
            </div>
          </div>
          <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5">
            <h3 className="font-semibold text-white">Traffic Sources</h3>
            <div className="mt-4 space-y-3">
              {data.analytics.trafficSources.length ? (
                data.analytics.trafficSources.map((source) => (
                  <div key={source.source} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{source.source}</span>
                    <span className="text-slate-500">{source.visitors} visitors</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Traffic source data will show after publish.</p>
              )}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function CreatePageCard() {
  return (
    <form action={createWebsitePageAction} className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5">
      <div className="flex items-center gap-2">
        <Plus className="h-5 w-5 text-violet-300" />
        <h3 className="font-semibold text-white">Create page</h3>
      </div>
      <label className="mt-5 block text-xs text-slate-400">
        Page title
        <input
          name="title"
          placeholder="Homepage, Offer Page, Donation Page..."
          className="mt-1 w-full rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2 text-sm text-white"
        />
      </label>
      <label className="mt-3 block text-xs text-slate-400">
        Template
        <select
          name="templateSlug"
          className="mt-1 w-full rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2 text-sm text-white"
        >
          {WEBSITE_TEMPLATE_DEFINITIONS.map((template) => (
            <option key={template.slug} value={template.slug} className="bg-[#0b1020]">
              {template.name}
            </option>
          ))}
        </select>
      </label>
      <button className="mt-4 w-full rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white">
        Create in Builder
      </button>
    </form>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/[0.12] bg-white/[0.02] p-8">
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{body}</p>
    </div>
  );
}

function InfoPanel({
  title,
  body,
  cta,
}: {
  title: string;
  body: string;
  cta?: { href: string; label: string };
}) {
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{body}</p>
      {cta ? (
        <Link
          href={cta.href}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white"
        >
          {cta.label}
          <ExternalLink className="h-4 w-4" />
        </Link>
      ) : null}
    </section>
  );
}

function inferAssetType(mimeType: string): "image" | "video" | "pdf" | "logo" | "font" | "other" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("font")) return "font";
  return "other";
}
