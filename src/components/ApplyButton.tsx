"use client";

import { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

/**
 * "Apply now" button that opens a modal for an optional intro message,
 * then submits to the applyToListing server action. Rep gets redirected
 * into the chat with the hiring tenant on success.
 */
export function ApplyButton({
  listingId,
  action,
  companyName,
  listingTitle,
  className,
  label = "Apply now",
}: {
  listingId: string;
  action: (fd: FormData) => void;
  companyName: string;
  listingTitle: string;
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className}
      >
        {label}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="apply-title"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => !submitting && setOpen(false)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface-2 shadow-2xl p-6">
            <button
              type="button"
              onClick={() => !submitting && setOpen(false)}
              aria-label="Close"
              disabled={submitting}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-surface-3 text-light-grey"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            <h2 id="apply-title" className="text-lg font-semibold mb-1">
              Apply to {companyName}
            </h2>
            <p className="text-xs text-light-grey mb-4">
              {listingTitle}
            </p>

            <form
              action={action}
              onSubmit={() => setSubmitting(true)}
              className="space-y-4"
            >
              <input type="hidden" name="listing_id" value={listingId} />

              <div>
                <label
                  htmlFor="apply-message"
                  className="block text-xs font-semibold uppercase tracking-wider text-light-grey mb-1"
                >
                  Say hello <span className="opacity-60">(optional)</span>
                </label>
                <textarea
                  id="apply-message"
                  name="message"
                  rows={4}
                  maxLength={500}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell them why this role stood out. Skip if you'd rather just raise your hand."
                  className="w-full rounded border border-border bg-surface-3 px-3 py-2 text-sm"
                />
                <p className="text-[11px] text-light-grey mt-1">
                  {message.length}/500 — this is the first message they see
                  when the chat opens.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                  className="rounded border border-border px-4 py-1.5 text-sm hover:bg-surface-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded bg-primary text-white px-4 py-1.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? "Applying..." : "Send application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
