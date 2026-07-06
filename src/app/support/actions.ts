"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Support ticket submission.
 *
 * Delivery order (whichever env var is set — falls through cleanly):
 *   1. GHL_SUPPORT_WEBHOOK_URL   — POST JSON to a GoHighLevel inbound
 *      webhook. GHL's existing Slack automation forwards from there.
 *   2. SLACK_SUPPORT_WEBHOOK_URL — direct Slack Incoming Webhook, in
 *      case GHL isn't wired yet or someone wants a simpler path.
 *   3. Neither set — the action succeeds silently (logs to server
 *      console) so the form still redirects; useful for local dev.
 */

const SUPPORT_KINDS = new Set([
  "platform_help",
  "feature_request",
]);

function getStr(fd: FormData, key: string, maxLen = 5000): string {
  return String(fd.get(key) ?? "")
    .trim()
    .slice(0, maxLen);
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

async function postGhl(payload: Record<string, unknown>) {
  const url = process.env.GHL_SUPPORT_WEBHOOK_URL;
  if (!url) return { skipped: true as const, reason: "no ghl url" };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ok: false as const, error: `GHL HTTP ${res.status}: ${body}` };
  }
  return { ok: true as const };
}

async function postSlack(payload: {
  name: string;
  email: string;
  kindLabel: string;
  message: string;
  fromUserId: string | null;
}) {
  const url = process.env.SLACK_SUPPORT_WEBHOOK_URL;
  if (!url) return { skipped: true as const, reason: "no slack url" };
  const body = {
    text: `New support ticket from ${payload.name}`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: `Support — ${payload.kindLabel}` },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*From*\n${payload.name}` },
          { type: "mrkdwn", text: `*Email*\n${payload.email}` },
        ],
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: `*Message*\n${payload.message}` },
      },
      ...(payload.fromUserId
        ? [
            {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text: `Signed-in user_id: \`${payload.fromUserId}\``,
                },
              ],
            },
          ]
        : []),
    ],
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const responseText = await res.text().catch(() => "");
    return {
      ok: false as const,
      error: `Slack HTTP ${res.status}: ${responseText}`,
    };
  }
  return { ok: true as const };
}

export async function submitSupportTicket(formData: FormData) {
  const name = getStr(formData, "name", 200);
  const email = getStr(formData, "email", 200);
  const kind = getStr(formData, "kind", 40);
  const message = getStr(formData, "message", 5000);

  const errors: string[] = [];
  if (name.length < 2) errors.push("Please share your name.");
  if (!isValidEmail(email)) errors.push("Please share a valid email.");
  if (!SUPPORT_KINDS.has(kind)) errors.push("Pick what you need help with.");
  if (message.length < 5) errors.push("Please share a few sentences.");
  if (errors.length > 0) {
    redirect(`/support?error=${encodeURIComponent(errors.join(" "))}`);
  }

  const kindLabel =
    kind === "feature_request"
      ? "Feature request"
      : "Platform help";

  // Best-effort attach the signed-in user's id — helps our team match
  // tickets to accounts without exposing PII in the form itself.
  let fromUserId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    fromUserId = user?.id ?? null;
  } catch {
    // ignore — form still works for logged-out visitors
  }

  const submittedAt = new Date().toISOString();
  const ghlPayload = {
    source: "remoterep-support-form",
    submitted_at: submittedAt,
    name,
    email,
    kind,
    kind_label: kindLabel,
    message,
    from_user_id: fromUserId,
  };

  const ghlResult = await postGhl(ghlPayload);
  const slackResult = await postSlack({
    name,
    email,
    kindLabel,
    message,
    fromUserId,
  });

  // If both attempts failed hard (not skipped), surface the error so
  // the message isn't lost silently. Skip-and-continue if neither
  // webhook is configured — page still redirects to the confirmation
  // (useful for local dev before env vars are set).
  const hardFail =
    "ok" in ghlResult && !ghlResult.ok && "ok" in slackResult && !slackResult.ok;
  if (hardFail) {
    const err =
      ("error" in ghlResult ? ghlResult.error : "") +
      " | " +
      ("error" in slackResult ? slackResult.error : "");
    console.error("[support] delivery failed:", err);
    redirect(
      `/support?error=${encodeURIComponent("Couldn't submit — please email support@remoterep.com directly.")}`,
    );
  }

  // Log for our own audit trail (Railway captures stdout).
  console.log("[support] delivered", {
    ghl:
      "ok" in ghlResult
        ? ghlResult.ok
          ? "sent"
          : "error"
        : ghlResult.reason,
    slack:
      "ok" in slackResult
        ? slackResult.ok
          ? "sent"
          : "error"
        : slackResult.reason,
    kind,
    from_user_id: fromUserId,
  });

  redirect("/support/thanks");
}
