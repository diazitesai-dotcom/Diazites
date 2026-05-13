import { z } from "zod";

export const TRACK_EVENT_TYPES = [
  "page_view",
  "cta_click",
  "form_view",
  "form_submit",
  "scroll_depth",
  "engagement",
] as const;

export const trackEventApiSchema = z.object({
  type: z.enum(TRACK_EVENT_TYPES),
  landingPageSlug: z.string().min(1).max(120).optional(),
  businessId: z.string().uuid().optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export type TrackEventInput = z.infer<typeof trackEventApiSchema>;
