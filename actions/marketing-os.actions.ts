"use server";

import { revalidatePath } from "next/cache";

import { requireBusinessContext } from "@/lib/auth/business-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  connectAdAccount,
  disconnectAdAccount,
  listAdAccounts,
  syncAdAccountCampaigns,
  testAdAccountConnection,
} from "@/services/ad-accounts/ad-account.service";
import {
  batchApprove,
  decideApproval,
  listApprovals,
} from "@/services/approvals/approval.service";
import { startGrowthEngineRun, listGrowthEngineRuns } from "@/services/growth-engine/growth-engine.service";
import { generateAndSaveThreeLandingPages } from "@/services/funnel/funnel-ai-generator.service";
import { isValidFunnelInput, parseFunnelInput } from "@/lib/funnel/parse-funnel-input";
import {
  addLandingPageAsset,
  cloneLandingPage,
  createLandingPageVariant,
  createLandingPageWithVersions,
  getLandingPageEditorState,
  listLandingPagesForBusiness,
  publishLandingPage,
  archiveLandingPage,
  pushLandingPageToCampaign,
  suggestAbTestWinner,
  updateLandingPageVersion,
  updateGeneratedLandingPageCopy,
} from "@/services/landing/landing-page-editor.service";
import {
  decideRecommendation,
  listOptimizationRecommendations,
} from "@/services/optimization/marketing-os-recommendations.service";
import {
  listAgentPermissions,
  updateAgentPermission,
} from "@/services/permissions/agent-permission.service";
import type { AdPlatform } from "@/types/marketing-os";
import type { LandingFormField, LandingSection, LandingVersionLabel } from "@/types/marketing-os";
import type { AgentPermissionKey } from "@/types/marketing-os";

async function ctx() {
  const supabase = await createServerSupabaseClient();
  const result = await requireBusinessContext(supabase);
  if (!result.ok) throw new Error(result.error);
  return { supabase, ...result.ctx };
}

export async function generateThreeLandingPagesAction(prompt: string) {
  const parsed = parseFunnelInput(prompt);
  if (!isValidFunnelInput(parsed)) {
    return {
      ok: false as const,
      error:
        parsed.kind === "url"
          ? "Enter a valid URL like domain.com, www.domain.com, or https://domain.com"
          : "Enter a keyword or business description (at least 3 characters).",
    };
  }

  const { supabase, userId, businessId } = await ctx();
  const result = await generateAndSaveThreeLandingPages(supabase, userId, businessId, prompt);
  if (!result.success) return { ok: false as const, error: result.error };
  revalidatePath("/dashboard/funnel");
  return { ok: true as const, data: result.data };
}

export async function createLandingPageAction(input: {
  headline: string;
  subheadline?: string;
  offer: string;
  ctaText?: string;
  location: string;
  audience?: string;
  industry?: string;
}) {
  const { supabase, userId, businessId } = await ctx();
  const result = await createLandingPageWithVersions(supabase, userId, businessId, input);
  if (!result.success) return { ok: false as const, error: result.error };
  revalidatePath("/dashboard/funnel");
  return { ok: true as const, data: result.data };
}

export async function updateGeneratedLandingPageCopyAction(
  landingPageId: string,
  versionId: string,
  patch: {
    headline: string;
    subheadline?: string;
    offer?: string;
    ctaText?: string;
  },
) {
  const { supabase, userId, businessId } = await ctx();
  const result = await updateGeneratedLandingPageCopy(
    supabase,
    userId,
    businessId,
    landingPageId,
    versionId,
    patch,
  );
  if (!result.success) return { ok: false as const, error: result.error };
  revalidatePath("/dashboard/funnel");
  return { ok: true as const, data: result.data };
}

export async function saveLandingPageVersionAction(
  versionId: string,
  patch: {
    sections?: LandingSection[];
    formFields?: LandingFormField[];
    name?: string;
    trafficWeight?: number;
  },
) {
  const { supabase, userId, businessId } = await ctx();
  const result = await updateLandingPageVersion(supabase, userId, businessId, versionId, patch);
  if (!result.success) return { ok: false as const, error: result.error };
  revalidatePath("/dashboard/funnel");
  return { ok: true as const };
}

