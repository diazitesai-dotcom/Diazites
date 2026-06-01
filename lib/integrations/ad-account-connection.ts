import { isAdAccountConnected } from "@/lib/integrations/integration-connect-config";

/** Row shape from ad_accounts (Ads engine and/or Marketing OS columns). */
export type AdAccountConnectionRow = {
  platform: string;
  external_account_id?: string | null;
  status?: string | null;
  connection_status?: string | null;
  access_token?: string | null;
};

/** Matches Integrations hub “connected” logic, including legacy Marketing OS rows. */
export function isAdAccountRowConnected(row: AdAccountConnectionRow): boolean {
  if (isAdAccountConnected(row)) return true;

  const platform = String(row.platform).toLowerCase();
  if (platform === "zernio" && row.access_token?.trim()) {
    const st = row.status?.toLowerCase();
    if (!st || st === "disconnected" || st === "error") {
      return false;
    }
    return true;
  }

  return false;
}

export function isZernioAdAccountRow(row: AdAccountConnectionRow): boolean {
  return String(row.platform).toLowerCase() === "zernio";
}
