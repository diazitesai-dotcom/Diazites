import Link from "next/link";

import { CeoCommandCenterDashboard } from "@/components/ceo-command-center/ceo-command-center-dashboard";
import { buttonVariants } from "@/components/ui/button";
import { getCeoCommandCenterMockData } from "@/lib/ceo-command-center/mock-data";
import { loadDashboardOverview } from "@/lib/dashboard/load-dashboard-overview";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const overview = await loadDashboardOverview();
  const data = getCeoCommandCenterMockData();

  if (!overview) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="max-w-md rounded-2xl border border-white/[0.08] bg-[#0c1222]/80 p-8 text-center backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">
            CEO Command Center
          </p>
          <h1 className="mt-2 text-xl font-semibold text-white">Welcome to Diazites</h1>
          <p className="mt-2 text-sm text-slate-400">
            Complete onboarding to unlock your AI business operating system.
          </p>
          <Link
            href="/onboarding"
            className={cn(buttonVariants({ variant: "default" }), "mt-6 rounded-xl")}
          >
            Start onboarding
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-4 -my-6 flex min-h-0 flex-1 flex-col md:-mx-6 md:-my-8">
      <CeoCommandCenterDashboard data={data} />
    </div>
  );
}
