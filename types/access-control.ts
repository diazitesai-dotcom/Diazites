export type PlatformAccountRole = "user" | "owner_admin";

export type PlatformAccountStatus = "active" | "pending" | "suspended";

export type PlatformServiceKey =
  | "basic_services"
  | "mission_control"
  | "email_campaigns"
  | "ai_call"
  | "agents"
  | "ads_management"
  | "workflow_reporting";

export type PlatformPlanKey = "free" | "growth" | "pro" | "enterprise";

export type AccessAuditActionType =
  | "plan_changed"
  | "service_enabled"
  | "service_disabled"
  | "account_suspended"
  | "account_activated";

export type PlatformService = {
  id: string;
  key: PlatformServiceKey;
  label: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
};

export type UserServiceAccessRow = {
  service_key: PlatformServiceKey;
  enabled: boolean;
  enabled_at: string | null;
  disabled_at: string | null;
};

export type CurrentUserAccess = {
  userId: string;
  email: string | null;
  fullName: string | null;
  accountRole: PlatformAccountRole;
  planKey: PlatformPlanKey;
  status: PlatformAccountStatus;
  isOwnerAdmin: boolean;
  enabledServiceKeys: PlatformServiceKey[];
  allServices: PlatformService[];
};

export type AdminUserListItem = {
  userId: string;
  email: string;
  fullName: string | null;
  planKey: PlatformPlanKey;
  accountRole: PlatformAccountRole;
  status: PlatformAccountStatus;
  createdAt: string;
  enabledServiceCount: number;
};

export type AdminUserDetails = {
  user: AdminUserListItem;
  services: Array<
    PlatformService & {
      enabled: boolean;
      enabledAt: string | null;
      disabledAt: string | null;
    }
  >;
  auditLogs: Array<{
    id: string;
    actionType: AccessAuditActionType;
    serviceKey: string | null;
    planKey: string | null;
    previousValue: Record<string, unknown> | null;
    newValue: Record<string, unknown> | null;
    actorUserId: string | null;
    createdAt: string;
  }>;
};
