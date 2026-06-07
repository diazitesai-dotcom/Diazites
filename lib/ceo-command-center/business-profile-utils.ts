import type { BusinessProfileFields } from "@/types/ceo-command-center";

/** Only these fields render in onboarding — legacy keys are stripped on load/scan. */
export const BUSINESS_PROFILE_FIELD_KEYS = [
  "businessName",
  "industry",
  "services",
  "address",
  "phone",
  "email",
  "website",
  "businessHours",
  "targetCustomer",
  "keywords",
  "seoMetaTitle",
  "seoMetaDescription",
  "mainOffer",
  "businessDescription",
] as const satisfies readonly (keyof BusinessProfileFields)[];

export function sanitizeBusinessProfile(
  input: Partial<BusinessProfileFields> & Record<string, unknown>,
  website = "",
): BusinessProfileFields {
  const empty = createEmptyBusinessProfile(website);
  const out = { ...empty };

  for (const key of BUSINESS_PROFILE_FIELD_KEYS) {
    const value = input[key];
    if (typeof value === "string" && value.trim()) {
      out[key] = value.trim();
    }
  }

  if (website.trim()) {
    out.website = website.trim();
  } else   if (typeof input.website === "string" && input.website.trim()) {
    out.website = input.website.trim();
  }

  return out;
}

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
