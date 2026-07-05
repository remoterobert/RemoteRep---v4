"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

/**
 * Searchable single-select. Behaves like a native `<select>` for form
 * submission (renders a hidden input with the same `name`) but with a
 * type-to-filter dropdown that scales to hundreds of options.
 */
export function SearchSelect({
  name,
  label,
  options,
  defaultValue = "",
  placeholder = "Select…",
  required = false,
}: {
  name: string;
  label?: string;
  options: readonly string[];
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 200);
    return options.filter((o) => o.toLowerCase().includes(q)).slice(0, 200);
  }, [options, query]);

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium mb-1">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}

      {/* Trigger: shows current value; click opens the dropdown */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center justify-between rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-left"
      >
        <span className={value ? "" : "text-light-grey"}>
          {value || placeholder}
        </span>
        <span className="flex items-center gap-1 shrink-0">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setValue("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  setValue("");
                }
              }}
              aria-label="Clear"
              className="p-0.5 rounded hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
            >
              <XMarkIcon className="h-3.5 w-3.5 text-light-grey" />
            </span>
          )}
          <ChevronDownIcon
            className={`h-4 w-4 text-light-grey transition-transform ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {open && (
        <div className="absolute z-40 mt-1 w-full max-h-72 overflow-y-auto rounded-lg border border-border bg-surface-2 shadow-xl">
          <div className="relative border-b border-border p-2">
            <MagnifyingGlassIcon className="absolute left-4 top-4 h-3.5 w-3.5 text-light-grey pointer-events-none" />
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-full pl-7 pr-2 py-1 text-sm rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
            />
          </div>
          <ul className="py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-xs text-light-grey">
                No matches for “{query}”.
              </li>
            )}
            {filtered.map((opt) => {
              const isActive = opt === value;
              return (
                <li key={opt}>
                  <button
                    type="button"
                    onClick={() => {
                      setValue(opt);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-white/[0.06] ${
                      isActive ? "bg-primary/10 text-primary font-semibold" : ""
                    }`}
                  >
                    {opt}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
