import Link from "next/link";
import { Bot } from "lucide-react";

import { CardShell } from "@/components/ceo-command-center/shared/card-shell";
import type { AiEmployee } from "@/types/ceo-command-center";

type AiEmployeesProps = {
  employees: AiEmployee[];
};

export function AiEmployees({ employees }: AiEmployeesProps) {
  return (
    <CardShell
      title="AI Employees"
      action={
        <Link
          href="/dashboard/agents"
          className="text-xs font-medium text-violet-300 hover:text-violet-200"
        >
          Manage All
        </Link>
      }
    >
      <ul className="space-y-2">
        {employees.map((emp) => (
          <li
            key={emp.id}
            className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
          >
            <div className="mt-0.5 rounded-lg bg-violet-500/15 p-1.5">
              <Bot className="h-3.5 w-3.5 text-violet-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-white">{emp.name}</p>
                <span className="rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium capitalize text-emerald-400">
                  {emp.status}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">{emp.description}</p>
            </div>
          </li>
        ))}
      </ul>
      <Link
        href="/dashboard/agents"
        className="mt-4 block w-full rounded-lg border border-white/[0.08] bg-white/[0.03] py-2 text-center text-xs font-medium text-slate-300 transition hover:bg-white/[0.06]"
      >
        View All AI Employees
      </Link>
    </CardShell>
  );
}
