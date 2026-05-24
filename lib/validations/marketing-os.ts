import { z } from "zod";

export const landingPageSubmitSchema = z.object({
  businessId: z.string().uuid(),
  landingPageId: z.string().uuid().optional().nullable(),
  landingPageVersionId: z.string().uuid().optional().nullable(),
  campaignId: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(200),
  phone: z.string().max(50).optional().nullable(),
  email: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
  address: z.string().max(500).optional().nullable(),
  roofingNeed: z.string().max(500).optional().nullable(),
  timeline: z.string().max(200).optional().nullable(),
  budget: z.string().max(200).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  source: z.string().max(100).optional().nullable(),
  customFields: z.record(z.string(), z.unknown()).optional(),
  utmSource: z.string().max(100).optional().nullable(),
  utmMedium: z.string().max(100).optional().nullable(),
  utmCampaign: z.string().max(100).optional().nullable(),
});

export const connectAdAccountSchema = z.object({
  platform: z.enum(["meta", "google", "tiktok", "microsoft", "zernio", "zapier", "other"]),
  accountName: z.string().max(200).optional(),
  externalAccountId: z.string().max(200).optional(),
  credentials: z.record(z.string(), z.string()).refine((obj) => Object.keys(obj).length > 0, {
    message: "At least one credential required",
  }),
});
