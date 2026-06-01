import type { SetupPanelKind } from "@/actions/mission-control-setup.actions";

const PANEL_KINDS = new Set<SetupPanelKind>([
  "integrations",
  "campaign",
  "landing",
  "funnel",
  "profile",
  "team",
  "agents",
]);

/** True when the user is on Mission Control (setup workspace). */
export function isMissionControlPath(pathname: string): boolean {
  const path = pathname.split("?")[0]?.replace(/\/+$/, "") || "/dashboard";
  return path === "/dashboard";
}

/** Maps a dashboard href to an inline panel kind, if supported. */
export function hrefToPanelKind(href: string): SetupPanelKind | null {
  const path = href.split("?")[0]?.toLowerCase() ?? "";
  if (path.includes("/integrations")) return "integrations";
  if (path.includes("/campaign-ops") || path.includes("/campaign")) return "campaign";
  if (path.includes("/funnel") || path.includes("/landing")) return "landing";
  if (path.includes("/agents")) return "agents";
  if (path.includes("/settings") || path.includes("/business")) return "profile";
  if (path.includes("/organization")) return "team";
  if (path.includes("/automations") || path.includes("/workflows") || path.includes("/engine"))
    return "funnel";
  if (path === "/dashboard") return "funnel";
  return null;
}

export function parsePanelFromSearchParams(
  params: URLSearchParams,
): SetupPanelKind | null {
  const raw = params.get("panel");
  if (raw && PANEL_KINDS.has(raw as SetupPanelKind)) return raw as SetupPanelKind;
  return null;
}

/** Stay on /dashboard and open an inline panel via query param. */
export function dashboardPanelHref(panel: SetupPanelKind): string {
  return `/dashboard?panel=${panel}`;
}

/** Rewrite external dashboard links to inline panel URLs when on Mission Control. */
export function inlineNavHref(href: string, pagePath: string): string {
  if (!isMissionControlPath(pagePath)) return href;
  const panel = hrefToPanelKind(href);
  if (panel) return dashboardPanelHref(panel);
  if (href.startsWith("/dashboard")) return "/dashboard";
  return href;
}
