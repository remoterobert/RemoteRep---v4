import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { ghlFetch } from "./client";
import {
  TAGS,
  isConfigured,
  isDryRun,
  pipelineConfig,
  type GhlPipeline,
  type PipelineConfig,
} from "./config";

/**
 * GoHighLevel sync operations.
 *
 * Every function here is safe to call from a server action: none of them
 * throw, and none of them block the user. Failures are recorded on the
 * user's `ghl_user_state` row so an admin can see what went wrong, instead
 * of disappearing into a swallowed console.error the way v3's did.
 *
 * v2 flow is two steps where v1 was one:
 *   1. upsert the contact (idempotent on email — a retry can't duplicate)
 *   2. create the opportunity, linked to that contact id
 * Tags are a contact-level concept in v2, applied via their own endpoint.
 */

// ---------------------------------------------------------------------------
// Response shapes. GHL returns the created record under a named key, but has
// varied historically, so every id read falls back to a bare `id`.
// ---------------------------------------------------------------------------

function extractId(res: unknown, key: string): string | null {
  if (!res || typeof res !== "object") return null;
  const obj = res as Record<string, unknown>;
  const nested = obj[key];
  if (nested && typeof nested === "object") {
    const id = (nested as Record<string, unknown>).id;
    if (typeof id === "string") return id;
  }
  return typeof obj.id === "string" ? obj.id : null;
}

// ---------------------------------------------------------------------------
// Raw API operations
// ---------------------------------------------------------------------------

type ContactInput = {
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone?: string | null;
  companyName?: string | null;
  tags: string[];
  source: string;
};

async function upsertContact(
  config: PipelineConfig,
  input: ContactInput,
): Promise<string | null> {
  const res = await ghlFetch<unknown>({
    config,
    path: "/contacts/upsert",
    method: "POST",
    context: "upsert contact",
    dryRunResult: { contact: { id: "dry-run-contact-id" } },
    body: {
      locationId: config.locationId,
      email: input.email,
      firstName: input.firstName ?? undefined,
      lastName: input.lastName ?? undefined,
      phone: input.phone ?? undefined,
      companyName: input.companyName ?? undefined,
      source: input.source,
      tags: input.tags,
    },
  });
  return extractId(res, "contact");
}

async function createOpportunity(
  config: PipelineConfig,
  input: { contactId: string; name: string },
): Promise<string | null> {
  const res = await ghlFetch<unknown>({
    config,
    path: "/opportunities/",
    method: "POST",
    context: "create opportunity",
    dryRunResult: { opportunity: { id: "dry-run-opportunity-id" } },
    body: {
      locationId: config.locationId,
      pipelineId: config.pipelineId,
      pipelineStageId: config.stageId,
      contactId: input.contactId,
      name: input.name,
      status: "open",
    },
  });
  return extractId(res, "opportunity");
}

async function addContactTags(
  config: PipelineConfig,
  contactId: string,
  tags: string[],
): Promise<void> {
  if (!tags.length) return;
  await ghlFetch<unknown>({
    config,
    path: `/contacts/${contactId}/tags`,
    method: "POST",
    context: "add contact tags",
    body: { tags },
  });
}

// ---------------------------------------------------------------------------
// State recording
// ---------------------------------------------------------------------------

type StatePatch = {
  contact_id?: string | null;
  opportunity_id?: string | null;
  tags?: string[];
  sync_error?: string | null;
};

async function recordState(
  userId: string,
  pipeline: GhlPipeline,
  patch: StatePatch,
): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("ghl_user_state").upsert(
      {
        user_id: userId,
        pipeline,
        last_synced_at: new Date().toISOString(),
        ...patch,
      },
      { onConflict: "user_id,pipeline" },
    );
  } catch (err) {
    // Recording the outcome must never itself break the caller.
    console.error("[ghl] could not record sync state", err);
  }
}

// ---------------------------------------------------------------------------
// Which pipeline does this user belong to?
// ---------------------------------------------------------------------------

