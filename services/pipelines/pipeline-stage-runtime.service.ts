import type { SupabaseClient } from "@supabase/supabase-js";

import { createPipelineRepository, type PipelineStageAutomationRow } from "@/repositories/pipeline.repository";
import { sendEmail } from "@/services/email/email.service";
import { logAgentActivity } from "@/services/platform/agent-activity.service";
import { sendSms } from "@/services/sms/sms.service";
import type { WorkflowDefinition } from "@/types/diazites-platform";

import { moveContactToPipelineStage } from "./contact-pipeline.service";

export type ContactPipelineContext = {
  id: string;
  business_id: string;
  lead_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  pipeline_id: string | null;
  pipeline_stage_id: string | null;
};

type RunResult = { ok: boolean; detail?: string };

function interpolate(template: string, ctx: Record<string, unknown>): string {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path: string) => {
    const parts = path.split(".");
    let cur: unknown = ctx;
    for (const p of parts) {
      if (cur && typeof cur === "object" && p in (cur as object)) {
        cur = (cur as Record<string, unknown>)[p];
      } else {
        return "";
      }
    }
    return cur != null ? String(cur) : "";
  });
}

function buildAutomationContext(
  contact: ContactPipelineContext,
  stage: { id: string; name: string; pipeline_id: string },
  pipelineName: string,
): Record<string, unknown> {
  return {
    contact: {
      id: contact.id,
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
    },
    stage: { id: stage.id, name: stage.name },
    pipeline: { id: stage.pipeline_id, name: pipelineName },
  };
}

async function logAutomationRun(
  client: SupabaseClient,
  input: {
    businessId: string;
    contactId: string;
    stageId: string;
    automation: PipelineStageAutomationRow;
    result: RunResult;
  },
): Promise<void> {
  await logAgentActivity(client, {
    businessId: input.businessId,
    agentKey: "pipeline_automation",
    actionType: input.automation.automation_type,
    entityType: "contact",
    entityId: input.contactId,
    payload: {
      automationId: input.automation.id,
      automationName: input.automation.name,
      stageId: input.stageId,
      ok: input.result.ok,
      detail: input.result.detail,
    },
  });
}

async function enrollInWorkflow(
  client: SupabaseClient,
  businessId: string,
  workflowId: string,
  contact: ContactPipelineContext,
): Promise<RunResult> {
  const { data: wf, error } = await client
    .from("diazites_workflows")
    .select("id, name, status, definition")
    .eq("id", workflowId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error || !wf) return { ok: false, detail: "workflow not found" };
  if (wf.status !== "active") {
    return { ok: false, detail: `workflow "${wf.name}" is not active (status: ${wf.status})` };
  }

  const definition = wf.definition as WorkflowDefinition;
  const triggerNode =
    definition.nodes?.find((n) => n.type === "trigger") ?? definition.nodes?.[0];
  const triggerNodeId = triggerNode?.id ?? "trigger-1";

  const enrollmentRow = {
    business_id: businessId,
    workflow_id: workflowId,
    contact_id: contact.id,
    lead_id: contact.lead_id,
    status: "active" as const,
  };

  const { error: enrollErr } = await client.from("workflow_enrollments").upsert(enrollmentRow, {
    onConflict: "workflow_id,contact_id,lead_id",
    ignoreDuplicates: false,
  });

  if (enrollErr) {
    return { ok: false, detail: enrollErr.message };
  }

  const { data: run, error: runErr } = await client
    .from("workflow_runs")
    .insert({
      business_id: businessId,
      workflow_id: workflowId,
      contact_id: contact.id,
      lead_id: contact.lead_id,
      status: "running",
      current_node_id: triggerNodeId,
    })
    .select("id")
    .single();

  if (runErr || !run) {
    return { ok: false, detail: runErr?.message ?? "workflow run failed" };
  }

  await client.from("workflow_run_steps").insert({
    run_id: run.id,
    node_id: triggerNodeId,
    action_type: String(triggerNode?.config?.triggerType ?? "pipeline_stage_changed"),
    status: "completed",
    payload: { enrolledFrom: "pipeline_stage_enter" },
    executed_at: new Date().toISOString(),
  });

  return { ok: true, detail: `enrolled in ${wf.name}` };
}

