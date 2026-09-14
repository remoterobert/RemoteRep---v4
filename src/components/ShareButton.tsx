"use client";

import { useState } from "react";
import { ShareIcon, CheckIcon } from "@heroicons/react/24/outline";

/**
 * Copies a link to the clipboard and shows a brief "Copied!" confirmation.
 *
 * By default it copies the current page URL, which is what the public
 * pages (/listings, /profiles, /companies) want — they're already the
 * canonical shareable URL.
 *
 * Pass `path` when the page you're ON is not the page you want to SHARE.
 * The company-side listing manager (/company/listings/[id]) is members-only,
 * so it shares the public `/listings/[id]` URL instead — otherwise the
 * recipient just gets bounced away from a page they can't see.
 *
 * Pass `disabledReason` to render the button inert with an explanation
 * (used for draft listings, which have no public page to share yet).
 */
export function ShareButton({
  label = "Share",
  size = "md",
  path,
  disabledReason,
}: {
  label?: string;
  size?: "sm" | "md";
  path?: string;
  disabledReason?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  async function onClick() {
    if (typeof window === "undefined") return;
    // `path` is a site-relative path ("/listings/abc"); make it absolute so
    // the copied link works when pasted anywhere.
    const url = path
      ? new URL(path, window.location.origin).toString()
      : window.location.href;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setFailed(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API is unavailable (older browsers, or a non-HTTPS origin).
      // Fall back to selecting a throwaway textarea so sharing still works
      // rather than silently doing nothing.
      try {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        document.body.removeChild(ta);
        if (!ok) throw new Error("copy rejected");
        setCopied(true);
        setFailed(false);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Nothing worked — tell the user instead of leaving the button dead.
        setFailed(true);
        setTimeout(() => setFailed(false), 3000);
      }
    }
  }

  const padCls = size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm";
  const baseCls = `inline-flex items-center gap-1.5 rounded border border-zinc-300 dark:border-zinc-700 font-medium transition-colors ${padCls}`;

  if (disabledReason) {
    return (
      <button
        type="button"
        disabled
        title={disabledReason}
        aria-label={disabledReason}
        className={`${baseCls} opacity-50 cursor-not-allowed`}
      >
        <ShareIcon className="h-4 w-4" />
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Copy a shareable link to this page"
      className={`${baseCls} hover:bg-zinc-100 dark:hover:bg-white/[0.06]`}
    >
      {copied ? (
        <>
          <CheckIcon className="h-4 w-4 text-success" />
          Copied!
        </>
      ) : failed ? (
        <>
          <ShareIcon className="h-4 w-4" />
          Press ⌘C to copy
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
