import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { cookiePolicy } from "@/lib/legal/cookie-policy";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: cookiePolicy.description,
};

export default function CookiesPage() {
  return <LegalPageShell document={cookiePolicy} />;
}
