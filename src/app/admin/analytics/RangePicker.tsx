"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

const BUCKETS = ["day", "week", "month", "quarter", "year"] as const;

const PRESETS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "180d", days: 180 },
  { label: "365d", days: 365 },
];

export function RangePicker() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const since = sp.get("since") ?? "";
  const until = sp.get("until") ?? "";
  const bucket = sp.get("bucket") ?? "day";
  const userType = sp.get("user_type") ?? "all";

  function push(next: Record<string, string>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next)) {
      if (!v) params.delete(k);
      else params.set(k, v);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function pickPreset(days: number) {
    const until = new Date();
    const since = new Date();
    since.setDate(since.getDate() - days);
    push({
      since: since.toISOString().slice(0, 10),
      until: until.toISOString().slice(0, 10),
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 bg-surface-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => pickPreset(p.days)}
            className="px-2.5 py-1 text-xs rounded hover:bg-surface-3 font-medium"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 text-xs">
        <input
          type="date"
          value={since}
          onChange={(e) => push({ since: e.target.value })}
          className="rounded border border-border bg-surface-2 px-2 py-1"
        />
        <span className="text-light-grey">→</span>
        <input
          type="date"
          value={until}
          onChange={(e) => push({ until: e.target.value })}
          className="rounded border border-border bg-surface-2 px-2 py-1"
        />
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 bg-surface-2">
        {BUCKETS.map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => push({ bucket: b })}
            className={`px-2.5 py-1 text-xs rounded font-medium capitalize ${
              b === bucket ? "bg-primary text-white" : "hover:bg-surface-3"
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 bg-surface-2 ml-auto">
        {[
          { key: "all", label: "All users" },
          { key: "candidate", label: "Candidates" },
          { key: "hiring", label: "Hiring" },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => push({ user_type: t.key })}
            className={`px-2.5 py-1 text-xs rounded font-medium ${
              t.key === userType
                ? "bg-primary text-white"
                : "hover:bg-surface-3"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
