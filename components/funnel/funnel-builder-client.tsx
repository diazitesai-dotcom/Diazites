"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  Layers,
  LayoutTemplate,
  Loader2,
  Monitor,
  Plus,
  Save,
  Smartphone,
  Sparkles,
  Tablet,
  Upload,
  Wand2,
} from "lucide-react";

import {
  addAssetAction,
  createLandingPageAction,
  createVariantAction,
  loadFunnelEditorAction,
  publishLandingPageAction,
  saveLandingPageVersionAction,
  suggestWinnerAction,
} from "@/actions/marketing-os.actions";
import { FunnelPageCanvas } from "@/components/funnel/funnel-page-canvas";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FUNNEL_TEMPLATES, type FunnelTemplate } from "@/lib/funnel/funnel-templates";
import { cn } from "@/lib/utils";
import {
  DEFAULT_FORM_FIELDS,
  DEFAULT_LANDING_SECTIONS,
  type AiConversionScores,
  type LandingFormField,
  type LandingSection,
  type LandingSectionType,
} from "@/types/marketing-os";

type LeftTab = "pages" | "layers" | "templates";

type LandingPageListItem = {
  id: string;
  slug: string;
  headline: string | null;
  published: boolean;
  status: string | null;
};

type EditorState = {
  page: Record<string, unknown>;
  versions: Array<Record<string, unknown>>;
  assets: Array<Record<string, unknown>>;
  analytics: Array<Record<string, unknown>>;
  aiScores: AiConversionScores;
};

type FunnelBuilderClientProps = {
  businessId: string;
  initialPages: LandingPageListItem[];
};

const ADD_SECTION_TYPES: { type: LandingSectionType; label: string }[] = [
  { type: "hero", label: "Hero" },
  { type: "offer", label: "Offer" },
  { type: "benefits", label: "Benefits" },
  { type: "testimonials", label: "Testimonials" },
  { type: "faq", label: "FAQ" },
  { type: "contact_form", label: "Form" },
  { type: "trust_badges", label: "Trust Badges" },
  { type: "pricing", label: "Pricing" },
  { type: "video", label: "Video" },
];