async function executeAutomation(
  client: SupabaseClient,
  automation: PipelineStageAutomationRow,
  contact: ContactPipelineContext,
  stage: { id: string; name: string; pipeline_id: string },
  pipelineName: string,
  depth: number,
): Promise<RunResult> {
  const config = (automation.config ?? {}) as Record<string, unknown>;
  const ctx = buildAutomationContext(contact, stage, pipelineName);

  switch (automation.automation_type) {
    case "enroll_workflow": {
      const workflowId = automation.workflow_id ?? (config.workflowId as string | undefined);
      if (!workflowId) return { ok: false, detail: "no workflow_id" };
      return enrollInWorkflow(client, contact.business_id, workflowId, contact);
    }
    case "send_sms": {
      const to = interpolate(String(config.to ?? contact.phone ?? ""), ctx);
      const body = interpolate(
        String(config.bodyTemplate ?? `Hi ${contact.name}, welcome to ${stage.name}.`),
        ctx,
      );
      if (!to) return { ok: false, detail: "contact has no phone" };
      return sendSms({ to, body });
    }
    case "send_email": {
      const to = contact.email;
      if (!to) return { ok: false, detail: "contact has no email" };
      const subject = interpolate(String(config.subject ?? "Update from your team"), ctx);
      const text = interpolate(
        String(config.bodyTemplate ?? `Hi ${contact.name}, you are now in stage: ${stage.name}.`),
        ctx,
      );
      const sent = await sendEmail({ to, subject, text });
      return sent.success ? { ok: true } : { ok: false, detail: sent.error };
    }
    case "add_tag": {
      const tagName = String(config.tagName ?? automation.name ?? "Pipeline");
      const { data: existing } = await client
        .from("tags")
        .select("id")
        .eq("business_id", contact.business_id)
        .eq("name", tagName)
        .maybeSingle();
      let tagId = existing?.id;
      if (!tagId) {
        const { data: created } = await client
          .from("tags")
          .insert({ business_id: contact.business_id, name: tagName })
          .select("id")
          .single();
        tagId = created?.id;
      }
      if (!tagId) return { ok: false, detail: "tag create failed" };
      await client.from("contact_tags").upsert(
        { contact_id: contact.id, tag_id: tagId },
        { onConflict: "contact_id,tag_id", ignoreDuplicates: true },
      );
      return { ok: true, detail: `tag ${tagName}` };
    }
    case "create_task": {
      const { data: board } = await client
        .from("project_boards")
        .select("id")
        .eq("business_id", contact.business_id)
        .limit(1)
        .maybeSingle();
      if (!board) return { ok: false, detail: "no project board" };
      const title = interpolate(
        String(config.title ?? automation.name ?? `Follow up: ${contact.name}`),
        ctx,
      );
      await client.from("project_tasks").insert({
        business_id: contact.business_id,
        board_id: board.id,
        title,
        description: interpolate(String(config.description ?? ""), ctx) || null,
        status: "todo",
        priority: (config.priority as string) ?? "medium",
      });
      return { ok: true };
    }
    case "move_pipeline_stage": {
      if (depth >= 3) return { ok: false, detail: "max pipeline depth" };
      const targetStageId = config.targetStageId as string | undefined;
      const targetStageName = config.targetStageName as string | undefined;
      if (!targetStageId && !targetStageName) {
        return { ok: false, detail: "missing target stage" };
      }
      let stageId = targetStageId;
      if (!stageId && targetStageName) {
        const { data: target } = await client
          .from("pipeline_stages")
          .select("id")
          .eq("pipeline_id", stage.pipeline_id)
          .eq("business_id", contact.business_id)
          .ilike("name", targetStageName)
          .limit(1)
          .maybeSingle();
        stageId = target?.id;
      }
      if (!stageId) return { ok: false, detail: "target stage not found" };
      const moved = await moveContactToPipelineStage(client, {
        contactId: contact.id,
        businessId: contact.business_id,
        pipelineId: stage.pipeline_id,
        stageId,
        depth: depth + 1,
      });
      return moved.success ? { ok: true } : { ok: false, detail: moved.error };
    }
    case "trigger_webhook": {
      const url = String(config.url ?? "").trim();
      if (!url) return { ok: false, detail: "missing webhook url" };
      try {
        const res = await fetch(url, {
          method: (String(config.method ?? "POST")).toUpperCase(),
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event: "pipeline_stage_enter", ...ctx, automationId: automation.id }),
        });
        return res.ok
          ? { ok: true, detail: `HTTP ${res.status}` }
          : { ok: false, detail: `HTTP ${res.status}` };
      } catch (e) {
        return { ok: false, detail: e instanceof Error ? e.message : "webhook failed" };
      }
    }
    case "wait": {
      const minutes = Number(config.minutes ?? 0);
      return {
        ok: true,
        detail: minutes > 0 ? `wait ${minutes}m (logged; scheduler not yet wired)` : "wait logged",
      };
    }
    default:
      return { ok: false, detail: `unknown type ${automation.automation_type}` };
  }
}

