"use client";

import { useMemo, useState } from "react";
import { Check, ChevronRight, Loader2, Play, RotateCcw } from "lucide-react";

import type { OnboardingPipelineWorkflow } from "@/lib/onboarding/command-center-payload";
import { cn } from "@/lib/utils";

type FlowNode = {
  id: string;
  label: string;
  detail: string;
  kind: "entry" | "stage" | "automation" | "exit";
};

type TestEvent = {
  id: string;
  at: string;
  message: string;
  status: "ok" | "pending" | "skip";
};

export function OnboardingPipelineTestPanel({
  businessName,
  landingTitle,
  primaryGoal,
  pipelineWorkflow,
  logoUrl,
  zernioConfigured,
  onTestComplete,
  testPassed,
}: {
  businessName: string;
  landingTitle: string;
  primaryGoal: string;
  pipelineWorkflow: OnboardingPipelineWorkflow;
  logoUrl?: string | null;
  zernioConfigured: boolean;
  onTestComplete: () => void;
  testPassed: boolean;
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [events, setEvents] = useState<TestEvent[]>([]);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  const flowNodes = useMemo<FlowNode[]>(() => {
    const nodes: FlowNode[] = [
      {
        id: "landing",
        label: landingTitle,
        detail: "Visitor lands and submits the form",
        kind: "entry",
      },
      {
        id: "capture",
        label: "Lead captured",
        detail: `Goal: ${primaryGoal}`,
        kind: "automation",
      },
    ];

    for (const automation of pipelineWorkflow.automations.filter((a) => a.enabled)) {
      nodes.push({
        id: `auto-${automation.id}`,
        label: automation.label,
        detail: "Automation fires on new lead",
        kind: "automation",
      });
    }

    for (const stage of pipelineWorkflow.stages) {
      nodes.push({
        id: `stage-${stage}`,
        label: stage,
        detail: `Owner: ${pipelineWorkflow.leadOwner}`,
        kind: "stage",
      });
    }

    if (pipelineWorkflow.followUpChannels.includes("SMS")) {
      nodes.push({
        id: "sms",
        label: "SMS follow-up",
        detail: pipelineWorkflow.followUpMessages.firstSms.slice(0, 80) || "Instant SMS sent",
        kind: "automation",
      });
    }

    if (pipelineWorkflow.followUpChannels.includes("Email")) {
      nodes.push({
        id: "email",
        label: "Email follow-up",
        detail: pipelineWorkflow.followUpMessages.firstEmail.slice(0, 80) || "Welcome email sent",
        kind: "automation",
      });
    }

    nodes.push({
      id: "complete",
      label: "Pipeline updated",
      detail: zernioConfigured
        ? "Ready to sync ads via Zernio on launch"
        : "Connect Zernio in step 5 to unlock ad platforms",
      kind: "exit",
    });

    return nodes;
  }, [landingTitle, primaryGoal, pipelineWorkflow, zernioConfigured]);

  async function runTest() {
    setIsRunning(true);
    setEvents([]);

    for (let i = 0; i < flowNodes.length; i++) {
      const node = flowNodes[i]!;
      setActiveNodeId(node.id);
      await new Promise((r) => setTimeout(r, 450));
      setEvents((prev) => [
        ...prev,
        {
          id: node.id,
          at: new Date().toLocaleTimeString(),
          message: `${node.label} — ${node.detail}`,
          status: "ok",
        },
      ]);
    }

    setActiveNodeId(null);
    setIsRunning(false);
    onTestComplete();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Test your full pipeline</h2>
        <p className="mt-1 text-sm text-slate-400">
          Walk through how a lead moves from {businessName || "your business"} landing page through
          your pipeline before you launch.
        </p>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max items-center gap-2">
          {flowNodes.map((node, index) => (
            <div key={node.id} className="flex items-center gap-2">
              <div
                className={cn(
                  "w-44 rounded-xl border p-3 transition-all",
                  activeNodeId === node.id
                    ? "border-violet-400 bg-violet-500/20 shadow-lg shadow-violet-900/30"
                    : events.some((e) => e.id === node.id)
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-white/[0.08] bg-white/[0.02]",
                )}
              >
                <p className="text-xs font-semibold text-white">{node.label}</p>
                <p className="mt-1 text-[10px] leading-4 text-slate-400">{node.detail}</p>
              </div>
              {index < flowNodes.length - 1 ? (
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-600" />
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {logoUrl ? (
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt="Business logo" className="h-10 w-10 rounded-lg object-contain" />
          <p className="text-xs text-slate-400">Logo will appear on your landing pages at launch.</p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void runTest()}
          disabled={isRunning}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {isRunning ? "Running test…" : "Run pipeline test"}
        </button>
        <button
          type="button"
          onClick={() => {
            setEvents([]);
            setActiveNodeId(null);
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
        {testPassed ? (
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300">
            <Check className="h-3.5 w-3.5" />
            Test passed — you can launch
          </span>
        ) : null}
      </div>

      {events.length > 0 ? (
        <div className="rounded-xl border border-white/[0.08] bg-black/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Test log</p>
          <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-xs">
            {events.map((event) => (
              <li key={event.id} className="flex gap-2 text-slate-300">
                <span className="shrink-0 text-slate-500">{event.at}</span>
                <span>{event.message}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
