"use client";

import Link from "next/link";
import { useState } from "react";
import {
  EllipsisHorizontalIcon,
  PencilSquareIcon,
  BoltIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

/**
 * Actions available for one listing row. Streamlined per the owner's
 * ask down to the four essentials:
 *   - Edit           → /company/listings/{id}/edit
 *   - Boost          → /company/listings/{id}?offer=featured (pops the
 *                     FeatureListingModal if not already boosted)
 *   - Mark Inactive  → toggles publish/unpublish via setStatusAction
 *                     (label flips to "Mark Active" when currently
 *                     inactive)
 *   - Delete         → typed-DELETE confirmation, existing action
 */
export function ListingRowActions({
  listingId,
  status,
  isFeatured,
  setStatusAction,
  deleteAction,
}: {
  listingId: string;
  status: string;
  isFeatured: boolean;
  setStatusAction: (fd: FormData) => void;
  deleteAction: (fd: FormData) => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const isPublished = status === "published";
  const inactiveLabel = isPublished ? "Mark inactive" : "Mark active";
  const inactiveAction = isPublished ? "unpublish" : "publish";

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-md p-1.5 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <EllipsisHorizontalIcon className="h-5 w-5 text-light-grey" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setOpen(false);
              setConfirming(false);
              setConfirmText("");
            }}
          />
          <div
            role="menu"
            className="absolute right-0 mt-1 w-56 rounded-lg border border-border bg-surface-2 shadow-xl z-50 py-1 text-left"
          >
            {/* Edit */}
            <Link
              href={`/company/listings/${listingId}/edit`}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <PencilSquareIcon className="h-4 w-4 text-light-grey" />
              Edit
            </Link>

            {/* Boost — opens the FeatureListingModal via ?offer=featured
                on the detail page. If already boosted, sends them to the
                same page but the modal is a no-op. */}
            <Link
              href={`/company/listings/${listingId}?offer=featured`}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <BoltIcon className="h-4 w-4 text-warning" />
              {isFeatured ? "Boost — already featured" : "Boost"}
            </Link>

            {/* Mark inactive / active — flips publish state */}
            <form action={setStatusAction} className="contents">
              <input type="hidden" name="listing_id" value={listingId} />
              <input
                type="hidden"
                name="action"
                value={inactiveAction}
              />
              <button
                type="submit"
                role="menuitem"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
              >
                {isPublished ? (
                  <PauseCircleIcon className="h-4 w-4 text-warning" />
                ) : (
                  <PlayCircleIcon className="h-4 w-4 text-success" />
                )}
                {inactiveLabel}
              </button>
            </form>

            <div className="my-1 border-t border-border" />

            {/* Delete — typed-DELETE confirm */}
            {!confirming ? (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                role="menuitem"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/5"
              >
                <TrashIcon className="h-4 w-4" />
                Delete
              </button>
            ) : (
              <form action={deleteAction} className="px-3 py-2 space-y-2">
                <input type="hidden" name="listing_id" value={listingId} />
                <div className="text-xs text-light-grey">
                  Type <b>DELETE</b> to confirm. Applicants and messages
                  will be removed with the listing.
                </div>
                <input
                  type="text"
                  name="confirm"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  autoFocus
                  className="w-full rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1 text-xs"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={confirmText !== "DELETE"}
                    className="flex-1 rounded bg-danger text-white px-2 py-1 text-xs font-semibold disabled:opacity-40"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirming(false);
                      setConfirmText("");
                    }}
                    className="rounded border border-zinc-300 dark:border-zinc-700 px-2 py-1 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}
