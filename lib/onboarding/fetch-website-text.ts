import {
  BRAND_HEADLINE,
  BRAND_SUBHEADLINE,
  ONBOARDING_AI_AGENTS,
  TRUST_BADGES,
} from "@/lib/marketing/platform-data";

// Large enough to reach footers on heavy site builders (Wix/Squarespace), where
// contact details usually live at the very bottom of the page.
const READ_BYTES = 1_500_000;
const MAX_TEXT_CHARS = 18_000;
const FETCH_TIMEOUT_MS = 15_000;

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "[::1]",
]);

function hostnameKey(host: string): string {
  return host.toLowerCase().replace(/^www\./, "");
}

function isOwnAppHostname(host: string): boolean {
  const key = hostnameKey(host);
  const candidates = new Set<string>(["diazites.com", "diazitesai.vercel.app"]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) {
    try {
      candidates.add(hostnameKey(new URL(appUrl).hostname));
    } catch {
      /* ignore */
    }
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    candidates.add(hostnameKey(vercelUrl.replace(/^https?:\/\//i, "")));
  }

  return candidates.has(key) || host.toLowerCase().endsWith(".vercel.app");
}

function builtInMarketingSnapshot(url: string): { text: string; title: string; html: string } | null {
  try {
    if (!isOwnAppHostname(new URL(url).hostname)) return null;
  } catch {
    return null;
  }

  const contactHtml = `
    <address>hello@diazites.com</address>
    <a href="mailto:hello@diazites.com">hello@diazites.com</a>
    <a href="/contact">Contact us</a>
  `;

  // Avoid server-side self-fetch loops on Vercel when operators test with diazites.com.
  const text = [
    `TITLE: ${BRAND_HEADLINE}`,
    `DESCRIPTION: ${BRAND_SUBHEADLINE}`,
    `EMAIL: hello@diazites.com`,
    `CONTACT PAGE:`,
    `URL: ${url.replace(/\/$/, "")}/contact`,
    `EMAIL: hello@diazites.com`,
    `SERVICES: ${TRUST_BADGES.join(", ")}`,
    `AGENTS: ${ONBOARDING_AI_AGENTS.map((a) => a.label).join(", ")}`,
    "INDUSTRY: SaaS, AI automation, marketing technology",
    "BUSINESS TYPE: SaaS",
    "TARGET AUDIENCE: Agencies, local businesses, consultants, and growth operators",
    "CAMPAIGN GOAL: generate leads and automate follow-up",
  ].join(" ");

  return {
    title: BRAND_HEADLINE,
    text: text.slice(0, MAX_TEXT_CHARS),
    html: contactHtml,
  };
}

function friendlyFetchError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  const cause =
    error instanceof Error && "cause" in error && error.cause instanceof Error
      ? error.cause.message
      : "";

  const combined = `${msg} ${cause}`.toLowerCase();
  if (
    combined.includes("fetch failed") ||
    combined.includes("econnrefused") ||
    combined.includes("enotfound") ||
    combined.includes("etimedout") ||
    combined.includes("certificate")
  ) {
    return "We couldn't reach that website from our servers. Use the full URL (https://…) or try again in a moment.";
  }
  return msg || "Failed to fetch website.";
}

function buildFetchCandidates(url: string): string[] {
  const parsed = new URL(url);
  const candidates = new Set<string>([url]);

  const bare = hostnameKey(parsed.hostname);
  const withWww = parsed.hostname.toLowerCase().startsWith("www.")
    ? bare
    : `www.${parsed.hostname.toLowerCase()}`;
  const withoutWww = bare;

  for (const host of [withWww, withoutWww]) {
    if (host !== parsed.hostname.toLowerCase()) {
      candidates.add(`${parsed.protocol}//${host}${parsed.pathname}${parsed.search}`);
    }
  }

  if (isOwnAppHostname(parsed.hostname) && process.env.VERCEL_URL?.trim()) {
    const vercelHost = process.env.VERCEL_URL.replace(/^https?:\/\//i, "").replace(/\/$/, "");
    candidates.add(`https://${vercelHost}${parsed.pathname}${parsed.search}`);
  }

  return [...candidates];
}

async function fetchHtml(url: string, signal: AbortSignal): Promise<Response> {
  const headers = {
    "User-Agent":
      "DiazitesBot/1.0 (+https://www.diazites.com; onboarding-autofill)",
    Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
  };

  const candidates = buildFetchCandidates(url);
  let lastError: Error | undefined;

  for (const candidate of candidates) {
    try {
      const res = await fetch(candidate, {
        signal,
        headers,
        redirect: "follow",
        cache: "no-store",
      });
      if (res.ok) return res;
      lastError = new Error(`Could not load website (HTTP ${res.status}).`);
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  throw lastError ?? new Error("Could not reach website.");
}

function normalizeWebsiteUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host)) return null;
  if (host.endsWith(".local") || host.endsWith(".internal")) return null;
  if (/^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\./.test(host)) return null;

  return url.toString();
}

/** Read only the first N bytes so large pages still work for autofill. */
async function readResponsePrefix(
  response: Response,
  maxBytes: number,
): Promise<ArrayBuffer> {
  const body = response.body;
  if (!body) {
    const buf = await response.arrayBuffer();
    return buf.byteLength <= maxBytes ? buf : buf.slice(0, maxBytes);
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (total < maxBytes) {
      const { done, value } = await reader.read();
      if (done || !value) break;

      const remaining = maxBytes - total;
      if (value.byteLength <= remaining) {
        chunks.push(value);
        total += value.byteLength;
      } else {
        chunks.push(value.slice(0, remaining));
        total = maxBytes;
        break;
      }
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      /* ignore */
    }
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return merged.buffer;
}

/** Prefer head + early body — enough for title, meta, and hero copy. */
function extractAutofillHtml(html: string): string {
  const headMatch = html.match(/<head[\s\S]*?<\/head>/i);
  const head = headMatch?.[0] ?? html.slice(0, 40_000);

  const headEnd = html.search(/<\/head>/i);
  const bodyStart = headEnd >= 0 ? headEnd + 7 : 0;
  const bodySnippet = html.slice(bodyStart, bodyStart + 100_000);

  return `${head}\n${bodySnippet}`;
}

function metaContent(html: string, key: string): string | undefined {
  const patterns = [
    new RegExp(
      `<meta[^>]+name=["']${key}["'][^>]+content=["']([^"']*)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${key}["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+property=["']og:${key}["'][^>]+content=["']([^"']*)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:${key}["']`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return undefined;
}

/** Strip the ENTIRE raw HTML to plain text (no focus truncation) for contact scanning. */
function htmlToScanText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

const PHONE_RE =
  /(?:\+?1[\s.\-]?)?\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}/g;
const EMAIL_RE = /[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/i;
// City, ST ZIP — anchor for a US postal address.
const CITY_STATE_ZIP_RE =
  /[A-Za-z][A-Za-z.'\s]{1,40}?,\s*[A-Z]{2},?\s*\d{5}(?:-\d{4})?/;
const HOURS_RE =
  /(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*\.?\s*(?:[-–—]|to|through)\s*(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*\.?[^\d]{0,12}\d{1,2}(?::\d{2})?\s*[AaPp]\.?\s*[Mm]\.?\s*(?:[-–—]|to)\s*\d{1,2}(?::\d{2})?\s*[AaPp]\.?\s*[Mm]\.?/;

const BLOCKED_EMAIL_HINTS = ["example.com", "sentry", "wixpress", "@2x", ".png", ".jpg"];

function findPhone(text: string): string | undefined {
  const matches = text.match(PHONE_RE);
  if (!matches) return undefined;
  for (const raw of matches) {
    const digits = raw.replace(/\D/g, "");
    // Reject obvious non-phones (e.g. timestamps, IDs) by length.
    if (digits.length === 10 || digits.length === 11) return raw.trim();
  }
  return undefined;
}

function findEmail(text: string): string | undefined {
  const match = text.match(EMAIL_RE);
  if (!match?.[0]) return undefined;
  const email = match[0].trim();
  const lower = email.toLowerCase();
  if (BLOCKED_EMAIL_HINTS.some((hint) => lower.includes(hint))) return undefined;
  return email;
}

const CONTACT_LABEL_RE = /\b(?:CONTACT|PHONE|EMAIL|HOURS|ADDRESS|TEL|FAX)\b/i;

function findAddress(text: string): string | undefined {
  const anchor = CITY_STATE_ZIP_RE.exec(text);
  if (!anchor || anchor.index === undefined) return undefined;

  const cityStateZip = anchor[0].replace(/\s+/g, " ").replace(/\s+,/g, ",").trim();
  const before = text.slice(Math.max(0, anchor.index - 90), anchor.index);

  // Only look back within the immediate segment: stop at a colon, newline, or a
  // contact label so we never absorb a "CONTACT ADDRESS:" label or a phone
  // number that happens to sit just before the address.
  const segment = before.split(/[:\n]|\b(?:CONTACT|PHONE|EMAIL|HOURS|ADDRESS|TEL|FAX)\b/i).pop() ?? "";
  const streetMatch = segment.match(/(\d{1,6}\s+[\s\S]+)$/);
  const street = streetMatch ? streetMatch[1] : "";

  let address = `${street}${anchor[0]}`
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .trim();

  // Defensive: never return a label/phone/email-polluted address.
  if (/[:@]/.test(address) || CONTACT_LABEL_RE.test(address)) {
    address = cityStateZip;
  }

  return address.length >= 8 ? address.slice(0, 240) : undefined;
}

function findBusinessHours(text: string): string | undefined {
  const match = text.match(HOURS_RE);
  if (!match?.[0]) return undefined;
  return match[0].replace(/\s+/g, " ").trim().slice(0, 120);
}

export type ContactDetails = {
  phone?: string;
  email?: string;
  address?: string;
  businessHours?: string;
};

/** Extract contact details (phone, email, address, hours) from page text. */
export function extractContactFromText(text: string): ContactDetails {
  return {
    phone: findPhone(text),
    email: findEmail(text),
    address: findAddress(text),
    businessHours: findBusinessHours(text),
  };
}

function stripHtmlToText(html: string): string {
  const focused = extractAutofillHtml(html);

  const withoutScripts = focused
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ");

  const description =
    metaContent(focused, "description") ?? metaContent(focused, "og:description");
  const siteName = metaContent(focused, "site_name");

  const withMeta = withoutScripts
    .replace(/<title[^>]*>([\s\S]*?)<\/title>/gi, " TITLE: $1 ")
    .replace(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/gi,
      " DESCRIPTION: $1 ",
    )
    .replace(
      /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/gi,
      " DESCRIPTION: $1 ",
    )
    .replace(
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["'][^>]*>/gi,
      " OG: $1 ",
    )
    .replace(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
      " SCHEMA: $1 ",
    );

  const prefix = [
    description ? `DESCRIPTION: ${description}` : "",
    siteName ? `SITE: ${siteName}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const text = withMeta
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return `${prefix} ${text}`.trim().slice(0, MAX_TEXT_CHARS);
}

export type WebsiteFetchResult = {
  url: string;
  text: string;
  title?: string;
  html?: string;
  /** Clean structured contact details, extracted BEFORE any synthetic labels are added. */
  contact?: ContactDetails;
};

export async function fetchWebsiteText(rawUrl: string): Promise<WebsiteFetchResult> {
  const url = normalizeWebsiteUrl(rawUrl);
  if (!url) {
    throw new Error("Enter a valid public website URL (https://…).");
  }

  const builtIn = builtInMarketingSnapshot(url);
  if (builtIn) {
    return {
      url,
      text: builtIn.text,
      title: builtIn.title,
      html: builtIn.html,
      contact: extractContactFromText(htmlToScanText(builtIn.html)),
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetchHtml(url, controller.signal);

    const contentType = res.headers.get("content-type") ?? "";
    if (
      contentType &&
      !contentType.includes("text/html") &&
      !contentType.includes("text/plain") &&
      !contentType.includes("application/xhtml")
    ) {
      throw new Error("Website did not return HTML content.");
    }

    const buffer = await readResponsePrefix(res, READ_BYTES);
    const html = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
    const focusedText = stripHtmlToText(html);

    // Scan the FULL page (incl. footer) for contact details and surface them up
    // front so they reach the AI excerpt and survive truncation.
    const contact = extractContactFromText(htmlToScanText(html));
    const contactBlock = [
      contact.phone ? `CONTACT PHONE: ${contact.phone}` : "",
      contact.email ? `CONTACT EMAIL: ${contact.email}` : "",
      contact.address ? `CONTACT ADDRESS: ${contact.address}` : "",
      contact.businessHours ? `CONTACT HOURS: ${contact.businessHours}` : "",
    ]
      .filter(Boolean)
      .join(" ");

    const text = (contactBlock ? `${contactBlock} ${focusedText}` : focusedText).slice(
      0,
      MAX_TEXT_CHARS,
    );

    if (focusedText.length < 40) {
      throw new Error(
        "Not enough readable content on that page — try the full URL including https://.",
      );
    }

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title =
      titleMatch?.[1]?.replace(/\s+/g, " ").trim() ??
      metaContent(html, "title") ??
      metaContent(html, "site_name");

    return { url, text, title, html, contact };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("Website took too long to respond.");
    }
    throw new Error(friendlyFetchError(e));
  } finally {
    clearTimeout(timer);
  }
}

export { normalizeWebsiteUrl };
