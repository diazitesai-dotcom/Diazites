import type { SupabaseClient } from "@supabase/supabase-js";

import { getPublicAppUrl } from "@/lib/env";
import { getPaymentProcessor } from "@/lib/payments/processor-registry";
import { fail, ok, type ServiceResult } from "@/lib/result";
import { createMerchantRepository } from "@/repositories/merchant.repository";
import type { MerchantPaymentEventKind, PaymentProcessor } from "@/types/merchant-services";

import { handleMerchantPaymentAutomation } from "@/services/merchant/merchant-payment-automation.service";

function computeFees(
  amount: number,
  feeConfig: {
    platform_fee_percent: number;
    platform_fee_flat: number;
    agency_revenue_share_percent: number;
  },
) {
  const platformFee = amount * (Number(feeConfig.platform_fee_percent) / 100) + Number(feeConfig.platform_fee_flat);
  const agencyShare = amount * (Number(feeConfig.agency_revenue_share_percent) / 100);
  const netAmount = amount - platformFee - agencyShare;
  return { platformFee, agencyShare, netAmount };
}

export async function requestMerchantActivation(
  client: SupabaseClient,
  input: {
    businessId: string;
    ownerUserId: string;
    processor?: PaymentProcessor;
    connectionType?: "stripe_connect" | "external_api" | "manual";
    notes?: string;
  },
): Promise<ServiceResult<{ requestId: string }>> {
  const repo = createMerchantRepository(client);
  const { data: business } = await client
    .from("businesses")
    .select("id, name, user_id")
    .eq("id", input.businessId)
    .maybeSingle();
  if (!business || business.user_id !== input.ownerUserId) {
    return fail("You do not have permission to activate merchant services for this business.");
  }

  const { data: existing } = await repo.getMerchantAccount(input.businessId);
  if (existing?.status === "active") {
    return fail("Merchant services are already active for this business.");
  }

  const { data: managed } = await client
    .from("agency_managed_businesses")
    .select("agency_id")
    .eq("business_id", input.businessId)
    .maybeSingle();

  const { data: request, error } = await repo.createActivationRequest({
    businessId: input.businessId,
    agencyId: managed?.agency_id ?? null,
    requestedBy: input.ownerUserId,
    processor: input.processor ?? "stripe",
    connectionType: input.connectionType ?? "stripe_connect",
    notes: input.notes,
  });
  if (error || !request) return fail(error?.message ?? "Failed to create activation request");

  await repo.upsertMerchantAccount({
    businessId: input.businessId,
    agencyId: managed?.agency_id ?? null,
    processor: input.processor ?? "stripe",
    connectionType: input.connectionType ?? "stripe_connect",
    status: "pending_approval",
  });

  await repo.logAudit({
    businessId: input.businessId,
    agencyId: managed?.agency_id ?? null,
    actorUserId: input.ownerUserId,
    actionType: "merchant_activation_requested",
    entityType: "merchant_activation_request",
    entityId: request.id,
    details: { processor: input.processor ?? "stripe" },
  });

  return ok({ requestId: request.id });
}

