import { Resend } from "resend";

import { assertRequiredEnv, env } from "@/lib/env";
import { ok, fail, type ServiceResult } from "@/lib/result";

export async function sendEmail(input: {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}): Promise<ServiceResult<{ id?: string }>> {
  try {
    assertRequiredEnv(["RESEND_API_KEY"]);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Resend not configured", "EMAIL_CONFIG");
  }

  const resend = new Resend(env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: input.to,
    subject: input.subject,
    ...(input.html
      ? { html: input.html }
      : { text: input.text ?? "" }),
  });

  if (error) {
    return fail(error.message, "RESEND_ERROR");
  }

  return ok({ id: data?.id });
}

/**
 * Sends operational alerts to internal Diazites operators (comma-separated env).
 */
export async function sendSystemNotification(input: {
  subject: string;
  text: string;
  html?: string;
}): Promise<ServiceResult<{ id?: string }>> {
  const raw = env.ADMIN_NOTIFICATION_EMAILS.trim();
  if (!raw) {
    return ok({ id: undefined });
  }

  const recipients = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    return ok({ id: undefined });
  }

  return sendEmail({
    to: recipients,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}
