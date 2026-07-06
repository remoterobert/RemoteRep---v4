"use client";

import { useState } from "react";
import {
  ArrowUpTrayIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const ACCEPT =
  "image/jpeg,image/png,image/gif,image/webp,image/svg+xml,application/pdf";

/**
 * Company logo upload + display. Mirrors the candidate ResumeSection
 * pattern: shows the current logo, lets you pick a replacement, and
 * exposes a Delete action. Accepted files: JPG, PNG, GIF, WebP, SVG,
 * or PDF up to 5 MB.
 */
export function LogoSection({
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
      <label className="block text-sm font-medium mb-1">Company logo</label>

      {currentUrl && (
        <div className="mb-3 rounded-lg border border-zinc-200 dark:border-white/[0.06] p-3 flex items-center gap-3">
          <div className="h-16 w-16 rounded-lg bg-primary/10 overflow-hidden flex items-center justify-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUrl}
              alt="Company logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">Current logo</div>
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
              aria-label="Remove logo"
            >
              <TrashIcon className="h-4 w-4" />
              Remove
            </button>
          </form>
        </div>
      )}

      <form action={uploadAction} className="space-y-3">
        <label
          htmlFor="logo-input"
          className="block rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          <ArrowUpTrayIcon className="h-8 w-8 text-light-grey mx-auto mb-2" />
          <div className="text-sm font-medium">
            {fileName ?? (currentUrl ? "Replace logo" : "Upload logo")}
          </div>
          <div className="text-xs text-light-grey mt-1">
            JPG, PNG, GIF, WebP, SVG, or PDF — up to 5 MB
          </div>
          <input
            id="logo-input"
            name="logo"
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
              Upload {currentUrl ? "replacement" : "logo"}
            </button>
            <button
              type="button"
              onClick={() => {
                setFileName(null);
                const input = document.getElementById(
                  "logo-input",
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
