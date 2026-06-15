"use client";

import "grapesjs/dist/css/grapes.min.css";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowLeft,
  BarChart3,
  Bot,
  Eye,
  FileImage,
  Layers3,
  Monitor,
  PanelLeft,
  Save,
  Search,
  Settings2,
  Smartphone,
  Tablet,
  Users,
} from "lucide-react";

import type {
  GrapesJsProjectData,
  WebsiteBuilderAnalyticsSummary,
  WebsiteBuilderAssetRecord,
  WebsiteBuilderPageRecord,
  WebsiteBuilderTemplateRecord,
} from "@/lib/website-builder/types";
import {
  generateAiLandingPageAction,
  saveWebsitePageAction,
} from "@/services/website-builder/actions";

type GrapesEditor = {
  getHtml: () => string;
  getCss: () => string;
  getProjectData: () => GrapesJsProjectData;
  loadProjectData?: (data: GrapesJsProjectData) => void;
  destroy: () => void;
  setDevice?: (device: string) => void;
  runCommand?: (command: string) => void;
  BlockManager?: {
    add: (id: string, options: Record<string, unknown>) => void;
  };
  Panels?: {
    addButton: (panel: string, button: Record<string, unknown>) => void;
  };
};

type GrapesModule = {
  default: {
    init: (options: Record<string, unknown>) => GrapesEditor;
  };
};

type GrapesJsWebsiteEditorProps = {
  page: WebsiteBuilderPageRecord;
  pages: WebsiteBuilderPageRecord[];
  templates: WebsiteBuilderTemplateRecord[];
  assets: WebsiteBuilderAssetRecord[];
  analytics: WebsiteBuilderAnalyticsSummary;
  versions: Array<Record<string, unknown>>;
};

const LEFT_TABS = [
  { id: "pages", label: "Pages", icon: PanelLeft },
  { id: "templates", label: "Templates", icon: Layers3 },
  { id: "blocks", label: "Blocks", icon: Layers3 },
  { id: "media", label: "Media", icon: FileImage },
  { id: "ai", label: "AI Generator", icon: Bot },
] as const;

const RIGHT_TABS = [
  { id: "styles", label: "Styles", icon: Settings2 },
  { id: "settings", label: "Settings", icon: Settings2 },
  { id: "seo", label: "SEO", icon: Search },
  { id: "crm", label: "CRM Settings", icon: Users },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "versions", label: "Versions", icon: Layers3 },
] as const;

type LeftTab = (typeof LEFT_TABS)[number]["id"];
type RightTab = (typeof RIGHT_TABS)[number]["id"];

