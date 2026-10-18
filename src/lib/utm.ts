/**
 * UTM attribution for leads sent to GoHighLevel.
 *
 * Landing-page links carry UTMs (?utm_source=…). A form on that page can read
 * them straight from the URL, but signups finish later in the app, after the
 * UTMs have left the address bar. So the proxy stores the UTMs of the most
 * recent tagged visit in the `rr_utm` cookie, and onboarding reads it back.
 * The cookie holds only these five values — no personal data.
 */

export const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export type UtmKey = (typeof UTM_KEYS)[number];
export type Utm = Partial<Record<UtmKey, string>>;

export const UTM_COOKIE = "rr_utm";
export const UTM_COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

function clean(v: unknown): string | undefined {
  const s = typeof v === "string" ? v.trim().slice(0, 200) : "";
  return s || undefined;
}

/** UTMs from any key/value source (URLSearchParams, FormData, object). */
export function pickUtm(get: (key: string) => unknown): Utm {
  const out: Utm = {};
  for (const k of UTM_KEYS) {
    const v = clean(get(k));
    if (v) out[k] = v;
  }
  return out;
}

export function hasUtm(utm: Utm): boolean {
  return UTM_KEYS.some((k) => utm[k]);
}

export function parseUtmCookie(raw: string | undefined): Utm {
  if (!raw) return {};
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    return pickUtm((k) => obj[k]);
  } catch {
    return {};
  }
}

/** "facebook / paid / fcro-launch / video-b" — for the GHL contact's Source. */
export function utmSource(utm: Utm, fallback: string): string {
  const parts = UTM_KEYS.map((k) => utm[k]).filter(Boolean);
  return parts.length ? parts.join(" / ") : fallback;
}

/** Labelled lines for the GHL note. */
export function utmNoteLines(utm: Utm): string[] {
  if (!hasUtm(utm)) return ["Traffic source: direct (no UTMs)"];
  return UTM_KEYS.filter((k) => utm[k]).map((k) => `${k}: ${utm[k]}`);
}