export async function approveMerchantActivation(
  client: SupabaseClient,
  input: {
    requestId: string;
    adminUserId: string;
    processor?: PaymentProcessor;
    notes?: string;
  },
): Promise<ServiceResult<{ onboardingUrl?: string }>> {
  const repo = createMerchantRepository(client);
  const { data: request } = await client
    .from("merchant_activation_requests")
    .select("*")
    .eq("id", input.requestId)
    .maybeSingle();
  if (!request || request.status !== "pending") {
    return fail("Activation request not found or already reviewed.");
  }

  const processor = input.processor ?? (request.processor as PaymentProcessor);
  await repo.reviewActivationRequest(input.requestId, "approved", input.adminUserId, input.notes);

  const { data: business } = await client
    .from("businesses")
    .select("id, name, user_id")
    .eq("id", request.business_id)
    .maybeSingle();
  if (!business) return fail("Business not found");

  const { data: userRow } = await client
    .from("users")
    .select("email")
    .eq("id", business.user_id)
    .maybeSingle();

  let onboardingUrl: string | undefined;
  let processorAccountId: string | null = null;

  if (processor === "stripe" && request.connection_type === "stripe_connect") {
    const stripe = getPaymentProcessor("stripe");
    const { accountId } = await stripe.createConnectAccount({
      businessId: request.business_id,
      email: userRow?.email ?? "merchant@diazites.com",
      businessName: business.name,
    });
    processorAccountId = accountId;
    const base = getPublicAppUrl();
    const { url } = await stripe.createOnboardingLink({
      connectedAccountId: accountId,
      refreshUrl: `${base}/dashboard/merchant-services?onboarding=refresh`,
      returnUrl: `${base}/dashboard/merchant-services?onboarding=complete`,
    });
    onboardingUrl = url;
  }

  await repo.upsertMerchantAccount({
    businessId: request.business_id,
    agencyId: request.agency_id,
    processor,
    connectionType: request.connection_type as "stripe_connect" | "external_api" | "manual",
    status: processorAccountId ? "onboarding" : "active",
    processorAccountId,
    approvedBy: input.adminUserId,
  });

  await repo.logAudit({
    businessId: request.business_id,
    agencyId: request.agency_id,
    actorUserId: input.adminUserId,
    actionType: "merchant_activation_approved",
    entityType: "merchant_activation_request",
    entityId: request.id,
    details: { processor, processorAccountId },
  });

  await seedMerchantAiAgents(client, request.business_id);

  return ok({ onboardingUrl });
}

