"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronRight,
  RefreshCw,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { useAgentDeployment } from "@/components/agents/agent-deployment-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { useSystemModule } from "@/components/dashboard/mission-control/system-module-provider";
import {
  SystemInspectorTabs,
  type InspectorTabId,
} from "@/components/dashboard/mission-control/system-inspector-tabs";
import type {
  CrmModuleDetail,
  FollowUpModuleDetail,
  LandingModuleDetail,
  OptimizeModuleDetail,
  QualifyModuleDetail,
  SystemModuleDetail,
  SystemModuleDisplayState,
  SystemModuleKeyValue,
  SystemModuleLogEntry,
  TrafficModuleDetail,
} from "@/lib/dashboard/system-module-types";
import { cn } from "@/lib/utils";

const STATE_BADGE: Record<SystemModuleDisplayState, string> = {
  live: "border-cyan-500/40 bg-cyan-500/15 text-cyan-200 mission-timeline-dot-pulse",
  running: "border-amber-500/35 bg-amber-500/12 text-amber-200 mission-timeline-dot-pulse",
  active: "border-emerald-500/35 bg-emerald-500/12 text-emerald-200",
  processing: "border-sky-500/35 bg-sky-500/12 text-sky-200 mission-eta-tick",
  failed: "border-rose-500/40 bg-rose-500/12 text-rose-300",
  needs_attention: "border-amber-500/35 bg-amber-500/12 text-amber-200",
  idle: "border-white/15 bg-white/[0.04] text-muted-foreground",
  disconnected: "border-white/20 bg-white/[0.06] text-muted-foreground",
};

function StateBadge({ state }: { state: SystemModuleDisplayState }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        STATE_BADGE[state],
      )}
    >
      {state.replace(/_/g, " ")}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

function MetricGrid({ items }: { items: SystemModuleKeyValue[] }) {
  return (
    <dl className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
          <dt className="text-[10px] text-muted-foreground">{item.label}</dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function LogList({ logs }: { logs: SystemModuleLogEntry[] }) {
  return (
    <ul className="max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-white/[0.06] bg-black/25 p-2 font-mono text-[10px]">
      {logs.map((log) => (
        <li key={log.id} className="flex gap-2">
          <span className="shrink-0 tabular-nums text-muted-foreground">{log.time}</span>
          <span
            className={cn(
              log.level === "error" && "text-rose-300",
              log.level === "warn" && "text-amber-300",
              log.level === "success" && "text-emerald-300",
              log.level === "info" && "text-foreground/80",
            )}
          >
            {log.message}
          </span>
        </li>
      ))}
    </ul>
  );
}

function EmptyModule({ detail }: { detail: SystemModuleDetail }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 text-center">
      <AlertTriangle className="mb-3 size-8 text-amber-400/80" />
      <p className="text-sm font-medium text-foreground">No data yet</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">{detail.summary}</p>
      <Link
        href="/dashboard/funnel"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4 rounded-lg border-white/10")}
      >
        Set up funnel
        <ArrowRight className="ml-1 size-3.5" />
      </Link>
    </div>
  );
}

function DrawerSkeleton() {
  return (
    <div className="animate-pulse space-y-4 p-1">
      <div className="h-4 w-2/3 rounded bg-white/10" />
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div key={i} className="h-16 rounded-lg bg-white/[0.06]" />
        ))}
      </div>
      <div className="h-24 rounded-lg bg-white/[0.06]" />
      <div className="h-32 rounded-lg bg-white/[0.06]" />
    </div>
  );
}

