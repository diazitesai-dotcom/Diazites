import { Resend } from "resend";

import { assertRequiredEnv, env } from "@/lib/env";

export async function sendLeadFollowUpEmail(input: {
  to: string;
  subject: string;
  body: string;
}) {
  assertRequiredEnv(["RESEND_API_KEY"]);
  const resend = new Resend(env.RESEND_API_KEY);
  return resend.emails.send({
    from: "Diazites AI <noreply@diazites.com>",
    to: input.to,
    subject: input.subject,
    text: input.body,
  });
}