export async function denyMerchantActivation(
  client: SupabaseClient,
  requestId: string,
  adminUserId: string,
  notes?: string,
): Promise<ServiceResult<{ ok: true }>> {
  const repo = createMerchantRepository(client);
  const { data: request } = await client
    .from("merchant_activation_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();
  if (!request || request.status !== "pending") {
    return fail("Activation request not found or already reviewed.");
  }

  await repo.reviewActivationRequest(requestId, "denied", adminUserId, notes);
  await repo.updateMerchantAccountStatus(request.business_id, "rejected");

  await repo.logAudit({
    businessId: request.business_id,
    actorUserId: adminUserId,
    actionType: "merchant_activation_denied",
    entityType: "merchant_activation_request",
    entityId: requestId,
    details: { notes },
  });

  return ok({ ok: true });
}

export async function deactivateMerchantServices(
  client: SupabaseClient,
  businessId: string,
  actorUserId: string,
): Promise<ServiceResult<{ ok: true }>> {
  const repo = createMerchantRepository(client);
  await repo.updateMerchantAccountStatus(businessId, "deactivated");
  await repo.logAudit({
    businessId,
    actorUserId,
    actionType: "merchant_deactivated",
    entityType: "merchant_account",
    details: {},
  });
  return ok({ ok: true });
}

export async function connectStripeForBusiness(
  client: SupabaseClient,
  businessId: string,
  ownerUserId: string,
): Promise<ServiceResult<{ url: string }>> {
  const repo = createMerchantRepository(client);
  const { data: business } = await client
    .from("businesses")
    .select("id, name, user_id")
    .eq("id", businessId)
    .maybeSingle();
  if (!business || business.user_id !== ownerUserId) {
    return fail("Permission denied.");
  }

  const { data: account } = await repo.getMerchantAccount(businessId);
  if (!account || !["active", "onboarding"].includes(account.status)) {
    return fail("Merchant services must be approved before connecting Stripe.");
  }

  const stripe = getPaymentProcessor("stripe");
  let connectedId = account.processor_account_id;
  if (!connectedId) {
    const { data: userRow } = await client
      .from("users")
      .select("email")
      .eq("id", business.user_id)
      .maybeSingle();
    const created = await stripe.createConnectAccount({
      businessId,
      email: userRow?.email ?? "merchant@diazites.com",
      businessName: business.name,
    });
    connectedId = created.accountId;
    await repo.upsertMerchantAccount({
      businessId,
      processorAccountId: connectedId,
      status: "onboarding",
    });
  }

  const base = getPublicAppUrl();
  const { url } = await stripe.createOnboardingLink({
    connectedAccountId: connectedId,
    refreshUrl: `${base}/dashboard/merchant-services?onboarding=refresh`,
    returnUrl: `${base}/dashboard/merchant-services?onboarding=complete`,
  });

  return ok({ url });
}

export async function createMerchantPaymentLink(
  client: SupabaseClient,
  input: {
    businessId: string;
    ownerUserId: string;
    name: string;
    amount?: number;
    currency?: string;
  },
): Promise<ServiceResult<{ url: string; linkId: string }>> {
  const repo = createMerchantRepository(client);
  const { data: business } = await client
    .from("businesses")
    .select("user_id")
    .eq("id", input.businessId)
    .maybeSingle();
  if (!business || business.user_id !== input.ownerUserId) return fail("Permission denied.");

  const { data: account } = await repo.getMerchantAccount(input.businessId);
  if (!account || account.status !== "active") {
    return fail("Activate merchant services before creating payment links.");
  }

  const processor = getPaymentProcessor(account.processor as PaymentProcessor);
  const { linkId, url } = await processor.createPaymentLink({
    businessId: input.businessId,
    name: input.name,
    amount: input.amount,
    currency: input.currency,
    connectedAccountId: account.processor_account_id ?? undefined,
  });

  await repo.insertPaymentLink({
    business_id: input.businessId,
    merchant_account_id: account.id,
    processor: account.processor as PaymentProcessor,
    processor_link_id: linkId,
    name: input.name,
    amount: input.amount ?? null,
    currency: input.currency ?? "usd",
    url,
  });

  await repo.logAudit({
    businessId: input.businessId,
    actorUserId: input.ownerUserId,
    actionType: "payment_link_created",
    details: { name: input.name, amount: input.amount },
  });

  return ok({ url, linkId });
}

export async function recordMerchantPaymentEvent(
  client: SupabaseClient,
  input: {
    businessId: string;
    kind: MerchantPaymentEventKind;
    amount: number;
    processor: PaymentProcessor;
    processorTransactionId?: string;
    contactId?: string;
    paymentMethodType?: string;
    description?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  const repo = createMerchantRepository(client);
  const { data: feeConfig } = await repo.getFeeConfigForBusiness(input.businessId);
  const fees = computeFees(input.amount, feeConfig ?? {
    platform_fee_percent: 1,
    platform_fee_flat: 0,
    agency_revenue_share_percent: 0.25,
  });

  const status =
    input.kind === "payment_failed" ? "failed" : input.kind === "refund_issued" ? "refunded" : "succeeded";

  await repo.upsertTransactionByProcessorId({
    businessId: input.businessId,
    processor: input.processor,
    processorTransactionId: input.processorTransactionId ?? `local-${Date.now()}`,
    patch: {
      transaction_type: input.kind.includes("refund") ? "refund" : "payment",
      status,
      amount: input.amount,
      platform_fee: fees.platformFee,
      agency_share: fees.agencyShare,
      net_amount: fees.netAmount,
      payment_method_type: input.paymentMethodType ?? null,
      description: input.description ?? null,
      metadata: input.metadata ?? {},
      paid_at: status === "succeeded" ? new Date().toISOString() : null,
    },
  });

  await handleMerchantPaymentAutomation(client, input.businessId, input.kind, {
    amount: input.amount,
    processor: input.processor,
    processorTransactionId: input.processorTransactionId,
    contactId: input.contactId,
  });
}

async function seedMerchantAiAgents(client: SupabaseClient, businessId: string): Promise<void> {
  const agents = [
    { agent_key: "billing", name: "AI Billing Agent", description: "Creates invoices and payment links" },
    { agent_key: "collections", name: "AI Collections Agent", description: "Follows up on failed payments" },
    { agent_key: "renewal", name: "AI Renewal Agent", description: "Manages subscription renewals" },
    { agent_key: "payment_support", name: "AI Payment Support Agent", description: "Answers billing questions" },
    { agent_key: "upsell", name: "AI Upsell Agent", description: "Recommends upsells after payments" },
  ];
  for (const a of agents) {
    await client.from("agent_tools").upsert(
      {
        business_id: businessId,
        agent_key: a.agent_key,
        tool_key: `merchant_${a.agent_key}`,
        enabled: true,
        config: { module: "merchant_services", name: a.name, description: a.description },
      },
      { onConflict: "business_id,agent_key,tool_key", ignoreDuplicates: true },
    );
  }
}

export async function activateAgencyMerchantServices(
  client: SupabaseClient,
  agencyId: string,
  adminUserId: string,
  enabled: boolean,
): Promise<ServiceResult<{ ok: true }>> {
  const repo = createMerchantRepository(client);
  await repo.updateAgencyMerchantSettings(agencyId, { merchant_services_enabled: enabled });
  await repo.logAudit({
    agencyId,
    actorUserId: adminUserId,
    actionType: enabled ? "agency_merchant_enabled" : "agency_merchant_disabled",
    entityType: "agency",
    entityId: agencyId,
  });
  return ok({ ok: true });
}

export async function activateSubAccountMerchant(
  client: SupabaseClient,
  managedId: string,
  adminUserId: string,
  enabled: boolean,
): Promise<ServiceResult<{ ok: true }>> {
  const { data: row, error } = await client
    .from("agency_managed_businesses")
    .update({ merchant_services_enabled: enabled })
    .eq("id", managedId)
    .select("*")
    .single();
  if (error || !row) return fail(error?.message ?? "Sub-account not found");

  const repo = createMerchantRepository(client);
  await repo.logAudit({
    businessId: row.business_id,
    agencyId: row.agency_id,
    actorUserId: adminUserId,
    actionType: enabled ? "subaccount_merchant_enabled" : "subaccount_merchant_disabled",
    entityType: "agency_managed_business",
    entityId: managedId,
  });
  return ok({ ok: true });
}

export async function updateGlobalFeeConfig(
  client: SupabaseClient,
  adminUserId: string,
  input: {
    platformFeePercent?: number;
    platformFeeFlat?: number;
    agencyRevenueSharePercent?: number;
    subAccountMarkupPercent?: number;
    payoutDelayDays?: number;
  },
): Promise<ServiceResult<{ ok: true }>> {
  const repo = createMerchantRepository(client);
  const { error } = await repo.upsertFeeConfig({
    isGlobalDefault: true,
    platformFeePercent: input.platformFeePercent,
    platformFeeFlat: input.platformFeeFlat,
    agencyRevenueSharePercent: input.agencyRevenueSharePercent,
    subAccountMarkupPercent: input.subAccountMarkupPercent,
    payoutDelayDays: input.payoutDelayDays,
  });
  if (error) return fail(error.message);

  await repo.logAudit({
    actorUserId: adminUserId,
    actionType: "fee_config_updated",
    details: input,
  });
  return ok({ ok: true });
}

export async function ensureAgencyFromBusiness(
  client: SupabaseClient,
  businessId: string,
  businessName: string,
): Promise<ServiceResult<{ agencyId: string }>> {
  const repo = createMerchantRepository(client);
  const { data: existing } = await repo.getAgencyByBusinessId(businessId);
  if (existing) return ok({ agencyId: existing.id });

  const { data, error } = await repo.upsertAgency({
    businessId,
    name: businessName,
  });
  if (error || !data) return fail(error?.message ?? "Failed to create agency");
  return ok({ agencyId: data.id });
}
