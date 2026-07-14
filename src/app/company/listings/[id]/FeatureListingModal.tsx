"use client";

import { useEffect, useState } from "react";
import {
  BoltIcon,
  XMarkIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

/**
 * Post-save offer to boost the listing. Fires from the listing detail
 * page when the URL includes ?offer=featured. Purely marketing UX —
 * accepting fires the boostListing server action, dismissing just closes.
 */
export function FeatureListingModal({
  listingId,
  boostAction,
  initiallyOpen,
}: {
  listingId: string;
  boostAction: (fd: FormData) => void;
  initiallyOpen: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const [period, setPeriod] = useState<"monthly" | "annual">("monthly");

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feature-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface-2 shadow-2xl p-6">
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-surface-3 text-light-grey"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <div className="h-9 w-9 rounded-lg bg-warning/15 text-warning flex items-center justify-center shrink-0">
            <BoltIcon className="h-5 w-5" />
          </div>
          <h2 id="feature-title" className="text-lg font-semibold">
            Need to fill this fast?
          </h2>
        </div>

        <p className="text-sm text-light-grey mb-4">
          For urgent hires, feature this listing. It gets a badge, pinned
          placement in the feed, and goes out in an email blast to every
          candidate on RemoteRep.
        </p>

        <ul className="space-y-2 mb-5 text-sm">
          <li className="flex items-start gap-2">
            <CheckCircleIcon className="h-4 w-4 text-success mt-0.5 shrink-0" />
            <span>Pinned at the top of the opportunities feed</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircleIcon className="h-4 w-4 text-success mt-0.5 shrink-0" />
            <span>Featured badge visible everywhere</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircleIcon className="h-4 w-4 text-success mt-0.5 shrink-0" />
            <span>Email blast to our full candidate list</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircleIcon className="h-4 w-4 text-success mt-0.5 shrink-0" />
            <span>
              <span className="font-semibold">AI features included</span> — the
              AI listing writer and profile helpers, same as Premium
            </span>
          </li>
        </ul>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <label
            className={`rounded border px-3 py-2 cursor-pointer text-sm ${
              period === "monthly"
                ? "border-primary bg-primary/5"
                : "border-border bg-surface-3"
            }`}
          >
            <input
              type="radio"
              name="period"
              value="monthly"
              checked={period === "monthly"}
              onChange={() => setPeriod("monthly")}
              className="mr-2"
            />
            <span className="font-semibold">$59/mo</span>
            <div className="text-[11px] text-light-grey">Monthly</div>
          </label>
          <label
            className={`rounded border px-3 py-2 cursor-pointer text-sm ${
              period === "annual"
                ? "border-primary bg-primary/5"
                : "border-border bg-surface-3"
            }`}
          >
            <input
              type="radio"
              name="period"
              value="annual"
              checked={period === "annual"}
              onChange={() => setPeriod("annual")}
              className="mr-2"
            />
            <span className="font-semibold">$566/yr</span>
            <div className="text-[11px] text-light-grey">Save ~20%</div>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <form action={boostAction} className="contents">
            <input type="hidden" name="listing_id" value={listingId} />
            <input type="hidden" name="period" value={period} />
            <button
              type="submit"
              className="rounded bg-primary text-white px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Feature this listing
            </button>
          </form>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded border border-border px-4 py-2 text-sm hover:bg-surface-3"
          >
            No thanks
          </button>
        </div>
      </div>
    </div>
  );
}
