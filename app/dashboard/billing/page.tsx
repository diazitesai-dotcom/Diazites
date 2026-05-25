import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/navigation/platform-nav";

export default async function BillingLegacyRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  qs.set("tab", "billing");
  for (const [k, v] of Object.entries(sp)) {
    if (k === "tab") continue;
    if (typeof v === "string") qs.set(k, v);
  }
  const q = qs.toString();
  redirect(q ? `${ROUTES.organization}?${q}` : `${ROUTES.organization}?tab=billing`);
}
