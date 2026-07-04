"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { XMarkIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

/**
 * Searchable multi-select for large option lists (e.g., 60+ industries).
 * Renders selected values as removable chips above a search input. Typing
 * filters the option list below; clicking an option adds it. Same submission
 * pattern as ChipMulti — hidden inputs share one `name`.
 */
export function SearchMulti({
  name,
  label,
  options,
  defaultSelected = [],
  placeholder = "Search…",
}: {
  name: string;
  label: string;
  options: readonly string[];
  defaultSelected?: readonly string[];
  placeholder?: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(defaultSelected),
  );
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLFieldSetElement>(null);

  // Close options list when clicking outside.
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
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const remaining = options.filter((o) => !selected.has(o));
    if (!q) return remaining.slice(0, 100);
    return remaining
      .filter((o) => o.toLowerCase().includes(q))
      .slice(0, 100);
  }, [options, query, selected]);

  function add(opt: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.add(opt);
      return next;
    });
    setQuery("");
  }

  function remove(opt: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(opt);
      return next;
    });
  }

  return (
    <fieldset ref={containerRef} className="relative">
      <legend className="block text-sm font-medium mb-2">{label}</legend>

      {/* Selected chips */}
      {selected.size > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {[...selected].map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 text-xs rounded-full bg-primary/10 text-primary px-2.5 py-1 border border-primary/30"
            >
              {v}
              <button
                type="button"
                onClick={() => remove(v)}
                aria-label={`Remove ${v}`}
                className="hover:bg-primary/20 rounded-full p-0.5 -mr-1"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-light-grey pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-8 pr-3 py-2 text-sm"
        />
      </div>

      {/* Dropdown of remaining options */}
      {open && filtered.length > 0 && (
        <div className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0b1220] shadow-xl">
          <ul className="py-1">
            {filtered.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  onClick={() => add(opt)}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
                >
                  {opt}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {open && filtered.length === 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0b1220] shadow-xl px-3 py-2 text-xs text-light-grey">
          {query
            ? `No matches for “${query}”.`
            : "All options selected."}
        </div>
      )}

      {/* Hidden inputs for form submission */}
      {[...selected].map((v) => (
        <input key={v} type="hidden" name={name} value={v} />
      ))}
    </fieldset>
  );
}
