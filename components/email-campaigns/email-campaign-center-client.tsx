"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  BarChart3,
  Loader2,
  Mail,
  Plus,
  Send,
  Sparkles,
  Users,
} from "lucide-react";

import {
  createEmailAudienceAction,
  createEmailCampaignAction,
  createEmailTemplateAction,
  generateEmailWithAiAction,
  sendEmailCampaignAction,
  syncEmailAudienceAction,
} from "@/actions/email-campaign.actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/lib/navigation/platform-nav";
import { cn } from "@/lib/utils";
import type {
  EmailAudienceRow,
  EmailCampaignDashboardStats,
  EmailCampaignRow,
  EmailTemplateRow,
} from "@/types/diazites-platform";
import { EMAIL_CAMPAIGN_FEATURES } from "@/types/diazites-platform";

type CampaignWithAudience = EmailCampaignRow & {
  email_audiences?: { name: string } | null;
};

type Props = {
  stats: EmailCampaignDashboardStats;
  audiences: EmailAudienceRow[];
  templates: EmailTemplateRow[];
  campaigns: CampaignWithAudience[];
};

export function EmailCampaignCenterClient({ stats, audiences, templates, campaigns }: Props) {
  const [audienceOpen, setAudienceOpen] = useState(false);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [audienceName, setAudienceName] = useState("Main list");
  const [campaignName, setCampaignName] = useState("");
  const [subject, setSubject] = useState("");
  const [htmlBody, setHtmlBody] = useState("<p>Hello {{name}},</p><p>Your message here.</p>");
  const [plainBody, setPlainBody] = useState("");
  const [selectedAudience, setSelectedAudience] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const statItems = [
    { label: "Subscribers", value: stats.totalSubscribers, icon: Users },
    { label: "Campaigns", value: stats.totalCampaigns, icon: Mail },
    { label: "Drafts", value: stats.drafts, icon: Mail },
    { label: "Sent", value: stats.sent, icon: Send },
    { label: "Open rate", value: `${stats.avgOpenRate}%`, icon: BarChart3 },
    { label: "Click rate", value: `${stats.avgClickRate}%`, icon: BarChart3 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <Button className="rounded-xl" onClick={() => setAudienceOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create audience
        </Button>
        <Button variant="outline" className="rounded-xl border-white/10" onClick={() => setCampaignOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New campaign
        </Button>
        <Button variant="outline" className="rounded-xl border-white/10" onClick={() => setAiOpen(true)}>
          <Sparkles className="mr-2 h-4 w-4" />
          AI email builder
        </Button>
        <Link
          href={ROUTES.leadsOs}
          className={cn(buttonVariants({ variant: "outline" }), "rounded-xl border-white/10")}
        >
          Import contacts
        </Link>
        <Link
          href={ROUTES.workflows}
          className={cn(buttonVariants({ variant: "outline" }), "rounded-xl border-white/10")}
        >
          Automation triggers
        </Link>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <Card className="border-violet-500/20 bg-violet-500/5">
        <CardHeader>
          <CardTitle className="text-base">Mailchimp-class toolkit</CardTitle>
          <CardDescription>Native email marketing — audiences, templates, campaigns, automations, and CRM sync.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {EMAIL_CAMPAIGN_FEATURES.map((f) => (
            <span key={f} className="rounded-full bg-white/5 px-3 py-1 text-xs text-muted-foreground">
              {f}
            </span>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statItems.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border-white/[0.06] bg-white/[0.02]">
            <CardHeader className="pb-1">
              <CardDescription className="flex items-center gap-1 text-xs">
                <Icon className="h-3 w-3" />
                {label}
              </CardDescription>
              <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="audiences">Audiences</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="automations">Automations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <Card className="border-white/[0.06]">
            <CardHeader>
              <CardTitle>Email campaigns</CardTitle>
              <CardDescription>Design, schedule, and send — powered by Resend with open/click tracking hooks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {campaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground">Create an audience, then launch your first campaign.</p>
              ) : (
                campaigns.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.06] px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium">{c.name}</span>
                      <span className="ml-2 text-muted-foreground">
                        {c.status} · {c.email_audiences?.name ?? "No audience"} · sent {c.stats?.sent ?? 0}
                      </span>
                      <p className="text-xs text-muted-foreground">{c.subject}</p>
                    </div>
                    {c.status === "draft" && c.audience_id ? (
                      <Button
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            const res = await sendEmailCampaignAction(c.id);
                            setMessage(
                              res.success
                                ? `Delivered ${res.data.sent} (${res.data.failed} failed)`
                                : res.error,
                            );
                          })
                        }
                      >
                        <Send className="mr-1 h-3 w-3" />
                        Send
                      </Button>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audiences">
          <Card className="border-white/[0.06]">
            <CardHeader>
              <CardTitle>Audiences & segments</CardTitle>
              <CardDescription>Sync subscribers from CRM contacts with email addresses.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {audiences.length === 0 ? (
                <p className="text-sm text-muted-foreground">No audiences yet.</p>
              ) : (
                audiences.map((a) => (
                  <div
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.06] px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium">{a.name}</span>
                      <span className="ml-2 text-muted-foreground">{a.contact_count} subscribers</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          const res = await syncEmailAudienceAction(a.id);
                          setMessage(res.success ? `Synced ${res.data.count} contacts` : res.error);
                        })
                      }
                    >
                      Sync CRM
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card className="border-white/[0.06]">
            <CardHeader>
              <CardTitle>Email templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {templates.length === 0 ? (
                <p className="text-sm text-muted-foreground">Use AI builder or save from a campaign.</p>
              ) : (
                templates.map((t) => (
                  <div key={t.id} className="rounded-lg border border-white/[0.06] px-3 py-2 text-sm">
                    <span className="font-medium">{t.name}</span>
                    <span className="ml-2 text-muted-foreground">{t.subject}</span>
                    {t.is_ai_generated ? (
                      <span className="ml-2 text-xs text-violet-400">AI</span>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automations">
          <Card className="border-white/[0.06]">
            <CardHeader>
              <CardTitle>Email automations</CardTitle>
              <CardDescription>Welcome series, abandoned cart, win-back — trigger from workflows & CRM events.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {stats.automationsActive} active automations. Build drip flows in{" "}
                <Link href={ROUTES.workflows} className="text-violet-400 hover:underline">
                  Workflows
                </Link>{" "}
                with email send steps.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="border-white/[0.06]">
            <CardHeader>
              <CardTitle>Campaign analytics</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-white/[0.06] p-4">
                <p className="text-xs text-muted-foreground">Avg open rate</p>
                <p className="text-2xl font-semibold">{stats.avgOpenRate}%</p>
              </div>
              <div className="rounded-lg border border-white/[0.06] p-4">
                <p className="text-xs text-muted-foreground">Avg click rate</p>
                <p className="text-2xl font-semibold">{stats.avgClickRate}%</p>
              </div>
              <div className="rounded-lg border border-white/[0.06] p-4">
                <p className="text-xs text-muted-foreground">Scheduled</p>
                <p className="text-2xl font-semibold">{stats.scheduled}</p>
              </div>
              <div className="rounded-lg border border-white/[0.06] p-4">
                <p className="text-xs text-muted-foreground">Total sent campaigns</p>
                <p className="text-2xl font-semibold">{stats.sent}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={audienceOpen} onOpenChange={setAudienceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create audience</DialogTitle>
            <DialogDescription>Automatically imports contacts with emails from CRM.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Name</Label>
              <Input value={audienceName} onChange={(e) => setAudienceName(e.target.value)} />
            </div>
            <Button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await createEmailAudienceAction({
                    name: audienceName,
                    syncFromCrm: true,
                  });
                  setMessage(
                    res.success
                      ? `Audience created with ${res.data.memberCount} members`
                      : res.error,
                  );
                  if (res.success) {
                    setSelectedAudience(res.data.id);
                    setAudienceOpen(false);
                  }
                })
              }
            >
              Create & sync CRM
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>AI email builder</DialogTitle>
            <DialogDescription>Generate subject, preview text, and HTML like top ESPs.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            rows={4}
            placeholder="e.g. Monthly newsletter announcing spring roofing promo with 15% off"
          />
          <Button
            disabled={pending || !aiPrompt.trim()}
            onClick={() =>
              startTransition(async () => {
                const res = await generateEmailWithAiAction(aiPrompt);
                if (res.success) {
                  setSubject(res.data.subject);
                  setHtmlBody(res.data.htmlBody);
                  setPlainBody(res.data.plainTextBody);
                  setCampaignName(res.data.subject.slice(0, 40));
                  setMessage("AI content ready — finish in New campaign");
                  setAiOpen(false);
                  setCampaignOpen(true);
                } else {
                  setMessage(res.error);
                }
              })
            }
          >
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Generate
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={campaignOpen} onOpenChange={setCampaignOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New email campaign</DialogTitle>
            <DialogDescription>Select audience, edit content, send via Resend.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Campaign name</Label>
              <Input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} />
            </div>
            <div>
              <Label>Audience</Label>
              <select
                className="w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm"
                value={selectedAudience}
                onChange={(e) => setSelectedAudience(e.target.value)}
              >
                <option value="">Select audience</option>
                {audiences.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.contact_count})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Subject</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div>
              <Label>HTML body</Label>
              <Textarea value={htmlBody} onChange={(e) => setHtmlBody(e.target.value)} rows={8} className="font-mono text-xs" />
            </div>
            <div>
              <Label>Plain text (optional)</Label>
              <Textarea value={plainBody} onChange={(e) => setPlainBody(e.target.value)} rows={3} />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={pending || !subject.trim()}
                onClick={() =>
                  startTransition(async () => {
                    const res = await createEmailTemplateAction({
                      name: campaignName || subject,
                      subject,
                      htmlBody,
                      plainTextBody: plainBody,
                      previewText: subject,
                    });
                    setMessage(res.success ? "Template saved" : res.error);
                  })
                }
              >
                Save as template
              </Button>
              <Button
                disabled={pending || !campaignName.trim() || !selectedAudience}
                onClick={() =>
                  startTransition(async () => {
                    const res = await createEmailCampaignAction({
                      name: campaignName,
                      subject,
                      htmlBody,
                      plainTextBody: plainBody,
                      audienceId: selectedAudience,
                    });
                    setMessage(res.success ? "Campaign draft saved — click Send in list" : res.error);
                    if (res.success) setCampaignOpen(false);
                  })
                }
              >
                Save campaign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