export async function publishLandingPageAction(landingPageId: string, versionId: string) {
  const { supabase, userId, businessId } = await ctx();
  const result = await publishLandingPage(supabase, userId, businessId, landingPageId, versionId);
  if (!result.success) return { ok: false as const, error: result.error };
  revalidatePath("/dashboard/funnel");
  return { ok: true as const, data: result.data };
}

export async function createVariantAction(
  landingPageId: string,
  sourceVersionId: string,
  label: LandingVersionLabel,
  name: string,
) {
  const { supabase, userId, businessId } = await ctx();
  const result = await createLandingPageVariant(
    supabase,
    userId,
    businessId,
    landingPageId,
    sourceVersionId,
    label,
    name,
  );
  if (!result.success) return { ok: false as const, error: result.error };
  revalidatePath("/dashboard/funnel");
  return { ok: true as const, data: result.data };
}

export async function cloneLandingPageAction(landingPageId: string) {
  const { supabase, userId, businessId } = await ctx();
  const result = await cloneLandingPage(supabase, userId, businessId, landingPageId);
  if (!result.success) return { ok: false as const, error: result.error };
  revalidatePath("/dashboard/funnel");
  return { ok: true as const, data: result.data };
}

export async function archiveLandingPageAction(landingPageId: string) {
  const { supabase, userId, businessId } = await ctx();
  const result = await archiveLandingPage(supabase, userId, businessId, landingPageId);
  if (!result.success) return { ok: false as const, error: result.error };
  revalidatePath("/dashboard/funnel");
  return { ok: true as const };
}

export async function pushLandingPageToCampaignAction(landingPageId: string, campaignId: string) {
  const { supabase, userId, businessId } = await ctx();
  const result = await pushLandingPageToCampaign(
    supabase,
    userId,
    businessId,
    landingPageId,
    campaignId,
  );
  if (!result.success) return { ok: false as const, error: result.error };
  revalidatePath("/dashboard/funnel");
  revalidatePath("/dashboard/campaign-ops");
  revalidatePath("/dashboard/campaigns");
  return { ok: true as const };
}

export async function suggestWinnerAction(landingPageId: string) {
  const { supabase, businessId } = await ctx();
  const result = await suggestAbTestWinner(supabase, businessId, landingPageId);
  if (!result.success) return { ok: false as const, error: result.error };
  revalidatePath("/dashboard/funnel");
  return { ok: true as const, data: result.data };
}

export async function addAssetAction(input: {
  landingPageId: string;
  assetType: string;
  fileUrl: string;
  fileName?: string;
}) {
  const { supabase, userId, businessId } = await ctx();
  const result = await addLandingPageAsset(supabase, userId, businessId, input);
  if (!result.success) return { ok: false as const, error: result.error };
  revalidatePath("/dashboard/funnel");
  return { ok: true as const };
}

export async function loadFunnelEditorAction(landingPageId: string) {
  const { supabase, userId, businessId } = await ctx();
  const result = await getLandingPageEditorState(supabase, userId, businessId, landingPageId);
  if (!result.success) return { ok: false as const, error: result.error };
  return { ok: true as const, data: result.data };
}

export async function listLandingPagesAction() {
  const { supabase, userId, businessId } = await ctx();
  const result = await listLandingPagesForBusiness(supabase, userId, businessId);
  if (!result.success) return { ok: false as const, error: result.error };
  return { ok: true as const, data: result.data };
}

export async function connectAdAccountAction(input: {
  platform: AdPlatform;
  accountName?: string;
  externalAccountId?: string;
  credentials: Record<string, string>;
}) {
  const { supabase, userId, businessId } = await ctx();
  const result = await connectAdAccount(supabase, userId, businessId, input);
  if (!result.success) return { ok: false as const, error: result.error };
  revalidatePath("/dashboard/campaign-ops");
  revalidatePath("/dashboard/ads");
  return { ok: true as const, data: result.data };
}

export async function testAdAccountAction(adAccountId: string) {
  const { supabase, userId, businessId } = await ctx();
  const result = await testAdAccountConnection(supabase, userId, businessId, adAccountId);
  if (!result.success) return { ok: false as const, error: result.error };
  revalidatePath("/dashboard/campaign-ops");
  revalidatePath("/dashboard/ads");
  return { ok: true as const, data: result.data };
}

