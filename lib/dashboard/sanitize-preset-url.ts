const BLOCKED_WEBSITE_PATTERNS = [/everpeakroofing\.com/i];

/** Remove legacy demo / client URLs from dashboard form presets (not user-typed mid-session). */
export function sanitizeDashboardWebsitePreset(url?: string | null): string {
  const trimmed = url?.trim() ?? "";
  if (!trimmed) return "";
  if (BLOCKED_WEBSITE_PATTERNS.some((re) => re.test(trimmed))) return "";
  try {
    const parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    const host = parsed.hostname.toLowerCase();
    if (BLOCKED_WEBSITE_PATTERNS.some((re) => re.test(host))) return "";
  } catch {
    if (BLOCKED_WEBSITE_PATTERNS.some((re) => re.test(trimmed))) return "";
  }
  return trimmed;
}
