import OpenAI from "openai";
import type { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { env } from "@/lib/env";
import { processOperatorMessage } from "@/lib/ai-operator/respond";
import {
  callJsonResponses,
  ENGINE_DEFAULT_MODEL,
  isOpenAiConfigured,
} from "@/services/engine/ai/openai-client";
import { buildToolsForAuth, callMcpTool, type McpToolDef } from "@/services/mcp/mcp-server";
import { normalizeDeploymentGoalId } from "@/types/agent-deployment";
import type {
  OperatorAction,
  OperatorAssistantMessage,
  OperatorMode,
  OperatorPlatformContext,
} from "@/types/ai-operator";
import type { McpAuthContext } from "@/types/mcp";

const MAX_TOOL_ROUNDS = 5;
const OPERATOR_MODEL = ENGINE_DEFAULT_MODEL;

const operatorReplySchema = z.object({
  mode: z.enum(["answer", "navigation", "action", "diagnostic", "support", "operator"]),
  content: z.string().min(1),
  bullets: z.array(z.string()).optional(),
  breadcrumb: z.string().optional(),
  actions: z
    .array(
      z.object({
        kind: z.enum(["navigate", "deploy", "open_diagnostics", "approve"]),
        label: z.string(),
        href: z.string().optional(),
        deployGoal: z.string().optional(),
        deployPreset: z.string().optional(),
        requiresApproval: z.boolean().optional(),
      }),
    )
    .optional(),
  logLine: z.string().optional(),
});

function mcpToolsToOpenAi(tools: McpToolDef[]): ChatCompletionTool[] {
  return tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.inputSchema,
    },
  }));
}

function buildSystemPrompt(ctx: OperatorPlatformContext): string {
  const lines = [
    "You are GrowthOS Operator — the in-app AI assistant for Diazites, a growth platform for contractors.",
    "You help users manage Mission Control, agents, funnels, landing pages, campaigns, leads, tracking, and ads.",
    "Use tools to read live data and execute allowed actions on the user's workspace.",
    "Never invent metrics — use tool results and the workspace snapshot below.",
    "For destructive or high-spend actions (full funnel run, mass publish), only run tools when the user clearly asks.",
    "Paid ad API changes on Meta/Google require connected accounts; guide to Integrations if disconnected.",
    "Be concise, actionable, and friendly. Prefer bullets for lists.",
    "",
    "Workspace snapshot:",
    `- Business: ${ctx.hasBusiness ? (ctx.businessName ?? "connected") : "not connected"}`,
    `- Health: ${ctx.healthScore}% (${ctx.riskLevel} risk)`,
    `- Revenue: $${ctx.revenue} · Pipeline: $${ctx.pipeline} · Spend: $${ctx.spend}`,
    `- ROAS: ${ctx.roas != null ? `${ctx.roas.toFixed(1)}×` : "n/a"}`,
    `- Leads (7d velocity): ${ctx.leadVelocity7d} · Total leads: ${ctx.totalLeads}`,
    `- Campaigns active: ${ctx.activeCampaigns} · Agents active: ${ctx.activeAgents}/${ctx.totalAgents}`,
    `- Approvals pending: ${ctx.pendingApprovals}`,
    `- Meta connected: ${ctx.metaConnected} · Google connected: ${ctx.googleConnected} · Zernio connected: ${ctx.zernioConnected}`,
    ctx.zernioConnected
      ? "- Zernio is connected: it is a multi-platform ads broker (Meta, Instagram, TikTok, LinkedIn, YouTube, X, and more). Treat paid ads as available."
      : "",
    `- Tracking: ${ctx.trackingStatus}`,
    `- Connected platforms: ${ctx.connectedPlatforms.join(", ") || "none"}`,
    ctx.topInsight ? `- Insight: ${ctx.topInsight}` : "",
    ctx.agentIssues.length ? `- Issues: ${ctx.agentIssues.join("; ")}` : "",
    `- Current page: ${ctx.pagePath}`,
  ];
  return lines.filter(Boolean).join("\n");
}

