"use client";

import Link from "next/link";
import { Copy, Layers, Pencil, Rocket } from "lucide-react";
import { motion } from "framer-motion";

import { useAgentDeployment } from "@/components/agents/agent-deployment-provider";
import { GlassCard } from "@/components/dashboard/mission-control/glass-card";
import { Button, buttonVariants } from "@/components/ui/button";
import type { LandingStackVersion } from "@/lib/dashboard/mission-control-types";
import { fadeItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<LandingStackVersion["status"], string> = {
  live: "border-emerald-500/35 bg-emerald-500/12 text-emerald-200",
  draft: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  archived: "border-white/20 bg-white/[0.06] text-muted-foreground",
};

export function LandingStackManager({ versions }: { versions: LandingStackVersion[] }) {
  const { openDeployment } = useAgentDeployment();

  return (
    <motion.div variants={fadeItem} initial="hidden" animate="show">
      <GlassCard
        title="Landing Stack Manager"
        description="Version control — clone, edit, deploy"
        headerExtra={
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase text-violet-200">
            <Layers className="size-3" />
            {versions.length} versions
          </span>
        }
      >
        <ul className="space-y-3">
          {versions.map((version) => (
            <li
              key={version.id}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-violet-500/25"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{version.name}</p>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                        STATUS_STYLE[version.status],
                      )}
                    >
                      {version.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{version.headline}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {version.conversions ? `${version.conversions} · ` : ""}
                    Updated {version.lastUpdated}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/dashboard/funnel"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-lg border-white/10 text-xs")}
                  >
                    <Pencil className="mr-1 size-3" />
                    Edit
                  </Link>
                  <Button type="button" variant="outline" size="sm" className="rounded-lg border-white/10 text-xs">
                    <Copy className="mr-1 size-3" />
                    Clone
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg border-white/10 text-xs"
                    onClick={() =>
                      openDeployment({
                        goal: "generate_leads",
                        step: "stack",
                        source: "control_plane",
                      })
                    }
                  >
                    <Rocket className="mr-1 size-3" />
                    Deploy
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </GlassCard>
    </motion.div>
  );
}
