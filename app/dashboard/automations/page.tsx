import { AutomationHubClient } from "@/components/automations/automation-hub-client";
import { loadAutomationHubData } from "@/lib/dashboard/load-automation-hub";

export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
  const data = await loadAutomationHubData();

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 pb-16">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
          Automation Center
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Pipelines & Automations</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          Manage pipelines, stage automations, event rules, and connected automation tools.
        </p>
      </div>
      <AutomationHubClient {...data} />
    </div>
  );
}
