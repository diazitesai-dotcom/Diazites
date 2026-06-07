import Link from "next/link";

import { CardShell } from "@/components/ceo-command-center/shared/card-shell";
import { CircularProgress } from "@/components/ceo-command-center/shared/circular-progress";
import type { RevenueGoalData } from "@/types/ceo-command-center";

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

type RevenueGoalCardProps = {
  data: RevenueGoalData;
};

export function RevenueGoalCard({ data }: RevenueGoalCardProps) {
  return (
    <CardShell title="Revenue Goal" glow="green">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Monthly Goal</span>
            <span className="font-semibold text-white">{formatCurrency(data.monthlyGoal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Current Revenue</span>
            <span className="font-semibold text-emerald-400">
              {formatCurrency(data.currentRevenue)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Revenue Gap</span>
            <span className="font-semibold text-rose-300">
              {formatCurrency(data.revenueGap)}
            </span>
          </div>
          <Link
            href="/dashboard/analytics"
            className="inline-block text-xs font-medium text-violet-300 hover:text-violet-200"
          >
            Edit Goal →
          </Link>
        </div>

        <CircularProgress
          value={data.progressPercent}
          size={120}
          strokeWidth={10}
          label={`${data.progressPercent}%`}
          sublabel="of goal"
          gradientId="revenue-goal-gradient"
        />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {[
          { label: "Leads Needed", value: data.leadsNeeded },
          { label: "Appointments Needed", value: data.appointmentsNeeded },
          { label: "Sales Needed", value: data.salesNeeded },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-center"
          >
            <p className="text-lg font-bold tabular-nums text-white">{item.value}</p>
            <p className="mt-0.5 text-[10px] leading-tight text-slate-500">{item.label}</p>
          </div>
        ))}
      </div>
    </CardShell>
  );
}
