"use client";

import Link from "next/link";
import { useState } from "react";
import {
  EllipsisHorizontalIcon,
  EyeIcon,
  PencilSquareIcon,
  PauseIcon,
  PlayIcon,
  ArchiveBoxIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

export function ListingRowActions({
  listingId,
  status,
  setStatusAction,
  deleteAction,
}: {
  listingId: string;
  status: string;
  setStatusAction: (fd: FormData) => void;
  deleteAction: (fd: FormData) => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const canPublish = status !== "published";
  const canPause = status === "published";
  const canArchive = status !== "archived";

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
          {/* Click-away catcher */}
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
            <Link
              href={`/company/listings/${listingId}`}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <EyeIcon className="h-4 w-4 text-light-grey" />
              View + applicants
            </Link>
            <Link
              href={`/company/listings/${listingId}/edit`}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <PencilSquareIcon className="h-4 w-4 text-light-grey" />
              Edit listing
            </Link>

            <div className="my-1 border-t border-border" />

            {canPublish && (
              <form action={setStatusAction} className="contents">
                <input type="hidden" name="listing_id" value={listingId} />
                <input type="hidden" name="action" value="publish" />
                <button
                  type="submit"
                  role="menuitem"
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
                >
                  <PlayIcon className="h-4 w-4 text-success" />
                  {status === "paused" || status === "archived"
                    ? "Re-publish (make live)"
                    : "Publish (make live)"}
                </button>
              </form>
            )}
            {canPause && (
              <form action={setStatusAction} className="contents">
                <input type="hidden" name="listing_id" value={listingId} />
                <input type="hidden" name="action" value="unpublish" />
                <button
                  type="submit"
                  role="menuitem"
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
                >
                  <PauseIcon className="h-4 w-4 text-warning" />
                  Pause (hide from reps)
                </button>
              </form>
            )}
            {canArchive && (
              <form action={setStatusAction} className="contents">
                <input type="hidden" name="listing_id" value={listingId} />
                <input type="hidden" name="action" value="archive" />
                <button
                  type="submit"
                  role="menuitem"
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-white/[0.06]"
                >
                  <ArchiveBoxIcon className="h-4 w-4 text-light-grey" />
                  Archive
                </button>
              </form>
            )}

            <div className="my-1 border-t border-border" />

            {!confirming ? (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                role="menuitem"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/5"
              >
                <TrashIcon className="h-4 w-4" />
                Delete permanently
              </button>
            ) : (
              <form action={deleteAction} className="px-3 py-2 space-y-2">
                <input type="hidden" name="listing_id" value={listingId} />
                <div className="text-xs text-light-grey">
                  Type <b>DELETE</b> to confirm. This cannot be undone —
                  applicants and their messages will be removed with the listing.
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
