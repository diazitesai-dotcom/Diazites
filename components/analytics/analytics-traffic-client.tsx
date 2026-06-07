"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type TrafficPoint = { label: string; visits: number };
export type AgentActivityRow = {
  id: string;
  title: string;
  detail: string;
  time: string;
  agentKey?: string;
};

type AnalyticsTrafficClientProps = {
  trafficSeries: TrafficPoint[];
  totalLeads: number;
  leadsThisWeek: number;
  agentActivities: AgentActivityRow[];
  leadUpdates: AgentActivityRow[];
};

export function AnalyticsTrafficClient({
  trafficSeries,
  totalLeads,
  leadsThisWeek,
  agentActivities,
  leadUpdates,
}: AnalyticsTrafficClientProps) {
  const maxVisits = Math.max(...trafficSeries.map((p) => p.visits), 1);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Site sessions (7d)" value={String(trafficSeries.reduce((a, p) => a + p.visits, 0))} />
        <MetricCard label="Leads captured" value={String(totalLeads)} />
        <MetricCard label="Leads this week" value={String(leadsThisWeek)} />
      </div>

      <Card className="border-white/[0.08]">
        <CardHeader>
          <CardTitle className="text-lg">Site traffic</CardTitle>
          <CardDescription>Landing page & tracked visits over the last 7 days.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-end gap-2">
            {trafficSeries.map((point) => (
              <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-violet-600/80 to-cyan-500/60"
                  style={{ height: `${Math.max(8, (point.visits / maxVisits) * 100)}%` }}
                />
                <span className="text-[10px] text-muted-foreground">{point.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityList title="Agent activity" items={agentActivities} empty="No agent activity yet." />
        <ActivityList
          title="Lead capture & updates"
          items={leadUpdates}
          empty="Leads will appear here as agents capture and update them."
        />
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-white/[0.08]">
      <CardContent className="pt-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function ActivityList({
  title,
  items,
  empty,
}: {
  title: string;
  items: AgentActivityRow[];
  empty: string;
}) {
  return (
    <Card className="border-white/[0.08]">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id} className="rounded-xl border border-white/[0.06] px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{item.title}</p>
                  <span className="shrink-0 text-[10px] text-muted-foreground">{item.time}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
