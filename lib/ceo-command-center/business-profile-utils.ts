import type { BusinessProfileFields } from "@/types/ceo-command-center";

export function createEmptyBusinessProfile(website = ""): BusinessProfileFields {
  return {
    businessName: "",
    industry: "",
    services: "",
    address: "",
    phone: "",
    email: "",
    website,
    businessHours: "",
    targetCustomer: "",
    keywords: "",
    seoMetaTitle: "",
    seoMetaDescription: "",
    mainOffer: "",
    competitors: "",
    bestCallToAction: "",
    brandVoice: "",
    businessDescription: "",
  };
}

/** Client-side URL check before triggering autofill. */
export function isScannableWebsiteUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed.length < 4) return false;
  try {
    const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    if (!host.includes(".")) return false;
    if (host === "localhost" || host.endsWith(".local")) return false;
    return true;
  } catch {
    return false;
  }
}

export function normalizeWebsiteUrlClient(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}
