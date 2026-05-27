export type ParsedFunnelInput = {
  raw: string;
  kind: "url" | "keyword";
  displayLabel: string;
  slugBase: string;
  aiPrompt: string;
  domain?: string;
};

const DOMAIN_RE =
  /^(?:https?:\/\/)?(?:www\.)?[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+(?:\/[^\s]*)?$/i;

export function slugifyFunnelInput(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 36) || "landing"
  );
}

export function normalizeDomain(input: string): string {
  let value = input.trim().toLowerCase();
  value = value.replace(/^https?:\/\//i, "");
  value = value.replace(/^www\./i, "");
  value = value.split("/")[0]?.split("?")[0]?.split("#")[0] ?? value;
  return value.replace(/\.$/, "");
}

export function looksLikeUrl(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed || /\s/.test(trimmed)) return false;
  return DOMAIN_RE.test(trimmed);
}

export function parseFunnelInput(input: string): ParsedFunnelInput {
  const raw = input.trim();

  if (looksLikeUrl(raw)) {
    const domain = normalizeDomain(raw);
    const brand = domain.split(".")[0] ?? domain;
    return {
      raw,
      kind: "url",
      displayLabel: domain,
      slugBase: slugifyFunnelInput(domain),
      domain,
      aiPrompt: `Website / business URL: ${domain}

Create landing pages for this business. Brand name inferred from domain: "${brand}".
Infer the industry, core services, target audience, and value proposition from the domain and brand.
Write copy as if you analyzed their website — professional, specific, and conversion-focused.`,
    };
  }

  return {
    raw,
    kind: "keyword",
    displayLabel: raw,
    slugBase: slugifyFunnelInput(raw),
    aiPrompt: raw,
  };
}

export function isValidFunnelInput(parsed: ParsedFunnelInput): boolean {
  if (parsed.kind === "url") {
    const domain = parsed.domain ?? "";
    const host = domain.split(".")[0] ?? "";
    return domain.includes(".") && host.length >= 2;
  }
  return parsed.raw.length >= 3;
}
