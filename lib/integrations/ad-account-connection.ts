import { isAdAccountConnected } from "@/lib/integrations/integration-connect-config";

/** Row shape from ad_accounts (Ads engine and/or Marketing OS columns). */
export type AdAccountConnectionRow = {
  platform: string;
  external_account_id?: string | null;
  status?: string | null;
  connection_status?: string | null;
  access_token?: string | null;
  credentials_encrypted?: string | null;
};

/** Matches Integrations hub “connected” logic, including legacy Marketing OS rows. */
export function isAdAccountRowConnected(row: AdAccountConnectionRow): boolean {
  if (isAdAccountConnected(row)) return true;

  const platform = String(row.platform).toLowerCase();
  if (platform !== "zernio") return false;
  if (!row.access_token?.trim() && !row.credentials_encrypted?.trim()) return false;

  const st = row.status?.toLowerCase();
  const cs = row.connection_status?.toLowerCase();
  if (st === "disconnected" || st === "error") return false;
  if (cs === "not_connected" || cs === "disconnected") return false;
  return true;
}

export function isZernioAdAccountRow(row: AdAccountConnectionRow): boolean {
  return String(row.platform).toLowerCase() === "zernio";
}