/** Valid in-app dashboard routes the operator is allowed to send users to. */
const VALID_DASHBOARD_ROUTES = new Set<string>([
  "/dashboard",
  "/dashboard/engine",
  "/dashboard/campaign-ops",
  "/dashboard/leads",
  "/dashboard/funnel",
  "/dashboard/agents",
  "/dashboard/optimization",
  "/dashboard/integrations",
  "/dashboard/automations",
  "/dashboard/automations/pipelines",
  "/dashboard/workflows",
  "/dashboard/ai-calls",
  "/dashboard/merchant-services",
  "/dashboard/email-campaigns",
  "/dashboard/approvals",
  "/dashboard/reports",
  "/dashboard/organization",
  "/dashboard/business",
  "/dashboard/settings",
  "/dashboard/ads",
  "/onboarding",
]);

/** Corrects common LLM-hallucinated routes (e.g. /dashboard/landingpages → /dashboard/funnel). */
const HREF_ALIASES: Record<string, string> = {
  "/dashboard/landingpages": "/dashboard/funnel",
  "/dashboard/landing-pages": "/dashboard/funnel",
  "/dashboard/landing": "/dashboard/funnel",
  "/dashboard/landing-page": "/dashboard/funnel",
  "/dashboard/funnels": "/dashboard/funnel",
  "/dashboard/campaigns": "/dashboard/campaign-ops",
  "/dashboard/campaign": "/dashboard/campaign-ops",
  "/dashboard/campaign-manager": "/dashboard/campaign-ops",
  "/dashboard/agent": "/dashboard/agents",
  "/dashboard/integration": "/dashboard/integrations",
  "/dashboard/integrations-hub": "/dashboard/integrations",
  "/dashboard/lead": "/dashboard/leads",
  "/dashboard/leads-os": "/dashboard/leads",
  "/dashboard/pipeline": "/dashboard/leads",
  "/dashboard/automation": "/dashboard/automations",
  "/dashboard/workflow": "/dashboard/workflows",
  "/dashboard/report": "/dashboard/reports",
  "/dashboard/reporting": "/dashboard/reports",
  "/dashboard/ai-text": "/dashboard/email-campaigns",
  "/dashboard/email": "/dashboard/email-campaigns",
  "/dashboard/home": "/dashboard",
  "/dashboard/overview": "/dashboard",
};

/**
 * Maps an operator-provided href to a real route. The LLM sometimes invents
 * paths that 404 (e.g. /dashboard/landingpages); we alias known mistakes and
 * fall back to Mission Control for anything unrecognized.
 */
export function normalizeDashboardHref(href: string): string {
  const trimmed = href.trim();
  if (!trimmed.startsWith("/")) return "/dashboard";

  const [rawPath, query] = trimmed.split("?");
  const path = rawPath.replace(/\/+$/, "").toLowerCase() || "/dashboard";
  const suffix = query ? `?${query}` : "";

  if (VALID_DASHBOARD_ROUTES.has(path)) return `${path}${suffix}`;
  if (HREF_ALIASES[path]) return `${HREF_ALIASES[path]}${suffix}`;

  // Unknown /dashboard/* path — keep the user inside the app rather than 404.
  if (path.startsWith("/dashboard")) return `/dashboard${suffix}`;
  return `${path}${suffix}`;
}

function mapActions(
  raw: z.infer<typeof operatorReplySchema>["actions"],
): OperatorAction[] | undefined {
  if (!raw?.length) return undefined;
  return raw.map((a, i) => {
    const base = {
      id: `llm-action-${i}-${a.label.slice(0, 12)}`,
      label: a.label,
      kind: a.kind,
      requiresApproval: a.requiresApproval,
    } as OperatorAction;

    if ((a.kind === "navigate" || a.kind === "open_diagnostics" || a.kind === "approve") && a.href) {
      return { ...base, href: normalizeDashboardHref(a.href) };
    }
    if (a.kind === "deploy") {
      const goal = normalizeDeploymentGoalId(a.deployGoal);
      if (goal) {
        return {
          ...base,
          kind: "deploy",
          deploy: {
            goal,
            step: "plan",
            source: "control_plane",
            ...(a.deployPreset === "retargeting"
              ? { preset: "retargeting" as const, agent: "retargeting" as const }
              : {}),
          },
        };
      }
    }
    return base;
  });
}

