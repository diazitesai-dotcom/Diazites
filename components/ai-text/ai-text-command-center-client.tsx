"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  Loader2,
  MessageSquare,
  Pause,
  Play,
  Plus,
  Send,
  Sparkles,
  Users,
} from "lucide-react";

import {
  createAiTextAgentAction,
  createSmsCampaignAction,
  generateAiTextSystemAction,
  sendSmsCampaignAction,
  sendTestSmsAction,
  updateAiTextAgentStatusAction,
} from "@/actions/ai-text.actions";
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
import type { AiTextAgentRow, AiTextDashboardStats, SmsCampaignRow } from "@/types/diazites-platform";
import { AI_TEXT_AGENT_PRESETS } from "@/types/diazites-platform";

type MessageRow = {
  id: string;
  direction: string;
  body: string;
  sent_at: string;
  conversations?: { channel: string } | null;
};

type Props = {
  agents: AiTextAgentRow[];
  stats: AiTextDashboardStats;
  campaigns: SmsCampaignRow[];
  recentMessages: MessageRow[];
};

export function AiTextCommandCenterClient({ agents, stats, campaigns, recentMessages }: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [testOpen, setTestOpen] = useState(false);
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [campaignBody, setCampaignBody] = useState("Hi {{name}}, thanks for connecting!");
  const [testPhone, setTestPhone] = useState("");
  const [testBody, setTestBody] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const statItems = [
    { label: "Active agents", value: stats.activeAgents, icon: MessageSquare },
    { label: "Sent today", value: stats.messagesSentToday, icon: Send },
    { label: "Active campaigns", value: stats.campaignsActive, icon: Users },
    { label: "Reply rate", value: `${stats.replyRate}%`, icon: MessageSquare },
    { label: "Sequences", value: stats.sequencesActive, icon: Play },
    { label: "Failed", value: stats.failedDeliveries, icon: MessageSquare },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <Button className="rounded-xl" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create AI text agent
        </Button>
        <Button variant="outline" className="rounded-xl border-white/10" onClick={() => setAiOpen(true)}>
          <Sparkles className="mr-2 h-4 w-4" />
          AI Text Auto-Builder
        </Button>
        <Button variant="outline" className="rounded-xl border-white/10" onClick={() => setCampaignOpen(true)}>
          <Send className="mr-2 h-4 w-4" />
          New SMS campaign
        </Button>
        <Button variant="outline" className="rounded-xl border-white/10" onClick={() => setTestOpen(true)}>
          Send test SMS
        </Button>
        <Link
          href={ROUTES.leadsOs}
          className={cn(buttonVariants({ variant: "outline" }), "rounded-xl border-white/10")}
        >
          CRM contacts
        </Link>
        <Link
          href={ROUTES.workflows}
          className={cn(buttonVariants({ variant: "outline" }), "rounded-xl border-white/10")}
        >
          Workflow triggers
        </Link>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

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

      <Tabs defaultValue="agents">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="agents">AI agents</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="sequences">Sequences</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-3">
          {agents.length === 0 ? (
            <Card className="border-white/[0.06]">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No text agents yet. Use a preset or AI builder to start.
              </CardContent>
            </Card>
          ) : (
            agents.map((agent) => (
              <Card key={agent.id} className="border-white/[0.06]">
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">{agent.name}</CardTitle>
                    <CardDescription>{agent.objective}</CardDescription>
                    <p className="mt-1 text-xs text-muted-foreground">Status: {agent.status}</p>
                  </div>
                  <div className="flex gap-2">
                    {agent.status !== "active" ? (
                      <Button
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await updateAiTextAgentStatusAction(agent.id, "active");
                            setMessage("Agent activated");
                          })
                        }
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await updateAiTextAgentStatusAction(agent.id, "paused");
                          })
                        }
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
          <div className="flex flex-wrap gap-2">
            {AI_TEXT_AGENT_PRESETS.map((p) => (
              <Button
                key={p.name}
                size="sm"
                variant="outline"
                className="border-white/10"
                disabled={pending}
                onClick={() => {
                  setName(p.name);
                  setObjective(p.objective);
                  setCreateOpen(true);
                }}
              >
                {p.name}
              </Button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card className="border-white/[0.06]">
            <CardHeader>
              <CardTitle>SMS campaigns</CardTitle>
              <CardDescription>Broadcast to CRM contacts via Twilio — logs sync to inbox & workflows.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {campaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground">No campaigns yet.</p>
              ) : (
                campaigns.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.06] px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium">{c.name}</span>
                      <span className="ml-2 text-muted-foreground">
                        {c.status} · sent {c.stats?.sent ?? 0}
                      </span>
                    </div>
                    {c.status === "draft" ? (
                      <Button
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            const res = await sendSmsCampaignAction(c.id);
                            setMessage(
                              res.success
                                ? `Sent ${res.data.sent} messages (${res.data.failed} failed)`
                                : res.error,
                            );
                          })
                        }
                      >
                        Send now
                      </Button>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inbox">
          <Card className="border-white/[0.06]">
            <CardHeader>
              <CardTitle>Recent messages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentMessages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No messages logged yet.</p>
              ) : (
                recentMessages.map((m) => (
                  <div key={m.id} className="rounded-lg border border-white/[0.06] px-3 py-2 text-sm">
                    <span className="text-xs text-muted-foreground">
                      {m.direction} · {new Date(m.sent_at).toLocaleString()}
                    </span>
                    <p className="mt-1">{m.body.slice(0, 160)}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sequences">
          <Card className="border-white/[0.06]">
            <CardHeader>
              <CardTitle>Drip sequences</CardTitle>
              <CardDescription>Multi-step SMS nurture — connect to workflows for triggers.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create sequences from{" "}
                <Link href={ROUTES.workflows} className="text-violet-400 hover:underline">
                  Workflows
                </Link>{" "}
                or duplicate a campaign into a sequence (coming soon).
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create AI text agent</DialogTitle>
            <DialogDescription>Automate SMS follow-up, reminders, and lead nurture.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Objective</Label>
              <Textarea value={objective} onChange={(e) => setObjective(e.target.value)} rows={3} />
            </div>
            <Button
              disabled={pending || !name.trim()}
              onClick={() =>
                startTransition(async () => {
                  const res = await createAiTextAgentAction({ name, objective });
                  setMessage(res.success ? "Agent created" : res.error);
                  if (res.success) setCreateOpen(false);
                })
              }
            >
              {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create agent
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Text Auto-Builder</DialogTitle>
            <DialogDescription>Describe your SMS system — AI generates scripts and follow-ups.</DialogDescription>
          </DialogHeader>
          <Textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} rows={4} placeholder="e.g. Recover missed leads with 3 follow-up texts over 5 days" />
          <Button
            disabled={pending || !aiPrompt.trim()}
            onClick={() =>
              startTransition(async () => {
                const res = await generateAiTextSystemAction(aiPrompt);
                setMessage(res.success ? `Created ${res.data.agentName}` : res.error);
                if (res.success) setAiOpen(false);
              })
            }
          >
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Generate with AI
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={campaignOpen} onOpenChange={setCampaignOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New SMS campaign</DialogTitle>
            <DialogDescription>Use {"{{name}}"} for personalization. Sends to all CRM contacts with phone numbers.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Campaign name</Label>
              <Input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea value={campaignBody} onChange={(e) => setCampaignBody(e.target.value)} rows={4} />
            </div>
            <Button
              disabled={pending || !campaignName.trim()}
              onClick={() =>
                startTransition(async () => {
                  const res = await createSmsCampaignAction({
                    name: campaignName,
                    messageBody: campaignBody,
                  });
                  setMessage(res.success ? "Campaign created — send from Campaigns tab" : res.error);
                  if (res.success) setCampaignOpen(false);
                })
              }
            >
              Save draft
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send test SMS</DialogTitle>
            <DialogDescription>Requires TWILIO_* env vars configured.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Phone (E.164)</Label>
              <Input value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="+15551234567" />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea value={testBody} onChange={(e) => setTestBody(e.target.value)} rows={3} />
            </div>
            <Button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await sendTestSmsAction({ phone: testPhone, body: testBody });
                  setMessage(res.success ? "Test sent" : res.error);
                })
              }
            >
              Send test
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
