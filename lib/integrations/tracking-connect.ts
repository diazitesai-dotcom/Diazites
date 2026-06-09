import type { TrackingPlatform } from "@/repositories/ad-account.repository";

export const TRACKING_INTEGRATION_IDS = new Set(["ga4", "meta_pixel", "gtm"]);

export type TrackingConnectSpec = {
  platform: TrackingPlatform;
  fieldLabel: string;
  placeholder: string;
  hint: string;
  metaKey: string;
};

const SPECS: Record<string, TrackingConnectSpec> = {
  ga4: {
    platform: "ga4",
    fieldLabel: "GA4 Measurement ID",
    placeholder: "G-XXXXXXXXXX",
    hint: "Admin → Data Streams → your web stream → Measurement ID",
    metaKey: "measurementId",
  },
  meta_pixel: {
    platform: "meta_pixel",
    fieldLabel: "Meta Pixel ID",
    placeholder: "1234567890123456",
    hint: "Events Manager → Data sources → your Pixel → Pixel ID",
    metaKey: "pixelId",
  },
  gtm: {
    platform: "gtm",
    fieldLabel: "GTM Container ID",
    placeholder: "GTM-XXXXXXX",
    hint: "Google Tag Manager → Admin → Container ID",
    metaKey: "containerId",
  },
};

export function getTrackingConnectSpec(integrationId: string): TrackingConnectSpec | null {
  return SPECS[integrationId] ?? null;
}

export function isTrackingIntegration(integrationId: string): boolean {
  return TRACKING_INTEGRATION_IDS.has(integrationId);
}

export function validateTrackingValue(
  integrationId: string,
  value: string,
): { ok: true } | { ok: false; error: string } {
  const trimmed = value.trim();
  if (!trimmed) return { ok: false, error: "Enter a value to connect." };

  if (integrationId === "ga4") {
    if (!/^G-[A-Z0-9]{6,}$/i.test(trimmed)) {
      return { ok: false, error: "GA4 Measurement ID should look like G-XXXXXXXXXX." };
    }
    return { ok: true };
  }

  if (integrationId === "meta_pixel") {
    if (!/^\d{10,20}$/.test(trimmed)) {
      return { ok: false, error: "Meta Pixel ID is usually a 15–16 digit number." };
    }
    return { ok: true };
  }

  if (integrationId === "gtm") {
    if (!/^GTM-[A-Z0-9]+$/i.test(trimmed)) {
      return { ok: false, error: "GTM Container ID should look like GTM-XXXXXXX." };
    }
    return { ok: true };
  }

  return { ok: false, error: "Unsupported tracking integration." };
}
