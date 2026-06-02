import type { NicheBlueprint, NicheId } from "@/lib/niche/types";
import {
  buildAutomatedGrowthWorkflow,
  buildClientOnboardingWorkflow,
  buildFormCaptureWorkflow,
} from "@/lib/niche/workflow-builders";

const COLORS = {
  indigo: "#6366f1",
  violet: "#8b5cf6",
  purple: "#a855f7",
  fuchsia: "#d946ef",
  emerald: "#10b981",
  slate: "#64748b",
  amber: "#f59e0b",
  sky: "#0ea5e9",
};

function standardSalesStages(extra?: { afterQualified?: string }): NicheBlueprint["pipelines"][0]["stages"] {
  const stages: NicheBlueprint["pipelines"][0]["stages"] = [
    {
      name: "New Lead",
      stageType: "open",
      color: COLORS.indigo,
      automations: [
        { name: "Enroll growth workflow", automationType: "enroll_workflow", workflowSlug: "niche-automated-growth" },
        { name: "Tag: New Lead", automationType: "add_tag", config: { tag: "New Lead" } },
        { name: "Welcome email", automationType: "send_email", config: { templateKey: "welcome" } },
      ],
    },
    { name: "Contacted", stageType: "open", color: COLORS.violet },
    { name: "Qualified", stageType: "open", color: COLORS.purple },
  ];
  if (extra?.afterQualified) {
    stages.push({ name: extra.afterQualified, stageType: "open", color: COLORS.fuchsia });
  } else {
    stages.push({ name: "Appointment Scheduled", stageType: "open", color: COLORS.fuchsia });
  }
  stages.push(
    { name: "Proposal / Quote Sent", stageType: "open", color: COLORS.amber },
    { name: "Negotiation", stageType: "open", color: COLORS.sky },
    {
      name: "Won / Client",
      stageType: "won",
      color: COLORS.emerald,
      automations: [
        {
          name: "Client onboarding workflow",
          automationType: "enroll_workflow",
          workflowSlug: "niche-client-onboarding",
        },
      ],
    },
    { name: "Lost / Follow Up Later", stageType: "lost", color: COLORS.slate },
  );
  return stages;
}

function baseWorkflows(displayName: string): NicheBlueprint["workflows"] {
  return [
    buildAutomatedGrowthWorkflow(displayName),
    buildFormCaptureWorkflow(displayName),
    buildClientOnboardingWorkflow(displayName),
  ];
}

