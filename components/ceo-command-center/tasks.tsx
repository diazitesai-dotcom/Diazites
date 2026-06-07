import Link from "next/link";

import { CardShell } from "@/components/ceo-command-center/shared/card-shell";
import { cn } from "@/lib/utils";
import type { TaskItem } from "@/types/ceo-command-center";

const priorityStyles = {
  high: "bg-rose-500/15 text-rose-300 border-rose-500/20",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/20",
  low: "bg-slate-500/15 text-slate-400 border-white/10",
};

type TasksProps = {
  items: TaskItem[];
};

export function Tasks({ items }: TasksProps) {
  return (
    <CardShell
      title="Today's Tasks"
      action={
        <Link
          href="/dashboard/tasks"
          className="text-xs font-medium text-violet-300 hover:text-violet-200"
        >
          View all
        </Link>
      }
    >
      <ul className="space-y-2">
        {items.map((task) => (
          <li
            key={task.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
          >
            <span className="text-sm text-slate-200">{task.title}</span>
            <span
              className={cn(
                "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize",
                priorityStyles[task.priority],
              )}
            >
              {task.priority}
            </span>
          </li>
        ))}
      </ul>
    </CardShell>
  );
}
