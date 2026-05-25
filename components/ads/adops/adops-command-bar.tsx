"use client";

import { Search } from "lucide-react";

import { useAdops } from "@/components/ads/adops/adops-provider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const FILTERS = [
  { id: "all", label: "All platforms" },
  { id: "connected", label: "Connected" },
  { id: "missing", label: "Missing" },
  { id: "errors", label: "Errors" },
  { id: "campaigns", label: "Campaigns" },
  { id: "agents", label: "Agents" },
  { id: "approvals", label: "Approvals" },
  { id: "tracking", label: "Tracking" },
];

export function AdopsCommandBar() {
  const { filter, setFilter, search, setSearch } = useAdops();

  return (
    <div className="sticky top-0 z-10 space-y-3 rounded-2xl border border-white/[0.08] bg-card/95 p-4 backdrop-blur-md">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search platforms, campaigns, agents…"
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={cn(
              "rounded-lg px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors",
              filter === f.id
                ? "bg-violet-500/25 text-violet-100"
                : "text-muted-foreground hover:bg-white/[0.04]",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
