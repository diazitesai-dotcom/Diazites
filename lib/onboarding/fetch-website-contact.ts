import {
  fetchWebsiteText,
  normalizeWebsiteUrl,
  type WebsiteFetchResult,
} from "@/lib/onboarding/fetch-website-text";

const CONTACT_PATHS = [
  "/contact",
  "/contact-us",
  "/contact-us/",
  "/contact/",
  "/about/contact",
  "/about-us/contact",
  "/get-in-touch",
  "/reach-us",
];

const CONTACT_HREF_PATTERN =
  /href=["']([^"']*(?:contact(?:-us)?|get-in-touch|reach-us|about\/contact)[^"']*)["']/gi;

function sameOrigin(base: URL, candidate: string): URL | null {
  try {
    const resolved = new URL(candidate, base);
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") return null;
    if (resolved.hostname.toLowerCase() !== base.hostname.toLowerCase()) return null;
    return resolved;
  } catch {
    return null;
  }
}

export function discoverContactPageUrls(baseUrl: string, html: string): string[] {
  const base = new URL(baseUrl);
  const found = new Set<string>();

  for (const path of CONTACT_PATHS) {
    found.add(new URL(path, base).toString());
  }

  let match: RegExpExecArray | null;
  const hrefPattern = new RegExp(CONTACT_HREF_PATTERN.source, CONTACT_HREF_PATTERN.flags);
  while ((match = hrefPattern.exec(html)) !== null) {
    const resolved = sameOrigin(base, match[1]);
    if (resolved) found.add(resolved.toString());
  }

  return [...found].slice(0, 4);
}

export type WebsiteAutofillBundle = WebsiteFetchResult & {
  contactText?: string;
  contactHtml?: string;
  contactUrl?: string;
};

/** Fetch homepage plus Contact Us page(s) for phone, email, and address. */
export async function fetchWebsiteForAutofill(rawUrl: string): Promise<WebsiteAutofillBundle> {
  const homepage = await fetchWebsiteText(rawUrl);
  const normalized = normalizeWebsiteUrl(rawUrl);
  if (!normalized || !homepage.html) {
    return homepage;
  }

  const contactCandidates = discoverContactPageUrls(normalized, homepage.html);
  let contactBundle: WebsiteFetchResult | null = null;

  for (const contactUrl of contactCandidates) {
    if (contactUrl === homepage.url || contactUrl === normalized) continue;
    try {
      const fetched = await fetchWebsiteText(contactUrl);
      if (fetched.text.length > 30) {
        contactBundle = fetched;
        break;
      }
    } catch {
      /* try next candidate */
    }
  }

  if (!contactBundle) {
    return homepage;
  }

  const combinedText = [
    homepage.text,
    "",
    "CONTACT PAGE:",
    `URL: ${contactBundle.url}`,
    contactBundle.text,
  ].join("\n");

  return {
    ...homepage,
    text: combinedText.slice(0, 24_000),
    contactText: contactBundle.text,
    contactHtml: contactBundle.html,
    contactUrl: contactBundle.url,
  };
}

export function extractContactDetailsFromHtml(html: string): {
  phone?: string;
  email?: string;
  address?: string;
} {
  const out: { phone?: string; email?: string; address?: string } = {};

  const telMatch = html.match(/href=["']tel:([^"'?#]+)["']/i);
  if (telMatch?.[1]) {
    out.phone = decodeURIComponent(telMatch[1].trim());
  }

  const mailMatch = html.match(/href=["']mailto:([^"'?#]+)["']/i);
  if (mailMatch?.[1]) {
    const email = decodeURIComponent(mailMatch[1].trim());
    if (!email.includes("example.com")) out.email = email;
  }

  const addressTag = html.match(
    /<address[^>]*>([\s\S]*?)<\/address>/i,
  );
  if (addressTag?.[1]) {
    out.address = addressTag[1]
      .replace(/<br\s*\/?>/gi, ", ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 240);
  }

  return out;
}
