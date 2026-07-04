"use client";

import { useState } from "react";
import { ShareIcon, CheckIcon } from "@heroicons/react/24/outline";

/**
 * Copies the current page URL to the clipboard and shows a brief
 * "Copied!" confirmation. Since the pages this ends up on are already
 * the public canonical URLs, there's nothing else to compute — just
 * `window.location.href`.
 */
export function ShareButton({
  label = "Share",
  size = "md",
}: {
  label?: string;
  size?: "sm" | "md";
}) {
  const [copied, setCopied] = useState(false);

  async function onClick() {
    try {
      const url =
        typeof window !== "undefined" ? window.location.href : "";
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission denied or unsupported; do nothing.
    }
  }

  const padCls = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Share this page"
      className={`inline-flex items-center gap-1.5 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-white/[0.06] font-medium transition-colors ${padCls}`}
    >
      {copied ? (
        <>
          <CheckIcon className="h-4 w-4 text-success" />
          Copied!
        </>
      ) : (
        <>
          <ShareIcon className="h-4 w-4" />
          {label}
        </>
      )}
    </button>
  );
}