export function FunnelBuilderClient({ initialPages }: FunnelBuilderClientProps) {
  const [pages, setPages] = useState(initialPages);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(initialPages[0]?.id ?? null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [loadingEditor, setLoadingEditor] = useState(false);
  const [leftTab, setLeftTab] = useState<LeftTab>("pages");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<"properties" | "forms" | "versions" | "ai">("properties");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [message, setMessage] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [pending, startTransition] = useTransition();

  const activeVersion = useMemo(() => {
    if (!editor?.versions.length) return null;
    const activeId = editor.page.active_version_id as string | undefined;
    return editor.versions.find((v) => v.id === activeId) ?? editor.versions[0];
  }, [editor]);

  const sections = (activeVersion?.sections as LandingSection[] | undefined) ?? DEFAULT_LANDING_SECTIONS;
  const formFields = (activeVersion?.form_fields as LandingFormField[] | undefined) ?? DEFAULT_FORM_FIELDS;
  const selectedSection = sections.find((s) => s.id === selectedSectionId) ?? null;
  const selectedPage = pages.find((p) => p.id === selectedPageId);

  const loadEditor = useCallback(async (pageId: string) => {
    setLoadingEditor(true);
    setMessage("");
    const result = await loadFunnelEditorAction(pageId);
    setLoadingEditor(false);
    if (result.ok) {
      const data = result.data as EditorState;
      setEditor(data);
      setSelectedPageId(pageId);
      const versionSections =
        ((data.versions[0]?.sections as LandingSection[] | undefined) ?? DEFAULT_LANDING_SECTIONS).filter(
          (s) => s.enabled,
        );
      setSelectedSectionId(versionSections[0]?.id ?? "hero");
      setLeftTab("layers");
    } else {
      setMessage(result.error);
    }
  }, []);

  useEffect(() => {
    if (selectedPageId && !editor && !loadingEditor) {
      void loadEditor(selectedPageId);
    }
  }, [selectedPageId, editor, loadingEditor, loadEditor]);

  function updateSections(nextSections: LandingSection[]) {
    if (!editor || !activeVersion) return;
    setEditor({
      ...editor,
      versions: editor.versions.map((v) =>
        v.id === activeVersion.id ? { ...v, sections: nextSections } : v,
      ),
    });
  }

  function updateSection(sectionId: string, patch: Partial<LandingSection>) {
    updateSections(sections.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)));
  }

  function updateFormField(fieldId: string, patch: Partial<LandingFormField>) {
    if (!editor || !activeVersion) return;
    const nextFields = formFields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f));
    setEditor({
      ...editor,
      versions: editor.versions.map((v) =>
        v.id === activeVersion.id ? { ...v, form_fields: nextFields } : v,
      ),
    });
  }

  function moveSection(sectionId: string, direction: "up" | "down") {
    const sorted = [...sections].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((s) => s.id === sectionId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const reordered = sorted.map((s, i) => {
      if (i === idx) return { ...sorted[swapIdx]!, order: s.order };
      if (i === swapIdx) return { ...sorted[idx]!, order: s.order };
      return s;
    });
    updateSections(reordered);
  }

  function addSection(type: LandingSectionType) {
    const maxOrder = Math.max(...sections.map((s) => s.order), -1);
    const newSection: LandingSection = {
      id: `${type}-${Date.now().toString(36)}`,
      type,
      enabled: true,
      order: maxOrder + 1,
      content: defaultContentForType(type),
    };
    updateSections([...sections, newSection]);
    setSelectedSectionId(newSection.id);
  }

  function createPage(input: {
    headline: string;
    subheadline?: string;
    offer: string;
    location: string;
    ctaText: string;
  }) {
    startTransition(async () => {
      const result = await createLandingPageAction(input);
      if (result.ok) {
        setPages((prev) => [
          {
            id: result.data.landingPageId,
            slug: result.data.slug,
            headline: input.headline,
            published: false,
            status: "draft",
          },
          ...prev,
        ]);
        setEditor(null);
        setSelectedPageId(result.data.landingPageId);
        await loadEditor(result.data.landingPageId);
        setMessage("Page created.");
      } else {
        setMessage(result.error);
      }
    });
  }

  function createFromTemplate(template: FunnelTemplate) {
    createPage({
      headline: template.headline,
      subheadline: template.subheadline,
      offer: template.offer,
      location: template.location,
      ctaText: template.ctaText,
    });
  }

  function handleSave() {
    if (!editor || !activeVersion) return;
    startTransition(async () => {
      const result = await saveLandingPageVersionAction(String(activeVersion.id), {
        sections,
        formFields,
      });
      setMessage(result.ok ? "Saved." : result.error);
    });
  }

  function handlePublish() {
    if (!editor || !activeVersion) return;
    startTransition(async () => {
      const result = await publishLandingPageAction(
        String(editor.page.id),
        String(activeVersion.id),
      );
      if (result.ok) {
        setMessage(`Published at /lp/${result.data.slug}`);
        setPages((prev) =>
          prev.map((p) =>
            p.id === selectedPageId ? { ...p, published: true, status: "published" } : p,
          ),
        );
      } else {
        setMessage(result.error);
      }
    });
  }

  return (
    <div className="-mx-4 -mt-8 flex min-h-[calc(100vh-8rem)] flex-col md:-mx-8">
      {/* Top toolbar — GHL-style */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-[#0c0c12]/95 px-4 py-3 backdrop-blur-xl">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-300/80">
            Funnel Studio
          </p>
          <h2 className="truncate text-sm font-semibold">
            {selectedPage?.headline ?? selectedPage?.slug ?? "Select a page"}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-white/10 p-0.5">
            {(
              [
                ["desktop", Monitor],
                ["tablet", Tablet],
                ["mobile", Smartphone],
              ] as const
            ).map(([device, Icon]) => (
              <Button
                key={device}
                type="button"
                size="icon-sm"
                variant={previewDevice === device ? "default" : "ghost"}
                className="size-8 rounded-md"
                onClick={() => setPreviewDevice(device)}
                aria-label={`${device} preview`}
              >
                <Icon className="size-4" />
              </Button>
            ))}
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-lg"
            disabled={pending}
            onClick={() => setAiOpen(true)}
          >
            <Sparkles className="mr-1.5 size-4" />
            AI Build
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-lg"
            disabled={pending || !editor}
            onClick={handleSave}
          >
            <Save className="mr-1.5 size-4" />
            Save
          </Button>

          {editor?.page.slug ? (
            <Link
              href={`/lp/${String(editor.page.slug)}`}
              target="_blank"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-xs font-medium hover:bg-white/[0.04]"
            >
              <Eye className="size-3.5" />
              Preview
            </Link>
          ) : null}

          <Button
            type="button"
            variant="gradient"
            size="sm"
            className="rounded-lg"
            disabled={pending || !editor}
            onClick={handlePublish}
          >
            Publish
          </Button>
        </div>
      </div>

      {message ? (
        <p className="shrink-0 border-b border-white/[0.06] bg-violet-500/5 px-4 py-2 text-xs text-muted-foreground">
          {message}
        </p>
      ) : null}

      {/* 3-column builder */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[240px_1fr_300px]">
        {/* Left — Pages / Layers / Templates */}
        <aside className="flex flex-col border-r border-white/[0.08] bg-[#0c0c12]/80">
          <Tabs value={leftTab} onValueChange={(v) => setLeftTab(v as LeftTab)} className="flex min-h-0 flex-1 flex-col">
            <TabsList className="mx-2 mt-2 grid w-auto grid-cols-3">
              <TabsTrigger value="pages" className="text-xs">
                Pages
              </TabsTrigger>
              <TabsTrigger value="layers" className="text-xs">
                <Layers className="mr-1 size-3" />
                Layers
              </TabsTrigger>
              <TabsTrigger value="templates" className="text-xs">
                <LayoutTemplate className="mr-1 size-3" />
                Templates
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pages" className="mt-0 flex-1 overflow-hidden px-2 pb-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mb-2 w-full rounded-lg"
                disabled={pending}
                onClick={() =>
                  createPage({
                    headline: "New Landing Page",
                    subheadline: "Edit headline and offer on canvas",
                    offer: "Describe your offer",
                    location: "Your city",
                    ctaText: "Get Started",
                  })
                }
              >
                <Plus className="mr-1.5 size-4" />
                New Page
              </Button>
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <div className="space-y-1">
                  {pages.length === 0 ? (
                    <p className="p-3 text-xs text-muted-foreground">
                      No pages yet. Create one or pick a template.
                    </p>
                  ) : (
                    pages.map((page) => (
                      <button
                        key={page.id}
                        type="button"
                        onClick={() => {
                          setEditor(null);
                          setSelectedPageId(page.id);
                          void loadEditor(page.id);
                        }}
                        className={cn(
                          "w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                          selectedPageId === page.id
                            ? "border-violet-500/40 bg-violet-500/10"
                            : "border-transparent hover:bg-white/[0.04]",
                        )}
                      >
                        <p className="truncate font-medium">{page.headline ?? page.slug}</p>
                        <p className="text-[10px] text-muted-foreground">
                          /lp/{page.slug} · {page.published ? "Published" : "Draft"}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="layers" className="mt-0 flex-1 overflow-hidden px-2 pb-2">
              {!editor ? (
                <p className="p-3 text-xs text-muted-foreground">Select a page to edit layers.</p>
              ) : (
                <>
                  <select
                    className="mb-2 w-full rounded-lg border border-white/10 bg-background px-2 py-1.5 text-xs"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        addSection(e.target.value as LandingSectionType);
                        e.target.value = "";
                      }
                    }}
                  >
                    <option value="">+ Add section</option>
                    {ADD_SECTION_TYPES.map((t) => (
                      <option key={t.type} value={t.type}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <ScrollArea className="h-[calc(100vh-16rem)]">
                    <div className="space-y-1">
                      {[...sections]
                        .sort((a, b) => a.order - b.order)
                        .map((section, idx, arr) => (
                          <div
                            key={section.id}
                            className={cn(
                              "flex items-center gap-1 rounded-lg border px-2 py-1.5",
                              selectedSectionId === section.id
                                ? "border-violet-500/40 bg-violet-500/10"
                                : "border-white/[0.06] bg-white/[0.02]",
                            )}
                          >
                            <button
                              type="button"
                              className="min-w-0 flex-1 truncate text-left text-xs font-medium"
                              onClick={() => {
                                setSelectedSectionId(section.id);
                                setRightTab("properties");
                              }}
                            >
                              {ADD_SECTION_TYPES.find((t) => t.type === section.type)?.label ??
                                section.type}
                            </button>
                            <Switch
                              checked={section.enabled}
                              onCheckedChange={(enabled) => updateSection(section.id, { enabled })}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="size-6"
                              disabled={idx === 0}
                              onClick={() => moveSection(section.id, "up")}
                              aria-label="Move up"
                            >
                              <ChevronUp className="size-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="size-6"
                              disabled={idx === arr.length - 1}
                              onClick={() => moveSection(section.id, "down")}
                              aria-label="Move down"
                            >
                              <ChevronDown className="size-3" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </>
              )}
            </TabsContent>

            <TabsContent value="templates" className="mt-0 flex-1 overflow-hidden px-2 pb-2">
              <ScrollArea className="h-[calc(100vh-14rem)]">
                <div className="space-y-2">
                  {FUNNEL_TEMPLATES.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      disabled={pending}
                      onClick={() => createFromTemplate(template)}
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 text-left transition-colors hover:border-violet-500/30 hover:bg-violet-500/5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{template.name}</p>
                        <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                          {template.conversionScore}% CVR
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-violet-300/70">{template.industry}</p>
                      <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">
                        {template.description}
                      </p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </aside>

        {/* Center — Visual canvas */}
        <main className="relative min-h-0 overflow-auto bg-[#08080d]">
          {loadingEditor ? (
            <div className="flex h-full min-h-[480px] items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading editor…
            </div>
          ) : editor && activeVersion ? (
            <FunnelPageCanvas
              page={editor.page}
              sections={sections}
              formFields={formFields}
              selectedSectionId={selectedSectionId}
              device={previewDevice}
              onSelectSection={(id) => {
                setSelectedSectionId(id);
                setRightTab("properties");
              }}
              onUpdateSection={updateSection}
            />
          ) : (
            <div className="flex h-full min-h-[480px] flex-col items-center justify-center gap-4 p-8 text-center">
              <LayoutTemplate className="size-10 text-violet-400/50" />
              <div>
                <p className="font-medium">Start building</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Create a new page, pick a template, or use AI to generate a funnel — then edit
                  visually on the canvas.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  variant="gradient"
                  className="rounded-xl"
                  disabled={pending}
                  onClick={() => setAiOpen(true)}
                >
                  <Sparkles className="mr-2 size-4" />
                  AI Build
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl"
                  disabled={pending}
                  onClick={() =>
                    createPage({
                      headline: "New Landing Page",
                      subheadline: "Your subheadline here",
                      offer: "Your offer description",
                      location: "Your city",
                      ctaText: "Get Started",
                    })
                  }
                >
                  <Plus className="mr-2 size-4" />
                  Blank Page
                </Button>
              </div>
            </div>
          )}
        </main>

        {/* Right — Properties */}
        <aside className="flex flex-col border-l border-white/[0.08] bg-[#0c0c12]/80">
          <Tabs
            value={rightTab}
            onValueChange={(v) => setRightTab(v as typeof rightTab)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <TabsList className="mx-2 mt-2 grid w-auto grid-cols-2">
              <TabsTrigger value="properties" className="text-xs">
                Properties
              </TabsTrigger>
              <TabsTrigger value="forms" className="text-xs">
                Forms
              </TabsTrigger>
            </TabsList>
            <TabsList className="mx-2 mt-1 grid w-auto grid-cols-2">
              <TabsTrigger value="versions" className="text-xs">
                A/B Tests
              </TabsTrigger>
              <TabsTrigger value="ai" className="text-xs">
                AI Optimize
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 px-3 pb-4">
              <TabsContent value="properties" className="mt-3 space-y-4">
                {!selectedSection ? (
                  <p className="text-xs text-muted-foreground">
                    Click a section on the canvas or in Layers to edit its properties.
                  </p>
                ) : (
                  <SectionProperties section={selectedSection} onUpdate={updateSection} />
                )}
              </TabsContent>

              <TabsContent value="forms" className="mt-3 space-y-3">
                {formFields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-white/[0.08] p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{field.label}</p>
                      <p className="text-[10px] text-muted-foreground">CRM: {field.crmField}</p>
                    </div>
                    <Switch
                      checked={field.required}
                      onCheckedChange={(required) => updateFormField(field.id, { required })}
                    />
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="versions" className="mt-3 space-y-3">
                <div className="flex flex-wrap gap-1">
                  {(["a", "b", "c"] as const).map((label) => (
                    <Button
                      key={label}
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={pending || !editor}
                      className="rounded-lg text-xs"
                      onClick={() => {
                        if (!editor || !activeVersion) return;
                        startTransition(async () => {
                          const result = await createVariantAction(
                            String(editor.page.id),
                            String(activeVersion.id),
                            label,
                            `Variant ${label.toUpperCase()}`,
                          );
                          if (result.ok) {
                            await loadEditor(String(editor.page.id));
                            setMessage(`Variant ${label.toUpperCase()} created.`);
                          } else setMessage(result.error);
                        });
                      }}
                    >
                      Variant {label.toUpperCase()}
                    </Button>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full rounded-lg"
                  disabled={!editor}
                  onClick={() => {
                    if (!editor) return;
                    startTransition(async () => {
                      const result = await suggestWinnerAction(String(editor.page.id));
                      setMessage(result.ok ? result.data.reason : result.error);
                      if (result.ok) await loadEditor(String(editor.page.id));
                    });
                  }}
                >
                  <Wand2 className="mr-2 size-4" />
                  Suggest winner
                </Button>
                {editor?.versions.map((v) => (
                  <div key={String(v.id)} className="rounded-lg border border-white/[0.08] p-2 text-xs">
                    <p className="font-medium">{String(v.name)}</p>
                    <p className="text-muted-foreground">
                      {String(v.version_label)} · {String(v.traffic_weight)}% traffic
                      {v.is_winner ? " · winner" : ""}
                    </p>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="ai" className="mt-3 space-y-3">
                {editor ? (
                  <>
                    <AiScore label="Headline" score={editor.aiScores.headlineScore} />
                    <AiScore label="CTA" score={editor.aiScores.ctaScore} />
                    <AiScore label="Form friction" score={editor.aiScores.formFrictionScore} />
                    <p className="text-xs">
                      Expected lift:{" "}
                      <strong className="text-violet-300">
                        +{editor.aiScores.expectedConversionLift}%
                      </strong>
                    </p>
                    <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                      {editor.aiScores.recommendations.map((rec) => (
                        <li key={rec}>{rec}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Open a page to see AI scores.</p>
                )}
              </TabsContent>
            </ScrollArea>

            <div className="border-t border-white/[0.08] p-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Image URL"
                  className="h-8 text-xs"
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" || !editor) return;
                    e.preventDefault();
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (!val) return;
                    startTransition(async () => {
                      const result = await addAssetAction({
                        landingPageId: String(editor.page.id),
                        assetType: "image",
                        fileUrl: val,
                        fileName: val.split("/").pop(),
                      });
                      if (result.ok) await loadEditor(String(editor.page.id));
                    });
                  }}
                />
                <Button type="button" variant="outline" size="icon-sm" className="size-8 shrink-0" aria-label="Add asset">
                  <Upload className="size-3.5" />
                </Button>
              </div>
            </div>
          </Tabs>
        </aside>
      </div>

      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="border-white/[0.08] bg-neutral-950">
          <DialogHeader>
            <DialogTitle>Build from business prompt</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="ai-prompt">Describe your business or niche</Label>
            <Textarea
              id="ai-prompt"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Build me a roofing lead generation website with landing pages, quote form, reviews, FAQs, booking, and Facebook lead funnel."
              className="min-h-[120px]"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAiOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button
                type="button"
                variant="gradient"
                className="rounded-xl"
                disabled={pending || aiPrompt.trim().length < 8}
                onClick={() => {
                  const prompt = aiPrompt.trim();
                  createPage({
                    headline: prompt.slice(0, 80) || "AI Generated Page",
                    subheadline: "AI-generated draft — customize on canvas",
                    offer: prompt.slice(0, 200),
                    location: "Your city",
                    ctaText: "Get Started",
                  });
                  setAiOpen(false);
                  setAiPrompt("");
                }}
              >
                Generate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SectionProperties({
  section,
  onUpdate,
}: {
  section: LandingSection;
  onUpdate: (id: string, patch: Partial<LandingSection>) => void;
}) {
  const label =
    ADD_SECTION_TYPES.find((t) => t.type === section.type)?.label ?? section.type;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{label}</p>
        <Switch
          checked={section.enabled}
          onCheckedChange={(enabled) => onUpdate(section.id, { enabled })}
        />
      </div>

      {section.type === "hero" ? (
        <>
          <Field label="Headline">
            <Input
              value={String(section.content.headline ?? "")}
              onChange={(e) =>
                onUpdate(section.id, {
                  content: { ...section.content, headline: e.target.value },
                })
              }
            />
          </Field>
          <Field label="Subheadline">
            <Textarea
              rows={2}
              value={String(section.content.subheadline ?? "")}
              onChange={(e) =>
                onUpdate(section.id, {
                  content: { ...section.content, subheadline: e.target.value },
                })
              }
            />
          </Field>
          <Field label="CTA button">
            <Input
              value={String(section.content.cta ?? "")}
              onChange={(e) =>
                onUpdate(section.id, {
                  content: { ...section.content, cta: e.target.value },
                })
              }
            />
          </Field>
        </>
      ) : null}

      {section.type === "offer" ? (
        <>
          <Field label="Title">
            <Input
              value={String(section.content.title ?? "")}
              onChange={(e) =>
                onUpdate(section.id, {
                  content: { ...section.content, title: e.target.value },
                })
              }
            />
          </Field>
          <Field label="Body">
            <Textarea
              rows={4}
              value={String(section.content.body ?? "")}
              onChange={(e) =>
                onUpdate(section.id, {
                  content: { ...section.content, body: e.target.value },
                })
              }
            />
          </Field>
        </>
      ) : null}

      {section.type === "benefits" ? (
        <Field label="Benefits (one per line)">
          <Textarea
            rows={5}
            value={((section.content.items as string[] | undefined) ?? []).join("\n")}
            onChange={(e) =>
              onUpdate(section.id, {
                content: {
                  ...section.content,
                  items: e.target.value.split("\n").filter(Boolean),
                },
              })
            }
          />
        </Field>
      ) : null}

      {section.type === "contact_form" ? (
        <Field label="Form title">
          <Input
            value={String(section.content.title ?? "")}
            onChange={(e) =>
              onUpdate(section.id, {
                content: { ...section.content, title: e.target.value },
              })
            }
          />
        </Field>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function AiScore({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span>{score}/100</span>
      </div>
      <div className="mt-1 h-1.5 rounded-full bg-white/10">
        <div
          className="h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function defaultContentForType(type: LandingSectionType): Record<string, unknown> {
  switch (type) {
    case "hero":
      return { headline: "New headline", subheadline: "Subheadline", cta: "Get Started" };
    case "offer":
      return { title: "Our Offer", body: "Describe your offer." };
    case "benefits":
      return { items: ["Benefit 1", "Benefit 2", "Benefit 3"] };
    case "testimonials":
      return { quote: "Great experience!", author: "Customer Name" };
    case "faq":
      return { items: [{ q: "Question?", a: "Answer." }] };
    case "contact_form":
      return { title: "Get in touch" };
    case "trust_badges":
      return { badges: ["Licensed", "Insured", "5-Star"] };
    default:
      return {};
  }
}
