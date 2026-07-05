// Small time-series + KPI helpers used by the admin analytics dashboard
// and per-user detail pages. Bucketing runs in JS (fine at MVP scale);
// swap for Postgres RPC functions when the platform grows.

export type Bucket = "day" | "week" | "month" | "quarter" | "year";

/**
 * Group rows by a truncated date derived from `dateField` (default
 * `created_at`) and return a sorted array of `{ date, count }`.
 *
 * `dateField` supports one level of dot-nesting for nested selects
 * (e.g., "tenants.created_at").
 */
export function bucketCounts<T extends Record<string, unknown>>(
  rows: T[],
  bucket: Bucket,
  dateField: keyof T | string = "created_at",
): Array<{ date: string; count: number }> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const raw = getPath(row, String(dateField));
    if (typeof raw !== "string") continue;
    const key = truncateDate(raw, bucket);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Two-level bucket: group by both date and category. Returns a
 * pivoted array `[{ date, [category1]: n, [category2]: n, ... }]`
 * suitable for stacked area / bar charts.
 */
export function bucketByCategory<T extends Record<string, unknown>>(
  rows: T[],
  bucket: Bucket,
  categoryField: keyof T | string,
  dateField: keyof T | string = "created_at",
): {
  data: Array<Record<string, string | number>>;
  categories: string[];
} {
  const byDate = new Map<string, Map<string, number>>();
  const categories = new Set<string>();
  for (const row of rows) {
    const raw = getPath(row, String(dateField));
    if (typeof raw !== "string") continue;
    const cat = String(getPath(row, String(categoryField)) ?? "unknown");
    categories.add(cat);
    const key = truncateDate(raw, bucket);
    if (!byDate.has(key)) byDate.set(key, new Map());
    const sub = byDate.get(key)!;
    sub.set(cat, (sub.get(cat) ?? 0) + 1);
  }
  const catList = Array.from(categories).sort();
  const data = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, sub]) => {
      const row: Record<string, string | number> = { date };
      for (const c of catList) row[c] = sub.get(c) ?? 0;
      return row;
    });
  return { data, categories: catList };
}

function getPath(obj: Record<string, unknown>, path: string): unknown {
  if (!path.includes(".")) return obj[path];
  return path.split(".").reduce<unknown>((acc, k) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[k];
    }
    return undefined;
  }, obj);
}

function truncateDate(iso: string, bucket: Bucket): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  switch (bucket) {
    case "day":
      return d.toISOString().slice(0, 10); // YYYY-MM-DD
    case "week": {
      const monday = new Date(d);
      const dayOfWeek = monday.getUTCDay();
      const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      monday.setUTCDate(monday.getUTCDate() + daysToMonday);
      return monday.toISOString().slice(0, 10);
    }
    case "month":
      return d.toISOString().slice(0, 7) + "-01"; // YYYY-MM-01
    case "quarter": {
      const q = Math.floor(d.getUTCMonth() / 3);
      return `${d.getUTCFullYear()}-Q${q + 1}`;
    }
    case "year":
      return d.getUTCFullYear().toString();
  }
}

/**
 * Compute the absolute-and-percentage delta between two counts.
 * Used on KPI cards ("+12% vs. prior 30 days").
 */
export function computeDelta(current: number, prior: number): {
  absolute: number;
  percent: number | null;
} {
  const absolute = current - prior;
  if (prior === 0) {
    return { absolute, percent: current > 0 ? 100 : null };
  }
  return { absolute, percent: Math.round((absolute / prior) * 100) };
}

/**
 * Parse an ISO date string; return null if invalid.
 */
export function safeParseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Standard shape for the range-picker's query params. `since` and
 * `until` are ISO date strings (YYYY-MM-DD).
 */
export type Range = { since: string; until: string; bucket: Bucket };

export function defaultRange(days = 30): Range {
  const until = new Date();
  const since = new Date();
  since.setDate(since.getDate() - days);
  return {
    since: since.toISOString().slice(0, 10),
    until: until.toISOString().slice(0, 10),
    bucket: "day",
  };
}

export function parseRangeFromSearchParams(
  sp: Record<string, string | string[] | undefined>,
): Range {
  const def = defaultRange();
  const since =
    (typeof sp.since === "string" && sp.since) || def.since;
  const until = (typeof sp.until === "string" && sp.until) || def.until;
  const bucket = (typeof sp.bucket === "string" && sp.bucket) as Bucket;
  const validBucket = ["day", "week", "month", "quarter", "year"].includes(
    bucket,
  )
    ? bucket
    : def.bucket;
  return { since, until, bucket: validBucket };
}
