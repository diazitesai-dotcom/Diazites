"use client";

import Link from "next/link";
import { useState } from "react";
import { Brain, CheckCircle2, FileText, ListChecks, Target, XCircle } from "lucide-react";

import { ApprovalStateBadge } from "@/components/dashboard/mission-control/approval-state-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/navigation/platform-nav";
import type { AgentWorkspaceData } from "@/types/agent-workspace";
import { cn } from "@/lib/utils";

function PanelGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 lg:grid-cols-2">{children}</div>;
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}

function LeadTable({
  rows,
  empty,
}: {
  rows: AgentWorkspaceData["qualifiedLeads"];
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/[0.08] text-[10px] uppercase tracking-wider text-muted-foreground">
            <th className="px-3 py-2">Lead</th>
            <th className="px-3 py-2">Score</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Source</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-white/[0.06] last:border-0">
              <td className="px-3 py-2 font-medium">{row.name}</td>
              <td className="px-3 py-2 tabular-nums">
                {row.score} · {row.bucket}
              </td>
              <td className="px-3 py-2 capitalize text-muted-foreground">{row.status}</td>
              <td className="px-3 py-2 text-muted-foreground">{row.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ManualOverridePanel({ data }: { data: AgentWorkspaceData }) {
  const [leadId, setLeadId] = useState(data.qualifiedLeads[0]?.id ?? "");
  const [bucket, setBucket] = useState("qualified");
  const [saved, setSaved] = useState(false);
  const all = [...data.qualifiedLeads, ...data.rejectedLeads];

  return (
    <Card className="border-white/[0.08]">
      <CardHeader>
        <CardTitle className="text-base">Manual override</CardTitle>
        <CardDescription>
          Override AI bucket assignment for a lead. Writes to Leads OS on save (demo: local
          confirmation only until persistence is wired).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Lead</span>
            <select
              className="w-full rounded-lg border border-white/10 bg-background px-3 py-2"
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
            >
              {all.length === 0 ? <option value="">No leads loaded</option> : null}
              {all.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Force bucket</span>
            <select
              className="w-full rounded-lg border border-white/10 bg-background px-3 py-2"
              value={bucket}
              onChange={(e) => setBucket(e.target.value)}
            >
              <option value="qualified">Qualified</option>
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
            </select>
          </label>
        </div>
        <Button
          type="button"
          className="rounded-xl"
          onClick={() => setSaved(true)}
          disabled={!leadId}
        >
          Apply override
        </Button>
        {saved ? (
          <p className="text-sm text-emerald-300">
            Override queued for {leadId} → {bucket}. Open Leads OS to confirm pipeline status.
          </p>
        ) : null}
        <Link href={ROUTES.leadsOs} className="text-xs text-violet-300 underline">
          Open Leads OS →
        </Link>
      </CardContent>
    </Card>
  );
}

export function AgentWorkspacePanels({
  data,
  tabId,
}: {
  data: AgentWorkspaceData;
  tabId: string;
}) {
  const isActive = data.status === "active";

  switch (tabId) {
    case "overview":
      return (
        <PanelGrid>
          <div className="space-y-4 lg:col-span-2">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Status"
                value={isActive ? "Running" : data.status === "pending" ? "Provisioning" : "Inactive"}
              />
              <StatCard
                label="Queue depth"
                value={String(data.queue.length)}
                sub="Tasks in pipeline"
              />
              <StatCard
                label="Performance"
                value={isActive ? `${data.performance.score}%` : "—"}
                sub={data.performance.resultLabel}
              />
              <StatCard
                label="Pending approvals"
                value={String(data.approvals.length)}
                sub={data.approvals.length ? "Needs CEO decision" : "Clear"}
              />
            </div>
            <Card className="border-white/[0.08]">
              <CardHeader>
                <CardTitle className="text-base">Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{data.description}</p>
                {data.activatedAt ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Activated {new Date(data.activatedAt).toLocaleString()}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </PanelGrid>
      );

    case "queue":
      return (
        <ul className="space-y-2">
          {data.queue.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3"
            >
              <div>
                <p className="font-medium text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {item.priority} · {item.status}
                  {item.eta ? ` · ETA ${item.eta}` : ""}
                </p>
              </div>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                  item.status === "running"
                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                    : "border-white/10 text-muted-foreground",
                )}
              >
                {item.status}
              </span>
            </li>
          ))}
        </ul>
      );

    case "logs":
      return (
        <div className="rounded-xl border border-white/[0.08] bg-black/40 p-4 font-mono text-xs">
          {data.logs.map((log) => (
            <div key={log.id} className="border-b border-white/[0.06] py-2 last:border-0">
              <span className="text-muted-foreground">
                {new Date(log.at).toLocaleTimeString()}{" "}
              </span>
              <span
                className={cn(
                  "mr-2 uppercase",
                  log.level === "error"
                    ? "text-rose-400"
                    : log.level === "warn"
                      ? "text-amber-400"
                      : "text-cyan-400",
                )}
              >
                [{log.level}]
              </span>
              {log.message}
            </div>
          ))}
        </div>
      );

    case "reasoning":
      return (
        <ul className="space-y-3">
          {data.reasoning.map((step) => (
            <li
              key={step.id}
              className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4"
            >
              <div className="flex items-start gap-2">
                <Brain className="mt-0.5 size-4 shrink-0 text-violet-400" />
                <div>
                  <p className="font-medium text-sm">{step.summary}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{step.detail}</p>
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    {new Date(step.at).toLocaleString()}
                    {step.confidence != null ? ` · ${step.confidence}% confidence` : ""}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      );

    case "platforms":
      return (
        <PanelGrid>
          {data.platforms.length === 0 ? (
            <p className="text-sm text-muted-foreground lg:col-span-2">
              No platforms mapped for this agent. Connect integrations in the Integrations Hub.
            </p>
          ) : (
            data.platforms.map((p) => (
              <Card key={p.id} className="border-white/[0.08]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <CardDescription>{p.detail}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                      p.status === "connected"
                        ? "border-emerald-500/40 text-emerald-300"
                        : "border-amber-500/40 text-amber-300",
                    )}
                  >
                    {p.status}
                  </span>
                </CardContent>
              </Card>
            ))
          )}
          <Link
            href={ROUTES.integrationsHub}
            className="text-sm text-violet-300 underline lg:col-span-2"
          >
            Integrations Hub →
          </Link>
        </PanelGrid>
      );

    case "campaigns":
      return (
        <div className="space-y-3">
          {data.campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No campaigns assigned. Launch Campaign Ops or the Growth Engine to attach ownership.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.campaigns.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.08] px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-sm">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.platform} · {c.role} · {c.status}
                    </p>
                  </div>
                  {c.spend ? (
                    <span className="text-sm tabular-nums text-cyan-200">{c.spend}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          <Link href={ROUTES.campaignOps} className="text-sm text-violet-300 underline">
            Campaign Ops →
          </Link>
        </div>
      );

    case "tasks":
      return (
        <ul className="space-y-2">
          {data.tasks.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-3 rounded-xl border border-white/[0.08] px-4 py-3"
            >
              <ListChecks className="size-4 text-violet-400" />
              <div className="flex-1">
                <p className="text-sm font-medium">{t.label}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {t.status}
                  {t.due ? ` · ${t.due}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      );

    case "memory":
      return (
        <ul className="space-y-2">
          {data.memory.map((m) => (
            <li
              key={m.id}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3"
            >
              <p className="text-[10px] font-bold uppercase text-muted-foreground">{m.label}</p>
              <p className="mt-1 text-sm font-medium">{m.value}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Updated {new Date(m.updatedAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      );

    case "performance":
      return (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Health score" value={`${data.performance.score}%`} />
          <StatCard
            label="Executions"
            value={String(data.performance.executions)}
            sub="Last 7 days"
          />
          <StatCard
            label="Success rate"
            value={`${data.performance.successRate}%`}
            sub={data.performance.resultLabel}
          />
        </div>
      );

    case "permissions":
      return (
        <ul className="space-y-2">
          {data.permissions.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.08] px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{p.label}</p>
                <p className="text-xs text-muted-foreground">{p.scope}</p>
              </div>
              {p.enabled ? (
                <CheckCircle2 className="size-4 text-emerald-400" />
              ) : (
                <XCircle className="size-4 text-muted-foreground" />
              )}
            </li>
          ))}
        </ul>
      );

    case "approvals":
      return (
        <div className="space-y-3">
          {data.approvals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending approvals for this agent.</p>
          ) : (
            data.approvals.map((a) => (
              <div
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-sm">{a.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(a.requestedAt).toLocaleString()}
                  </p>
                </div>
                <ApprovalStateBadge state="pending" />
              </div>
            ))
          )}
          <Link href={ROUTES.approvalCenter} className="text-sm text-violet-300 underline">
            Approval Center →
          </Link>
        </div>
      );

    case "rules":
      return (
        <ul className="space-y-2">
          <li className="rounded-xl border border-white/[0.08] px-4 py-3 text-sm text-muted-foreground">
            Playbook rules provisioned on activation. Enable webhook targets in Automations.
          </li>
          {data.tabs.find((t) => t.id === "rules") ? (
            <li className="flex items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/10 px-4 py-3">
              <FileText className="size-4 text-violet-400" />
              <span className="text-sm">
                Lead status change → route to CRM and booking automations
              </span>
            </li>
          ) : null}
          <Link href={ROUTES.automationCenter} className="text-sm text-violet-300 underline">
            Automation Center →
          </Link>
        </ul>
      );

    case "scoring":
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Heuristic engine (0–100) — runs on every Leads OS fetch. No external API calls.
          </p>
          <ul className="space-y-2">
            {data.scoringRules.map((rule) => (
              <li
                key={rule.id}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm">{rule.label}</p>
                  <span className="text-xs font-semibold text-violet-300">{rule.weight}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{rule.description}</p>
              </li>
            ))}
          </ul>
        </div>
      );

    case "qualified":
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="size-4 text-emerald-400" />
            Qualified & hot leads from your live pipeline
          </div>
          <LeadTable rows={data.qualifiedLeads} empty="No qualified leads yet — scoring runs on inbound capture." />
        </div>
      );

    case "rejected":
      return (
        <div className="space-y-3">
          <LeadTable
            rows={data.rejectedLeads}
            empty="No rejected or cold-disqualified leads in the current window."
          />
          {data.rejectedLeads.map((row) => (
            <p key={row.id} className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{row.name}:</span> {row.rationale}
            </p>
          ))}
        </div>
      );

    case "override":
      return <ManualOverridePanel data={data} />;

    default:
      return (
        <p className="text-sm text-muted-foreground">
          This section is not configured for {data.agentName}.
        </p>
      );
  }
}
