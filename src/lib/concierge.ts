import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Concierge agent. Given a chat's most recent human message from a
 * candidate, generates and posts a reply as the tenant's AI assistant.
 *
 * Only runs when:
 *   - the listing tied to this chat has concierge_enabled_at set
 *   - the tenant is on the concierge tier (with an unexpired subscription)
 *   - the candidate has recorded consent for this tenant (or has not
 *     revoked it after consenting)
 *
 * Everything is fire-and-forget from the caller's perspective — a failure
 * inside the agent must never block the human's message from being
 * delivered.
 */

const AGENT_MODEL = "claude-haiku-4-5-20251001";

const SYSTEM_PROMPT = `You are a professional hiring concierge for a company using RemoteRep to hire remote sales talent. Your job is to warmly represent the company in the first phase of candidate conversations, answer straightforward questions, gather signal about what the candidate is looking for, and — when they're ready — hand off to the hiring team by sharing the interview booking link (if provided).

Rules you must follow:

1. Never make hiring decisions or promises. You can express interest, but the actual hiring team decides everything.
2. Never ask about or use age, race, gender, disability, national origin, religion, family status, veteran status, sexual orientation, or any other legally protected characteristic. If the candidate volunteers this info, do not incorporate it into your reasoning — steer the conversation back to skills, experience, and fit.
3. Every candidate is entitled to opt out of AI. If they say anything like "human only", "I want to talk to a person", "no AI", "please have someone from the team message me" — respond politely acknowledging their preference and stop responding. A human on the hiring side will pick up.
4. Be honest about being AI. When you first interact, mention you're the AI assistant. Keep messages short (2-4 sentences) and warm — no corporate-speak.
5. If the listing includes a calendar link and the candidate has expressed clear interest, invite them to book a call using the link. Never fabricate a link.
6. If you don't know the answer to a question about the specifics of the role, say so and offer to loop in the hiring team.

Output plain text messages, ready to send. No markdown, no headers.`;

type AgentContext = {
  chatId: string;
  candidateUserId: string;
  tenantAdminUserId: string;
  companyName: string;
  listingTitle: string;
  calendarLink: string | null;
  recentMessages: Array<{
    author_kind: "user" | "ai_concierge" | "system";
    is_from_candidate: boolean;
    body: string;
  }>;
};

async function generateReply(ctx: AgentContext): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const conversationText = ctx.recentMessages
    .map((m) => {
      const who =
        m.author_kind === "ai_concierge"
          ? "You (concierge AI)"
          : m.is_from_candidate
            ? "Candidate"
            : "Hiring team";
      return `${who}: ${m.body}`;
    })
    .join("\n\n");

  const userPrompt = `Company: ${ctx.companyName}
Listing: ${ctx.listingTitle}
${ctx.calendarLink ? `Booking link: ${ctx.calendarLink}` : "No booking link yet — do not fabricate one."}

Conversation so far (oldest first):

${conversationText}

Write your next message to the candidate. Reply with just the message text, nothing else.`;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: AGENT_MODEL,
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });
    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return text || null;
  } catch {
    return null;
  }
}

/**
 * Try to send a concierge reply on the given chat. Runs on the server
 * after a candidate posts a message. Handles all guards (tier, consent,
 * opt-out) internally; caller just fires it.
 */
export async function maybeRunConciergeReply(chatId: string, candidateUserId: string) {
  const admin = createAdminClient();

  // Load chat → application → listing → tenant. Bail on any missing link.
  const { data: chat } = await admin
    .from("chats")
    .select("id, tenant_id, related_application_id")
    .eq("id", chatId)
    .maybeSingle();
  if (!chat) return;
  const chatRow = chat as {
    id: string;
    tenant_id: string | null;
    related_application_id: string | null;
  };
  if (!chatRow.tenant_id || !chatRow.related_application_id) return;

  const { data: app } = await admin
    .from("applications")
    .select("id, listing_id, candidate_user_id, status")
    .eq("id", chatRow.related_application_id)
    .maybeSingle();
  if (!app) return;
  const appRow = app as {
    id: string;
    listing_id: string | null;
    candidate_user_id: string;
    status: string;
  };
  if (appRow.candidate_user_id !== candidateUserId) return;
  if (!appRow.listing_id) return;

  const { data: listing } = await admin
    .from("listings")
    .select(
      "id, title, calendar_link, concierge_enabled_at, tenants(id, name, subscription_tier, subscription_expires_at)",
    )
    .eq("id", appRow.listing_id)
    .maybeSingle();
  if (!listing) return;
  const listingRow = listing as unknown as {
    id: string;
    title: string;
    calendar_link: string | null;
    concierge_enabled_at: string | null;
    tenants:
      | {
          id: string;
          name: string;
          subscription_tier: string;
          subscription_expires_at: string | null;
        }
      | Array<{
          id: string;
          name: string;
          subscription_tier: string;
          subscription_expires_at: string | null;
        }>
      | null;
  };
  const tenant = Array.isArray(listingRow.tenants)
    ? listingRow.tenants[0]
    : listingRow.tenants;
  if (!tenant) return;

  // Guard: concierge must be enabled AND tenant tier must still be concierge.
  if (!listingRow.concierge_enabled_at) return;
  if (tenant.subscription_tier !== "concierge") return;
  if (
    tenant.subscription_expires_at &&
    new Date(tenant.subscription_expires_at) < new Date()
  )
    return;

  // Guard: candidate must have active consent.
  const { data: consent } = await admin
    .from("candidate_ai_consent")
    .select("consented_at, revoked_at")
    .eq("user_id", candidateUserId)
    .eq("tenant_id", tenant.id)
    .maybeSingle();
  if (!consent) return;
  if ((consent as { revoked_at: string | null }).revoked_at) return;

  // Pick a tenant admin to attribute the AI message to. Any active admin
  // works; the message will show as authored by the AI regardless via
  // author_kind='ai_concierge'.
  const { data: adminMember } = await admin
    .from("tenant_members")
    .select("user_id")
    .eq("tenant_id", tenant.id)
    .eq("status", "active")
    .in("role", ["client_admin", "agency_admin"])
    .limit(1)
    .maybeSingle();
  const tenantAdminUserId =
    (adminMember as { user_id: string } | null)?.user_id ?? null;
  if (!tenantAdminUserId) return;

  // Pull last 15 messages for context.
  const { data: recent } = await admin
    .from("messages")
    .select("author_user_id, author_kind, body, created_at")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true })
    .limit(15);
  const recentMessages =
    (recent as unknown as Array<{
      author_user_id: string;
      author_kind: "user" | "ai_concierge" | "system";
      body: string;
    }> | null) ?? [];

  const reply = await generateReply({
    chatId,
    candidateUserId,
    tenantAdminUserId,
    companyName: tenant.name,
    listingTitle: listingRow.title,
    calendarLink: listingRow.calendar_link,
    recentMessages: recentMessages.map((m) => ({
      author_kind: m.author_kind,
      is_from_candidate: m.author_user_id === candidateUserId,
      body: m.body,
    })),
  });
  if (!reply) return;

  await admin.from("messages").insert({
    chat_id: chatId,
    author_user_id: tenantAdminUserId,
    author_kind: "ai_concierge",
    body: reply,
  });

  await admin.from("events").insert({
    tenant_id: tenant.id,
    actor_user_id: tenantAdminUserId,
    event_type: "concierge.replied",
    entity_type: "chat",
    entity_id: chatId,
    payload: {
      candidate_user_id: candidateUserId,
      listing_id: listingRow.id,
      reply_chars: reply.length,
    },
  });
}