type UserFacts = {
  email: string;
  firstName: string | null;
  lastName: string | null;
  tags: string[];
  referenceSource: string | null;
  pipeline: GhlPipeline | null;
  companyName: string | null;
};

/**
 * v3 knew talent-vs-client at signup because signup collected everything.
 * v4's signup takes only an email and password — the choice happens during
 * onboarding — so the pipeline is derived from what the user has become:
 * a hiring-team membership means client, sales specialties mean talent.
 */
async function loadUserFacts(userId: string): Promise<UserFacts | null> {
  const admin = createAdminClient();

  const { data: user } = await admin
    .from("users")
    .select("email, first_name, last_name, tags, reference_source")
    .eq("id", userId)
    .maybeSingle();

  if (!user?.email) return null;

  // Oldest membership wins, so the answer is stable rather than whichever
  // row the database happened to return first.
  const { data: membership } = await admin
    .from("tenant_members")
    .select("tenant_id, tenants!inner(name, type)")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const tenant = (
    membership as { tenants?: { name: string; type: string } } | null
  )?.tenants;

  // Every onboarded user gets a tenant, and its type says which side of the
  // marketplace they're on: reps get a personal `solo_talent` tenant,
  // hiring teams get `client_company` (or `agency`). `platform` is ours.
  const isHiring =
    tenant?.type === "client_company" || tenant?.type === "agency";

  let pipeline: GhlPipeline | null = isHiring
    ? "client"
    : tenant?.type === "solo_talent"
      ? "talent"
      : null;

  // Fallback for anyone predating the tenant-per-rep model: having picked
  // sales specialties makes them a rep.
  if (!pipeline) {
    const { data: specialty } = await admin
      .from("candidate_specialties")
      .select("user_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();
    if (specialty) pipeline = "talent";
  }

  return {
    email: user.email as string,
    firstName: (user.first_name as string | null) ?? null,
    lastName: (user.last_name as string | null) ?? null,
    tags: ((user.tags as string[] | null) ?? []).filter(Boolean),
    referenceSource: (user.reference_source as string | null) ?? null,
    pipeline,
    companyName: isHiring ? (tenant?.name ?? null) : null,
  };
}

/**
 * v3 tagged `self-registered` on anything that wasn't admin-created, and
 * recorded a `source` of "Self-registered" or "Administrator-registered".
 * v4 keeps both, reading the distinction off `users.reference_source`,
 * which the admin create-user flow already stamps.
 */
function isAdminCreated(referenceSource: string | null): boolean {
  return (referenceSource ?? "")
    .toLowerCase()
    .startsWith("administrator-registered");
}

// ---------------------------------------------------------------------------
// Public operations
// ---------------------------------------------------------------------------

/**
 * Create (or refresh) this user's contact + opportunity in GoHighLevel.
 *
 * Safe to call more than once: the contact upsert is keyed on email, and an
 * opportunity is only created the first time.
 */
export async function syncUserToGhl(
  userId: string,
  extraTags: string[] = [],
): Promise<void> {
  if (!isConfigured() && !isDryRun()) return;

  try {
    const facts = await loadUserFacts(userId);
    if (!facts) return;

    if (!facts.pipeline) {
      // Admin-created users often have no role yet — they get synced when
      // they finish onboarding. Recorded rather than silently dropped.
      await recordState(userId, "talent", {
        sync_error:
          "Pipeline unknown — user has not completed onboarding yet. Will sync when they do.",
      });
      return;
    }

    const config = pipelineConfig(facts.pipeline);
    if (!config) {
      if (isDryRun()) {
        console.log("[ghl:dry-run] pipeline not configured", {
          userId,
          pipeline: facts.pipeline,
        });
      }
      return;
    }

    const adminCreated = isAdminCreated(facts.referenceSource);
    const source = adminCreated
      ? "Administrator-registered"
      : "Self-registered";

    const baseTag =
      facts.pipeline === "talent" ? TAGS.talent : TAGS.client;
    const tags = Array.from(
      new Set([
        baseTag,
        ...(adminCreated ? [] : [TAGS.selfRegistered]),
        ...facts.tags,
        ...extraTags,
      ]),
    );

    const fullName =
      [facts.firstName, facts.lastName].filter(Boolean).join(" ").trim() ||
      facts.email;

    const contactId = await upsertContact(config, {
      email: facts.email,
      firstName: facts.firstName,
      lastName: facts.lastName,
      companyName: facts.companyName,
      tags,
      source,
    });

    if (!contactId) {
      // Dry run, or GHL returned no id. Nothing more we can do this pass.
      await recordState(userId, facts.pipeline, {
        tags,
        sync_error: isDryRun() ? null : "GHL returned no contact id",
      });
      return;
    }

    // v3 titled opportunities "Name <timestamp>" (and clients
    // "Name | Company <timestamp>"). Kept so the pipeline reads the same.
    const stamp = Date.now();
    const name =
      facts.pipeline === "client" && facts.companyName
        ? `${fullName} | ${facts.companyName} ${stamp}`
        : `${fullName} ${stamp}`;

    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("ghl_user_state")
      .select("opportunity_id")
      .eq("user_id", userId)
      .eq("pipeline", facts.pipeline)
      .maybeSingle();

    let opportunityId =
      (existing as { opportunity_id: string | null } | null)?.opportunity_id ??
      null;

    if (!opportunityId) {
      opportunityId = await createOpportunity(config, { contactId, name });
    }

    await recordState(userId, facts.pipeline, {
      contact_id: contactId,
      opportunity_id: opportunityId,
      tags,
      sync_error: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[ghl] syncUserToGhl failed", { userId, message });
    const facts = await loadUserFacts(userId).catch(() => null);
    await recordState(userId, facts?.pipeline ?? "talent", {
      sync_error: message.slice(0, 1000),
    });
  }
}

/**
 * Push tags onto a user's existing GoHighLevel contact.
 *
 * Used by the admin user editor, whose `tags` field has always been
 * documented as "used to trigger GHL automations" but until now went
 * nowhere. Only adds tags — removing one in the admin UI does not remove
 * it in GHL, because GHL automations may have added tags of their own that
 * we must not clobber.
 */
export async function pushUserTags(
  userId: string,
  tags: string[],
): Promise<void> {
  const clean = tags.map((t) => t.trim()).filter(Boolean);
  if (!clean.length) return;
  if (!isConfigured() && !isDryRun()) return;

  try {
    const admin = createAdminClient();
    const { data: state } = await admin
      .from("ghl_user_state")
      .select("pipeline, contact_id")
      .eq("user_id", userId)
      .not("contact_id", "is", null)
      .limit(1)
      .maybeSingle();

    const row = state as {
      pipeline: GhlPipeline;
      contact_id: string;
    } | null;

    if (!row?.contact_id) {
      // Not in GHL yet, so there is no contact to tag. Fall back to a full
      // sync and hand the tags along explicitly — relying on them having
      // already been written to users.tags would make this silently
      // dependent on the caller's ordering.
      await syncUserToGhl(userId, clean);
      return;
    }

    const config = pipelineConfig(row.pipeline);
    if (!config) return;

    await addContactTags(config, row.contact_id, clean);
    await recordState(userId, row.pipeline, { sync_error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[ghl] pushUserTags failed", { userId, message });
  }
}

/**
 * Tag a subscription tier change.
 *
 * v3 tagged `$299` and `$780` on Stripe payment. v4 has no payments wired
 * up yet and sells different tiers, so this is called from wherever the
 * tier changes today and is ready for billing when it lands.
 */
export async function syncTierChange(
  userId: string,
  tier: "free" | "premium" | "concierge",
): Promise<void> {
  if (tier === "free") return; // nothing to add; we never remove tags
  await pushUserTags(userId, [
    tier === "premium" ? TAGS.premium : TAGS.concierge,
  ]);
}
