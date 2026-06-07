import { CardShell } from "@/components/ceo-command-center/shared/card-shell";
import type { ActivityItem } from "@/types/ceo-command-center";

type RecentActivityProps = {
  items: ActivityItem[];
};

export function RecentActivity({ items }: RecentActivityProps) {
  return (
    <CardShell title="Recent Activity">
      {items.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-8 text-center">
          <p className="text-sm font-medium text-slate-300">No activity yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Real system activity will appear here as agents, leads, and campaigns run.
          </p>
        </div>
      ) : (
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={item.id} className="flex gap-3">
            <div className="relative flex flex-col items-center">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-500" />
              {index < items.length - 1 ? (
                <span className="mt-1 w-px flex-1 bg-white/10" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1 pb-3">
              <p className="text-sm text-slate-200">{item.text}</p>
              <p className="mt-0.5 text-xs text-slate-500">{item.timeAgo}</p>
            </div>
          </li>
        ))}
      </ul>
      )}
    </CardShell>
  );
}