export function GrapesJsWebsiteEditor({
  page,
  pages,
  templates,
  assets,
  analytics,
  versions,
}: GrapesJsWebsiteEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<GrapesEditor | null>(null);
  const [leftTab, setLeftTab] = useState<LeftTab>("pages");
  const [rightTab, setRightTab] = useState<RightTab>("styles");
  const [message, setMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [aiInstruction, setAiInstruction] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let mounted = true;

    async function bootEditor() {
      if (!containerRef.current || editorRef.current) return;
      const grapesjs = ((await import("grapesjs")) as unknown as GrapesModule).default;
      if (!mounted) return;

      const editor = grapesjs.init({
        container: containerRef.current,
        height: "calc(100vh - 190px)",
        storageManager: false,
        fromElement: false,
        projectData: hasProjectData(page.grapesjs_data)
          ? page.grapesjs_data
          : undefined,
        components: page.html,
        style: page.css,
        deviceManager: {
          devices: [
            { id: "desktop", name: "Desktop", width: "" },
            { id: "tablet", name: "Tablet", width: "768px", widthMedia: "992px" },
            { id: "mobile", name: "Mobile", width: "375px", widthMedia: "480px" },
          ],
        },
        panels: { defaults: [] },
        blockManager: {
          appendTo: "#dz-builder-blocks",
        },
        styleManager: {
          appendTo: "#dz-builder-styles",
        },
        layerManager: {
          appendTo: "#dz-builder-layers",
        },
      });

      addDiazitesBlocks(editor);
      editorRef.current = editor;
    }

    void bootEditor();

    return () => {
      mounted = false;
      editorRef.current?.destroy();
      editorRef.current = null;
    };
  }, [page.css, page.grapesjs_data, page.html]);

  const save = () => {
    const editor = editorRef.current;
    if (!editor) return;
    setMessage(null);
    setErrorDetails(null);
    startTransition(async () => {
      const result = await saveWebsitePageAction({
        pageId: page.id,
        html: editor.getHtml(),
        css: editor.getCss(),
        grapesjsData: editor.getProjectData(),
      });
      setMessage(result.success ? "Draft saved." : result.error);
    });
  };

  const generateWithAi = () => {
    setMessage(null);
    setErrorDetails(null);
    startTransition(async () => {
      const result = await generateAiLandingPageAction({
        pageId: page.id,
        instruction: aiInstruction,
      });
      if (!result.success) {
        setMessage(result.error);
        setErrorDetails(result.details ?? null);
        return;
      }
      editorRef.current?.loadProjectData?.(result.data.grapesjsData);
      setMessage(`AI generated the page in ${result.attempts} attempt${result.attempts === 1 ? "" : "s"}. Review it, then save or publish.`);
    });
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      <header className="border-b border-white/[0.08] bg-[#0b1020] px-4 py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/websites"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] text-slate-300"
              aria-label="Back to Websites"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-violet-300">Diazites Builder</p>
              <h1 className="text-lg font-semibold">{page.title}</h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[
              ["Desktop", Monitor],
              ["Tablet", Tablet],
              ["Mobile", Smartphone],
            ].map(([device, Icon]) => (
              <button
                key={String(device)}
                type="button"
                onClick={() => editorRef.current?.setDevice?.(String(device))}
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2 text-sm text-slate-200"
              >
                <Icon className="h-4 w-4" />
                {String(device)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => editorRef.current?.runCommand?.("preview")}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] px-3 py-2 text-sm text-slate-200"
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
            <button
              type="button"
              onClick={save}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isPending ? "Saving..." : "Save Draft"}
            </button>
          </div>
        </div>
        {message ? <p className="mt-3 text-sm text-violet-200">{message}</p> : null}
        {errorDetails ? (
          <pre className="mt-3 max-h-40 overflow-auto rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs leading-5 text-rose-100">
            {errorDetails}
          </pre>
        ) : null}
      </header>

      <section className="grid min-h-[calc(100vh-96px)] grid-cols-1 xl:grid-cols-[280px_1fr_300px]">
        <aside className="border-r border-white/[0.08] bg-[#090e1a] p-4">
          <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/[0.08] bg-black/20 p-1">
            {LEFT_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setLeftTab(tab.id)}
                  className={`flex items-center gap-2 rounded-xl px-2 py-2 text-xs ${
                    leftTab === tab.id ? "bg-violet-600 text-white" : "text-slate-400"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {leftTab === "pages" ? (
            <EditorPanel title="Pages">
              <div className="space-y-2">
                {pages.map((item) => (
                  <Link
                    key={item.id}
                    href={`/dashboard/websites/${item.id}/editor`}
                    className={`block rounded-xl border px-3 py-2 text-sm ${
                      item.id === page.id
                        ? "border-violet-500/40 bg-violet-500/15 text-white"
                        : "border-white/[0.08] text-slate-300"
                    }`}
                  >
                    <span className="block truncate font-medium">{item.title}</span>
                    <span className="text-xs text-slate-500">/{item.slug}</span>
                  </Link>
                ))}
              </div>
            </EditorPanel>
          ) : null}

          {leftTab === "templates" ? (
            <EditorPanel title="Templates">
              <div className="space-y-2">
                {templates.slice(0, 12).map((template) => (
                  <div key={template.id} className="rounded-xl border border-white/[0.08] p-3">
                    <p className="text-sm font-medium text-white">{template.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{template.description}</p>
                  </div>
                ))}
              </div>
            </EditorPanel>
          ) : null}

          {leftTab === "blocks" ? (
            <EditorPanel title="Blocks">
              <div id="dz-builder-blocks" className="space-y-2" />
            </EditorPanel>
          ) : null}

          {leftTab === "media" ? (
            <EditorPanel title="Media Library">
              <div className="space-y-2">
                {assets.length ? (
                  assets.map((asset) => (
                    <a
                      key={asset.id}
                      href={asset.public_url ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-xl border border-white/[0.08] p-3 text-sm text-slate-300"
                    >
                      <span className="block truncate text-white">{asset.file_name}</span>
                      <span className="text-xs uppercase text-slate-500">{asset.asset_type}</span>
                    </a>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Upload media from the Websites dashboard.</p>
                )}
              </div>
            </EditorPanel>
          ) : null}

          {leftTab === "ai" ? (
            <EditorPanel title="AI Website Generator">
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-violet-200" />
                  <h2 className="text-sm font-semibold">Schema-driven AI agent</h2>
                </div>
                <p className="mt-2 text-xs leading-5 text-violet-100/80">
                  AI returns typed JSON sections, Diazites validates it, then converts sections into
                  GrapesJS components.
                </p>
                <textarea
                  value={aiInstruction}
                  onChange={(event) => setAiInstruction(event.target.value)}
                  placeholder="Tell Diazites what to build..."
                  className="mt-3 min-h-28 w-full rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2 text-sm text-white"
                />
                <button
                  type="button"
                  onClick={generateWithAi}
                  disabled={isPending}
                  className="mt-3 w-full rounded-xl bg-violet-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Generate into builder
                </button>
              </div>
            </EditorPanel>
          ) : null}
        </aside>

        <main className="min-w-0 bg-white">
          <div ref={containerRef} />
        </main>

        <aside className="border-l border-white/[0.08] bg-[#090e1a] p-4">
          <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/[0.08] bg-black/20 p-1">
            {RIGHT_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRightTab(tab.id)}
                  className={`flex items-center gap-2 rounded-xl px-2 py-2 text-xs ${
                    rightTab === tab.id ? "bg-violet-600 text-white" : "text-slate-400"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {rightTab === "styles" ? (
            <EditorPanel title="Styles">
              <div id="dz-builder-styles" />
              <h2 className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Layers
              </h2>
              <div id="dz-builder-layers" className="mt-3" />
            </EditorPanel>
          ) : null}

          {rightTab === "settings" ? (
            <EditorPanel title="Page Settings">
              <SettingRow label="Page name" value={page.title} />
              <SettingRow label="URL slug" value={`/${page.slug}`} />
              <SettingRow label="Status" value={page.status} />
              <SettingRow label="Page type" value={page.page_type} />
            </EditorPanel>
          ) : null}

          {rightTab === "seo" ? (
            <EditorPanel title="SEO">
              <SettingRow label="Meta title" value="Managed from AI generation / SEO table" />
              <SettingRow label="Meta description" value="Generated per page and editable in the next panel pass" />
              <SettingRow label="Schema" value="LocalBusiness JSON-LD supported" />
            </EditorPanel>
          ) : null}

          {rightTab === "crm" ? (
            <EditorPanel title="CRM Settings">
              <SettingRow label="Lead action" value="Create contact + lead + opportunity" />
              <SettingRow label="Pipeline" value="Website form pipeline settings" />
              <SettingRow label="Workflow" value="Trigger from website_forms.workflow_id" />
              <SettingRow label="AI Agent" value="Ready for assigned-agent mapping" />
            </EditorPanel>
          ) : null}

          {rightTab === "analytics" ? (
            <EditorPanel title="Analytics">
              <SettingRow label="Visitors" value={String(analytics.visitors)} />
              <SettingRow label="Leads" value={String(analytics.leads)} />
              <SettingRow label="Conversions" value={`${(analytics.conversionRate * 100).toFixed(1)}%`} />
            </EditorPanel>
          ) : null}

          {rightTab === "versions" ? (
            <EditorPanel title="Version History">
              <div className="space-y-2">
                {versions.slice(0, 8).map((version) => (
                  <div key={String(version.id)} className="rounded-xl border border-white/[0.08] p-3 text-xs">
                    <p className="font-medium text-slate-200">
                      v{String(version.version_number ?? "?")} · {String(version.label ?? "Draft")}
                    </p>
                    <p className="mt-1 text-slate-500">{String(version.change_summary ?? "Saved")}</p>
                  </div>
                ))}
              </div>
            </EditorPanel>
          ) : null}
        </aside>
      </section>
    </div>
  );
}

