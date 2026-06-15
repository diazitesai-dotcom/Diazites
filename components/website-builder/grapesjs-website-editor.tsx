"use client";

import "grapesjs/dist/css/grapes.min.css";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, Bot, Eye, Monitor, Save, Smartphone, Tablet } from "lucide-react";

import type { GrapesJsProjectData, WebsiteBuilderPageRecord } from "@/lib/website-builder/types";
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
  versions: Array<Record<string, unknown>>;
};

export function GrapesJsWebsiteEditor({ page, versions }: GrapesJsWebsiteEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<GrapesEditor | null>(null);
  const [message, setMessage] = useState<string | null>(null);
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
    startTransition(async () => {
      const result = await generateAiLandingPageAction({
        pageId: page.id,
        instruction: aiInstruction,
      });
      if (!result.success) {
        setMessage(result.error);
        return;
      }
      editorRef.current?.loadProjectData?.(result.data.grapesjsData);
      setMessage("AI generated the page. Review it, then save or publish.");
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
      </header>

      <section className="grid min-h-[calc(100vh-96px)] grid-cols-1 xl:grid-cols-[280px_1fr_300px]">
        <aside className="border-r border-white/[0.08] bg-[#090e1a] p-4">
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-violet-200" />
              <h2 className="text-sm font-semibold">AI page agent</h2>
            </div>
            <textarea
              value={aiInstruction}
              onChange={(event) => setAiInstruction(event.target.value)}
              placeholder="Tell Diazites what to build..."
              className="mt-3 min-h-24 w-full rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2 text-sm text-white"
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

          <h2 className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Blocks
          </h2>
          <div id="dz-builder-blocks" className="mt-3 space-y-2" />
        </aside>

        <main className="min-w-0 bg-white">
          <div ref={containerRef} />
        </main>

        <aside className="border-l border-white/[0.08] bg-[#090e1a] p-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Layers
          </h2>
          <div id="dz-builder-layers" className="mt-3" />
          <h2 className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Styles
          </h2>
          <div id="dz-builder-styles" className="mt-3" />
          <h2 className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Versions
          </h2>
          <div className="mt-3 space-y-2">
            {versions.slice(0, 8).map((version) => (
              <div key={String(version.id)} className="rounded-xl border border-white/[0.08] p-3 text-xs">
                <p className="font-medium text-slate-200">
                  v{String(version.version_number ?? "?")} · {String(version.label ?? "Draft")}
                </p>
                <p className="mt-1 text-slate-500">{String(version.change_summary ?? "Saved")}</p>
              </div>
            ))}
          </div>
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
