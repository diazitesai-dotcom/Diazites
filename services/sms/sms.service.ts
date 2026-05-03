import twilio from "twilio";

import { env } from "@/lib/env";

export type SendSmsInput = {
  to: string;
  body: string;
};

function normalizeE164(to: string): string {
  const t = to.trim();
  if (!t) return t;
  return t.startsWith("+") ? t : `+${t.replace(/\D/g, "")}`;
}

/**
 * Sends SMS via Twilio when credentials exist; otherwise tries AgentMail HTTP if configured.
 */
export async function sendSms(input: SendSmsInput): Promise<{ ok: boolean; detail?: string }> {
  const to = normalizeE164(input.to);
  if (!to || !input.body.trim()) {
    return { ok: false, detail: "missing recipient or body" };
  }

  const sid = env.TWILIO_ACCOUNT_SID?.trim();
  const token = env.TWILIO_AUTH_TOKEN?.trim();
  const from = env.TWILIO_FROM_NUMBER?.trim();

  if (sid && token && from) {
    try {
      const client = twilio(sid, token);
      await client.messages.create({ to, from, body: input.body });
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "twilio error";
      console.error("[sms] Twilio failed", msg);
      return { ok: false, detail: msg };
    }
  }

  const agentUrl = env.AGENTMAIL_API_URL?.trim();
  const agentKey = env.AGENTMAIL_API_KEY?.trim();
  if (agentUrl && agentKey) {
    try {
      const res = await fetch(agentUrl.replace(/\/$/, ""), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${agentKey}`,
        },
        body: JSON.stringify({ to, body: input.body }),
      });
      if (!res.ok) {
        const text = await res.text();
        return { ok: false, detail: `AgentMail ${res.status}: ${text.slice(0, 200)}` };
      }
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "agentmail error";
      return { ok: false, detail: msg };
    }
  }

  console.warn(
    "[sms] No provider configured (set TWILIO_* or AGENTMAIL_API_URL + AGENTMAIL_API_KEY)",
  );
  return { ok: false, detail: "no_sms_provider" };
}
