"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, useTransition } from "react";
import {
  Copy,
  Eye,
  Files,
  Monitor,
  PanelLeft,
  Sparkles,
  Smartphone,
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_FORM_FIELDS,
  DEFAULT_LANDING_SECTIONS,
  type AiConversionScores,
  type LandingFormField,
  type LandingSection,
  type LandingSectionType,
} from "@/types/marketing-os";

type BuilderSection =
  | "pages"
  | "funnels"
  | "templates"
  | "assets"
  | "forms"
  | "versions"
  | "analytics"
  | "seo"
  | "settings";

const SECTION_TYPES: { type: LandingSectionType; label: string }[] = [
  { type: "hero", label: "Hero" },
  { type: "offer", label: "Offer" },
  { type: "benefits", label: "Benefits" },
  { type: "testimonials", label: "Testimonials" },
  { type: "faq", label: "FAQ" },
  { type: "video", label: "Video" },
  { type: "gallery", label: "Gallery" },
  { type: "before_after", label: "Before/After" },
  { type: "map", label: "Map" },
  { type: "pricing", label: "Pricing" },
  { type: "contact_form", label: "Contact form" },
  { type: "calendar", label: "Calendar" },
  { type: "trust_badges", label: "Trust badges" },
];

type LandingPageListItem = {
  id: string;
  slug: string;
  headline: string | null;
  published: boolean;
  status: string | null;
  versions?: Array<{ id: string; version_label: string; name: string }>;
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

export function FunnelBuilderClient({ businessId, initialPages }: FunnelBuilderClientProps) {
  const [pages, setPages] = useState(initialPages);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(initialPages[0]?.id ?? null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [message, setMessage] = useState("");
  const [activeSection, setActiveSection] = useState<BuilderSection>("pages");
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

  const loadEditor = useCallback(async (pageId: string) => {
    const result = await loadFunnelEditorAction(pageId);
    if (result.ok) {
      setEditor(result.data as EditorState);
      setSelectedPageId(pageId);
      setActiveSection("pages");
    } else {
      setMessage(result.error);
    }
  }, []);

  function updateSection(sectionId: string, patch: Partial<LandingSection>) {
    if (!editor || !activeVersion) return;
    const nextSections = sections.map((s) => (s.id === sectionId ? { ...s, ...patch } : s));
    setEditor({
      ...editor,
      versions: editor.versions.map((v) =>
        v.id === activeVersion.id ? { ...v, sections: nextSections } : v,
      ),
    });
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

  return (
    <div className="space-y-6">
      <FunnelHeader
        pending={pending}
        onCreate={() => {
          startTransition(async () => {
            const result = await createLandingPageAction({
              headline: "Fast estimates in 24 hours",
              subheadline: "Licensed, insured, and local",
              offer: "Free inspection + same-day quote",
              location: "Your city",
              ctaText: "Get my quote",
            });
            if (result.ok) {
              setPages((prev) => [
                {
                  id: result.data.landingPageId,
                  slug: result.data.slug,
                  headline: "Fast estimates in 24 hours",
                  published: false,
                  status: "draft",
                },
                ...prev,
              ]);
              await loadEditor(result.data.landingPageId);
              setMessage("Landing page created.");
            } else setMessage(result.error);
          });
        }}
        onAiBuild={() => setAiOpen(true)}
      />

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <div className="grid gap-6 xl:grid-cols-[260px_1fr_420px]">
        <Card className="border-white/[0.06]">
          <CardHeader className="space-y-1">
            <CardTitle className="text-sm">Workspace</CardTitle>
            <CardDescription>Pages, funnels, templates, assets, forms, and analytics.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <nav className="space-y-1">
              <LeftNavButton
                icon={Files}
                label="Pages"
                description="Website & landing pages"
                active={activeSection === "pages"}
                onClick={() => setActiveSection("pages")}
              />
              <LeftNavButton
                icon={PanelLeft}
                label="Funnels"
                description="Visual funnel mapping"
                active={activeSection === "funnels"}
                onClick={() => setActiveSection("funnels")}
              />
              <LeftNavButton
                icon={Sparkles}
                label="Templates"
                description="Clone & customize"
                active={activeSection === "templates"}
                onClick={() => setActiveSection("templates")}
              />
              <LeftNavButton
                icon={Upload}
                label="Assets"
                description="Images & brand kit"
                active={activeSection === "assets"}
                onClick={() => setActiveSection("assets")}
              />
              <LeftNavButton
                icon={Wand2}
                label="Forms"
                description="Lead forms & surveys"
                active={activeSection === "forms"}
                onClick={() => setActiveSection("forms")}
              />
              <LeftNavButton
                icon={Copy}
                label="Versions"
                description="A/B tests & rollback"
                active={activeSection === "versions"}
                onClick={() => setActiveSection("versions")}
              />
              <LeftNavButton
                icon={Eye}
                label="Analytics"
                description="CVR & performance"
                active={activeSection === "analytics"}
                onClick={() => setActiveSection("analytics")}
              />
            </nav>

            {activeSection === "pages" ? (
              <ScrollArea className="h-[380px] pr-2">
                <div className="space-y-2">
                  {pages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No pages yet. Create one to start.</p>
                  ) : (
                    pages.map((page) => (
                      <button
                        key={page.id}
                        type="button"
                        onClick={() => void loadEditor(page.id)}
                        className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                          selectedPageId === page.id
                            ? "border-violet-500/40 bg-violet-500/10"
                            : "border-border/60 hover:bg-white/[0.04]"
                        }`}
                      >
                        <p className="font-medium">{page.headline ?? page.slug}</p>
                        <p className="text-xs text-muted-foreground">
                          {page.published ? "Published" : "Draft"}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            ) : (
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-muted-foreground">
                Coming next: {activeSection.replace(/^\w/, (c) => c.toUpperCase())} builder.
              </div>
            )}
          </CardContent>
        </Card>

        {activeSection === "pages" ? (
          editor && activeVersion ? (
            <EditorPanel
              editor={editor}
              sections={sections}
              formFields={formFields}
              pending={pending}
              onUpdateSection={updateSection}
              onUpdateFormField={updateFormField}
              onSave={() => {
                startTransition(async () => {
                  const result = await saveLandingPageVersionAction(String(activeVersion.id), {
                    sections,
                    formFields,
                  });
                  setMessage(result.ok ? "Saved." : result.error);
                });
              }}
              onPublish={() => {
                startTransition(async () => {
                  const result = await publishLandingPageAction(
                    String(editor.page.id),
                    String(activeVersion.id),
                  );
                  if (result.ok) {
                    setMessage(`Published at /lp/${result.data.slug}`);
                  } else setMessage(result.error);
                });
              }}
              onCreateVariant={(label) => {
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
              onSuggestWinner={() => {
                startTransition(async () => {
                  const result = await suggestWinnerAction(String(editor.page.id));
                  setMessage(result.ok ? result.data.reason : result.error);
                  if (result.ok) await loadEditor(String(editor.page.id));
                });
              }}
              onAddAsset={(url) => {
                startTransition(async () => {
                  const result = await addAssetAction({
                    landingPageId: String(editor.page.id),
                    assetType: "image",
                    fileUrl: url,
                    fileName: url.split("/").pop(),
                  });
                  if (result.ok) await loadEditor(String(editor.page.id));
                });
              }}
            />
          ) : (
            <Card className="border-white/[0.06]">
              <CardContent className="py-16 text-center text-muted-foreground">
                Select or create a page to open the editor.
              </CardContent>
            </Card>
          )
        ) : (
          <Card className="border-white/[0.06]">
            <CardHeader>
              <CardTitle className="text-lg">Builder canvas</CardTitle>
              <CardDescription>Drag-and-drop canvas, layers, and responsive controls.</CardDescription>
            </CardHeader>
            <CardContent className="py-16 text-center text-muted-foreground">
              {activeSection === "funnels"
                ? "Funnel map builder is next."
                : activeSection === "templates"
                  ? "Template library and marketplace is next."
                  : "Select Pages to edit a live landing page."}
            </CardContent>
          </Card>
        )}

        <Card className="border-white/[0.06]">
          {activeSection === "pages" ? (
            editor && activeVersion ? (
              <PreviewPanel
                editor={editor}
                sections={sections}
                formFields={formFields}
                device={previewDevice}
                onDeviceChange={setPreviewDevice}
                businessId={businessId}
              />
            ) : (
              <CardContent className="py-16 text-center text-muted-foreground">
                Preview opens when a page is selected.
              </CardContent>
            )
          ) : (
            <CardContent className="py-16 text-center text-muted-foreground">
              Properties + AI tools panel (coming next).
            </CardContent>
          )}
        </Card>
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
              placeholder='Build me a roofing lead generation website with landing pages, quote form, reviews, FAQs, booking, and Facebook lead funnel.'
              className="min-h-[120px]"
            />
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAiOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button
                type="button"
                variant="gradient"
                className="rounded-xl"
                disabled={pending || aiPrompt.trim().length < 8}
                onClick={() => {
                  startTransition(async () => {
                    // MVP: create a small starter set of pages based on the prompt.
                    // (Full AI template engine + structured site maps come next.)
                    const base = aiPrompt.trim();
                    const headline = base.slice(0, 60);
                    const result = await createLandingPageAction({
                      headline: headline.length ? headline : "New website",
                      subheadline: "Generated draft — customize sections, forms, and offers",
                      offer: "Launch-ready conversion system",
                      location: "Your city",
                      ctaText: "Get started",
                    });
                    if (result.ok) {
                      setPages((prev) => [
                        {
                          id: result.data.landingPageId,
                          slug: result.data.slug,
                          headline: headline.length ? headline : "New website",
                          published: false,
                          status: "draft",
                        },
                        ...prev,
                      ]);
                      await loadEditor(result.data.landingPageId);
                      setMessage("AI draft created. Next: templates + multi-page site maps.");
                      setAiOpen(false);
                      setAiPrompt("");
                    } else {
                      setMessage(result.error);
                    }
                  });
                }}
              >
                Generate draft
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FunnelHeader({
  pending,
  onCreate,
  onAiBuild,
}: {
  pending: boolean;
  onCreate: () => void;
  onAiBuild: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Funnel Builder</p>
        <h2 className="text-lg font-semibold">Landing page editor</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button disabled={pending} onClick={onAiBuild} variant="secondary" className="rounded-xl">
          <Sparkles className="mr-2 size-4" />
          AI build
        </Button>
        <Button disabled={pending} onClick={onCreate} variant="gradient" className="rounded-xl">
          New landing page
        </Button>
      </div>
    </div>
  );
}

function LeftNavButton({
  icon: Icon,
  label,
  description,
  active,
  onClick,
}: {
  icon: typeof Files;
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full rounded-xl border px-3 py-2 text-left transition-colors
        ${active ? "border-violet-500/40 bg-violet-500/10" : "border-border/60 hover:bg-white/[0.04]"}
      `}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex size-8 items-center justify-center rounded-lg bg-white/[0.04]">
          <Icon className="size-4 text-muted-foreground" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </button>
  );
}

function EditorPanel(props: {
  editor: EditorState;
  sections: LandingSection[];
  formFields: LandingFormField[];
  pending: boolean;
  onUpdateSection: (id: string, patch: Partial<LandingSection>) => void;
  onUpdateFormField: (id: string, patch: Partial<LandingFormField>) => void;
  onSave: () => void;
  onPublish: () => void;
  onCreateVariant: (label: "a" | "b" | "c") => void;
  onSuggestWinner: () => void;
  onAddAsset: (url: string) => void;
}) {
  const { editor, sections, formFields, pending } = props;
  const ai = editor.aiScores;

  return (
    <Card className="border-white/[0.06]">
      <CardHeader>
        <CardTitle className="text-lg">Editor</CardTitle>
        <CardDescription>Sections, form fields, versions, and AI conversion review.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="content">
          <TabsList className="mb-4">
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="forms">Forms</TabsTrigger>
            <TabsTrigger value="versions">A/B</TabsTrigger>
            <TabsTrigger value="ai">AI review</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            {sections.map((section) => (
              <div key={section.id} className="rounded-xl border border-border/60 p-3">
                <SectionHeader section={section} onUpdate={props.onUpdateSection} />
                {section.type === "hero" ? (
                  <div className="mt-3 space-y-2">
                    <Input
                      value={String(section.content.headline ?? "")}
                      onChange={(e) =>
                        props.onUpdateSection(section.id, {
                          content: { ...section.content, headline: e.target.value },
                        })
                      }
                      placeholder="Headline"
                    />
                    <Input
                      value={String(section.content.subheadline ?? "")}
                      onChange={(e) =>
                        props.onUpdateSection(section.id, {
                          content: { ...section.content, subheadline: e.target.value },
                        })
                      }
                      placeholder="Subheadline"
                    />
                    <Input
                      value={String(section.content.cta ?? "")}
                      onChange={(e) =>
                        props.onUpdateSection(section.id, {
                          content: { ...section.content, cta: e.target.value },
                        })
                      }
                      placeholder="CTA"
                    />
                  </div>
                ) : null}
                {section.type === "offer" ? (
                  <Textarea
                    className="mt-3"
                    value={String(section.content.body ?? "")}
                    onChange={(e) =>
                      props.onUpdateSection(section.id, {
                        content: { ...section.content, body: e.target.value },
                      })
                    }
                    placeholder="Offer copy"
                  />
                ) : null}
              </div>
            ))}

            <div className="flex gap-2">
              <Input
                id="asset-url"
                placeholder="Image/video URL"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val) props.onAddAsset(val);
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" aria-label="Upload asset">
                <Upload className="size-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="forms" className="space-y-3">
            {formFields.map((field) => (
              <div key={field.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{field.label}</p>
                  <p className="text-xs text-muted-foreground">CRM: {field.crmField}</p>
                </div>
                <Switch
                  checked={field.required}
                  onCheckedChange={(checked) =>
                    props.onUpdateFormField(field.id, { required: checked })
                  }
                />
              </div>
            ))}
          </TabsContent>

          <TabsContent value="versions" className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(["a", "b", "c"] as const).map((label) => (
                <Button
                  key={label}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() => props.onCreateVariant(label)}
                >
                  Generate variant {label.toUpperCase()}
                </Button>
              ))}
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={props.onSuggestWinner}>
              <Wand2 className="mr-2 size-4" /> Suggest A/B winner
            </Button>
            <div className="space-y-2">
              {editor.versions.map((v) => (
                <div key={String(v.id)} className="rounded-lg border p-2 text-sm">
                  <p className="font-medium">{String(v.name)}</p>
                  <p className="text-xs text-muted-foreground">
                    {String(v.version_label)} · traffic {String(v.traffic_weight)}%
                    {v.is_winner ? " · winner" : ""}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-3">
            <AiScore label="Headline" score={ai.headlineScore} />
            <AiScore label="CTA" score={ai.ctaScore} />
            <AiScore label="Form friction (higher = better)" score={ai.formFrictionScore} />
            <p className="text-sm">
              Expected conversion lift: <strong>+{ai.expectedConversionLift}%</strong>
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {ai.recommendations.map((rec) => (
                <li key={rec}>{rec}</li>
              ))}
            </ul>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button disabled={pending} onClick={props.onSave} variant="outline" className="rounded-xl">
            Save draft
          </Button>
          <Button disabled={pending} onClick={props.onPublish} variant="gradient" className="rounded-xl">
            Publish
          </Button>
          {editor.page.slug ? (
            <Link
              href={`/lp/${String(editor.page.slug)}`}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm"
            >
              <Eye className="size-4" /> Preview
            </Link>
          ) : null}
          <Button type="button" variant="ghost" size="sm">
            <Copy className="mr-2 size-4" /> Clone
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionHeader({
  section,
  onUpdate,
}: {
  section: LandingSection;
  onUpdate: (id: string, patch: Partial<LandingSection>) => void;
}) {
  const label = SECTION_TYPES.find((t) => t.type === section.type)?.label ?? section.type;
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium">{label}</p>
      <Switch
        checked={section.enabled}
        onCheckedChange={(enabled) => onUpdate(section.id, { enabled })}
      />
    </div>
  );
}

function AiScore({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>{score}/100</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-muted">
        <AiScoreFill score={score} />
      </div>
    </div>
  );
}

function AiScoreFill({ score }: { score: number }) {
  return (
    <div
      className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
      style={{ width: `${score}%` }}
    />
  );
}

function PreviewPanel({
  editor,
  sections,
  formFields,
  device,
  onDeviceChange,
  businessId,
}: {
  editor: EditorState;
  sections: LandingSection[];
  formFields: LandingFormField[];
  device: "desktop" | "tablet" | "mobile";
  onDeviceChange: (d: "desktop" | "tablet" | "mobile") => void;
  businessId: string;
}) {
  const hero = sections.find((s) => s.type === "hero" && s.enabled);
  const width =
    device === "mobile" ? "max-w-sm" : device === "tablet" ? "max-w-xl" : "max-w-3xl";

  return (
    <Card className="border-white/[0.06]">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Preview</CardTitle>
          <CardDescription>Desktop, tablet, and mobile layouts.</CardDescription>
        </div>
        <div className="flex gap-1">
          <Button
            type="button"
            size="icon"
            variant={device === "desktop" ? "default" : "ghost"}
            onClick={() => onDeviceChange("desktop")}
            aria-label="Desktop preview"
          >
            <Monitor className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant={device === "tablet" ? "default" : "ghost"}
            onClick={() => onDeviceChange("tablet")}
            aria-label="Tablet preview"
          >
            <Tablet className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant={device === "mobile" ? "default" : "ghost"}
            onClick={() => onDeviceChange("mobile")}
            aria-label="Mobile preview"
          >
            <Smartphone className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`mx-auto ${width} rounded-2xl border border-white/10 p-6`}>
          <h2 className="text-2xl font-semibold">{String(hero?.content?.headline ?? editor.page.headline ?? "")}</h2>
          <p className="mt-2 text-muted-foreground">
            {String(hero?.content?.subheadline ?? editor.page.subheadline ?? "")}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">Serving {String(editor.page.location ?? "")}</p>
          <div className="mt-6 space-y-2">
            {formFields.filter((f) => f.required).map((f) => (
              <Input key={f.id} placeholder={f.label} disabled />
            ))}
            <Button variant="gradient" className="w-full rounded-xl" disabled>
              {String(hero?.content?.cta ?? editor.page.cta_text ?? "Submit")}
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Submissions create leads in CRM for workspace {businessId.slice(0, 8)}…
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
