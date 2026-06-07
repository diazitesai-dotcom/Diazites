import { redirect } from "next/navigation";

import { ROUTES } from "@/lib/navigation/platform-nav";

export default function ApprovalsRedirectPage() {
  redirect(ROUTES.leadsOs);
}
