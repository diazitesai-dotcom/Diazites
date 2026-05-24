import { redirect } from "next/navigation";

/** Ad accounts and agent permissions live on the Ads dashboard */
export default function IntegrationsRedirectPage() {
  redirect("/dashboard/ads");
}
