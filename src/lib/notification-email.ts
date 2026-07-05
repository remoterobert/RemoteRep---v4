import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, wrapEmail } from "@/lib/email";
import type { NotificationKind } from "@/lib/notifications";

type EmailPayload = {
  userId: string;
  kind: NotificationKind;
  subject: string;
  headline: string;
  intro: string;
  ctaLabel?: string;
  ctaPath?: string;
};

/**
 * Send an email version of a notification if the recipient hasn't
 * disabled email for that kind. Uses the service-role client because
 * we need to look up any user's email + prefs, not just our own.
 *
 * Fire-and-forget: swallows all errors so a broken email pipeline never
 * blocks the user-facing action that triggered it.
 */
export async function sendNotificationEmail(payload: EmailPayload) {
  try {
    const admin = createAdminClient();

    const [{ data: userRow }, { data: pref }] = await Promise.all([
      admin
        .from("users")
        .select("email, first_name")
        .eq("id", payload.userId)
        .maybeSingle(),
      admin
        .from("notification_channels")
        .select("email_enabled")
        .eq("user_id", payload.userId)
        .eq("kind", payload.kind)
        .maybeSingle(),
    ]);

    if (!userRow?.email) return;
    // Default is email-on when no explicit row exists.
    if (pref && pref.email_enabled === false) return;

    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    const ctaHref =
      payload.ctaPath && origin ? `${origin}${payload.ctaPath}` : undefined;

    await sendEmail({
      to: userRow.email,
      subject: payload.subject,
      html: wrapEmail({
        headline: payload.headline,
        intro: payload.intro,
        ctaLabel: payload.ctaLabel,
        ctaHref,
      }),
      text: `${payload.headline}\n\n${payload.intro}${
        ctaHref ? `\n\n${payload.ctaLabel ?? "Open"}: ${ctaHref}` : ""
      }`,
    });
  } catch {
    // never block the caller on an email failure
  }
}