export async function processOperatorMessageWithLlm(
  client: SupabaseClient,
  mcpCtx: McpAuthContext,
  businessId: string,
  message: string,
  platformCtx: OperatorPlatformContext,
): Promise<OperatorAssistantMessage | null> {
  if (!isOpenAiConfigured()) return null;

  const tools = buildToolsForAuth(mcpCtx);
  if (tools.length === 0) return null;

  const openaiTools = mcpToolsToOpenAi(tools);
  const toolNames = new Set(tools.map((t) => t.name));

  let openai: OpenAI;
  try {
    openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  } catch {
    return null;
  }

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt(platformCtx) },
    { role: "user", content: message.trim() },
  ];

  const toolTraces: string[] = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: OPERATOR_MODEL,
        messages,
        tools: openaiTools,
        tool_choice: "auto",
        temperature: 0.35,
      });
    } catch {
      return null;
    }

    const choice = completion.choices[0]?.message;
    if (!choice) return null;

    if (!choice.tool_calls?.length) {
      const text = choice.content?.trim();
      if (text) {
        return finalizeFromText(text, platformCtx, message, toolTraces, client, businessId);
      }
      break;
    }

    messages.push({
      role: "assistant",
      content: choice.content ?? null,
      tool_calls: choice.tool_calls,
    });

    for (const call of choice.tool_calls) {
      if (call.type !== "function") continue;
      const name = call.function.name;
      if (!toolNames.has(name)) {
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify({ error: `Tool not allowed: ${name}` }),
        });
        continue;
      }

      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function.arguments || "{}") as Record<string, unknown>;
      } catch {
        args = {};
      }

      const result = await callMcpTool(client, mcpCtx, name, args);
      const text = result.content.map((c) => c.text).join("\n");
      toolTraces.push(`${name}: ${result.isError ? "error" : "ok"}`);
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: text.slice(0, 12_000),
      });
    }
  }

  return synthesizeReply(client, businessId, message, platformCtx, toolTraces, messages);
}

async function finalizeFromText(
  text: string,
  platformCtx: OperatorPlatformContext,
  userMessage: string,
  toolTraces: string[],
  client: SupabaseClient,
  businessId: string,
): Promise<OperatorAssistantMessage> {
  const synthesized = await synthesizeReply(
    client,
    businessId,
    userMessage,
    platformCtx,
    toolTraces,
    [
      { role: "system", content: buildSystemPrompt(platformCtx) },
      { role: "user", content: userMessage },
      { role: "assistant", content: text },
    ],
  );
  return synthesized ?? mergeWithRules(userMessage, platformCtx, text, toolTraces);
}

