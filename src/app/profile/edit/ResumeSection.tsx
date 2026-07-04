"use client";

import { useState } from "react";
import {
  DocumentArrowUpIcon,
  DocumentTextIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { SectionCard } from "./ProfileEditForm";

export function ResumeSection({
  currentFilename,
  currentSizeBytes,
  uploadedAt,
  uploadAction,
  deleteAction,
}: {
  currentFilename: string | null;
  currentSizeBytes: number | null;
  uploadedAt: string | null;
  uploadAction: (fd: FormData) => void;
  deleteAction: () => void;
}) {
  const [fileName, setFileName] = useState<string | null>(null);

  const humanSize = currentSizeBytes
    ? currentSizeBytes < 1024 * 1024
      ? `${Math.round(currentSizeBytes / 1024)} KB`
      : `${(currentSizeBytes / 1024 / 1024).toFixed(1)} MB`
    : null;

  return (
    <SectionCard
      step={4}
      title="Resume"
      subtitle="One PDF, up to 5 MB. Hiring companies who view your public profile can download it."
    >
      {currentFilename && (
        <div className="rounded-lg border border-zinc-200 dark:border-white/[0.06] p-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <DocumentTextIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">
              {currentFilename}
            </div>
            <div className="text-xs text-light-grey">
              {humanSize}
              {uploadedAt &&
                ` · uploaded ${new Date(uploadedAt).toLocaleDateString(
                  undefined,
                  { month: "short", day: "numeric", year: "numeric" },
                )}`}
            </div>
          </div>
          <form action={deleteAction} className="contents">
            <button
              type="submit"
              className="inline-flex items-center gap-1 text-xs text-danger hover:opacity-80 px-2 py-1 rounded hover:bg-danger/5"
              aria-label="Remove resume"
            >
              <TrashIcon className="h-4 w-4" />
              Remove
            </button>
          </form>
        </div>
      )}

      <form action={uploadAction} className="space-y-3">
        <label
          htmlFor="resume-input"
          className="block rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          <DocumentArrowUpIcon className="h-8 w-8 text-light-grey mx-auto mb-2" />
          <div className="text-sm font-medium">
            {fileName ?? (currentFilename ? "Replace resume" : "Upload resume")}
          </div>
          <div className="text-xs text-light-grey mt-1">
            PDF only · up to 5 MB
          </div>
          <input
            id="resume-input"
            name="resume"
            type="file"
            accept="application/pdf"
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
              Upload {currentFilename ? "replacement" : "resume"}
            </button>
            <button
              type="button"
              onClick={() => {
                setFileName(null);
                const input = document.getElementById(
                  "resume-input",
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
    </SectionCard>
  );
}
