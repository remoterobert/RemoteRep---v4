"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

/**
 * One filterable dimension.
 *
 * - "single" — at most one value (`?role=AE`)
 * - "multi"  — any number of values (`?tech=Salesforce&tech=Outreach`)
 * - "numeric" — a single lower bound (`?min_exp=3`)
 */
export type Facet =
  | {
      param: string;
      label: string;
      options: readonly string[];
      kind: "single" | "multi";
      searchable?: boolean;
    }
  | {
      param: string;
      label: string;
      kind: "numeric";
      placeholder: string;
      /** Formats the active-filter chip, e.g. "Min. pay: $75,000+". */
      formatChip?: (value: string) => string;
    };

/**
 * Horizontal filter bar. Each facet is a pill button. Clicking a pill
 * opens a floating popover with its options. Selected pills are colored
 * and show the count/value. Layout: sits above the content, wraps naturally.
 *
 * State: URL search params. All read/write goes through the router so
 * filters survive back-button and are shareable.
 *
 * Shared by both sides of the marketplace — reps filtering listings on
 * /opportunities, and hiring teams filtering reps on /candidates — so the
 * two behave identically. Pass the facet list for whichever side you're on.
 */
export function FacetFilterBar({
  facets,
  showResultsCount,
  resultNoun = "result",
  preserveParams = [],
}: {
  facets: readonly Facet[];
  showResultsCount?: number;
  /** Noun for the result count, pluralized with a trailing "s". */
  resultNoun?: string;
  /** Params that "Clear all" should leave alone (view mode, etc). */
  preserveParams?: readonly string[];
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const activeChips = useMemo(() => {
    const chips: Array<{ param: string; value: string; label: string }> = [];
    for (const f of facets) {
      if (f.kind === "numeric") {
        const v = sp.get(f.param);
        if (v) {
          const display = f.formatChip
            ? f.formatChip(v)
            : `${f.label}: ${v}+`;
          chips.push({ param: f.param, value: v, label: display });
        }
      } else {
        for (const v of sp.getAll(f.param)) {
          chips.push({ param: f.param, value: v, label: `${f.label}: ${v}` });
        }
      }
    }
    return chips;
  }, [sp, facets]);

  const activeCount = activeChips.length;

  function clearAll() {
    const params = new URLSearchParams();
    for (const keep of preserveParams) {
      const v = sp.get(keep);
      if (v) params.set(keep, v);
    }
    router.push(`?${params.toString()}`);
  }

  function removeChip(param: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    const facet = facets.find((f) => f.param === param);
    if (facet?.kind === "numeric" || facet?.kind === "single") {
      params.delete(param);
    } else {
      const existing = params.getAll(param);
      params.delete(param);
      existing
        .filter((v) => v !== value)
        .forEach((v) => params.append(param, v));
    }
    router.push(`?${params.toString()}`);
  }

  const plural = showResultsCount === 1 ? "" : "s";

  return (
    <div className="mb-4">
      {/* The filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-light-grey uppercase tracking-wider mr-1">
          <AdjustmentsHorizontalIcon className="h-4 w-4" />
          Filters
        </span>

        {facets.map((f) => (
          <FacetPill key={f.param} facet={f} />
        ))}

        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-light-grey hover:text-primary underline ml-auto"
          >
            Clear all ({activeCount})
          </button>
        )}

        {showResultsCount !== undefined && (
          <span className="text-xs text-light-grey ml-auto">
            {showResultsCount} {resultNoun}
            {plural}
          </span>
        )}
      </div>

      {/* Active-filter chips below */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
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
        </div>
      )}
    </div>
  );
}

/**
 * One facet pill. Renders a button showing the facet name + count of
 * active values, and opens a popover when clicked.
 */