function TrafficDetail({ detail }: { detail: TrafficModuleDetail }) {
  if (detail.isEmpty) return <EmptyModule detail={detail} />;
  return (
    <div className="space-y-5">
      <MetricGrid items={detail.metrics} />
      <Section title="Source breakdown">
        <ul className="space-y-1.5">
          {detail.sources.map((s) => (
            <li key={s.name} className="flex items-center justify-between text-sm">
              <span>{s.name}</span>
              <span className="tabular-nums text-muted-foreground">
                {s.visits} · {s.percent}%
              </span>
            </li>
          ))}
        </ul>
      </Section>
      <Section title="UTM tracking">
        <MetricGrid items={detail.utmCampaigns} />
      </Section>
      <Section title="Device & location">
        <MetricGrid items={[...detail.devices, ...detail.locations]} />
      </Section>
      <Section title="Visitor timeline">
        <ul className="space-y-1 text-xs text-muted-foreground">
          {detail.timeline.map((t) => (
            <li key={t.time}>
              <span className="font-mono text-cyan-300/80">{t.time}</span> — {t.event}
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Click path">
        <div className="flex flex-wrap items-center gap-1 text-xs">
          {detail.clickPath.map((step, i) => (
            <span key={step} className="flex items-center gap-1">
              {i > 0 ? <ChevronRight className="size-3 text-muted-foreground" /> : null}
              <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5">{step}</span>
            </span>
          ))}
        </div>
      </Section>
      <Section title="Logs">
        <LogList logs={detail.logs} />
      </Section>
    </div>
  );
}

function LandingDetail({ detail }: { detail: LandingModuleDetail }) {
  const { openDeployment } = useAgentDeployment();
  if (detail.isEmpty) return <EmptyModule detail={detail} />;
  return (
    <div className="space-y-5">
      <MetricGrid items={detail.metrics} />
      <Section title="A/B test">
        {detail.abTests.length ? (
          <ul className="space-y-2">
            {detail.abTests.map((t) => (
              <li key={t.variant} className="flex justify-between rounded-lg border border-white/[0.06] px-3 py-2 text-sm">
                <span>{t.variant}</span>
                <span className="text-muted-foreground">
                  {t.cvr} · {t.traffic}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">No active A/B test</p>
        )}
      </Section>
      <Section title="Agent actions">
        <ul className="space-y-1 text-xs text-muted-foreground">
          {detail.agentActions.map((a) => (
            <li key={a} className="flex items-center gap-2">
              <Sparkles className="size-3 text-violet-300" />
              {a}
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Page versions">
        <ul className="space-y-2">
          {detail.versions.map((v) => (
            <li key={v.id} className="rounded-lg border border-white/[0.06] px-3 py-2 text-sm">
              <p className="font-medium">{v.name}</p>
              <p className="text-xs text-muted-foreground">{v.headline}</p>
            </li>
          ))}
        </ul>
      </Section>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/funnel"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-lg border-white/10")}
        >
          Edit landing page
        </Link>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg border-white/10"
          onClick={() => openDeployment({ goal: "generate_leads", step: "stack", source: "control_plane" })}
        >
          Deploy version
        </Button>
      </div>
      <Section title="Logs">
        <LogList logs={detail.logs} />
      </Section>
    </div>
  );
}

function QualifyDetail({ detail }: { detail: QualifyModuleDetail }) {
  if (detail.isEmpty) return <EmptyModule detail={detail} />;
  return (
    <div className="space-y-5">
      <MetricGrid items={detail.metrics} />
      <Section title="Qualification rules">
        <ul className="space-y-1 text-xs text-muted-foreground">
          {detail.rules.map((r) => (
            <li key={r} className="flex gap-2">
              <Check className="mt-0.5 size-3 shrink-0 text-emerald-400" />
              {r}
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Lead queue">
        <ul className="space-y-3">
          {detail.leads.map((lead) => (
            <li key={lead.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{lead.name}</p>
                  <p className="text-xs text-cyan-200/90">Score: {lead.score}</p>
                </div>
                <span className="text-[10px] uppercase text-muted-foreground">{lead.status}</span>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                <span className="font-medium text-violet-300/90">AI reasoning: </span>
                {lead.reasoning}
              </p>
              {lead.missingFields.length ? (
                <p className="mt-1 text-[11px] text-amber-300/90">
                  Missing: {lead.missingFields.join(", ")}
                </p>
              ) : null}
              <div className="mt-2 flex gap-2">
                <Button type="button" size="sm" variant="outline" className="h-7 rounded-lg text-[10px]">
                  Approve
                </Button>
                <Button type="button" size="sm" variant="ghost" className="h-7 rounded-lg text-[10px]">
                  Reject
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Logs">
        <LogList logs={detail.logs} />
      </Section>
    </div>
  );
}

function FollowUpDetail({ detail }: { detail: FollowUpModuleDetail }) {
  if (detail.isEmpty) return <EmptyModule detail={detail} />;
  return (
    <div className="space-y-5">
      <MetricGrid items={detail.metrics} />
      <Section title="Sequences">
        <ul className="space-y-3">
          {detail.sequences.map((seq, i) => (
            <li key={i} className="rounded-lg border border-white/[0.06] p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{seq.lead}</span>
                <span className="text-[10px] uppercase text-muted-foreground">{seq.channel}</span>
              </div>
              <p className="mt-1 text-xs text-cyan-200/80">{seq.status}</p>
              <p className="mt-2 rounded-md bg-black/20 p-2 text-[11px] italic text-muted-foreground">
                &ldquo;{seq.preview}&rdquo;
              </p>
              {seq.failed ? (
                <Button type="button" size="sm" variant="outline" className="mt-2 h-7 rounded-lg text-[10px]">
                  <RefreshCw className="mr-1 size-3" />
                  Retry send
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      </Section>
      <p className="text-xs text-muted-foreground">
        Next outreach: <span className="font-medium text-foreground">{detail.nextOutreach}</span>
      </p>
      <Section title="Logs">
        <LogList logs={detail.logs} />
      </Section>
    </div>
  );
}

function CrmDetail({ detail }: { detail: CrmModuleDetail }) {
  const router = useRouter();
  return (
    <div className="space-y-5">
      {detail.isEmpty ? <EmptyModule detail={detail} /> : <MetricGrid items={detail.metrics} />}
      <Section title="Field mapping">
        <MetricGrid items={detail.fieldMapping} />
      </Section>
      {detail.failedRecords.length ? (
        <Section title="Failed records">
          <ul className="space-y-2">
            {detail.failedRecords.map((r) => (
              <li key={r.id} className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-sm">
                <span className="font-mono text-xs text-rose-300">{r.id}</span>
                <p className="text-xs text-muted-foreground">{r.reason}</p>
              </li>
            ))}
          </ul>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2 rounded-lg border-white/10"
            onClick={() => router.push("/dashboard/leads")}
          >
            <RefreshCw className="mr-1.5 size-3.5" />
            Retry sync
          </Button>
        </Section>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Connected: <span className="font-medium text-foreground">{detail.connectedAccount}</span>
      </p>
      <Section title="Sync logs">
        <LogList logs={detail.logs} />
      </Section>
    </div>
  );
}

function OptimizeDetail({ detail }: { detail: OptimizeModuleDetail }) {
  const router = useRouter();
  if (detail.isEmpty) return <EmptyModule detail={detail} />;
  return (
    <div className="space-y-5">
      <MetricGrid items={detail.metrics} />
      <Section title="What changed & why">
        <ul className="space-y-3">
          {detail.changes.map((c) => (
            <li key={c.what} className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
              <p className="text-sm font-medium">{c.what}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                <span className="font-medium text-violet-300/90">Why: </span>
                {c.why}
              </p>
            </li>
          ))}
        </ul>
      </Section>
      {detail.budgetAdjustments.length ? (
        <Section title="Budget adjustments">
          <MetricGrid items={detail.budgetAdjustments} />
        </Section>
      ) : null}
      <p className="text-sm text-emerald-300/90">Impact: {detail.performanceImpact}</p>
      {detail.rollbackAvailable ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg border-white/10"
          onClick={() => router.push("/dashboard/optimization")}
        >
          <RotateCcw className="mr-1.5 size-3.5" />
          Rollback last change
        </Button>
      ) : null}
      <Section title="Logs">
        <LogList logs={detail.logs} />
      </Section>
    </div>
  );
}

function ModuleDetailBody({ detail }: { detail: SystemModuleDetail }) {
  switch (detail.moduleId) {
    case "traffic":
      return <TrafficDetail detail={detail} />;
    case "landing":
      return <LandingDetail detail={detail} />;
    case "qualify":
      return <QualifyDetail detail={detail} />;
    case "followup":
      return <FollowUpDetail detail={detail} />;
    case "crm":
      return <CrmDetail detail={detail} />;
    case "optimize":
      return <OptimizeDetail detail={detail} />;
    default:
      return null;
  }
}

function TabbedInspectorBody({ detail, tab }: { detail: SystemModuleDetail; tab: InspectorTabId }) {
  if (tab === "overview") return <ModuleDetailBody detail={detail} />;
  if (tab === "metrics") {
    return (
      <Section title="Live metrics">
        <MetricGrid items={detail.metrics} />
      </Section>
    );
  }
  if (tab === "logs") {
    return (
      <Section title="Event logs">
        <LogList logs={detail.logs} />
      </Section>
    );
  }
  if (tab === "reasoning") {
    return (
      <Section title="AI reasoning">
        <p className="rounded-lg border border-violet-500/20 bg-violet-500/10 p-3 text-sm leading-relaxed text-muted-foreground">
          {detail.aiReasoning ?? "No AI reasoning recorded for this module yet."}
        </p>
      </Section>
    );
  }
  if (tab === "actions") {
    const actions = detail.contextualActions ?? [];
    return (
      <Section title="Contextual actions">
        {actions.length ? (
          <div className="flex flex-wrap gap-2">
            {actions.map((action) =>
              action.href ? (
                <Link
                  key={action.label}
                  href={action.href}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-lg border-white/10")}
                >
                  {action.label}
                </Link>
              ) : (
                <Button key={action.label} type="button" variant="outline" size="sm" className="rounded-lg border-white/10">
                  {action.label}
                </Button>
              ),
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No actions available.</p>
        )}
      </Section>
    );
  }
  return (
    <Section title="History">
      <ul className="space-y-2 text-xs text-muted-foreground">
        {(detail.history ?? []).map((h) => (
          <li key={`${h.time}-${h.event}`}>
            <span className="font-mono text-cyan-300/80">{h.time}</span> — {h.event}
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function SystemModuleDrawer() {
  const { drawerOpen, closeModule, activeDetail, loading } = useSystemModule();
  const [tab, setTab] = useState<InspectorTabId>("overview");

  return (
    <>
      <AnimatePresence>
        {drawerOpen ? (
          <motion.div
            className="fixed inset-0 z-[58] bg-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModule}
            aria-hidden
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {drawerOpen && activeDetail ? (
          <motion.aside
            role="dialog"
            aria-label={`${activeDetail.title} module details`}
            className="fixed inset-y-0 right-0 z-[59] flex w-full max-w-md flex-col border-l border-white/10 bg-card/98 shadow-[-24px_0_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <header className="shrink-0 border-b border-white/10 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <motion.div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold">{activeDetail.title}</p>
                    <StateBadge state={activeDetail.displayState} />
                  </motion.div>
                  <p className="mt-1 text-xs text-muted-foreground">{activeDetail.summary}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-lg"
                  onClick={closeModule}
                  aria-label="Close module details"
                >
                  <X className="size-4" />
                </Button>
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-cyan-200/70">
                <Activity className="size-3" />
                System Inspector
              </p>
              {!loading && activeDetail ? (
                <div className="mt-3">
                  <SystemInspectorTabs active={tab} onChange={setTab} />
                </div>
              ) : null}
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {loading ? (
                <DrawerSkeleton />
              ) : activeDetail ? (
                <TabbedInspectorBody detail={activeDetail} tab={tab} />
              ) : null}
            </div>
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </>
  );
}
