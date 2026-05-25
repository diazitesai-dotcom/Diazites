"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AgentWorkspacePanels } from "@/components/agents/workspace/agent-workspace-panels";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AgentWorkspaceData } from "@/types/agent-workspace";
import { cn } from "@/lib/utils";

export function AgentWorkspaceClient({ data }: { data: AgentWorkspaceData }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab =
    data.tabs.find((t) => t.id === tabParam)?.id ?? data.tabs[0]?.id ?? "overview";

  const setTab = useCallback(
    (id: string) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("tab", id);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return (
    <Tabs value={activeTab} onValueChange={setTab} className="space-y-6">
      <div className="-mx-1 overflow-x-auto pb-1">
        <TabsList className="inline-flex h-auto min-w-full flex-nowrap justify-start gap-0.5 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
          {data.tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "shrink-0 rounded-lg px-3 py-2 text-xs font-medium data-active:bg-violet-500/20 data-active:text-violet-100",
              )}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {data.tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="mt-0 outline-none">
          <AgentWorkspacePanels data={data} tabId={tab.id} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
