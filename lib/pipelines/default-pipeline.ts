/** Default GHL-style sales pipeline stages for new businesses. */
export const DEFAULT_PIPELINE_STAGES: Array<{
  name: string;
  stageType: "open" | "won" | "lost";
  color: string;
}> = [
  { name: "New Lead", stageType: "open", color: "#6366f1" },
  { name: "Contacted", stageType: "open", color: "#8b5cf6" },
  { name: "Qualified", stageType: "open", color: "#a855f7" },
  { name: "Appointment Booked", stageType: "open", color: "#d946ef" },
  { name: "Won", stageType: "won", color: "#10b981" },
  { name: "Lost", stageType: "lost", color: "#64748b" },
];

export const STAGE_AUTOMATION_TYPE_LABELS: Record<string, string> = {
  enroll_workflow: "Enroll in workflow",
  send_email: "Send email",
  add_tag: "Add tag",
  create_task: "Create task",
  move_pipeline_stage: "Move to stage",
  trigger_webhook: "Webhook",
  wait: "Wait / delay",
};
