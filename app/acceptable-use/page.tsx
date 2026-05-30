import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { acceptableUsePolicy } from "@/lib/legal/acceptable-use";

export const metadata: Metadata = {
  title: "Acceptable Use Policy",
  description: acceptableUsePolicy.description,
};

export default function AcceptableUsePage() {
  return <LegalPageShell document={acceptableUsePolicy} />;
}
