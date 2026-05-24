import { redirect } from "next/navigation";

/** Canonical Growth Engine lives at /dashboard/engine */
export default function GrowthEngineRedirectPage() {
  redirect("/dashboard/engine");
}
