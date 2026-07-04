"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AdjustmentsHorizontalIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  SALES_ROLES,
  COMMITMENTS,
  COMPENSATION_TYPES,
  SALES_TYPES,
  DECISION_MAKERS,
  SALES_ENVIRONMENTS,
  SALES_CYCLES,
  DEAL_AMOUNTS,
  SALES_VOLUMES,
  LEAD_TYPES,
  TECHNOLOGIES,
  INDUSTRIES,
  EDUCATION_LEVELS,
} from "@/lib/listings/options";

/**
 * Every filterable facet the /opportunities page understands. `single`
 * facets bind to at-most-one URL value; `multi` facets bind to any number
 * (repeated ?key=A&key=B). Reserved `param` names must match what
 * page.tsx reads from searchParams.
 */
const FACETS = [
  { param: "role", label: "Sales role", options: SALES_ROLES, kind: "single" as const },
  { param: "commitment", label: "Commitment", options: COMMITMENTS, kind: "multi" as const },
  { param: "comp_type", label: "Compensation type", options: COMPENSATION_TYPES, kind: "multi" as const },
  { param: "sales_type", label: "Sales type", options: SALES_TYPES, kind: "multi" as const },
  { param: "decision_maker", label: "Decision-maker", options: DECISION_MAKERS, kind: "multi" as const },
  { param: "environment", label: "Environment", options: SALES_ENVIRONMENTS, kind: "multi" as const },
  { param: "cycle", label: "Sales cycle", options: SALES_CYCLES, kind: "multi" as const },
  { param: "deal", label: "Deal size", options: DEAL_AMOUNTS, kind: "multi" as const },
  { param: "volume", label: "Annual volume", options: SALES_VOLUMES, kind: "multi" as const },
  { param: "lead", label: "Lead type", options: LEAD_TYPES, kind: "multi" as const },
  { param: "tech", label: "Tools", options: TECHNOLOGIES, kind: "multi" as const },
  { param: "education", label: "Education", options: EDUCATION_LEVELS, kind: "multi" as const },
  { param: "industry", label: "Industry", options: INDUSTRIES, kind: "multi" as const, searchable: true },
];

type Facet = (typeof FACETS)[number];

