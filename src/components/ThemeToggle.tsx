"use client";

import { useEffect, useState } from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";

const STORAGE_KEY = "remoterep.theme";

type Theme = "light" | "dark";

function getInitial(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // localStorage blocked; fall through to system pref
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/**
 * Sun/moon toggle. Persists to localStorage under `remoterep.theme` and
 * flips the `.dark` class on <html> which is what Tailwind's dark:
 * variant now watches.
 *
 * The initial class is set by the inline script in <head> before paint,
 * so this component just keeps state in sync after hydration.
 */
export function ThemeToggle({ label = false }: { label?: boolean }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(getInitial());
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
    document.documentElement.classList.toggle("dark", next === "dark");
  }

  // Before mount, render a stable placeholder so hydration doesn't blow up.
  if (!mounted) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-border px-2.5 py-1.5 text-xs opacity-50" />
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className="inline-flex items-center gap-2 rounded-full border border-border hover:bg-surface-3 transition-colors px-2.5 py-1.5 text-xs"
    >
      {theme === "dark" ? (
        <MoonIcon className="h-4 w-4" />
      ) : (
        <SunIcon className="h-4 w-4" />
      )}
      {label && (
        <span className="font-medium">
          {theme === "dark" ? "Dark" : "Light"} mode
        </span>
      )}
    </button>
  );
}
