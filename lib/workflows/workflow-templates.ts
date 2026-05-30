import type { WorkflowDefinition } from "@/types/diazites-platform";

function baseTrigger(id = "trigger-1"): WorkflowDefinition["nodes"][0] {
  return {
    id,
    type: "trigger",
    label: "New lead created",
    x: 80,
    y: 120,
    config: { triggerType: "new_lead_created" },
  };
}

export const SYSTEM_WORKFLOW_TEMPLATES: Array<{
  slug: string;
  name: string;
  description: string;
  category: string;
  definition: WorkflowDefinition;
}> = [
  {
    slug: "new-lead-follow-up",
    name: "New Lead Follow-Up",
    description: "Welcome SMS, wait, AI follow-up, pipeline moves, and team task.",
    category: "sales",
    definition: {
      nodes: [
        baseTrigger(),
        { id: "a1", type: "action", label: "Add tag: New Lead", x: 280, y: 80, config: { actionType: "add_tag", tag: "New Lead" } },
        { id: "a2", type: "action", label: "Send welcome SMS", x: 280, y: 160, config: { actionType: "send_sms" } },
        { id: "w1", type: "wait", label: "Wait 5 minutes", x: 480, y: 120, config: { minutes: 5 } },
        { id: "a3", type: "action", label: "Trigger AI Follow-Up Agent", x: 680, y: 120, config: { actionType: "trigger_ai_agent", agentKey: "follow_up" } },
        { id: "b1", type: "branch", label: "Replied?", x: 880, y: 120, config: { condition: "lead_replied" } },
        { id: "a4", type: "action", label: "Move to Contacted", x: 1080, y: 60, config: { actionType: "move_pipeline_stage", stage: "Contacted" } },
        { id: "a5", type: "action", label: "24h follow-up SMS", x: 1080, y: 180, config: { actionType: "send_sms", delayHours: 24 } },
      ],
      edges: [
        { id: "e1", from: "trigger-1", to: "a1" },
        { id: "e2", from: "a1", to: "a2" },
        { id: "e3", from: "a2", to: "w1" },
        { id: "e4", from: "w1", to: "a3" },
        { id: "e5", from: "a3", to: "b1" },
        { id: "e6", from: "b1", to: "a4", label: "Yes" },
        { id: "e7", from: "b1", to: "a5", label: "No" },
      ],
    },
  },
  {
    slug: "missed-call-text-back",
    name: "Missed Call Text Back",
    description: "Instant SMS after missed call with booking link.",
    category: "calls",
    definition: {
      nodes: [
        { id: "t1", type: "trigger", label: "Missed call", x: 80, y: 120, config: { triggerType: "missed_call" } },
        { id: "a1", type: "action", label: "Send SMS", x: 320, y: 120, config: { actionType: "send_sms" } },
        { id: "a2", type: "action", label: "Create task", x: 560, y: 120, config: { actionType: "create_task" } },
      ],
      edges: [
        { id: "e1", from: "t1", to: "a1" },
        { id: "e2", from: "a1", to: "a2" },
      ],
    },
  },
  {
    slug: "appointment-reminder",
    name: "Appointment Reminder",
    description: "Reminder SMS and email before booked appointments.",
    category: "appointments",
    definition: {
      nodes: [
        { id: "t1", type: "trigger", label: "Appointment booked", x: 80, y: 120, config: { triggerType: "appointment_booked" } },
        { id: "w1", type: "wait", label: "Wait until 24h before", x: 300, y: 120, config: { hoursBeforeAppointment: 24 } },
        { id: "a1", type: "action", label: "Send reminder SMS", x: 520, y: 120, config: { actionType: "send_sms" } },
      ],
      edges: [
        { id: "e1", from: "t1", to: "w1" },
        { id: "e2", from: "w1", to: "a1" },
      ],
    },
  },
  {
    slug: "ai-call-follow-up",
    name: "AI Call Follow-Up",
    description: "Post-call SMS, workflow trigger, and pipeline update.",
    category: "calls",
    definition: {
      nodes: [
        { id: "t1", type: "trigger", label: "Outbound call completed", x: 80, y: 120, config: { triggerType: "outbound_call_completed" } },
        { id: "a1", type: "action", label: "Log note", x: 300, y: 120, config: { actionType: "add_internal_note" } },
        { id: "a2", type: "action", label: "Trigger nurture workflow", x: 520, y: 120, config: { actionType: "start_workflow" } },
      ],
      edges: [
        { id: "e1", from: "t1", to: "a1" },
        { id: "e2", from: "a1", to: "a2" },
      ],
    },
  },
];

export const WORKFLOW_TRIGGER_OPTIONS = [
  { id: "new_lead_created", label: "New lead created" },
  { id: "form_submitted", label: "Contact form submitted" },
  { id: "landing_page_submission", label: "Landing page form submitted" },
  { id: "missed_call", label: "Missed call" },
  { id: "inbound_call", label: "Incoming call" },
  { id: "outbound_call_completed", label: "Outbound call completed" },
  { id: "sms_received", label: "SMS received" },
  { id: "email_opened", label: "Email opened" },
  { id: "appointment_booked", label: "Appointment booked" },
  { id: "appointment_missed", label: "Appointment missed" },
  { id: "pipeline_stage_changed", label: "Pipeline stage changed" },
  { id: "tag_added", label: "Tag added" },
  { id: "manual", label: "Manual trigger" },
] as const;

export const WORKFLOW_ACTION_OPTIONS = [
  { id: "send_sms", label: "Send SMS" },
  { id: "send_email", label: "Send email" },
  { id: "add_tag", label: "Add tag" },
  { id: "remove_tag", label: "Remove tag" },
  { id: "move_pipeline_stage", label: "Move pipeline stage" },
  { id: "create_task", label: "Create task" },
  { id: "trigger_ai_agent", label: "Trigger AI agent" },
  { id: "trigger_ai_calling_agent", label: "Trigger AI calling agent" },
  { id: "book_appointment", label: "Book appointment" },
  { id: "score_lead", label: "Score lead" },
  { id: "add_internal_note", label: "Add internal note" },
  { id: "start_workflow", label: "Start another workflow" },
  { id: "create_project_task", label: "Create project task" },
] as const;
