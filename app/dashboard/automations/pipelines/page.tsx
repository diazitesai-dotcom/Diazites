import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/navigation/platform-nav";

/** Pipelines live under Automation Center → Pipelines tab. */
export default function AutomationsPipelinesIndexPage() {
  redirect(`${ROUTES.automationCenter}?tab=pipelines`);
}
