import { z } from "zod";

/**
 * Lead intake accepts EITHER a businessId (for internal/admin callers) OR
 * a landingPageSlug (for public landing pages). The route resolves slug ->
 * businessId server-side and rejects requests with neither.
 */
export const createLeadApiSchema = z
  .object({
    businessId: z.string().uuid().optional(),
    landingPageSlug: z.string().min(1).max(160).optional(),
    campaignId: z.string().uuid().optional().nullable(),
    landingPageId: z.string().uuid().optional().nullable(),
    landingPageVersionId: z.string().uuid().optional().nullable(),
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
  })
  .refine((d) => Boolean(d.businessId) || Boolean(d.landingPageSlug), {
    message: "Either businessId or landingPageSlug is required",
    path: ["businessId"],
  });

export type CreateLeadApiInput = z.infer<typeof createLeadApiSchema>;
