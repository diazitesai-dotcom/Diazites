import type { NicheWorkflowDef } from "@/lib/niche/types";
import type { WorkflowDefinition } from "@/types/diazites-platform";

function triggerNode(
  id: string,
  label: string,
  triggerType: string,
  y = 120,
): WorkflowDefinition["nodes"][0] {
  return {
    id,
    type: "trigger",
    label,
    x: 80,
    y,
    config: { triggerType },
  };
}

/** Core inbound lead workflow: tag, welcome email, task, nurture delays (email-only). */
export function buildAutomatedGrowthWorkflow(nicheLabel: string): NicheWorkflowDef {
  const definition: WorkflowDefinition = {
    nodes: [
      triggerNode("t1", "New lead / form / ad lead", "new_lead_created"),
      {
        id: "a1",
        type: "action",
        label: "Assign tag: New Lead",
        x: 300,
        y: 60,
        config: { actionType: "add_tag", tag: "New Lead" },
      },
      {
        id: "a2",
        type: "action",
        label: "Send welcome email",
        x: 300,
        y: 140,
        config: { actionType: "send_email", templateKey: "welcome" },
      },
      {
        id: "a3",
        type: "action",
        label: "Create opportunity in pipeline",
        x: 300,
        y: 220,
        config: { actionType: "move_pipeline_stage", stage: "New Lead" },
      },
      {
        id: "a4",
        type: "action",
        label: "Notify team — follow up",
        x: 300,
        y: 300,
        config: {
          actionType: "create_task",
          title: `Follow up with new ${nicheLabel} lead`,
        },
      },
      {
        id: "w1",
        type: "wait",
        label: "Day 1 — wait 24h",
        x: 520,
        y: 180,
        config: { hours: 24 },
      },
      {
        id: "a5",
        type: "action",
        label: "Day 1 follow-up email",
        x: 720,
        y: 180,
        config: { actionType: "send_email", templateKey: "follow_up_day_1" },
      },
      {
        id: "w2",
        type: "wait",
        label: "Day 3 — wait 48h",
        x: 920,
        y: 180,
        config: { hours: 48 },
      },
      {
        id: "a6",
        type: "action",
        label: "Day 3 reminder email",
        x: 1120,
        y: 180,
        config: { actionType: "send_email", templateKey: "follow_up_day_3" },
      },
      {
        id: "w3",
        type: "wait",
        label: "Day 5 — wait 48h",
        x: 1320,
        y: 180,
        config: { hours: 48 },
      },
      {
        id: "a7",
        type: "action",
        label: "Day 5 — create call task",
        x: 1520,
        y: 180,
        config: {
          actionType: "create_task",
          title: "Call lead — Day 5 follow-up",
          priority: "high",
        },
      },
      {
        id: "w4",
        type: "wait",
        label: "Day 7 — wait 48h",
        x: 1720,
        y: 180,
        config: { hours: 48 },
      },
      {
        id: "a8",
        type: "action",
        label: "Day 7 final follow-up email",
        x: 1920,
        y: 180,
        config: { actionType: "send_email", templateKey: "follow_up_day_7" },
      },
    ],
    edges: [
      { id: "e1", from: "t1", to: "a1" },
      { id: "e2", from: "a1", to: "a2" },
      { id: "e3", from: "a2", to: "a3" },
      { id: "e4", from: "a3", to: "a4" },
      { id: "e5", from: "a4", to: "w1" },
      { id: "e6", from: "w1", to: "a5" },
      { id: "e7", from: "a5", to: "w2" },
      { id: "e8", from: "w2", to: "a6" },
      { id: "e9", from: "a6", to: "w3" },
      { id: "e10", from: "w3", to: "a7" },
      { id: "e11", from: "a7", to: "w4" },
      { id: "e12", from: "w4", to: "a8" },
    ],
  };

  return {
    slug: "niche-automated-growth",
    name: `${nicheLabel} Automated Growth Workflow`,
    description:
      "Triggers on new leads, form submissions, and inquiries. Assigns owner tags, sends welcome + nurture emails, creates tasks, and tracks opportunities.",
    category: "growth",
    triggerType: "new_lead_created",
    definition,
  };
}

export function buildFormCaptureWorkflow(nicheLabel: string): NicheWorkflowDef {
  return {
    slug: "niche-form-capture",
    name: `${nicheLabel} Form & Landing Page Capture`,
    description: "Runs when a contact form or landing page is submitted.",
    category: "capture",
    triggerType: "form_submitted",
    definition: {
      nodes: [
        triggerNode("t1", "Form submitted", "form_submitted"),
        {
          id: "a1",
          type: "action",
          label: "Tag by source",
          x: 300,
          y: 120,
          config: { actionType: "add_tag", tag: "Website Inquiry" },
        },
        {
          id: "a2",
          type: "action",
          label: "Start growth workflow",
          x: 520,
          y: 120,
          config: { actionType: "start_workflow", workflowSlug: "niche-automated-growth" },
        },
      ],
      edges: [
        { id: "e1", from: "t1", to: "a1" },
        { id: "e2", from: "a1", to: "a2" },
      ],
    },
  };
}

export function buildClientOnboardingWorkflow(nicheLabel: string): NicheWorkflowDef {
  return {
    slug: "niche-client-onboarding",
    name: `${nicheLabel} Client Onboarding`,
    description: "Post-win onboarding: welcome packet email, tasks, and pipeline move.",
    category: "onboarding",
    triggerType: "pipeline_stage_changed",
    definition: {
      nodes: [
        triggerNode("t1", "Moved to Won / Client", "pipeline_stage_changed"),
        {
          id: "a1",
          type: "action",
          label: "Send onboarding email",
          x: 320,
          y: 120,
          config: { actionType: "send_email", templateKey: "client_onboarding" },
        },
        {
          id: "a2",
          type: "action",
          label: "Create onboarding checklist task",
          x: 540,
          y: 120,
          config: {
            actionType: "create_task",
            title: "Complete client onboarding checklist",
            priority: "high",
          },
        },
      ],
      edges: [
        { id: "e1", from: "t1", to: "a1" },
        { id: "e2", from: "a1", to: "a2" },
      ],
    },
  };
}
