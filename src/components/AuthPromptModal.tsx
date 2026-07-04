"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

/**
 * A button-shaped element that, when clicked, opens a sign-up modal
 * prompting the visitor to log in or create an account. Use in place
 * of Apply / Invite / Bookmark buttons for logged-out visitors on
 * public shareable pages.
 *
 * The wrapping page decides which to render:
 *   {signedIn
 *     ? <form action={realAction}><button>Apply</button></form>
 *     : <AuthPromptButton title="…" body="…">Apply</AuthPromptButton>
 *   }
 *
 * Important: this component is fully self-contained. It does NOT
 * accept a function-shaped `children` render-prop from a server
 * component (which React would reject at the RSC boundary). Only
 * plain JSX children — text, icons, etc.
 */
export function AuthPromptButton({
  title,
  body,
  loginRedirect,
  className,
  ariaLabel,
  children,
}: {
  title: string;
  body: string;
  loginRedirect?: string;
  className?: string;
  ariaLabel?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  const redirectQs = loginRedirect
    ? `?redirect=${encodeURIComponent(loginRedirect)}`
    : "";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={ariaLabel}
        className={className}
      >
        {children}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-prompt-title"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/60"
            onClick={close}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#0b1220] shadow-2xl border border-zinc-200 dark:border-white/[0.08] p-6">
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-white/[0.06] text-light-grey"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            <div className="mx-auto h-12 w-12 rounded-full bg-warning/15 flex items-center justify-center mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-warning" />
            </div>

            <h2
              id="auth-prompt-title"
              className="text-lg font-semibold text-center mb-2"
            >
              {title}
            </h2>
            <p className="text-sm text-light-grey text-center leading-relaxed mb-6">
              {body}
            </p>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Link
                href={`/login${redirectQs}`}
                className="flex-1 text-center rounded-full border border-primary text-primary px-4 py-2.5 text-sm font-semibold hover:bg-primary/5 transition-colors"
              >
                Login
              </Link>
              <Link
                href={`/signup${redirectQs}`}
                className="flex-1 text-center rounded-full bg-primary text-white px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