export function FilterPanel() {
  const router = useRouter();
  const sp = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [industryQuery, setIndustryQuery] = useState("");
  const [expandedIndustry, setExpandedIndustry] = useState(false);

  // Compute active-filter chips across all facets for the "clear" banner.
  const activeChips = useMemo(() => {
    const chips: Array<{ param: string; value: string; label: string }> = [];
    for (const f of FACETS) {
      const values = sp.getAll(f.param);
      for (const v of values) {
        chips.push({ param: f.param, value: v, label: `${f.label}: ${v}` });
      }
    }
    const minPay = sp.get("min_pay");
    if (minPay) {
      chips.push({
        param: "min_pay",
        value: minPay,
        label: `Min pay: $${Number(minPay).toLocaleString()}+`,
      });
    }
    const minExp = sp.get("min_exp");
    if (minExp) {
      chips.push({
        param: "min_exp",
        value: minExp,
        label: `Min exp: ${minExp}+ yrs`,
      });
    }
    return chips;
  }, [sp]);

  function toggleValue(param: string, value: string, kind: Facet["kind"]) {
    const params = new URLSearchParams(sp.toString());
    if (kind === "single") {
      if (params.get(param) === value) params.delete(param);
      else params.set(param, value);
    } else {
      const existing = params.getAll(param);
      if (existing.includes(value)) {
        params.delete(param);
        existing.filter((v) => v !== value).forEach((v) => params.append(param, v));
      } else {
        params.append(param, value);
      }
    }
    params.set("view", sp.get("view") ?? "tile");
    router.push(`/opportunities?${params.toString()}`);
  }

  function setScalar(param: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value === "") params.delete(param);
    else params.set(param, value);
    router.push(`/opportunities?${params.toString()}`);
  }

  function removeChip(param: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (param === "min_pay" || param === "min_exp") {
      params.delete(param);
    } else {
      const existing = params.getAll(param);
      params.delete(param);
      existing.filter((v) => v !== value).forEach((v) => params.append(param, v));
    }
    router.push(`/opportunities?${params.toString()}`);
  }

  function clearAll() {
    const params = new URLSearchParams();
    const view = sp.get("view");
    if (view) params.set("view", view);
    router.push(`/opportunities?${params.toString()}`);
  }

  // Close mobile drawer with Escape.
  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const panel = (
    <div className="space-y-5">
      {/* Numeric scalars */}
      <NumericBlock
        param="min_pay"
        label="Minimum pay (USD)"
        placeholder="e.g. 75000"
        current={sp.get("min_pay") ?? ""}
        onCommit={(v) => setScalar("min_pay", v)}
      />
      <NumericBlock
        param="min_exp"
        label="Minimum experience (years)"
        placeholder="e.g. 3"
        current={sp.get("min_exp") ?? ""}
        onCommit={(v) => setScalar("min_exp", v)}
      />

      {FACETS.map((f) => {
        if (f.param === "industry") {
          // Special-case industries: search + expandable to keep panel short.
          const active = new Set(sp.getAll(f.param));
          const filtered = f.options.filter((o) =>
            o.toLowerCase().includes(industryQuery.trim().toLowerCase()),
          );
          const visible = expandedIndustry ? filtered : filtered.slice(0, 8);
          return (
            <div key={f.param}>
              <div className="text-xs font-semibold uppercase tracking-wider text-light-grey mb-2">
                {f.label}
              </div>
              <input
                type="search"
                value={industryQuery}
                onChange={(e) => setIndustryQuery(e.target.value)}
                placeholder="Search 68 industries…"
                className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-xs mb-2"
              />
              <div className="flex flex-wrap gap-1">
                {visible.map((opt) => {
                  const isActive = active.has(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleValue(f.param, opt, f.kind)}
                      className={`text-[11px] rounded-full px-2 py-1 border transition-colors ${
                        isActive
                          ? "bg-primary text-white border-primary"
                          : "border-zinc-300 dark:border-zinc-700 hover:border-primary/50"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {filtered.length > 8 && (
                <button
                  type="button"
                  onClick={() => setExpandedIndustry((v) => !v)}
                  className="text-[11px] text-primary hover:opacity-80 mt-1.5"
                >
                  {expandedIndustry
                    ? "Show fewer"
                    : `Show all ${filtered.length} →`}
                </button>
              )}
            </div>
          );
        }

        const active = new Set(sp.getAll(f.param));
        return (
          <div key={f.param}>
            <div className="text-xs font-semibold uppercase tracking-wider text-light-grey mb-2">
              {f.label}
            </div>
            <div className="flex flex-wrap gap-1">
              {f.options.map((opt) => {
                const isActive =
                  f.kind === "single"
                    ? sp.get(f.param) === opt
                    : active.has(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleValue(f.param, opt, f.kind)}
                    className={`text-[11px] rounded-full px-2 py-1 border transition-colors ${
                      isActive
                        ? "bg-primary text-white border-primary"
                        : "border-zinc-300 dark:border-zinc-700 hover:border-primary/50"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Active-chips banner (visible on all viewports) */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          <span className="text-xs text-light-grey mr-1">Filtering:</span>
          {activeChips.map((c) => (
            <span
              key={`${c.param}-${c.value}`}
              className="inline-flex items-center gap-1 text-[11px] rounded-full bg-primary/10 text-primary px-2.5 py-1 border border-primary/30"
            >
              {c.label}
              <button
                type="button"
                onClick={() => removeChip(c.param, c.value)}
                aria-label={`Remove ${c.label}`}
                className="hover:bg-primary/20 rounded-full p-0.5 -mr-1"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="text-[11px] text-light-grey hover:text-primary underline ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden inline-flex items-center gap-1.5 rounded border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm font-medium mb-4"
      >
        <AdjustmentsHorizontalIcon className="h-4 w-4" />
        Filters{activeChips.length > 0 && ` (${activeChips.length})`}
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block sticky top-[88px] self-start w-[260px] shrink-0 pr-2 pb-8 overflow-y-auto max-h-[calc(100vh-100px)]">
        <div className="text-sm font-semibold mb-4 flex items-center gap-1.5">
          <AdjustmentsHorizontalIcon className="h-4 w-4" />
          Filters
        </div>
        {panel}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative ml-auto w-[320px] max-w-[85vw] h-full bg-white dark:bg-[#0b1220] shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-[#0b1220] border-b border-zinc-200 dark:border-white/[0.06] flex items-center justify-between px-4 py-3">
              <div className="text-sm font-semibold">Filters</div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close filters"
                className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">{panel}</div>
          </div>
        </div>
      )}
    </>
  );
}

function NumericBlock({
  label,
  placeholder,
  current,
  onCommit,
}: {
  param: string;
  label: string;
  placeholder: string;
  current: string;
  onCommit: (v: string) => void;
}) {
  const [local, setLocal] = useState(current);
  useEffect(() => setLocal(current), [current]);
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-light-grey mb-2">
        {label}
      </div>
      <input
        type="number"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          if (local !== current) onCommit(local);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
        }}
        placeholder={placeholder}
        min={0}
        className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1.5 text-xs"
      />
    </div>
  );
}
