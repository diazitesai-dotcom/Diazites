import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/navigation/platform-nav";

export default function AutomationsRedirectPage() {
  redirect(ROUTES.automationPipelines);
}
