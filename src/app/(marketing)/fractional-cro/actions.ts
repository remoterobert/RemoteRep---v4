"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { logGhl, syncLead } from "@/lib/ghl";
import {
  INCOME_RANGES,
  LEADERSHIP_YEARS,
  TEAM_SIZES,
  TIMELINES,
  type IntakeState,
} from "./options";

/**
 * Fractional CRO intake submission (public — no sign-in required).
 *
 * Every delivery channel is best-effort and env-gated, so the form keeps
 * working while channels are being wired up:
 *   1. GoHighLevel talent sub-account — contact, tags, a note with the
 *      answers, and an opportunity on the CRO pipeline (see src/lib/ghl.ts).
 *      This is where the sales team works the lead.
 *   2. Supabase `cro_leads` table (needs SUPABASE_SERVICE_ROLE_KEY).
 *   3. CRO_LEADS_WEBHOOK_URL — POST JSON (e.g. a GoHighLevel inbound webhook
 *      to drop the lead into the CRM / sales pipeline).
 *   4. CRO_LEADS_NOTIFY_EMAIL — email alert via Resend.
 * If at least one channel accepts the lead we send the applicant on to book
 * their call. If every configured channel fails we show an error instead of
 * silently losing the lead.
 */

function getStr(fd: FormData, key: string, maxLen: number): string {
  return String(fd.get(key) ?? "")
    .trim()
    .slice(0, maxLen);
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function oneOf<T extends readonly string[]>(list: T, v: string): boolean {
  return (list as readonly string[]).includes(v);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type Outcome = "sent" | "skipped" | "failed";

export async function submitCroIntake(
  _prev: IntakeState,
  formData: FormData,
): Promise<IntakeState> {
  // Honeypot: real people never see this field. Bots fill it in. Pretend it
  // worked so they don't retry.
  if (getStr(formData, "company_website", 200)) {
    redirect("/fractional-cro/book");
  }

  const lead = {
    first_name: getStr(formData, "first_name", 100),
    last_name: getStr(formData, "last_name", 100),
    email: getStr(formData, "email", 200).toLowerCase(),
    phone: getStr(formData, "phone", 40),
    linkedin_url: getStr(formData, "linkedin_url", 300) || null,
    current_title: getStr(formData, "current_title", 150),
    leadership_years: getStr(formData, "leadership_years", 40),
    team_size: getStr(formData, "team_size", 40),
    income_range: getStr(formData, "income_range", 40),
    timeline: getStr(formData, "timeline", 40),
    why_now: getStr(formData, "why_now", 3000) || null,
    utm_source: getStr(formData, "utm_source", 200) || null,
    utm_medium: getStr(formData, "utm_medium", 200) || null,
    utm_campaign: getStr(formData, "utm_campaign", 200) || null,
  };

  const errors: string[] = [];
  if (!lead.first_name || !lead.last_name)
    errors.push("Please share your full name.");
  if (!isValidEmail(lead.email)) errors.push("Please share a valid email.");
  if (lead.phone.replace(/\D/g, "").length < 7)
    errors.push("Please share a phone number we can reach you on.");
  if (lead.current_title.length < 2)
    errors.push("Please share your current title.");
  if (
    !oneOf(LEADERSHIP_YEARS, lead.leadership_years) ||
    !oneOf(TEAM_SIZES, lead.team_size) ||
    !oneOf(INCOME_RANGES, lead.income_range) ||
    !oneOf(TIMELINES, lead.timeline)
  )
    errors.push("Please answer each of the multiple-choice questions.");
  if (errors.length > 0) return { error: errors.join(" ") };

  // 1. GoHighLevel
  const source =
    [lead.utm_source, lead.utm_medium, lead.utm_campaign].filter(Boolean).join(" / ") || null;
  const ghlResult = await syncLead({
    type: "cro",
    email: lead.email,
    firstName: lead.first_name,
    lastName: lead.last_name,
    phone: lead.phone,
    tags: ["fractional-cro", "cro-application", "self-registered"],
    source: "RemoteRep website — Fractional CRO application",
    opportunityName: `${lead.first_name} ${lead.last_name} — Fractional CRO`,
    note: [
      "Fractional CRO application (remoterep.com/fractional-cro)",
      "",
      `Current title: ${lead.current_title}`,
      `Years leading sales teams: ${lead.leadership_years}`,
      `Largest team led: ${lead.team_size}`,
      `Current income: ${lead.income_range}`,
      `Timeline: ${lead.timeline}`,
      `LinkedIn: ${lead.linkedin_url ?? "—"}`,
      `Why now: ${lead.why_now ?? "—"}`,
      `Traffic source: ${source ?? "direct"}`,
    ].join("\n"),
  });
  logGhl("cro-intake", ghlResult);
  const ghl: Outcome =
    ghlResult.status === "synced" ? "sent" : ghlResult.status === "failed" ? "failed" : "skipped";

  // 2. Database
  let db: Outcome = "skipped";
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { error } = await createAdminClient().from("cro_leads").insert(lead);
      db = error ? "failed" : "sent";
      if (error) console.error("[cro-intake] db insert failed:", error.message);
    } catch (e) {
      db = "failed";
      console.error("[cro-intake] db insert threw:", e);
    }
  }

  // 3. CRM webhook
  let webhook: Outcome = "skipped";
  const webhookUrl = process.env.CRO_LEADS_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "remoterep-fractional-cro-intake",
          submitted_at: new Date().toISOString(),
          ...lead,
        }),
      });
      webhook = res.ok ? "sent" : "failed";
      if (!res.ok) console.error("[cro-intake] webhook HTTP", res.status);
    } catch (e) {
      webhook = "failed";
      console.error("[cro-intake] webhook threw:", e);
    }
  }

  // 4. Email alert
  let email: Outcome = "skipped";
  const notifyTo = process.env.CRO_LEADS_NOTIFY_EMAIL;
  if (notifyTo) {
    const rows: [string, string | null][] = [
      ["Name", `${lead.first_name} ${lead.last_name}`],
      ["Email", lead.email],
      ["Phone", lead.phone],
      ["LinkedIn", lead.linkedin_url],
      ["Current title", lead.current_title],
      ["Years leading sales", lead.leadership_years],
      ["Largest team", lead.team_size],
      ["Current income", lead.income_range],
      ["Timeline", lead.timeline],
      ["Why now", lead.why_now],
      ["Source", source],
    ];
    const html = `<h2>New Fractional CRO application</h2><table cellpadding="6">${rows
      .map(
        ([k, v]) =>
          `<tr><td style="color:#6b7280;vertical-align:top">${k}</td><td>${escapeHtml(v ?? "—")}</td></tr>`,
      )
      .join("")}</table>`;
    const result = await sendEmail({
      to: notifyTo,
      subject: `New Fractional CRO application: ${lead.first_name} ${lead.last_name} (${lead.income_range})`,
      html,
      text: rows.map(([k, v]) => `${k}: ${v ?? "—"}`).join("\n"),
      replyTo: lead.email,
    });
    email = "sent" in result ? (result.sent ? "sent" : "failed") : "skipped";
  }

  const outcomes = [ghl, db, webhook, email];
  console.log("[cro-intake] delivered", { ghl, db, webhook, email });

  // Something was configured and nothing accepted the lead — don't lose it.
  if (outcomes.includes("failed") && !outcomes.includes("sent")) {
    return {
      error:
        "Something went wrong saving your application. Please try again, or email support@remoterep.com.",
    };
  }

  // First name only — keep contact details out of URLs and access logs.
  const params = new URLSearchParams({ name: lead.first_name });
  redirect(`/fractional-cro/book?${params.toString()}`);
}
