"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  Loader2,
  Mic,
  Pause,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Play,
  Plus,
  Sparkles,
} from "lucide-react";

import {
  createAiCallingAgentAction,
  generateAiCallingSystemAction,
  updateAiCallingAgentStatusAction,
} from "@/actions/ai-calls.actions";
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
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/lib/navigation/platform-nav";
import { cn } from "@/lib/utils";
import type { AiCallDashboardStats, AiCallingAgentRow } from "@/types/diazites-platform";

type CallRow = {
  id: string;
  direction: string;
  status: string;
  outcome: string | null;
  duration_seconds: number | null;
  created_at: string;
  ai_calling_agents?: { name: string } | null;
};

type AiCallCommandCenterClientProps = {
  agents: AiCallingAgentRow[];
  stats: AiCallDashboardStats;
  recentCalls: CallRow[];
};

const AGENT_PRESETS = [
  { name: "Sales Caller", objective: "Qualify leads and move them through the sales pipeline" },
  { name: "Appointment Setter", objective: "Book appointments and send confirmations" },
  { name: "Missed Call Recovery", objective: "Call back missed leads within 5 minutes" },
  { name: "Lead Qualification", objective: "Ask qualification questions and score leads" },
];

export function AiCallCommandCenterClient({
  agents,
  stats,
  recentCalls,
}: AiCallCommandCenterClientProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const statItems = [
    { label: "Active AI agents", value: stats.activeAgents, icon: Mic },
    { label: "Calls today", value: stats.callsToday, icon: Phone },
    { label: "Outbound", value: stats.outbound, icon: PhoneOutgoing },
    { label: "Inbound", value: stats.inbound, icon: PhoneIncoming },
    { label: "Answer rate", value: `${stats.answerRate}%`, icon: Phone },
    { label: "Appointments booked", value: stats.appointmentsBooked, icon: Phone },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <Button className="rounded-xl" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create AI agent
        </Button>
        <Button variant="outline" className="rounded-xl border-white/10" onClick={() => setAiOpen(true)}>
          <Sparkles className="mr-2 h-4 w-4" />
          AI Call Auto-Builder
        </Button>
        <Link
          href={ROUTES.leadsOs}
          className={cn(buttonVariants({ variant: "outline" }), "rounded-xl border-white/10")}
        >
          Import leads / CRM lists
        </Link>
        <Link
          href={ROUTES.workflows}
          className={cn(buttonVariants({ variant: "outline" }), "rounded-xl border-white/10")}
        >
          View workflow triggers
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle>AI calling agents</CardTitle>
            <CardDescription>
              Native voice agents connected to CRM, pipelines, workflows, and tasks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {agents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No agents yet. Create one or use AI Call Auto-Builder after onboarding.
              </p>
            ) : (
              agents.map((agent) => (
                <div
                  key={agent.id}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{agent.name}</p>
                      <p className="text-xs text-muted-foreground">{agent.objective}</p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-xs capitalize",
                        agent.status === "active"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : "border-slate-500/30 bg-slate-500/10 text-slate-300",
                      )}
                    >
                      {agent.status}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {agent.status !== "active" ? (
                      <Button
                        size="sm"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await updateAiCallingAgentStatusAction(agent.id, "active");
                          })
                        }
                      >
                        <Play className="mr-1 h-3 w-3" />
                        Activate
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await updateAiCallingAgentStatusAction(agent.id, "paused");
                          })
                        }
                      >
                        <Pause className="mr-1 h-3 w-3" />
                        Pause
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-white/[0.06]">
          <CardHeader>
            <CardTitle>Call logs</CardTitle>
            <CardDescription>Recordings, transcripts, and outcomes (native Diazites).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentCalls.length === 0 ? (
              <p className="text-sm text-muted-foreground">No calls logged yet.</p>
            ) : (
              recentCalls.map((call) => (
                <div
                  key={call.id}
                  className="flex justify-between rounded-lg border border-white/[0.06] px-3 py-2 text-sm"
                >
                  <span>
                    {call.ai_calling_agents?.name ?? "Agent"} · {call.direction}
                  </span>
                  <span className="text-muted-foreground">{call.status}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/[0.06]">
        <CardHeader>
          <CardTitle>Quick-start agent presets</CardTitle>
          <CardDescription>Clone a preset, then customize voice, script, and pipeline rules.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {AGENT_PRESETS.map((preset) => (
            <div
              key={preset.name}
              className="rounded-xl border border-white/[0.06] p-4"
            >
              <p className="font-medium">{preset.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{preset.objective}</p>
              <Button
                size="sm"
                className="mt-3 rounded-lg"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const res = await createAiCallingAgentAction(preset);
                    setMessage(res.success ? `Created ${preset.name}` : res.error);
                  })
                }
              >
                Create agent
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="border-white/10 bg-zinc-950">
          <DialogHeader>
            <DialogTitle>Create AI calling agent</DialogTitle>
            <DialogDescription>Configure objective, voice, and CRM actions in Diazites.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="border-white/10" />
            </div>
            <div>
              <Label>Business objective</Label>
              <Textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="border-white/10"
                rows={3}
              />
            </div>
            <Button
              className="w-full rounded-xl"
              disabled={pending || !name.trim() || !objective.trim()}
              onClick={() =>
                startTransition(async () => {
                  const res = await createAiCallingAgentAction({ name, objective });
                  if (res.success) {
                    setCreateOpen(false);
                    setName("");
                    setObjective("");
                  }
                  setMessage(res.success ? "Agent created" : res.error);
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
        <DialogContent className="border-white/10 bg-zinc-950 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>What should your AI calling system accomplish?</DialogTitle>
            <DialogDescription>
              Diazites generates agents, scripts, qualification logic, and follow-up workflow hooks.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="I want AI to call new leads, qualify them, book appointments, and trigger SMS follow-ups..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            rows={5}
            className="border-white/10"
          />
          <Button
            className="rounded-xl"
            disabled={pending || !aiPrompt.trim()}
            onClick={() =>
              startTransition(async () => {
                const res = await generateAiCallingSystemAction(aiPrompt);
                setMessage(
                  res.success
                    ? `Created agent "${res.data.agentName}"`
                    : res.error,
                );
                if (res.success) setAiOpen(false);
              })
            }
          >
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate calling system
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
