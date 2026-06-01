"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Bot,
  ExternalLink,
  LayoutTemplate,
  Megaphone,
  Workflow,
} from "lucide-react";

import type { SetupArtifact } from "@/actions/mission-control-setup.actions";
import { cn } from "@/lib/utils";

const THEME_DOT: Record<string, string> = {
  violet: "bg-violet-400",
  cyan: "bg-cyan-400",
  emerald: "bg-emerald-400",
  amber: "bg-amber-400",
  rose: "bg-rose-400",
  indigo: "bg-indigo-400",
};

function CardShell({
  children,
  accent = "violet",
}: {
  children: React.ReactNode;
  accent?: "violet" | "cyan" | "emerald";
}) {
  const glow =
    accent === "cyan"
      ? "from-cyan-500/15"
      : accent === "emerald"
        ? "from-emerald-500/15"
        : "from-violet-500/15";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", damping: 22, stiffness: 240 }}
      className={cn(
        "relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br to-background/60 p-3.5 shadow-lg",
        glow,
      )}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full opacity-40 blur-2xl"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.12), transparent 70%)" }}
        aria-hidden
      />
      {children}
    </motion.div>
  );
}

function PreviewLink({ href, label, external }: { href: string; label: string; external?: boolean }) {
  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-violet-100"
    >
      {label}
      {external ? <ExternalLink className="size-3" /> : <ArrowUpRight className="size-3" />}
    </Link>
  );
}

export function SetupArtifactCard({ artifact }: { artifact: SetupArtifact }) {
  if (artifact.type === "landing_page") {
    return (
      <CardShell accent="violet">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg border border-violet-500/30 bg-violet-500/15">
            <LayoutTemplate className="size-3.5 text-violet-200" />
          </span>
          <p className="text-xs font-semibold">Landing page</p>
          <span className="ml-auto flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
            <span className={cn("size-2 rounded-full", THEME_DOT[artifact.theme] ?? "bg-violet-400")} />
            {artifact.theme} · {artifact.design}
          </span>
        </div>
        <p className="mt-2 line-clamp-2 text-sm font-medium text-foreground/90">{artifact.headline}</p>
        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">diazites.com{artifact.url}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <PreviewLink href={artifact.url} label="View live page" external />
          <PreviewLink href="/dashboard/funnel?setup=1" label="Edit in Funnel" />
        </div>
      </CardShell>
    );
  }

  if (artifact.type === "campaign") {
    return (
      <CardShell accent="cyan">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/15">
            <Megaphone className="size-3.5 text-cyan-200" />
          </span>
          <p className="text-xs font-semibold">Ad campaign</p>
          <span className="ml-auto rounded-md border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-cyan-100">
            {artifact.platform}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Metric label="Daily budget" value={`$${artifact.budget}`} />
          <Metric label="Goal" value="Leads" />
          <Metric label="Targeting" value={artifact.location} />
        </div>
        <div className="mt-3">
          <PreviewLink href="/dashboard/campaign-ops?setup=1" label="Open Campaign Manager" />
        </div>
      </CardShell>
    );
  }

  if (artifact.type === "agents") {
    return (
      <CardShell accent="emerald">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/15">
            <Bot className="size-3.5 text-emerald-200" />
          </span>
          <p className="text-xs font-semibold">AI agents activated</p>
        </div>
        <ul className="mt-2.5 space-y-1.5">
          {artifact.agents.map((a) => (
            <li key={a} className="flex items-center gap-2 text-xs text-foreground/90">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/70" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
              </span>
              {a}
            </li>
          ))}
        </ul>
      </CardShell>
    );
  }

  // Funnel — a connected stack of every piece built together.
  return (
    <CardShell accent="violet">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg border border-violet-500/30 bg-gradient-to-br from-violet-500/25 to-cyan-500/20">
          <Workflow className="size-3.5 text-violet-100" />
        </span>
        <p className="text-xs font-semibold">Complete funnel</p>
        <span className="ml-auto rounded-md border border-white/15 bg-white/[0.04] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          Live
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {artifact.landingPage ? (
          <FunnelRow
            icon={<LayoutTemplate className="size-3.5 text-violet-200" />}
            title="Landing page"
            subtitle={`${artifact.landingPage.theme} · ${artifact.landingPage.design}`}
            href={artifact.landingPage.url}
            external
          />
        ) : null}
        {artifact.agents.length ? (
          <FunnelRow
            icon={<Bot className="size-3.5 text-emerald-200" />}
            title={`${artifact.agents.length} AI agents`}
            subtitle={artifact.agents.join(", ")}
          />
        ) : null}
        {artifact.campaign ? (
          <FunnelRow
            icon={<Megaphone className="size-3.5 text-cyan-200" />}
            title="Ad campaign"
            subtitle={`${artifact.campaign.platform} · $${artifact.campaign.budget}/day`}
            href="/dashboard/campaign-ops?setup=1"
          />
        ) : null}
      </div>
    </CardShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-center">
      <p className="truncate text-xs font-semibold text-foreground">{value}</p>
      <p className="mt-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function FunnelRow({
  icon,
  title,
  subtitle,
  href,
  external,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  href?: string;
  external?: boolean;
}) {
  const body = (
    <div className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-2 transition-colors hover:border-white/20">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/[0.04]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground/90">{title}</p>
        <p className="truncate text-[10px] text-muted-foreground">{subtitle}</p>
      </div>
      {href ? <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" /> : null}
    </div>
  );

  if (!href) return body;
  return (
    <Link href={href} target={external ? "_blank" : undefined} className="block">
      {body}
    </Link>
  );
}
