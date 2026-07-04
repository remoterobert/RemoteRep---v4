"use client";

import { useState } from "react";

/**
 * Multi-select rendered as a row of toggle-able pill chips. For small
 * option sets (2–10 items) where each value should be visible at a glance.
 * Submits selections as multiple hidden inputs sharing the same `name`,
 * so a server action reads them via `formData.getAll(name)`.
 */
export function ChipMulti({
  name,
  label,
  options,
  defaultSelected = [],
  required = false,
}: {
  name: string;
  label: string;
  options: readonly string[];
  defaultSelected?: readonly string[];
  required?: boolean;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(defaultSelected),
  );

  function toggle(opt: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(opt)) next.delete(opt);
      else next.add(opt);
      return next;
    });
  }

  return (
    <fieldset>
      <legend className="block text-sm font-medium mb-2">
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const isSelected = selected.has(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              aria-pressed={isSelected}
              className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${
                isSelected
                  ? "bg-primary text-white border-primary"
                  : "bg-white dark:bg-white/[0.02] border-zinc-300 dark:border-zinc-700 text-dark-foreground dark:text-white hover:border-primary/50"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {/* Hidden inputs so the server action sees the selection via FormData */}
      {[...selected].map((v) => (
        <input key={v} type="hidden" name={name} value={v} />
      ))}
    </fieldset>
  );
}