async function synthesizeReply(
  client: SupabaseClient,
  businessId: string,
  userMessage: string,
  platformCtx: OperatorPlatformContext,
  toolTraces: string[],
  conversation: ChatCompletionMessageParam[],
): Promise<OperatorAssistantMessage | null> {
  const transcript = conversation
    .map((m) => {
      if (m.role === "tool") return `Tool result: ${String(m.content).slice(0, 2000)}`;
      if (m.role === "assistant" && "tool_calls" in m && m.tool_calls) {
        const names = m.tool_calls
          .filter((t) => t.type === "function")
          .map((t) => t.function.name);
        return `Assistant called tools: ${names.join(", ")}`;
      }
      return `${m.role}: ${typeof m.content === "string" ? m.content : ""}`;
    })
    .join("\n\n");

  const parsed = await callJsonResponses({
    supabase: client,
    businessId,
    purpose: "operator_assistant_reply",
    model: OPERATOR_MODEL,
    system:
      "You format the GrowthOS Operator's final reply for the UI. Use tool results and conversation; do not fabricate data.",
    prompt: `User asked: ${userMessage}

Conversation and tool activity:
${transcript}

Tools executed: ${toolTraces.length ? toolTraces.join("; ") : "none"}

Return JSON with:
- mode: one of answer, navigation, action, diagnostic, support, operator
- content: main reply (plain text, 2-5 sentences max unless listing steps)
- bullets: optional string array of key points
- breadcrumb: optional UI breadcrumb
- actions: optional array of { kind, label, href?, deployGoal?, deployPreset?, requiresApproval? }
  - navigate: href MUST be one of these exact routes (do not invent others): /dashboard, /dashboard/engine, /dashboard/campaign-ops, /dashboard/leads, /dashboard/funnel (landing pages live here), /dashboard/agents, /dashboard/optimization, /dashboard/integrations, /dashboard/automations, /dashboard/workflows, /dashboard/email-campaigns, /dashboard/approvals, /dashboard/reports, /dashboard/organization, /dashboard/business
  - For setup (integrations, campaigns, landing pages, funnel): prefer /dashboard — Mission Control opens those tools inline without sending the user to another page
  - deploy: deployGoal e.g. generate_leads, launch_ads, follow_up_leads; deployPreset optional retargeting
- logLine: optional short log for operator console`,
    schema: operatorReplySchema,
  });

  if (!parsed.success) {
    const lastAssistant = [...conversation].reverse().find((m) => m.role === "assistant");
    const fallbackText =
      typeof lastAssistant?.content === "string" ? lastAssistant.content.trim() : "";
    if (fallbackText) {
      return mergeWithRules(userMessage, platformCtx, fallbackText, toolTraces);
    }
    return null;
  }

  const data = parsed.data;
  const ruleBased = processOperatorMessage(userMessage, platformCtx);
  const mergedActions = mergeActions(mapActions(data.actions), ruleBased.actions);

  return {
    id: `a-llm-${Date.now()}`,
    role: "assistant",
    mode: data.mode as OperatorMode,
    content: data.content,
    bullets: data.bullets?.length ? data.bullets : ruleBased.bullets,
    breadcrumb: data.breadcrumb ?? ruleBased.breadcrumb,
    actions: mergedActions,
    logLine:
      data.logLine ??
      (toolTraces.length ? `Tools: ${toolTraces.join(" · ")}` : ruleBased.logLine),
  };
}

function mergeActions(
  a?: OperatorAction[],
  b?: OperatorAction[],
): OperatorAction[] | undefined {
  const combined = [...(a ?? []), ...(b ?? [])];
  if (!combined.length) return undefined;
  const seen = new Set<string>();
  const out: OperatorAction[] = [];
  for (const action of combined) {
    const key = `${action.kind}:${action.label}:${action.href ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(action);
    if (out.length >= 6) break;
  }
  return out.length ? out : undefined;
}

function mergeWithRules(
  userMessage: string,
  platformCtx: OperatorPlatformContext,
  llmContent: string,
  toolTraces: string[],
): OperatorAssistantMessage {
  const ruleBased = processOperatorMessage(userMessage, platformCtx);
  return {
    ...ruleBased,
    content: llmContent || ruleBased.content,
    actions: mergeActions(ruleBased.actions, undefined),
    logLine: toolTraces.length ? `Tools: ${toolTraces.join(" · ")}` : ruleBased.logLine,
  };
}

/** Try LLM path; fall back to rule-based operator. */
export async function processOperatorMessageSmart(
  client: SupabaseClient,
  mcpCtx: McpAuthContext | null,
  businessId: string | null,
  message: string,
  platformCtx: OperatorPlatformContext,
): Promise<OperatorAssistantMessage> {
  if (mcpCtx && businessId) {
    const llm = await processOperatorMessageWithLlm(
      client,
      mcpCtx,
      businessId,
      message,
      platformCtx,
    );
    if (llm) return llm;
  }
  return processOperatorMessage(message, platformCtx);
}