export async function syncAdAccountAction(adAccountId: string) {
  const { supabase, userId, businessId } = await ctx();
  const result = await syncAdAccountCampaigns(supabase, userId, businessId, adAccountId);
  if (!result.success) return { ok: false as const, error: result.error };
  revalidatePath("/dashboard/campaign-ops");
  revalidatePath("/dashboard/ads");
  revalidatePath("/dashboard/campaign-ops");
  revalidatePath("/dashboard/campaigns");
  return { ok: true as const, data: result.data };
}

export async function disconnectAdAccountAction(adAccountId: string) {
  const { supabase, userId, businessId } = await ctx();
  const result = await disconnectAdAccount(supabase, userId, businessId, adAccountId);
  if (!result.success) return { ok: false as const, error: result.error };
  revalidatePath("/dashboard/campaign-ops");
  revalidatePath("/dashboard/ads");
  return { ok: true as const };
}

export async function listAdAccountsAction() {
  const { supabase, userId, businessId } = await ctx();
  const result = await listAdAccounts(supabase, userId, businessId);
  if (!result.success) return { ok: false as const, error: result.error };
  return { ok: true as const, data: result.data };
}

export async function listApprovalsAction(pendingOnly = false) {
  const { supabase, userId, businessId } = await ctx();
  const result = await listApprovals(supabase, userId, businessId, pendingOnly);
  if (!result.success) return { ok: false as const, error: result.error };
  return { ok: true as const, data: result.data };
}

export async function decideApprovalAction(
  approvalId: string,
  status: "approved" | "rejected" | "modified",
  note?: string,
) {
  const { supabase, userId, businessId } = await ctx();
  const result = await decideApproval(supabase, userId, businessId, approvalId, { status, note });
  if (!result.success) return { ok: false as const, error: result.error };
  revalidatePath("/dashboard/approvals");
  return { ok: true as const };
}

export async function batchApproveAction(approvalIds: string[]) {
  const { supabase, userId, businessId } = await ctx();
  const result = await batchApprove(supabase, userId, businessId, approvalIds);
  if (!result.success) return { ok: false as const, error: result.error };
  revalidatePath("/dashboard/approvals");
  return { ok: true as const, data: result.data };
}

export async function listOptimizationsAction() {
  const { supabase, userId, businessId } = await ctx();
  const result = await listOptimizationRecommendations(supabase, userId, businessId);
  if (!result.success) return { ok: false as const, error: result.error };
  return { ok: true as const, data: result.data };
}

export async function decideOptimizationAction(
  recommendationId: string,
  decision: "approved" | "rejected" | "applied",
) {
  const { supabase, userId, businessId } = await ctx();
  const result = await decideRecommendation(supabase, userId, businessId, recommendationId, decision);
  if (!result.success) return { ok: false as const, error: result.error };
  revalidatePath("/dashboard/optimization");
  return { ok: true as const };
}

export async function listAgentPermissionsAction() {
  const { supabase, userId, businessId } = await ctx();
  const result = await listAgentPermissions(supabase, userId, businessId);
  if (!result.success) return { ok: false as const, error: result.error };
  return { ok: true as const, data: result.data };
}

export async function updateAgentPermissionAction(input: {
  permissionKey: AgentPermissionKey;
  granted: boolean;
  requiresApproval?: boolean;
}) {
  const { supabase, userId, businessId } = await ctx();
  const result = await updateAgentPermission(supabase, userId, businessId, input);
  if (!result.success) return { ok: false as const, error: result.error };
  revalidatePath("/dashboard/campaign-ops");
  revalidatePath("/dashboard/ads");
  return { ok: true as const };
}

export async function startGrowthEngineAction(inputUrl: string) {
  const { supabase, userId, businessId } = await ctx();
  const result = await startGrowthEngineRun(supabase, userId, businessId, inputUrl);
  if (!result.success) return { ok: false as const, error: result.error };
  revalidatePath("/dashboard/engine");
  return { ok: true as const, data: result.data };
}

export async function listGrowthEngineRunsAction() {
  const { supabase, userId, businessId } = await ctx();
  const result = await listGrowthEngineRuns(supabase, userId, businessId);
  if (!result.success) return { ok: false as const, error: result.error };
  return { ok: true as const, data: result.data };
}
