/**
 * GoHighLevel (GHL) lead sync — API v2 via Private Integration tokens.
 *
 * Two GHL sub-accounts, each with its own token + location:
 *   - talent: reps and Fractional CRO applicants
 *       GHL_TALENT_API_TOKEN, GHL_TALENT_LOCATION_ID
 *   - client: companies hiring
 *       GHL_CLIENT_API_TOKEN, GHL_CLIENT_LOCATION_ID
 *
 * Pipelines are optional and set per lead type (find the IDs on
 * /admin/env-check). Without them we still create the contact + tags.
 *   GHL_REP_PIPELINE_ID / GHL_REP_STAGE_ID        (talent account)
 *   GHL_CRO_PIPELINE_ID / GHL_CRO_STAGE_ID        (talent account)
 *   GHL_CLIENT_PIPELINE_ID / GHL_CLIENT_STAGE_ID  (client account)
 *
 * Every function here is best-effort: it never throws, it returns what
 * happened, and callers decide whether that matters. Tokens never leave
 * the server.
 */

// GHL_API_BASE exists only so tests can point at a local stand-in server.
const API = process.env.GHL_API_BASE ?? "https://services.leadconnectorhq.com";
const VERSION = "2021-07-28";
const TIMEOUT_MS = 8000;

export type GhlAccount = "talent" | "client";
export type GhlLeadType = "rep" | "cro" | "client";

const ACCOUNT_FOR: Record<GhlLeadType, GhlAccount> = {
  rep: "talent",
  cro: "talent",
  client: "client",
};

function accountConfig(account: GhlAccount) {
  const prefix = account === "talent" ? "GHL_TALENT" : "GHL_CLIENT";
  const token = process.env[`${prefix}_API_TOKEN`];
  const locationId = process.env[`${prefix}_LOCATION_ID`];
  return token && locationId ? { token, locationId } : null;
}

function pipelineConfig(lead: GhlLeadType) {
  const prefix = `GHL_${lead.toUpperCase()}`;
  const pipelineId = process.env[`${prefix}_PIPELINE_ID`];
  const stageId = process.env[`${prefix}_STAGE_ID`];
  return pipelineId && stageId ? { pipelineId, stageId } : null;
}

export function isGhlConfigured(account: GhlAccount): boolean {
  return accountConfig(account) !== null;
}

async function call<T>(
  account: GhlAccount,
  method: "GET" | "POST",
  path: string,
  body?: unknown,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const cfg = accountConfig(account);
  if (!cfg) return { ok: false, error: `${account} account not configured` };
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        Version: VERSION,
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `HTTP ${res.status} ${path}: ${text.slice(0, 300)}` };
    }
    return { ok: true, data: (await res.json().catch(() => ({}))) as T };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export type GhlLead = {
  type: GhlLeadType;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  companyName?: string;
  tags: string[];
  source: string;
  /** Opportunity title; defaults to the person's name. */
  opportunityName?: string;
  /** Free-text note attached to the contact (e.g. intake answers). */
  note?: string;
};

export type GhlSyncResult =
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string }
  | {
      status: "synced";
      contactId: string;
      opportunityId: string | null;
      warnings: string[];
    };

/**
 * Create-or-update the contact, add tags, attach an optional note, and put
 * them on the lead type's pipeline (once per contact per pipeline).
 */
export async function syncLead(lead: GhlLead): Promise<GhlSyncResult> {
  const account = ACCOUNT_FOR[lead.type];
  const cfg = accountConfig(account);
  if (!cfg) return { status: "skipped", reason: `GHL ${account} account not configured` };

  // 1. Contact (upsert matches on email/phone, so repeat leads don't duplicate)
  const contact = await call<{ contact?: { id?: string } }>(account, "POST", "/contacts/upsert", {
    locationId: cfg.locationId,
    email: lead.email,
    firstName: lead.firstName || undefined,
    lastName: lead.lastName || undefined,
    phone: lead.phone || undefined,
    companyName: lead.companyName || undefined,
    source: lead.source,
  });
  const contactId = contact.ok ? contact.data.contact?.id : undefined;
  if (!contactId) {
    return { status: "failed", error: contact.ok ? "upsert returned no contact id" : contact.error };
  }

  const warnings: string[] = [];

  // 2. Tags — added, never replaced, so existing automations keep their tags.
  if (lead.tags.length) {
    const t = await call(account, "POST", `/contacts/${contactId}/tags`, { tags: lead.tags });
    if (!t.ok) warnings.push(`tags: ${t.error}`);
  }

  // 3. Note
  if (lead.note) {
    const n = await call(account, "POST", `/contacts/${contactId}/notes`, { body: lead.note });
    if (!n.ok) warnings.push(`note: ${n.error}`);
  }

  // 4. Opportunity — skip if they're already on this pipeline.
  let opportunityId: string | null = null;
  const pipe = pipelineConfig(lead.type);
  if (pipe) {
    const params = new URLSearchParams({
      location_id: cfg.locationId,
      contact_id: contactId,
      pipeline_id: pipe.pipelineId,
    });
    const existing = await call<{ opportunities?: { id: string }[] }>(
      account,
      "GET",
      `/opportunities/search?${params.toString()}`,
    );
    opportunityId = existing.ok ? (existing.data.opportunities?.[0]?.id ?? null) : null;
    if (!existing.ok) warnings.push(`opportunity search: ${existing.error}`);

    if (!opportunityId) {
      const name =
        lead.opportunityName ||
        [lead.firstName, lead.lastName].filter(Boolean).join(" ") ||
        lead.email;
      const opp = await call<{ opportunity?: { id?: string } }>(account, "POST", "/opportunities/", {
        locationId: cfg.locationId,
        pipelineId: pipe.pipelineId,
        pipelineStageId: pipe.stageId,
        contactId,
        name,
        status: "open",
        source: lead.source,
      });
      if (opp.ok) opportunityId = opp.data.opportunity?.id ?? null;
      else warnings.push(`opportunity: ${opp.error}`);
    }
  }

  return { status: "synced", contactId, opportunityId, warnings };
}

/** Log a sync result in one consistent line (Railway captures stdout). */
export function logGhl(label: string, result: GhlSyncResult) {
  if (result.status === "synced") {
    console.log(`[ghl] ${label} synced`, {
      contactId: result.contactId,
      opportunityId: result.opportunityId,
      ...(result.warnings.length ? { warnings: result.warnings } : {}),
    });
  } else if (result.status === "failed") {
    console.error(`[ghl] ${label} failed:`, result.error);
  } else {
    console.log(`[ghl] ${label} skipped:`, result.reason);
  }
}

export type GhlPipeline = {
  id: string;
  name: string;
  stages: { id: string; name: string }[];
};

/** Pipelines + stages for an account — powers the IDs table on /admin/env-check. */
export async function listPipelines(
  account: GhlAccount,
): Promise<{ ok: true; pipelines: GhlPipeline[] } | { ok: false; error: string }> {
  const cfg = accountConfig(account);
  if (!cfg) return { ok: false, error: "not configured" };
  const r = await call<{ pipelines?: GhlPipeline[] }>(
    account,
    "GET",
    `/opportunities/pipelines?locationId=${encodeURIComponent(cfg.locationId)}`,
  );
  if (!r.ok) return r;
  return {
    ok: true,
    pipelines: (r.data.pipelines ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      stages: (p.stages ?? []).map((s) => ({ id: s.id, name: s.name })),
    })),
  };
}
