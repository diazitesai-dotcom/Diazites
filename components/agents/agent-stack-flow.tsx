"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { StackFlowGraph } from "@/types/agent-deployment";

export function AgentStackFlow({ flow, className }: { flow: StackFlowGraph; className?: string }) {
  if (flow.nodes.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Execution flow
      </p>
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max items-center gap-2">
          {flow.nodes.map((node, i) => (
            <div key={node.id} className="flex items-center gap-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                className="w-[140px] rounded-xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 to-transparent p-3"
              >
                <p className="text-xs font-semibold text-foreground">{node.label}</p>
                <p className="mt-1 text-[10px] leading-snug text-muted-foreground">{node.role}</p>
              </motion.div>
              {i < flow.nodes.length - 1 ? (
                <div className="flex flex-col items-center gap-0.5 px-1">
                  <ArrowRight className="size-3.5 text-violet-400/80" />
                  {flow.edges[i]?.label ? (
                    <span className="text-[9px] uppercase tracking-wide text-cyan-300/70">
                      {flow.edges[i].label}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      {flow.edges.some((e) => e.from === "retargeting") ? (
        <p className="text-[10px] text-muted-foreground">
          Retargeting loop feeds warm visitors back into the funnel.
        </p>
      ) : null}
    </div>
  );
}
