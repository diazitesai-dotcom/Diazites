import type { PipelineStatus } from "@/types/domain";

/** Maps Leads OS kanban status to native pipeline stage names. */
export const LEAD_STATUS_TO_STAGE_NAME: Record<PipelineStatus, string> = {
  new: "New Lead",
  contacted: "Contacted",
  qualified: "Qualified",
  booked: "Appointment Booked",
  won: "Won",
  lost: "Lost",
};