/**
 * Runs all enabled stage-entry automations when a contact lands on a pipeline stage.
 */
export async function runStageAutomationsForContact(
  client: SupabaseClient,
  input: {
    businessId: string;
    contact: ContactPipelineContext;
    pipelineId: string;
    stageId: string;
    depth?: number;
  },
): Promise<void> {
  const depth = input.depth ?? 0;
  if (depth > 3) return;

  const repo = createPipelineRepository(client);
  const [{ data: stage }, { data: pipeline }, { data: automations }] = await Promise.all([
    client
      .from("pipeline_stages")
      .select("id, name, pipeline_id")
      .eq("id", input.stageId)
      .eq("business_id", input.businessId)
      .maybeSingle(),
    repo.getPipeline(input.pipelineId, input.businessId),
    repo.listStageAutomations(input.pipelineId, input.businessId),
  ]);

  if (!stage || !pipeline) return;

  const stageRows = ((automations ?? []) as PipelineStageAutomationRow[]).filter(
    (a) => a.pipeline_stage_id === input.stageId && a.enabled,
  );

  const seenWorkflowIds = new Set<string>();

  for (const automation of stageRows.sort((a, b) => a.sort_order - b.sort_order)) {
    if (automation.workflow_id) seenWorkflowIds.add(automation.workflow_id);
    const result = await executeAutomation(
      client,
      automation,
      input.contact,
      stage,
      pipeline.name,
      depth,
    );
    await logAutomationRun(client, {
      businessId: input.businessId,
      contactId: input.contact.id,
      stageId: input.stageId,
      automation,
      result,
    });
  }

  const { data: linkedWorkflows } = await client
    .from("diazites_workflows")
    .select("id, name, status")
    .eq("business_id", input.businessId)
    .eq("pipeline_stage_id", input.stageId)
    .eq("status", "active");

  for (const wf of linkedWorkflows ?? []) {
    if (seenWorkflowIds.has(wf.id)) continue;
    const pseudo: PipelineStageAutomationRow = {
      id: wf.id,
      business_id: input.businessId,
      pipeline_id: input.pipelineId,
      pipeline_stage_id: input.stageId,
      name: wf.name,
      automation_type: "enroll_workflow",
      workflow_id: wf.id,
      config: { trigger: "on_stage_enter" },
      enabled: true,
      sort_order: 999,
      created_at: "",
      updated_at: "",
    };
    const result = await enrollInWorkflow(client, input.businessId, wf.id, input.contact);
    await logAutomationRun(client, {
      businessId: input.businessId,
      contactId: input.contact.id,
      stageId: input.stageId,
      automation: pseudo,
      result,
    });
  }
}
