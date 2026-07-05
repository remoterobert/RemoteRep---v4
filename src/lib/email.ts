/**
 * Thin Resend HTTP wrapper.
 *
 * Env-var gated so nothing sends until we're ready:
 *   - RESEND_API_KEY: required. Missing → silent no-op.
 *   - RESEND_FROM_EMAIL: required. Missing → silent no-op.
 *   - RESEND_ALLOWLIST_EMAILS (optional, comma-separated): while the
 *     sending domain is sandbox-only, restrict outbound to these
 *     addresses. Any recipient not in the list is skipped (logged).
 *     Remove once the domain is verified in Resend.
 */

const RESEND_API_URL = "https://api.resend.com/emails";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export type SendEmailResult =
  | { skipped: true; reason: string }
  | { sent: true; id: string }
  | { sent: false; error: string };

function getAllowlist(): Set<string> | null {
  const raw = process.env.RESEND_ALLOWLIST_EMAILS;
  if (!raw) return null;
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function sendEmail(
  input: SendEmailInput,
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return { skipped: true, reason: "resend not configured" };
  }

  const allowlist = getAllowlist();
  if (allowlist && !allowlist.has(input.to.toLowerCase())) {
    return {
      skipped: true,
      reason: `recipient not in RESEND_ALLOWLIST_EMAILS: ${input.to}`,
    };
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.replyTo,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { sent: false, error: `HTTP ${res.status}: ${body}` };
    }
    const json = (await res.json()) as { id?: string };
    return { sent: true, id: json.id ?? "unknown" };
  } catch (e) {
    return {
      sent: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Render a minimal branded HTML shell around a plain-text body. Safe
 * default for MVP; template later.
 */
export function wrapEmail({
  headline,
  intro,
  ctaLabel,
  ctaHref,
  footer,
}: {
  headline: string;
  intro: string;
  ctaLabel?: string;
  ctaHref?: string;
  footer?: string;
}) {
  const cta =
    ctaLabel && ctaHref
      ? `<p style="text-align:center;margin:32px 0;"><a href="${ctaHref}" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">${escapeHtml(ctaLabel)}</a></p>`
      : "";
  const foot = footer
    ? `<p style="color:#6b7280;font-size:12px;margin-top:32px;">${escapeHtml(footer)}</p>`
    : "";
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111;">
    <h1 style="font-size:20px;margin:0 0 12px 0;">${escapeHtml(headline)}</h1>
    <p style="font-size:15px;line-height:1.5;margin:0;">${escapeHtml(intro)}</p>
    ${cta}
    ${foot}
    <p style="color:#9ca3af;font-size:11px;margin-top:24px;">Sent by RemoteRep. <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/settings/notifications" style="color:#9ca3af;">Manage email preferences</a>.</p>
  </div>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
