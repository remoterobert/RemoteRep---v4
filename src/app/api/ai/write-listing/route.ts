import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { LISTING_STYLES, type ListingStyle } from "@/lib/listings/options";
import { currentHiringAiAccess } from "@/lib/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Guard: keep the model short-lived per request; never persist keys client-side.
const MODEL = "claude-haiku-4-5-20251001";

const STYLE_INSTRUCTIONS: Record<ListingStyle, string> = {
  default: `Write a polished, professional, neutral job description that reads
like it came from a top-tier company. Warm and clear, not corporate-speak.
Sections: a short opener, "What you'll do", "What we're looking for",
"What we offer". Total ~250-350 words. Do not use emoji or filler.`,

  repel: `Write in a bold, direct, "repel" style — the goal is to filter out
mismatches so only real fits apply. Think Alex Hormozi / David Ogilvy: name
what the job actually demands, warn candidates off if they can't hack the
pace, and describe hard things honestly. No apologies, no soft edges. Still
respectful and legal — never mention gender, race, age, disability, or any
protected characteristic. Sections: "This role is not for you if...",
"This role IS for you if...", "The bar", "What we offer". ~250-350 words.`,

  inclusive: `Write in a warm, welcoming, inclusive style that lowers the
barrier to apply. Emphasize growth, coachability, and non-traditional
backgrounds. Explicitly say candidates should apply even if they don't
match every bullet. Use plain language, no jargon. Sections: opener,
"What you'll do", "You might be a great fit if...", "You don't need every
one of these", "What we offer". ~250-350 words. Never mention protected
characteristics — just make the tone welcoming.`,
};

const SYSTEM_PROMPT = `You are a senior sales-recruiting copywriter for RemoteRep,
a marketplace for remote sales talent. You write job listings for hiring
companies. Rules:
- Never mention or imply gender, race, age, national origin, religion,
  sexual orientation, disability, veteran status, or any legally protected
  characteristic. Not even in inclusive framing.
- Never invent numbers (comp, quota, deal size). Only use the numbers the
  hiring manager gave you.
- Write in plain American English. Short sentences. Active voice.
- No emoji. No hashtags. No exclamation points unless the brief has them.
- Output plain text with light markdown headers (## for sections). No HTML.
- Do NOT wrap in code fences or add a preamble like "Here is the listing:".`;

export async function POST(req: NextRequest) {
  // Auth — only signed-in hiring-side users can burn tokens.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Not signed in" }, { status: 401 });
  }
  const { data: membership } = await supabase
    .from("tenant_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", [
      "client_admin",
      "client_member",
      "agency_admin",
      "agency_member",
    ])
    .limit(1)
    .maybeSingle();
  if (!membership) {
    return Response.json({ error: "Hiring role required" }, { status: 403 });
  }

  // Paywall — free tenants get 402 so the UI can surface the upgrade path.
  // AI is unlocked by a Premium+ plan OR an active Featured ($59) listing.
  const { allowed: aiAllowed } = await currentHiringAiAccess();
  if (!aiAllowed) {
    return Response.json(
      { error: "AI features require Premium, Concierge, or a Featured listing." },
      { status: 402 },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "AI writer not configured yet — ANTHROPIC_API_KEY missing." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const {
    style,
    title,
    salesRole,
    commitment,
    compensation,
    sellingPoints,
    company,
  } = (body ?? {}) as {
    style?: string;
    title?: string;
    salesRole?: string;
    commitment?: string;
    compensation?: string;
    sellingPoints?: string;
    company?: string;
  };

  if (!style || !LISTING_STYLES.includes(style as ListingStyle)) {
    return Response.json(
      { error: `style must be one of: ${LISTING_STYLES.join(", ")}` },
      { status: 400 },
    );
  }

  const brief = [
    title ? `Job title: ${title}` : null,
    company ? `Company: ${company}` : null,
    salesRole ? `Sales role: ${salesRole}` : null,
    commitment ? `Commitment: ${commitment}` : null,
    compensation ? `Compensation: ${compensation}` : null,
    sellingPoints ? `Selling points from the hiring manager:\n${sellingPoints}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  if (!brief) {
    return Response.json(
      { error: "Provide at least a title or selling points to draft from." },
      { status: 400 },
    );
  }

  const client = new Anthropic({ apiKey });
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `${STYLE_INSTRUCTIONS[style as ListingStyle]}\n\nHere's the brief:\n\n${brief}\n\nDraft the listing now.`,
        },
      ],
    });
    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return Response.json({ text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { error: `AI request failed: ${msg}` },
      { status: 502 },
    );
  }
}
