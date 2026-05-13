import type { SupabaseClient } from "@supabase/supabase-js";

// ─── Approvals ───────────────────────────────────────────────────────────

export type ApprovalSubjectKind =
  | "engine_decision" | "engine_launch" | "ad_campaign" | "asset";
export type ApprovalState = "pending" | "approved" | "rejected";

export type ApprovalRow = {
  id: string;
  business_id: string;
  subject_kind: ApprovalSubjectKind;
  subject_id: string;
  state: ApprovalState;
  requested_by: string | null;
  decided_by: string | null;
  decided_at: string | null;
  note: string | null;
  created_at: string;
};

export function createApprovalRepository(client: SupabaseClient) {
  return {
    async listPendingForBusiness(businessId: string, limit = 50) {
      return client
        .from("approvals")
        .select("*")
        .eq("business_id", businessId)
        .eq("state", "pending")
        .order("created_at", { ascending: false })
        .limit(limit);
    },

    async listForBusiness(businessId: string, limit = 50) {
      return client
        .from("approvals")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(limit);
    },

    async request(input: {
      businessId: string;
      subjectKind: ApprovalSubjectKind;
      subjectId: string;
      requestedBy?: string | null;
      note?: string | null;
    }) {
      return client
        .from("approvals")
        .insert({
          business_id: input.businessId,
          subject_kind: input.subjectKind,
          subject_id: input.subjectId,
          requested_by: input.requestedBy ?? null,
          note: input.note ?? null,
        })
        .select("*")
        .single();
    },

    async decide(input: {
      id: string;
      decidedBy: string;
      state: "approved" | "rejected";
      note?: string | null;
    }) {
      return client
        .from("approvals")
        .update({
          state: input.state,
          decided_by: input.decidedBy,
          decided_at: new Date().toISOString(),
          note: input.note ?? null,
        })
        .eq("id", input.id)
        .select("*")
        .single();
    },
  };
}

// ─── Audit Logs ──────────────────────────────────────────────────────────

export type AuditLogRow = {
  id: string;
  business_id: string | null;
  actor_user_id: string | null;
  action: string;
  target_kind: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export function createAuditLogRepository(client: SupabaseClient) {
  return {
    async record(input: {
      businessId?: string | null;
      actorUserId?: string | null;
      action: string;
      targetKind?: string | null;
      targetId?: string | null;
      metadata?: Record<string, unknown>;
    }) {
      return client.from("audit_logs").insert({
        business_id: input.businessId ?? null,
        actor_user_id: input.actorUserId ?? null,
        action: input.action,
        target_kind: input.targetKind ?? null,
        target_id: input.targetId ?? null,
        metadata: input.metadata ?? {},
      });
    },

    async listForBusiness(businessId: string, limit = 100) {
      return client
        .from("audit_logs")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(limit);
    },

    async listAll(limit = 200) {
      return client
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
    },
  };
}

// ─── Notifications ───────────────────────────────────────────────────────

export type NotificationKind =
  | "new_lead"
  | "approval_requested"
  | "engine_launched"
  | "engine_failed"
  | "budget_alert"
  | "system";

export type NotificationRow = {
  id: string;
  user_id: string;
  business_id: string | null;
  kind: NotificationKind;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export function createNotificationRepository(client: SupabaseClient) {
  return {
    async listForUser(userId: string, limit = 30) {
      return client
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);
    },

    async countUnread(userId: string) {
      return client
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .is("read_at", null);
    },

    async create(input: {
      userId: string;
      businessId?: string | null;
      kind: NotificationKind;
      title: string;
      body?: string | null;
      link?: string | null;
    }) {
      return client.from("notifications").insert({
        user_id: input.userId,
        business_id: input.businessId ?? null,
        kind: input.kind,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
      });
    },

    async markRead(id: string) {
      return client
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", id);
    },

    async markAllReadForUser(userId: string) {
      return client
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", userId)
        .is("read_at", null);
    },
  };
}

// ─── Team Members ────────────────────────────────────────────────────────

export type TeamRole = "owner" | "admin" | "member" | "viewer";

export type TeamMemberRow = {
  id: string;
  business_id: string;
  user_id: string | null;
  email: string;
  role: TeamRole;
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
};

export function createTeamMemberRepository(client: SupabaseClient) {
  return {
    async listForBusiness(businessId: string) {
      return client
        .from("team_members")
        .select("*")
        .eq("business_id", businessId)
        .order("invited_at", { ascending: false });
    },

    async invite(input: {
      businessId: string;
      email: string;
      role: TeamRole;
      invitedBy: string;
    }) {
      return client
        .from("team_members")
        .upsert(
          {
            business_id: input.businessId,
            email: input.email.toLowerCase().trim(),
            role: input.role,
            invited_by: input.invitedBy,
            invited_at: new Date().toISOString(),
          },
          { onConflict: "business_id,email" },
        )
        .select("*")
        .single();
    },

    async setRole(id: string, role: TeamRole) {
      return client
        .from("team_members")
        .update({ role })
        .eq("id", id)
        .select("*")
        .single();
    },

    async remove(id: string) {
      return client.from("team_members").delete().eq("id", id);
    },
  };
}
