/**
 * GoHighLevel v2 configuration.
 *
 * v3 talked to the v1 API (rest.gohighlevel.com/v1) using two separate
 * API keys. That API reached end-of-support on 2025-12-31 — still running,
 * but unsupported and with no announced shutoff date — so v4 targets the
 * v2 API instead.
 *
 * What changed:
 *   - Host is services.leadconnectorhq.com, and every request needs a
 *     `Version` header.
 *   - Auth is a Private Integration Token (Settings -> Private Integrations
 *     in GHL). That's the right choice for a first-party backend like ours;
 *     OAuth is for marketplace apps installed on accounts we don't own.
 *   - Every call is scoped to a Location (sub-account) id.
 *   - Tags live on the CONTACT, not on the opportunity payload.
 *
 * v3's two API keys suggest the talent and client pipelines may live in
 * two different sub-accounts. Each pipeline is configured independently
 * here so either layout works: point both at the same location + token if
 * they share a sub-account, or give each its own if they don't.
 */

export const GHL_API_BASE = "https://services.leadconnectorhq.com";

/** GHL's date-based API version. Sent on every request. */
export const GHL_API_VERSION = process.env.GHL_API_VERSION ?? "2021-07-28";

export type GhlPipeline = "talent" | "client";

export type PipelineConfig = {
  pipeline: GhlPipeline;
  token: string;
  locationId: string;
  pipelineId: string;
  stageId: string;
};

/**
 * Pipeline + stage ids carried over from v3. They're defaults, not secrets —
 * override via env if the pipelines were rebuilt. Nothing is sent anywhere
 * until a token and location id are also configured.
 */
const V3_DEFAULTS = {
  talent: {
    pipelineId: "Q0vVyvzi1qKRrXvYGi2n",
    stageId: "6c9c0dbc-2316-47bf-8919-19a61744dd5d",
  },
  client: {
    pipelineId: "WxrJIMYTpwIngsR7gO05",
    stageId: "7c57756d-1eb6-408c-9208-5268189098e8",
  },
} as const;

function env(name: string): string {
  return (process.env[name] ?? "").trim();
}

/**
 * Resolve the config for one pipeline, or null when it isn't configured.
 * A per-pipeline token wins over the shared one, so the two-sub-account
 * layout works without extra plumbing.
 */
export function pipelineConfig(pipeline: GhlPipeline): PipelineConfig | null {
  const prefix = pipeline === "talent" ? "GHL_TALENT" : "GHL_CLIENT";

  const token = env(`${prefix}_TOKEN`) || env("GHL_PRIVATE_TOKEN");
  const locationId = env(`${prefix}_LOCATION_ID`) || env("GHL_LOCATION_ID");
  const pipelineId =
    env(`${prefix}_PIPELINE_ID`) || V3_DEFAULTS[pipeline].pipelineId;
  const stageId = env(`${prefix}_STAGE_ID`) || V3_DEFAULTS[pipeline].stageId;

  if (!token || !locationId) return null;

  return { pipeline, token, locationId, pipelineId, stageId };
}

/**
 * Dry run logs exactly what would be sent instead of calling GHL.
 *
 * v3 gated everything on `DEPLOYMENT_STAGE === 'prod'`, which meant the
 * integration could never be exercised anywhere but production — the
 * reason a broken tag update went unnoticed for so long. Dry run replaces
 * that: the whole path runs everywhere, and only the final HTTP call is
 * swapped for a log line.
 *
 * Defaults to ON whenever GHL_DRY_RUN is unset outside production, so a
 * dev machine can never write into the live CRM by accident.
 */
export function isDryRun(): boolean {
  const explicit = env("GHL_DRY_RUN").toLowerCase();
  if (explicit === "true" || explicit === "1") return true;
  if (explicit === "false" || explicit === "0") return false;
  return process.env.NODE_ENV !== "production";
}

/** True when at least one pipeline has a token + location configured. */
export function isConfigured(): boolean {
  return pipelineConfig("talent") !== null || pipelineConfig("client") !== null;
}

/**
 * Tag vocabulary. Deliberately identical to v3's so the automations already
 * built inside GoHighLevel keep firing — they key on these exact strings.
 * v4 says "rep" where v3 said "talent"; the tag stays `talent` on purpose.
 */
export const TAGS = {
  talent: "talent",
  client: "client",
  selfRegistered: "self-registered",
  premium: "premium",
  concierge: "concierge",
} as const;

/**
 * v3 also wrote `$299` and `$780` tags on payment. Both are retired:
 * v4 has no payments wired up yet, and the pricing they referred to no
 * longer exists (v4 sells Free / Premium $59 / Concierge $299 per month).
 * Tier tags above replace them — see docs/GOHIGHLEVEL.md.
 */
