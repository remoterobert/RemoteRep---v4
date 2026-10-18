/**
 * GoHighLevel (GHL) lead sync — API v2 via Private Integration tokens.
 *
 * Two GHL sub-accounts, each with its own token + location:
 *   - talent: reps and Fractional CRO applicants
 *       GHL_TALENT_API_TOKEN, GHL_TALENT_LOCATION_ID
 *   - client: companies hiring
 *       GHL_CLIENT_API_TOKEN, GHL_CLIENT_LOCATION_ID
 *
 * The site only creates/updates the contact, adds tags, and attaches a note.
 * Everything downstream (pipelines, assignments, follow-up) is a GHL workflow
 * triggered by the tags — so a new form or split test needs a new tag, not a
 * new env variable. Tag list: docs/GHL-INTEGRATION.md.
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
  /** Free-text note attached to the contact (e.g. intake answers). */
  note?: string;
};

export type GhlSyncResult =
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string }
  | { status: "synced"; contactId: string; warnings: string[] };

/** Create-or-update the contact, add tags, and attach an optional note. */
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

  return { status: "synced", contactId, warnings };
}

/** Log a sync result in one consistent line (Railway captures stdout). */
export function logGhl(label: string, result: GhlSyncResult) {
  if (result.status === "synced") {
    console.log(`[ghl] ${label} synced`, {
      contactId: result.contactId,
      ...(result.warnings.length ? { warnings: result.warnings } : {}),
    });
  } else if (result.status === "failed") {
    console.error(`[ghl] ${label} failed:`, result.error);
  } else {
    console.log(`[ghl] ${label} skipped:`, result.reason);
  }
}
