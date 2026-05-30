import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { termsOfService } from "@/lib/legal/terms-of-service";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: termsOfService.description,
};

export default function TermsPage() {
  return <LegalPageShell document={termsOfService} />;
}
