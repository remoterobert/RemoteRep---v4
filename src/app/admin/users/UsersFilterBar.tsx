"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

const TYPES = [
  { key: "all", label: "All types" },
  { key: "candidate", label: "Candidates" },
  { key: "hiring", label: "Hiring" },
  { key: "admin", label: "Admins" },
];

const ACCESS = [
  { key: "all", label: "Any access" },
  { key: "free", label: "Free" },
  { key: "premium", label: "Premium" },
  { key: "comp", label: "Comped" },
];

const STATUS = [
  { key: "active", label: "Active" },
  { key: "archived", label: "Archived" },
  { key: "all", label: "All statuses" },
];

const SORT = [
  { key: "created_desc", label: "Newest first" },
  { key: "created_asc", label: "Oldest first" },
  { key: "email_asc", label: "Email A→Z" },
  { key: "email_desc", label: "Email Z→A" },
];

export function UsersFilterBar({
  allTags,
  totalCount,
}: {
  allTags: string[];
  totalCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [q, setQ] = useState(sp.get("q") ?? "");

  // Debounced push for the search input
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams(sp.toString());
      if (q) params.set("q", q);
      else params.delete("q");
      router.push(`${pathname}?${params.toString()}`);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function push(next: Record<string, string>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next)) {
      if (!v || v === "all") params.delete(k);
      else params.set(k, v);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const currentType = sp.get("type") ?? "all";
  const currentAccess = sp.get("access") ?? "all";
  const currentStatus = sp.get("status") ?? "active";
  const currentSort = sp.get("sort") ?? "created_desc";
  const currentTag = sp.get("tag") ?? "";

  return (
    <div className="rounded-2xl border border-border bg-surface-2 p-3 mb-4 flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative flex-1 min-w-[220px]">
        <MagnifyingGlassIcon className="absolute left-2.5 top-2 h-4 w-4 text-light-grey pointer-events-none" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or email…"
          className="w-full rounded-full border border-border bg-surface-3 pl-8 pr-3 py-1.5 text-xs"
        />
      </div>

      <Dropdown
        icon={<FunnelIcon className="h-4 w-4" />}
        label={TYPES.find((t) => t.key === currentType)?.label ?? "Type"}
        options={TYPES}
        currentKey={currentType}
        onPick={(k) => push({ type: k })}
      />

      <Dropdown
        label={ACCESS.find((t) => t.key === currentAccess)?.label ?? "Access"}
        options={ACCESS}
        currentKey={currentAccess}
        onPick={(k) => push({ access: k })}
      />

      <Dropdown
        label={STATUS.find((t) => t.key === currentStatus)?.label ?? "Status"}
        options={STATUS}
        currentKey={currentStatus}
        onPick={(k) => push({ status: k })}
      />

      {allTags.length > 0 && (
        <Dropdown
          label={currentTag || "All tags"}
          options={[
            { key: "all", label: "All tags" },
            ...allTags.map((t) => ({ key: t, label: t })),
          ]}
          currentKey={currentTag || "all"}
          onPick={(k) => push({ tag: k })}
        />
      )}

      <Dropdown
        label={SORT.find((s) => s.key === currentSort)?.label ?? "Sort"}
        options={SORT}
        currentKey={currentSort}
        onPick={(k) => push({ sort: k })}
      />

      <span className="text-xs text-light-grey ml-auto">
        {totalCount} {totalCount === 1 ? "user" : "users"}
      </span>
    </div>
  );
}

function Dropdown({
  icon,
  label,
  options,
  currentKey,
  onPick,
}: {
  icon?: React.ReactNode;
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
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-3 hover:bg-surface-2 px-3 py-1.5 text-xs font-medium transition-colors"
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