const BLUEPRINTS: Record<NicheId, NicheBlueprint> = {
  generic: {
    nicheId: "generic",
    displayName: "General Business",
    pipelines: [
      {
        name: "Sales Pipeline",
        description: "Default sales pipeline with qualification, appointments, and close stages.",
        isDefault: true,
        stages: standardSalesStages(),
      },
    ],
    tags: ["New Lead", "Hot Lead", "Qualified", "Appointment Set", "Proposal Sent", "Follow-Up"],
    workflows: baseWorkflows("General Business"),
    systemWorkflowSlugs: ["appointment-reminder", "missed-call-text-back"],
    seedTasks: [
      { title: "Review auto-generated pipeline & workflows", sourceAgent: "workflow", priority: "high" },
      { title: "Customize welcome email templates", sourceAgent: "email", priority: "medium" },
      { title: "Connect lead capture form or landing page", sourceAgent: "landing_page", priority: "high" },
    ],
    callingObjective: "Qualify inbound leads and book appointments",
    projectBoardName: "Sales Operations",
  },

  real_estate: {
    nicheId: "real_estate",
    displayName: "Real Estate",
    pipelines: [
      {
        name: "Buyer Pipeline",
        description: "Buyer journey from inquiry to closed purchase.",
        isDefault: true,
        stages: [
          { name: "New Inquiry", stageType: "open", color: COLORS.indigo, automations: [{ name: "Growth workflow", automationType: "enroll_workflow", workflowSlug: "niche-automated-growth" }] },
          { name: "Pre-Approved / Qualified", stageType: "open", color: COLORS.violet },
          { name: "Showing Scheduled", stageType: "open", color: COLORS.fuchsia, automations: [{ name: "Showing reminder", automationType: "enroll_workflow", workflowSlug: "appointment-reminder" }] },
          { name: "Offer Submitted", stageType: "open", color: COLORS.amber },
          { name: "Under Contract", stageType: "open", color: COLORS.sky },
          { name: "Closed — Buyer", stageType: "won", color: COLORS.emerald },
          { name: "Nurture Later", stageType: "lost", color: COLORS.slate },
        ],
      },
      {
        name: "Seller Pipeline",
        description: "Listing and seller representation pipeline.",
        stages: [
          { name: "Listing Inquiry", stageType: "open", color: COLORS.indigo },
          { name: "Listing Appointment", stageType: "open", color: COLORS.violet },
          { name: "Listing Signed", stageType: "open", color: COLORS.purple },
          { name: "Active Listing", stageType: "open", color: COLORS.fuchsia },
          { name: "Offer Received", stageType: "open", color: COLORS.amber },
          { name: "Closed — Seller", stageType: "won", color: COLORS.emerald },
          { name: "Lost Listing", stageType: "lost", color: COLORS.slate },
        ],
      },
    ],
    tags: ["Buyer", "Seller", "Investor", "Open House", "Hot Lead", "Showing Booked"],
    workflows: [
      ...baseWorkflows("Real Estate"),
      {
        slug: "open-house-follow-up",
        name: "Open House Follow-Up",
        description: "Nurture open house visitors with email sequence and showing tasks.",
        category: "real_estate",
        triggerType: "tag_added",
        definition: {
          nodes: [
            { id: "t1", type: "trigger", label: "Tag: Open House", x: 80, y: 120, config: { triggerType: "tag_added", tag: "Open House" } },
            { id: "a1", type: "action", label: "Thank-you email", x: 300, y: 120, config: { actionType: "send_email" } },
            { id: "a2", type: "action", label: "Schedule showing task", x: 520, y: 120, config: { actionType: "create_task", title: "Schedule property showing" } },
          ],
          edges: [
            { id: "e1", from: "t1", to: "a1" },
            { id: "e2", from: "a1", to: "a2" },
          ],
        },
      },
      {
        slug: "property-inquiry",
        name: "Property Inquiry Workflow",
        description: "Instant response to property listing inquiries.",
        category: "real_estate",
        triggerType: "form_submitted",
        definition: {
          nodes: [
            { id: "t1", type: "trigger", label: "Property inquiry", x: 80, y: 120, config: { triggerType: "form_submitted" } },
            { id: "a1", type: "action", label: "Tag listing interest", x: 300, y: 120, config: { actionType: "add_tag", tag: "Buyer" } },
            { id: "a2", type: "action", label: "Move to New Inquiry", x: 520, y: 120, config: { actionType: "move_pipeline_stage", stage: "New Inquiry" } },
          ],
          edges: [
            { id: "e1", from: "t1", to: "a1" },
            { id: "e2", from: "a1", to: "a2" },
          ],
        },
      },
    ],
    systemWorkflowSlugs: ["appointment-reminder", "new-lead-follow-up"],
    seedTasks: [
      { title: "Import active listings into CRM", sourceAgent: "crm", priority: "high" },
      { title: "Set up open house capture form", sourceAgent: "landing_page", priority: "medium" },
      { title: "Review buyer & seller pipeline stages", sourceAgent: "workflow", priority: "medium" },
    ],
    callingObjective: "Qualify buyers/sellers and book showings or listing appointments",
    projectBoardName: "Real Estate Transactions",
  },

  restaurant: {
    nicheId: "restaurant",
    displayName: "Restaurant",
    pipelines: [
      {
        name: "Catering Leads Pipeline",
        description: "Corporate and event catering inquiries.",
        isDefault: true,
        stages: [
          { name: "Catering Inquiry", stageType: "open", color: COLORS.indigo, automations: [{ name: "Growth workflow", automationType: "enroll_workflow", workflowSlug: "niche-automated-growth" }] },
          { name: "Menu / Quote Sent", stageType: "open", color: COLORS.violet },
          { name: "Tasting Scheduled", stageType: "open", color: COLORS.fuchsia },
          { name: "Event Booked", stageType: "won", color: COLORS.emerald },
          { name: "Lost / Future Date", stageType: "lost", color: COLORS.slate },
        ],
      },
      {
        name: "Reservation Pipeline",
        description: "Table reservations and large party bookings.",
        stages: [
          { name: "Reservation Request", stageType: "open", color: COLORS.indigo },
          { name: "Confirmed", stageType: "open", color: COLORS.violet },
          { name: "Seated / Completed", stageType: "won", color: COLORS.emerald },
          { name: "No-Show", stageType: "lost", color: COLORS.slate },
        ],
      },
    ],
    tags: ["Catering", "Reservation", "VIP", "Review Requested", "Promo Opt-In"],
    workflows: [
      ...baseWorkflows("Restaurant"),
      {
        slug: "review-request",
        name: "Review Request Automation",
        description: "Ask for reviews after completed visits or events.",
        category: "restaurant",
        triggerType: "pipeline_stage_changed",
        definition: {
          nodes: [
            { id: "t1", type: "trigger", label: "Event completed", x: 80, y: 120, config: { triggerType: "pipeline_stage_changed" } },
            { id: "a1", type: "action", label: "Send review request email", x: 300, y: 120, config: { actionType: "send_email", templateKey: "review_request" } },
            { id: "a2", type: "action", label: "Tag review sent", x: 520, y: 120, config: { actionType: "add_tag", tag: "Review Requested" } },
          ],
          edges: [
            { id: "e1", from: "t1", to: "a1" },
            { id: "e2", from: "a1", to: "a2" },
          ],
        },
      },
      {
        slug: "promo-campaign",
        name: "Promo Campaign Workflow",
        description: "Launch promo emails to opted-in guests.",
        category: "restaurant",
        triggerType: "tag_added",
        definition: {
          nodes: [
            { id: "t1", type: "trigger", label: "Promo opt-in", x: 80, y: 120, config: { triggerType: "tag_added", tag: "Promo Opt-In" } },
            { id: "a1", type: "action", label: "Send promo email", x: 300, y: 120, config: { actionType: "send_email" } },
          ],
          edges: [{ id: "e1", from: "t1", to: "a1" }],
        },
      },
    ],
    systemWorkflowSlugs: ["appointment-reminder"],
    seedTasks: [
      { title: "Connect reservation / catering form", sourceAgent: "landing_page", priority: "high" },
      { title: "Customize review request email", sourceAgent: "email", priority: "medium" },
    ],
    callingObjective: "Book catering events and confirm reservations",
    projectBoardName: "Restaurant Growth",
  },

  med_spa: {
    nicheId: "med_spa",
    displayName: "Med Spa",
    pipelines: [
      {
        name: "Consultation Pipeline",
        description: "Consultation booking through treatment packages.",
        isDefault: true,
        stages: standardSalesStages({ afterQualified: "Consultation Booked" }),
      },
    ],
    tags: ["Consultation", "Treatment Plan", "VIP Client", "Reactivation", "No-Show"],
    workflows: [
      ...baseWorkflows("Med Spa"),
      {
        slug: "treatment-follow-up",
        name: "Treatment Follow-Up",
        description: "Post-treatment care instructions and upsell sequence.",
        category: "med_spa",
        triggerType: "pipeline_stage_changed",
        definition: {
          nodes: [
            { id: "t1", type: "trigger", label: "Won / Client", x: 80, y: 120, config: { triggerType: "pipeline_stage_changed" } },
            { id: "a1", type: "action", label: "Aftercare email", x: 300, y: 120, config: { actionType: "send_email" } },
            { id: "w1", type: "wait", label: "Wait 14 days", x: 500, y: 120, config: { hours: 336 } },
            { id: "a2", type: "action", label: "Rebook reminder", x: 700, y: 120, config: { actionType: "send_email" } },
          ],
          edges: [
            { id: "e1", from: "t1", to: "a1" },
            { id: "e2", from: "a1", to: "w1" },
            { id: "e3", from: "w1", to: "a2" },
          ],
        },
      },
      {
        slug: "reactivation-campaign",
        name: "Reactivation Campaign",
        description: "Win back inactive clients with email offers.",
        category: "med_spa",
        triggerType: "manual",
        definition: {
          nodes: [
            { id: "t1", type: "trigger", label: "Manual reactivation", x: 80, y: 120, config: { triggerType: "manual" } },
            { id: "a1", type: "action", label: "Reactivation email", x: 300, y: 120, config: { actionType: "send_email", templateKey: "reactivation" } },
            { id: "a2", type: "action", label: "Tag reactivation", x: 520, y: 120, config: { actionType: "add_tag", tag: "Reactivation" } },
          ],
          edges: [
            { id: "e1", from: "t1", to: "a1" },
            { id: "e2", from: "a1", to: "a2" },
          ],
        },
      },
    ],
    systemWorkflowSlugs: ["appointment-reminder", "new-lead-follow-up"],
    seedTasks: [
      { title: "Set consultation booking link on landing page", sourceAgent: "landing_page", priority: "high" },
      { title: "Review treatment follow-up email copy", sourceAgent: "email", priority: "medium" },
    ],
    callingObjective: "Book med spa consultations and treatment plans",
    projectBoardName: "Med Spa Client Journey",
  },

  law_firm: {
    nicheId: "law_firm",
    displayName: "Law Firm",
    pipelines: [
      {
        name: "Intake Pipeline",
        description: "Legal intake from inquiry to retained client.",
        isDefault: true,
        stages: [
          { name: "New Intake", stageType: "open", color: COLORS.indigo, automations: [{ name: "Growth workflow", automationType: "enroll_workflow", workflowSlug: "niche-automated-growth" }] },
          { name: "Consultation Scheduled", stageType: "open", color: COLORS.violet },
          { name: "Consultation Complete", stageType: "open", color: COLORS.purple },
          { name: "Documents Pending", stageType: "open", color: COLORS.amber },
          { name: "Retainer Sent", stageType: "open", color: COLORS.sky },
          { name: "Retained Client", stageType: "won", color: COLORS.emerald },
          { name: "Declined / Refer Out", stageType: "lost", color: COLORS.slate },
        ],
      },
    ],
    tags: ["Intake", "Consultation", "Retainer", "Documents Needed", "Urgent"],
    workflows: [
      ...baseWorkflows("Law Firm"),
      {
        slug: "document-collection",
        name: "Document Collection Workflow",
        description: "Request intake documents after consultation.",
        category: "law",
        triggerType: "pipeline_stage_changed",
        definition: {
          nodes: [
            { id: "t1", type: "trigger", label: "Documents Pending", x: 80, y: 120, config: { triggerType: "pipeline_stage_changed" } },
            { id: "a1", type: "action", label: "Document request email", x: 300, y: 120, config: { actionType: "send_email" } },
            { id: "a2", type: "action", label: "Create doc review task", x: 520, y: 120, config: { actionType: "create_task", title: "Review submitted intake documents" } },
          ],
          edges: [
            { id: "e1", from: "t1", to: "a1" },
            { id: "e2", from: "a1", to: "a2" },
          ],
        },
      },
      {
        slug: "retainer-follow-up",
        name: "Retainer Follow-Up",
        description: "Follow up on unsigned retainer agreements.",
        category: "law",
        triggerType: "pipeline_stage_changed",
        definition: {
          nodes: [
            { id: "t1", type: "trigger", label: "Retainer Sent", x: 80, y: 120, config: { triggerType: "pipeline_stage_changed" } },
            { id: "w1", type: "wait", label: "Wait 48h", x: 280, y: 120, config: { hours: 48 } },
            { id: "a1", type: "action", label: "Retainer reminder email", x: 480, y: 120, config: { actionType: "send_email" } },
          ],
          edges: [
            { id: "e1", from: "t1", to: "w1" },
            { id: "e2", from: "w1", to: "a1" },
          ],
        },
      },
    ],
    systemWorkflowSlugs: ["appointment-reminder"],
    seedTasks: [
      { title: "Upload retainer & intake form links", sourceAgent: "workflow", priority: "high" },
      { title: "Configure consultation booking calendar", sourceAgent: "crm", priority: "high" },
    ],
    callingObjective: "Qualify legal matters and book consultations",
    projectBoardName: "Legal Intake",
  },

  marketing_agency: {
    nicheId: "marketing_agency",
    displayName: "Marketing Agency",
    pipelines: [
      {
        name: "Discovery Call Pipeline",
        description: "Agency new business from lead to signed client.",
        isDefault: true,
        stages: [
          { name: "New Lead", stageType: "open", color: COLORS.indigo, automations: [{ name: "Growth workflow", automationType: "enroll_workflow", workflowSlug: "niche-automated-growth" }] },
          { name: "Discovery Scheduled", stageType: "open", color: COLORS.violet },
          { name: "Discovery Complete", stageType: "open", color: COLORS.purple },
          { name: "Proposal Sent", stageType: "open", color: COLORS.amber },
          { name: "Negotiation", stageType: "open", color: COLORS.sky },
          { name: "Client Signed", stageType: "won", color: COLORS.emerald },
          { name: "Lost / Nurture", stageType: "lost", color: COLORS.slate },
        ],
      },
      {
        name: "Proposal Pipeline",
        description: "Track proposal revisions and approvals.",
        stages: [
          { name: "Drafting Proposal", stageType: "open", color: COLORS.indigo },
          { name: "Internal Review", stageType: "open", color: COLORS.violet },
          { name: "Sent to Client", stageType: "open", color: COLORS.fuchsia },
          { name: "Approved", stageType: "won", color: COLORS.emerald },
          { name: "Rejected", stageType: "lost", color: COLORS.slate },
        ],
      },
    ],
    tags: ["Discovery", "Proposal", "Onboarding", "Upsell", "Churn Risk"],
    workflows: [
      ...baseWorkflows("Marketing Agency"),
      {
        slug: "campaign-launch",
        name: "Campaign Launch Workflow",
        description: "Kick off client campaigns after onboarding.",
        category: "agency",
        triggerType: "pipeline_stage_changed",
        definition: {
          nodes: [
            { id: "t1", type: "trigger", label: "Client signed", x: 80, y: 120, config: { triggerType: "pipeline_stage_changed" } },
            { id: "a1", type: "action", label: "Launch checklist task", x: 300, y: 120, config: { actionType: "create_task", title: "Complete campaign launch checklist" } },
            { id: "a2", type: "action", label: "Notify ads agent", x: 520, y: 120, config: { actionType: "trigger_ai_agent", agentKey: "ads" } },
          ],
          edges: [
            { id: "e1", from: "t1", to: "a1" },
            { id: "e2", from: "a1", to: "a2" },
          ],
        },
      },
      {
        slug: "upsell-automation",
        name: "Upsell Automation",
        description: "Identify expansion opportunities after 60 days.",
        category: "agency",
        triggerType: "manual",
        definition: {
          nodes: [
            { id: "t1", type: "trigger", label: "Manual upsell review", x: 80, y: 120, config: { triggerType: "manual" } },
            { id: "a1", type: "action", label: "Upsell outreach email", x: 300, y: 120, config: { actionType: "send_email" } },
            { id: "a2", type: "action", label: "Tag upsell", x: 520, y: 120, config: { actionType: "add_tag", tag: "Upsell" } },
          ],
          edges: [
            { id: "e1", from: "t1", to: "a1" },
            { id: "e2", from: "a1", to: "a2" },
          ],
        },
      },
    ],
    systemWorkflowSlugs: ["new-lead-follow-up", "appointment-reminder"],
    seedTasks: [
      { title: "Customize discovery call script", sourceAgent: "workflow", priority: "medium" },
      { title: "Set up client onboarding workflow", sourceAgent: "workflow", priority: "high" },
      { title: "Connect ad accounts for first client", sourceAgent: "ads", priority: "high" },
    ],
    callingObjective: "Book discovery calls and close agency retainers",
    projectBoardName: "Agency New Business",
  },

  nonprofit: {
    nicheId: "nonprofit",
    displayName: "Nonprofit",
    pipelines: [
      {
        name: "Donor Pipeline",
        description: "Donor cultivation and stewardship.",
        isDefault: true,
        stages: [
          { name: "New Donor Lead", stageType: "open", color: COLORS.indigo, automations: [{ name: "Growth workflow", automationType: "enroll_workflow", workflowSlug: "niche-automated-growth" }] },
          { name: "Engaged", stageType: "open", color: COLORS.violet },
          { name: "First Gift", stageType: "open", color: COLORS.purple },
          { name: "Recurring Donor", stageType: "won", color: COLORS.emerald },
          { name: "Lapsed", stageType: "lost", color: COLORS.slate },
        ],
      },
      {
        name: "Grant Tracking Pipeline",
        description: "Grant research through award or rejection.",
        stages: [
          { name: "Prospect Identified", stageType: "open", color: COLORS.indigo },
          { name: "Application In Progress", stageType: "open", color: COLORS.violet },
          { name: "Submitted", stageType: "open", color: COLORS.fuchsia },
          { name: "Awarded", stageType: "won", color: COLORS.emerald },
          { name: "Declined", stageType: "lost", color: COLORS.slate },
        ],
      },
    ],
    tags: ["Donor", "Volunteer", "Grant", "Event Registrant", "Major Gift"],
    workflows: [
      ...baseWorkflows("Nonprofit"),
      {
        slug: "donation-follow-up",
        name: "Donation Follow-Up",
        description: "Thank donors and suggest next engagement.",
        category: "nonprofit",
        triggerType: "manual",
        definition: {
          nodes: [
            { id: "t1", type: "trigger", label: "Donation recorded", x: 80, y: 120, config: { triggerType: "manual" } },
            { id: "a1", type: "action", label: "Thank-you email", x: 300, y: 120, config: { actionType: "send_email", templateKey: "donation_thanks" } },
          ],
          edges: [{ id: "e1", from: "t1", to: "a1" }],
        },
      },
      {
        slug: "event-registration",
        name: "Event Registration Workflow",
        description: "Confirm event signups and send reminders.",
        category: "nonprofit",
        triggerType: "form_submitted",
        definition: {
          nodes: [
            { id: "t1", type: "trigger", label: "Event registration", x: 80, y: 120, config: { triggerType: "form_submitted" } },
            { id: "a1", type: "action", label: "Confirmation email", x: 300, y: 120, config: { actionType: "send_email" } },
            { id: "a2", type: "action", label: "Tag registrant", x: 520, y: 120, config: { actionType: "add_tag", tag: "Event Registrant" } },
          ],
          edges: [
            { id: "e1", from: "t1", to: "a1" },
            { id: "e2", from: "a1", to: "a2" },
          ],
        },
      },
      {
        slug: "volunteer-onboarding",
        name: "Volunteer Workflow",
        description: "Onboard new volunteers with tasks and welcome email.",
        category: "nonprofit",
        triggerType: "tag_added",
        definition: {
          nodes: [
            { id: "t1", type: "trigger", label: "Volunteer tag", x: 80, y: 120, config: { triggerType: "tag_added", tag: "Volunteer" } },
            { id: "a1", type: "action", label: "Welcome volunteer email", x: 300, y: 120, config: { actionType: "send_email" } },
            { id: "a2", type: "action", label: "Orientation task", x: 520, y: 120, config: { actionType: "create_task", title: "Schedule volunteer orientation" } },
          ],
          edges: [
            { id: "e1", from: "t1", to: "a1" },
            { id: "e2", from: "a1", to: "a2" },
          ],
        },
      },
    ],
    systemWorkflowSlugs: ["new-lead-follow-up"],
    seedTasks: [
      { title: "Import donor list", sourceAgent: "crm", priority: "high" },
      { title: "Set up event registration form", sourceAgent: "landing_page", priority: "medium" },
    ],
    callingObjective: "Engage donors and book stewardship calls",
    projectBoardName: "Nonprofit Programs",
  },

  home_services: {
    nicheId: "home_services",
    displayName: "Home Services",
    pipelines: [
      {
        name: "Estimate Pipeline",
        description: "HVAC / home services estimate through job completion.",
        isDefault: true,
        stages: [
          { name: "New Lead", stageType: "open", color: COLORS.indigo, automations: [{ name: "Growth workflow", automationType: "enroll_workflow", workflowSlug: "niche-automated-growth" }] },
          { name: "Contacted", stageType: "open", color: COLORS.violet },
          { name: "Estimate Scheduled", stageType: "open", color: COLORS.fuchsia },
          { name: "Quote Sent", stageType: "open", color: COLORS.amber },
          { name: "Job Booked", stageType: "open", color: COLORS.sky },
          { name: "Job Complete", stageType: "won", color: COLORS.emerald },
          { name: "Lost / Seasonal Nurture", stageType: "lost", color: COLORS.slate },
        ],
      },
    ],
    tags: ["Estimate", "Emergency", "Maintenance Plan", "Review Requested", "Hot Lead"],
    workflows: [
      ...baseWorkflows("Home Services"),
      {
        slug: "service-booking",
        name: "Service Booking Workflow",
        description: "Confirm booked jobs and send prep instructions.",
        category: "home_services",
        triggerType: "appointment_booked",
        definition: {
          nodes: [
            { id: "t1", type: "trigger", label: "Job booked", x: 80, y: 120, config: { triggerType: "appointment_booked" } },
            { id: "a1", type: "action", label: "Booking confirmation email", x: 300, y: 120, config: { actionType: "send_email" } },
            { id: "a2", type: "action", label: "Dispatch prep task", x: 520, y: 120, config: { actionType: "create_task", title: "Prepare technician dispatch" } },
          ],
          edges: [
            { id: "e1", from: "t1", to: "a1" },
            { id: "e2", from: "a1", to: "a2" },
          ],
        },
      },
      {
        slug: "technician-dispatch",
        name: "Technician Dispatch Flow",
        description: "Create dispatch tasks when estimate converts to job.",
        category: "home_services",
        triggerType: "pipeline_stage_changed",
        definition: {
          nodes: [
            { id: "t1", type: "trigger", label: "Job Booked", x: 80, y: 120, config: { triggerType: "pipeline_stage_changed" } },
            { id: "a1", type: "action", label: "Assign dispatch task", x: 300, y: 120, config: { actionType: "create_task", title: "Assign technician to job" } },
          ],
          edges: [{ id: "e1", from: "t1", to: "a1" }],
        },
      },
      {
        slug: "review-request-hvac",
        name: "Review Request Automation",
        description: "Request Google reviews after completed jobs.",
        category: "home_services",
        triggerType: "pipeline_stage_changed",
        definition: {
          nodes: [
            { id: "t1", type: "trigger", label: "Job Complete", x: 80, y: 120, config: { triggerType: "pipeline_stage_changed" } },
            { id: "w1", type: "wait", label: "Wait 24h", x: 280, y: 120, config: { hours: 24 } },
            { id: "a1", type: "action", label: "Review request email", x: 480, y: 120, config: { actionType: "send_email", templateKey: "review_request" } },
          ],
          edges: [
            { id: "e1", from: "t1", to: "w1" },
            { id: "e2", from: "w1", to: "a1" },
          ],
        },
      },
    ],
    systemWorkflowSlugs: ["appointment-reminder", "missed-call-text-back"],
    seedTasks: [
      { title: "Connect estimate request form", sourceAgent: "landing_page", priority: "high" },
      { title: "Set technician dispatch rules", sourceAgent: "workflow", priority: "medium" },
      { title: "Enable review request after jobs", sourceAgent: "email", priority: "low" },
    ],
    callingObjective: "Book estimates and dispatch technicians",
    projectBoardName: "Field Operations",
  },
};

export function getNicheBlueprint(nicheId: NicheId): NicheBlueprint {
  return BLUEPRINTS[nicheId] ?? BLUEPRINTS.generic;
}

export function formatNicheProvisionSummary(blueprint: NicheBlueprint): string {
  const pipelineList = blueprint.pipelines.map((p) => p.name).join(", ");
  const workflowList = blueprint.workflows.map((w) => w.name).join(", ");
  return `${blueprint.displayName}: pipelines [${pipelineList}]; workflows [${workflowList}]`;
}
