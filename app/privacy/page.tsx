import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { privacyPolicy } from "@/lib/legal/privacy-policy";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: privacyPolicy.description,
};

export default function PrivacyPage() {
  return <LegalPageShell document={privacyPolicy} />;
}
