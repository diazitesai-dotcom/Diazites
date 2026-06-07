import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/navigation/platform-nav";

export default function IntegrationsRedirectPage() {
  redirect(ROUTES.campaignOps);
}
