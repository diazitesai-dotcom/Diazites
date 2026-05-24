import { redirect } from "next/navigation";

export default function LegacyFunnelRedirect() {
  redirect("/dashboard/funnel");
}