function FacetPill({ facet }: { facet: Facet }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isNumeric = facet.kind === "numeric";
  const active = isNumeric
    ? sp.get(facet.param)
      ? 1
      : 0
    : sp.getAll(facet.param).length;

  function toggleValue(value: string) {
    if (facet.kind === "numeric") return;
    const params = new URLSearchParams(sp.toString());
    if (facet.kind === "single") {
      if (params.get(facet.param) === value) params.delete(facet.param);
      else params.set(facet.param, value);
    } else {
      const existing = params.getAll(facet.param);
      if (existing.includes(value)) {
        params.delete(facet.param);
        existing
          .filter((v) => v !== value)
          .forEach((v) => params.append(facet.param, v));
      } else {
        params.append(facet.param, value);
      }
    }
    router.push(`?${params.toString()}`);
  }

  function setNumeric(value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value === "") params.delete(facet.param);
    else params.set(facet.param, value);
    router.push(`?${params.toString()}`);
  }

  const pillClass = active
    ? "bg-primary/10 text-primary border-primary"
    : "bg-white dark:bg-white/[0.02] border-zinc-300 dark:border-zinc-700 hover:border-primary/40";

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`text-xs rounded-full px-3 py-1.5 border font-medium inline-flex items-center gap-1.5 transition-colors ${pillClass}`}
      >
        {facet.label}
        {active > 0 && !isNumeric && facet.kind === "multi" && (
          <span className="rounded-full bg-primary text-white text-[10px] px-1.5 py-0.5 font-bold">
            {active}
          </span>
        )}
        {facet.kind === "single" && active > 0 && (
          <span className="text-[10px] font-bold">
            · {sp.get(facet.param)}
          </span>
        )}
        {isNumeric && active > 0 && (
          <span className="text-[10px] font-bold">
            · {sp.get(facet.param)}
          </span>
        )}
        <ChevronDownIcon
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 min-w-[240px] max-w-sm rounded-lg border border-border bg-surface-2 shadow-xl p-3">
          {facet.kind === "numeric" ? (
            <NumericInput
              placeholder={facet.placeholder}
              current={sp.get(facet.param) ?? ""}
              onCommit={setNumeric}
            />
          ) : (
            <>
              {facet.searchable && (
                <div className="relative mb-2">
                  <MagnifyingGlassIcon className="absolute left-2 top-2 h-3.5 w-3.5 text-light-grey pointer-events-none" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search…"
                    className="w-full pl-7 pr-2 py-1.5 text-xs rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  />
                </div>
              )}
              <div className="flex flex-wrap gap-1 max-h-72 overflow-y-auto">
                {facet.options
                  .filter((opt) =>
                    facet.searchable && query
                      ? opt.toLowerCase().includes(query.toLowerCase())
                      : true,
                  )
                  .map((opt) => {
                    const isActive =
                      facet.kind === "single"
                        ? sp.get(facet.param) === opt
                        : sp.getAll(facet.param).includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleValue(opt)}
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
            </>
          )}
        </div>
      )}
    </div>
  );
}

function NumericInput({
  placeholder,
  current,
  onCommit,
}: {
  placeholder: string;
  current: string;
  onCommit: (v: string) => void;
}) {
  const [local, setLocal] = useState(current);
  // Re-sync the box when the committed value changes underneath us (back
  // button, "Clear all"). Adjusting state during render rather than in an
  // effect avoids a second render pass — React's documented pattern for
  // resetting state when a prop changes.
  const [lastCommitted, setLastCommitted] = useState(current);
  if (lastCommitted !== current) {
    setLastCommitted(current);
    setLocal(current);
  }
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        min={0}
        autoFocus
        className="flex-1 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-sm"
      />
      <button
        type="button"
        onClick={() => onCommit(local)}
        className="rounded bg-primary text-white px-3 py-1 text-xs font-semibold hover:opacity-90"
      >
        Apply
      </button>
      {current && (
        <button
          type="button"
          onClick={() => onCommit("")}
          className="text-xs text-light-grey hover:text-primary"
        >
          Clear
        </button>
      )}
    </div>
  );
}
