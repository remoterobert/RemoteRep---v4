import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

/**
 * Password reset emails, sent through Resend (not Supabase's built-in mailer).
 *
 * We ask Supabase for a one-time recovery token and email our own link to
 * /auth/confirm, which verifies the token server-side and signs the user in
 * on /reset-password. Because the token travels in the link itself, it works
 * even when the email is opened on a different device or browser.
 *
 * Never reveals to the caller-facing UI whether an account exists — callers
 * show the same "check your email" message either way.
 */

export type ResetResult =
  | { status: "sent" }
  | { status: "no_account" }
  | { status: "failed"; error: string };

export async function sendPasswordResetEmail(
  email: string,
  origin: string,
): Promise<ResetResult> {
  const address = email.trim().toLowerCase();

  let tokenHash: string | undefined;
  try {
    const { data, error } = await createAdminClient().auth.admin.generateLink({
      type: "recovery",
      email: address,
    });
    if (error) {
      // Unknown email — not an error worth surfacing (or revealing).
      if (/not.*found|no user/i.test(error.message)) return { status: "no_account" };
      return { status: "failed", error: error.message };
    }
    tokenHash = data.properties?.hashed_token;
  } catch (e) {
    return { status: "failed", error: e instanceof Error ? e.message : String(e) };
  }
  if (!tokenHash) return { status: "failed", error: "no recovery token returned" };

  const link = `${origin}/auth/confirm?${new URLSearchParams({
    token_hash: tokenHash,
    type: "recovery",
    next: "/reset-password",
  }).toString()}`;

  const result = await sendEmail({
    to: address,
    subject: "Reset your RemoteRep password",
    html: resetEmailHtml(link),
    text: [
      "We received a request to reset the password for your RemoteRep account.",
      "",
      `Choose a new password: ${link}`,
      "",
      "This link works once and expires soon. If you didn't ask for this, you can ignore this email — your password won't change.",
    ].join("\n"),
  });

  if ("sent" in result && result.sent) return { status: "sent" };
  return {
    status: "failed",
    error: "skipped" in result ? `email not sent: ${result.reason}` : result.error,
  };
}

function resetEmailHtml(rawLink: string): string {
  const link = rawLink.replace(/&/g, "&amp;");
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0b1220;">
    <p style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#004fbe;margin:0 0 16px;">RemoteRep</p>
    <h1 style="font-size:22px;margin:0 0 12px;">Reset your password</h1>
    <p style="font-size:15px;line-height:1.6;margin:0;">We received a request to reset the password for your RemoteRep account. Click below to choose a new one.</p>
    <p style="margin:28px 0;"><a href="${link}" style="display:inline-block;background:#004fbe;color:#ffffff;padding:13px 26px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Choose a new password</a></p>
    <p style="font-size:13px;line-height:1.6;color:#6b7280;margin:0;">This link works once and expires soon. If you didn't ask for this, you can safely ignore this email — your password won't change.</p>
    <p style="font-size:12px;line-height:1.6;color:#9ca3af;margin:24px 0 0;">Button not working? Copy this link into your browser:<br><span style="word-break:break-all;">${link}</span></p>
  </div>`;
}
