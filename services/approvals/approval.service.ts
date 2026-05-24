import type { SupabaseClient } from "@supabase/supabase-js";

import { ok, fail, type ServiceResult } from "@/lib/result";
import { createApprovalRepository } from "@/repositories/marketing-os.repository";
import { createBusinessRepository } from "@/repositories/business.repository";
import { EVENT_TYPES } from "@/types/backend";
import type { ApprovalStatus, ApprovalType } from "@/types/marketing-os";

import { writeAuditLog } from "@/services/audit/audit.service";
import { triggerEvent } from "@/services/events/event-dispatcher";

const MEDIUM_RISK_THRESHOLD = 50;

export async function requestApprovalIfNeeded(
  client: SupabaseClient,
  input: {
    businessId: string;
    approvalType: ApprovalType;
    title: string;
    description?: string;
    riskScore: number;
    confidenceScore?: number;
    expectedImpact?: string;
    explanation?: Record<string, unknown>;
    payload?: Record<string, unknown>;
    requestedByType?: string;
    requestedById?: string;
    entityType?: string;
    entityId?: string;
  },
): Promise<ServiceResult<{ id: string; autoApproved: boolean }>> {
  const repo = createApprovalRepository(client);

  if (input.riskScore < MEDIUM_RISK_THRESHOLD) {
    return ok({ id: "", autoApproved: true });
  }

  const { data, error } = await repo.create({
    businessId: input.businessId,
    approvalType: input.approvalType,
    title: input.title,
    description: input.description,
    entityType: input.entityType,
    entityId: input.entityId,
    riskScore: input.riskScore,
    confidenceScore: input.confidenceScore,
    expectedImpact: input.expectedImpact,
    explanation: input.explanation,
    payload: input.payload,
    requestedByType: input.requestedByType,
    requestedById: input.requestedById,
  });

  if (error || !data) return fail(error?.message ?? "Failed to create approval");

  await triggerEvent(client, {
    type: EVENT_TYPES.APPROVAL_REQUESTED,
    businessId: input.businessId,
    payload: { approvalId: data.id, type: input.approvalType },
  });

  return ok({ id: data.id, autoApproved: false });
}

export async function listApprovals(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
  pendingOnly = false,
): Promise<ServiceResult<unknown[]>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const repo = createApprovalRepository(client);
  const { data, error } = pendingOnly
    ? await repo.listPending(businessId)
    : await repo.listAll(businessId);
  if (error) return fail(error.message);
  return ok(data ?? []);
}

export async function decideApproval(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
  approvalId: string,
  decision: { status: ApprovalStatus; note?: string },
): Promise<ServiceResult<unknown>> {
  const businesses = createBusinessRepository(client);
  const { data: business } = await businesses.getById(businessId);
  if (!business || business.user_id !== ownerUserId) {
    return fail("Forbidden", "FORBIDDEN");
  }

  const repo = createApprovalRepository(client);
  const { data, error } = await repo.decide(approvalId, businessId, {
    status: decision.status,
    decidedBy: ownerUserId,
    decisionNote: decision.note,
  });

  if (error || !data) return fail(error?.message ?? "Decision failed");

  await writeAuditLog(client, {
    businessId,
    actorUserId: ownerUserId,
    action: `approval.${decision.status}`,
    entityType: "approval_request",
    entityId: approvalId,
    metadata: { note: decision.note },
  });

  await triggerEvent(client, {
    type: EVENT_TYPES.APPROVAL_DECIDED,
    businessId,
    payload: { approvalId, status: decision.status },
  });

  return ok(data);
}

export async function batchApprove(
  client: SupabaseClient,
  ownerUserId: string,
  businessId: string,
  approvalIds: string[],
): Promise<ServiceResult<{ approved: number }>> {
  let approved = 0;
  for (const id of approvalIds) {
    const result = await decideApproval(client, ownerUserId, businessId, id, {
      status: "approved",
      note: "Batch approved",
    });
    if (result.success) approved += 1;
  }
  return ok({ approved });
}
