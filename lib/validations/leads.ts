import { z } from "zod";

export const createLeadApiSchema = z.object({
  businessId: z.string().uuid(),
  campaignId: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(200),
  phone: z.string().max(50).optional().nullable(),
  email: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
  address: z.string().max(500).optional().nullable(),
  roofingNeed: z.string().max(500).optional().nullable(),
  timeline: z.string().max(200).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  source: z.string().max(100).optional().nullable(),
});

export type CreateLeadApiInput = z.infer<typeof createLeadApiSchema>;
