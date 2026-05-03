import { z } from "zod";

export const createCampaignSchema = z.object({
  businessId: z.string().uuid(),
  platform: z.string().min(1).max(80),
  budget: z.number().nonnegative().optional(),
  goal: z.string().max(200).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  status: z.string().max(40).optional(),
});
