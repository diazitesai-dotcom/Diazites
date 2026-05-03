/**
 * Legacy facade — prefer `@/services/email/email.service`.
 */
import { sendEmail } from "@/services/email/email.service";

export async function sendLeadFollowUpEmail(input: {
  to: string;
  subject: string;
  body: string;
}) {
  const result = await sendEmail({
    to: input.to,
    subject: input.subject,
    text: input.body,
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  return result.data;
}
