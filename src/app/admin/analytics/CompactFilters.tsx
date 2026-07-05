"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  CalendarIcon,
  ChevronDownIcon,
  ClockIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

const RANGE_PRESETS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "Last 180 days", days: 180 },
  { label: "Last 365 days", days: 365 },
];

const BUCKETS = [
  { key: "day", label: "Daily" },
  { key: "week", label: "Weekly" },
  { key: "month", label: "Monthly" },
  { key: "quarter", label: "Quarterly" },
  { key: "year", label: "Yearly" },
];

const USER_TYPES = [
  { key: "all", label: "All users" },
  { key: "candidate", label: "Candidates" },
  { key: "hiring", label: "Hiring" },
];

/**
 * Compact single-row filter bar. Each filter is a small pill button
 * that opens a popover; label reflects current selection.
 */
export function CompactFilters() {
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

  const rangeLabel = getRangeLabel(since, until);
  const bucketLabel = BUCKETS.find((b) => b.key === bucket)?.label ?? "Daily";
  const userLabel =
    USER_TYPES.find((u) => u.key === userType)?.label ?? "All users";

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <RangeDropdown
        label={rangeLabel}
        currentSince={since}
        currentUntil={until}
        onPickPreset={(days) => {
          const untilD = new Date();
          const sinceD = new Date();
          sinceD.setDate(sinceD.getDate() - days);
          push({
            since: sinceD.toISOString().slice(0, 10),
            until: untilD.toISOString().slice(0, 10),
          });
        }}
        onPickCustom={(s, u) => push({ since: s, until: u })}
      />

      <SimpleDropdown
        icon={<ClockIcon className="h-4 w-4" />}
        label={bucketLabel}
        options={BUCKETS}
        currentKey={bucket}
        onPick={(k) => push({ bucket: k })}
      />

      <SimpleDropdown
        icon={<UserIcon className="h-4 w-4" />}
        label={userLabel}
        options={USER_TYPES}
        currentKey={userType}
        onPick={(k) => push({ user_type: k })}
      />
    </div>
  );
}

function getRangeLabel(since: string, until: string): string {
  if (!since || !until) return "Last 30 days";
  const preset = RANGE_PRESETS.find((p) => {
    const untilD = new Date();
    const sinceD = new Date();
    sinceD.setDate(sinceD.getDate() - p.days);
    return (
      sinceD.toISOString().slice(0, 10) === since &&
      untilD.toISOString().slice(0, 10) === until
    );
  });
  if (preset) return preset.label;
  return `${since} → ${until}`;
}

function SimpleDropdown({
  icon,
  label,
  options,
  currentKey,
  onPick,
}: {
  icon: React.ReactNode;
  label: string;
  options: readonly { key: string; label: string }[];
  currentKey: string;
  onPick: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 hover:bg-surface-3 px-3 py-1.5 text-xs font-medium transition-colors"
      >
        {icon}
        {label}
        <ChevronDownIcon
          className={`h-3.5 w-3.5 text-light-grey transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute z-40 mt-1 min-w-[160px] rounded-lg border border-border bg-surface-2 shadow-xl py-1">
          {options.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => {
                onPick(o.key);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs hover:bg-surface-3 ${
                o.key === currentKey ? "text-primary font-semibold" : ""
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RangeDropdown({
  label,
  currentSince,
  currentUntil,
  onPickPreset,
  onPickCustom,
}: {
  label: string;
  currentSince: string;
  currentUntil: string;
  onPickPreset: (days: number) => void;
  onPickCustom: (since: string, until: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [localSince, setLocalSince] = useState(currentSince);
  const [localUntil, setLocalUntil] = useState(currentUntil);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalSince(currentSince);
    setLocalUntil(currentUntil);
  }, [currentSince, currentUntil]);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 hover:bg-surface-3 px-3 py-1.5 text-xs font-medium transition-colors"
      >
        <CalendarIcon className="h-4 w-4" />
        {label}
        <ChevronDownIcon
          className={`h-3.5 w-3.5 text-light-grey transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-40 mt-1 min-w-[240px] rounded-lg border border-border bg-surface-2 shadow-xl py-1.5">
          {RANGE_PRESETS.map((p) => (
            <button
              key={p.days}
              type="button"
              onClick={() => {
                onPickPreset(p.days);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-surface-3"
            >
              {p.label}
            </button>
          ))}
          <div className="my-1 border-t border-border" />
          <div className="px-3 py-2 space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-light-grey font-semibold">
              Custom range
            </div>
            <div className="flex items-center gap-1 text-xs">
              <input
                type="date"
                value={localSince}
                onChange={(e) => setLocalSince(e.target.value)}
                className="rounded border border-border bg-surface-3 px-1.5 py-1 flex-1"
              />
              <span className="text-light-grey">→</span>
              <input
                type="date"
                value={localUntil}
                onChange={(e) => setLocalUntil(e.target.value)}
                className="rounded border border-border bg-surface-3 px-1.5 py-1 flex-1"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (localSince && localUntil) {
                  onPickCustom(localSince, localUntil);
                  setOpen(false);
                }
              }}
              className="w-full text-center rounded bg-primary text-white text-xs font-semibold py-1"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