function addDiazitesBlocks(editor: GrapesEditor) {
  const blockManager = editor.BlockManager;
  if (!blockManager) return;

  blockManager.add("dz-hero", {
    label: "Hero Section",
    category: "Diazites",
    content:
      '<section class="dz-hero"><div class="dz-pill">Diazites AI Funnel</div><h1>Your headline here</h1><p>Your subheadline here</p><a class="dz-button" href="#contact">Get Started</a></section>',
  });
  blockManager.add("dz-columns", {
    label: "3 Columns",
    category: "Diazites",
    content:
      '<section class="dz-section dz-grid"><article><h2>Benefit 1</h2><p>Describe it.</p></article><article><h2>Benefit 2</h2><p>Describe it.</p></article><article><h2>Benefit 3</h2><p>Describe it.</p></article></section>',
  });
  blockManager.add("dz-form", {
    label: "Lead Form",
    category: "Diazites",
    content:
      '<section id="contact" class="dz-section dz-contact"><h2>Contact us</h2><form data-dz-form="lead-capture"><input name="name" placeholder="Name"/><input name="email" type="email" placeholder="Email"/><input name="phone" type="tel" placeholder="Phone"/><textarea name="message" placeholder="Message"></textarea><button type="submit">Submit</button></form></section>',
  });
  blockManager.add("dz-faq", {
    label: "FAQ",
    category: "Diazites",
    content:
      '<section class="dz-section dz-faq"><h2>FAQ</h2><details open><summary>Question?</summary><p>Answer.</p></details><details><summary>Question?</summary><p>Answer.</p></details></section>',
  });
  blockManager.add("dz-html", {
    label: "Custom HTML",
    category: "Advanced",
    content: '<div class="dz-section"><h2>Custom HTML block</h2><p>Edit this block with your own content.</p></div>',
  });
}

function hasProjectData(data: GrapesJsProjectData): boolean {
  return Object.keys(data ?? {}).length > 0;
}

function EditorPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-5">
      <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</h2>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-white/[0.06] py-3 text-sm">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1 text-slate-200">{value || "Not set"}</p>
    </div>
  );
}
