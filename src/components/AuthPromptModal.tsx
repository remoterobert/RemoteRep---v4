"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

/**
 * Wrap any button-like target with an auth-prompt gate. Clicking the
 * target opens a modal with Login + Sign up CTAs when the user isn't
 * signed in. When they are signed in, clicking runs the passed action
 * (or navigates via href).
 *
 * Two ways to use:
 *   1. Pass `signedIn={false}` + a `title`/`body` for the prompt.
 *   2. Wrap it around any interactive child (button, a Link, a form
 *      submit) via the `children` render-prop pattern.
 */
export function AuthGate({
  signedIn,
  title,
  body,
  loginRedirect,
  children,
}: {
  signedIn: boolean;
  title: string;
  body: string;
  loginRedirect?: string;
  children: (props: {
    onGatedClick: (e: React.MouseEvent) => void;
  }) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  const closeModal = useCallback(() => setOpen(false), []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeModal]);

  const redirectQs = loginRedirect
    ? `?redirect=${encodeURIComponent(loginRedirect)}`
    : "";

  function onGatedClick(e: React.MouseEvent) {
    if (signedIn) return; // let default handler run (form submit / link nav)
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  }

  return (
    <>
      {children({ onGatedClick })}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-prompt-title"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={closeModal}
            aria-hidden="true"
          />

          <div
            ref={dialogRef}
            className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#0b1220] shadow-2xl border border-zinc-200 dark:border-white/[0.08] p-6"
          >
            <button
              type="button"
              onClick={closeModal}
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
