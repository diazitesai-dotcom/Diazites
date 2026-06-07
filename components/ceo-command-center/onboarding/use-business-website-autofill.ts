"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  createEmptyBusinessProfile,
  isScannableWebsiteUrl,
  normalizeWebsiteUrlClient,
  sanitizeBusinessProfile,
} from "@/lib/ceo-command-center/business-profile-utils";
import type { BusinessProfileFields } from "@/types/ceo-command-center";

const AUTO_SCAN_DEBOUNCE_MS = 900;

type ScanResult = {
  profile: BusinessProfileFields;
  usedAi: boolean;
};

export function useBusinessWebsiteAutofill(
  initialWebsite = "",
  initialProfile?: Partial<BusinessProfileFields>,
) {
  const [websiteUrl, setWebsiteUrl] = useState(initialWebsite);
  const [profile, setProfile] = useState<BusinessProfileFields>(() =>
    sanitizeBusinessProfile(initialProfile ?? {}, initialWebsite),
  );
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const lastScannedUrlRef = useRef<string | null>(null);
  const scanInFlightRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runScan = useCallback(async (rawUrl: string, { force = false } = {}) => {
    const normalized = normalizeWebsiteUrlClient(rawUrl);
    if (!normalized || !isScannableWebsiteUrl(rawUrl)) {
      return;
    }

    if (!force && lastScannedUrlRef.current === normalized) {
      return;
    }

    if (scanInFlightRef.current) {
      return;
    }

    scanInFlightRef.current = true;
    setIsScanning(true);
    setScanError(null);
    setScanMessage(null);

    try {
      const response = await fetch("/api/onboarding/scan-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ websiteUrl: normalized }),
      });

      const payload = (await response.json()) as ScanResult & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not scan website.");
      }

      setProfile(sanitizeBusinessProfile(payload.profile, normalized));
      setWebsiteUrl(payload.profile.website || normalized);
      lastScannedUrlRef.current = normalized;
      setScanMessage(
        payload.usedAi
          ? "AI filled in your business details — review and edit anything before continuing."
          : "We pulled details from your website — review and edit before continuing.",
      );
    } catch (error) {
      lastScannedUrlRef.current = null;
      setScanError(error instanceof Error ? error.message : "Scan failed. Try again.");
    } finally {
      scanInFlightRef.current = false;
      setIsScanning(false);
    }
  }, []);

  const scheduleAutoScan = useCallback(
    (rawUrl: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      if (!isScannableWebsiteUrl(rawUrl)) {
        return;
      }

      debounceTimerRef.current = setTimeout(() => {
        void runScan(rawUrl);
      }, AUTO_SCAN_DEBOUNCE_MS);
    },
    [runScan],
  );

  const handleWebsiteChange = useCallback(
    (value: string) => {
      setWebsiteUrl(value);
      setScanError(null);
      scheduleAutoScan(value);
    },
    [scheduleAutoScan],
  );

  const handleWebsiteBlur = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (isScannableWebsiteUrl(websiteUrl)) {
      void runScan(websiteUrl, { force: true });
    }
  }, [runScan, websiteUrl]);

  const scanNow = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const url = websiteUrl.trim();
    if (!url) {
      setScanError("Enter your business website URL first.");
      setScanMessage(null);
      return;
    }

    if (!isScannableWebsiteUrl(url)) {
      setScanError("Enter a valid website URL (e.g. https://yourbusiness.com).");
      setScanMessage(null);
      return;
    }

    void runScan(url, { force: true });
  }, [runScan, websiteUrl]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    websiteUrl,
    setWebsiteUrl: handleWebsiteChange,
    profile,
    setProfile,
    isScanning,
    scanError,
    scanMessage,
    scanNow,
    handleWebsiteBlur,
  };
}
