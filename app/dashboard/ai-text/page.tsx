import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/navigation/platform-nav";

/** Legacy route — SMS product removed; email campaigns is the follow-up hub. */
export default function AiTextRedirectPage() {
  redirect(ROUTES.emailCampaignCenter);
}
