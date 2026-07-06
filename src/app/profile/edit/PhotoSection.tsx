"use client";

import { useState } from "react";
import { ArrowUpTrayIcon, TrashIcon, UserCircleIcon } from "@heroicons/react/24/outline";

const ACCEPT =
  "image/jpeg,image/png,image/gif,image/webp,image/svg+xml";

/**
 * Profile photo upload + display. Mirrors the company LogoSection: shows the
 * current photo with a Remove button and a drop-zone-style upload. Accepts
 * JPG, PNG, GIF, WebP, or SVG up to 5 MB.
 */
export function PhotoSection({
  currentUrl,
  uploadAction,
  deleteAction,
}: {
  currentUrl: string | null;
  uploadAction: (fd: FormData) => void;
  deleteAction: () => void;
}) {
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div>
      <label className="block text-sm font-medium mb-1">Profile photo</label>

      {currentUrl ? (
        <div className="mb-3 rounded-lg border border-zinc-200 dark:border-white/[0.06] p-3 flex items-center gap-3">
          <div className="h-16 w-16 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUrl}
              alt="Profile photo"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">Current photo</div>
            <a
              href={currentUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary hover:opacity-80 break-all"
            >
              Open full size
            </a>
          </div>
          <form action={deleteAction} className="contents">
            <button
              type="submit"
              className="inline-flex items-center gap-1 text-xs text-danger hover:opacity-80 px-2 py-1 rounded hover:bg-danger/5"
              aria-label="Remove photo"
            >
              <TrashIcon className="h-4 w-4" />
              Remove
            </button>
          </form>
        </div>
      ) : (
        <div className="mb-3 flex items-center gap-3 text-xs text-light-grey">
          <div className="h-16 w-16 rounded-full bg-surface-3 flex items-center justify-center">
            <UserCircleIcon className="h-8 w-8 text-light-grey" />
          </div>
          <div>No photo yet — a real photo boosts response rates.</div>
        </div>
      )}

      <form action={uploadAction} className="space-y-3">
        <label
          htmlFor="photo-input"
          className="block rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          <ArrowUpTrayIcon className="h-8 w-8 text-light-grey mx-auto mb-2" />
          <div className="text-sm font-medium">
            {fileName ?? (currentUrl ? "Replace photo" : "Upload photo")}
          </div>
          <div className="text-xs text-light-grey mt-1">
            JPG, PNG, GIF, WebP, or SVG — up to 5 MB
          </div>
          <input
            id="photo-input"
            name="photo"
            type="file"
            accept={ACCEPT}
            className="sr-only"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </label>
        {fileName && (
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded bg-primary text-white px-4 py-1.5 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Upload {currentUrl ? "replacement" : "photo"}
            </button>
            <button
              type="button"
              onClick={() => {
                setFileName(null);
                const input = document.getElementById(
                  "photo-input",
                ) as HTMLInputElement | null;
                if (input) input.value = "";
              }}
              className="text-xs text-light-grey hover:text-primary"
            >
              Clear selection
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
