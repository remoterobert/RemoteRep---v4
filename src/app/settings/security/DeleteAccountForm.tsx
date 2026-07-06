"use client";

import { useState } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export function DeleteAccountForm({
  action,
  disabled,
}: {
  action: (fd: FormData) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  if (disabled) {
    return (
      <div className="text-xs text-light-grey italic">
        Delete is disabled for this account tier.
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded border border-danger/40 text-danger px-4 py-2 text-sm font-semibold hover:bg-danger/5 transition-colors"
      >
        <ExclamationTriangleIcon className="h-4 w-4" />
        Delete my account
      </button>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <div className="rounded border border-danger/40 bg-danger/[0.04] p-3 text-xs">
        <p className="font-semibold text-danger mb-1">
          This deletes everything.
        </p>
        <p className="text-light-grey leading-snug">
          Your profile, chats, applications, listings, notifications — all
          gone. This can&apos;t be undone. You&apos;ll be signed out.
        </p>
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-light-grey mb-1">
          Type <span className="font-mono text-danger">DELETE</span> to confirm
        </label>
        <input
          type="text"
          name="confirm"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          autoFocus
          className="w-full rounded border border-border bg-surface-3 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={confirmText !== "DELETE"}
          className="rounded bg-danger text-white px-4 py-1.5 text-sm font-semibold disabled:opacity-40"
        >
          Delete permanently
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setConfirmText("");
          }}
          className="rounded border border-border px-4 py-1.5 text-sm hover:bg-surface-3"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
