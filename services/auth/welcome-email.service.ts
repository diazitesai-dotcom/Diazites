import { AUTH_BRAND, DEFAULT_TRIAL_DAYS_SIGNUP } from "@/lib/auth/auth-branding";
import { getPublicAppUrl } from "@/lib/env";
import { sendEmail } from "@/services/email/email.service";

type WelcomeEmailInput = {
  to: string;
  fullName?: string | null;
  /** User must still click Supabase confirmation link */
  confirmationPending?: boolean;
};

function greeting(name?: string | null): string {
  if (name?.trim()) return `Hi ${name.trim().split(" ")[0]},`;
  return "Hi there,";
}

export async function sendDiazitesWelcomeEmail(
  input: WelcomeEmailInput,
): Promise<{ sent: boolean; error?: string }> {
  const appUrl = getPublicAppUrl();
  const first = greeting(input.fullName);

  const confirmationBlock = input.confirmationPending
    ? `<p style="margin:16px 0;font-size:15px;line-height:1.6;color:#e2e8f0;">
        We sent a <strong>confirmation link</strong> from <strong>${AUTH_BRAND.fromName}</strong> to this address.
        Open it to activate your account and start your free trial (check spam if needed).
      </p>`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;background:#0f0f14;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <tr>
      <td style="padding-bottom:24px;">
        <span style="font-size:22px;font-weight:700;color:#fff;">${AUTH_BRAND.platformName}</span>
        <p style="margin:8px 0 0;font-size:13px;color:#a78bfa;">${AUTH_BRAND.tagline}</p>
      </td>
    </tr>
    <tr>
      <td style="background:#1a1a24;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:28px;">
        <p style="margin:0 0 12px;font-size:16px;color:#fff;">${first}</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#e2e8f0;">
          Welcome to <strong>${AUTH_BRAND.productName}</strong>. Your account includes a
          <strong>${DEFAULT_TRIAL_DAYS_SIGNUP}-day free trial</strong> with full access to CRM, AI agents,
          workflows, funnels, and growth tools.
        </p>
        ${confirmationBlock}
        <p style="margin:20px 0 0;">
          <a href="${appUrl}/onboarding"
             style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#6366f1);color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:10px;">
            Start setup
          </a>
        </p>
        <p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#94a3b8;">
          When you are ready, upgrade anytime from Organization → Billing.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding-top:24px;font-size:12px;color:#64748b;text-align:center;">
        © ${new Date().getFullYear()} ${AUTH_BRAND.productName} · ${AUTH_BRAND.supportEmail}
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `${first}

Welcome to ${AUTH_BRAND.platformName}. You have a ${DEFAULT_TRIAL_DAYS_SIGNUP}-day free trial with full platform access.

${input.confirmationPending ? "Please confirm your email using the link we sent (check spam).\n\n" : ""}Start setup: ${appUrl}/onboarding

Upgrade anytime: ${appUrl}/dashboard/organization?tab=billing

— ${AUTH_BRAND.platformName}`;

  const result = await sendEmail({
    to: input.to,
    subject: input.confirmationPending
      ? `Confirm your ${AUTH_BRAND.platformName} account`
      : `Welcome to ${AUTH_BRAND.platformName} — your free trial starts now`,
    html,
    text,
  });

  if (!result.success) {
    return { sent: false, error: result.error };
  }
  return { sent: true };
}
