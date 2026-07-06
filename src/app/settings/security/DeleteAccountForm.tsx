"use client";

import { useState } from "react";
import {
  ExclamationTriangleIcon,
  PauseCircleIcon,
} from "@heroicons/react/24/outline";

type Step = "closed" | "interstitial" | "confirm";

export function DeleteAccountForm({
  action,
  pauseAction,
  disabled,
  hasHireHistory,
  isHiringSide,
  isAlreadyPaused,
}: {
  action: (fd: FormData) => void;
  pauseAction: () => void;
  disabled?: boolean;
  hasHireHistory: boolean;
  isHiringSide: boolean;
  isAlreadyPaused: boolean;
}) {
  const [step, setStep] = useState<Step>("closed");
  const [confirmText, setConfirmText] = useState("");

  if (disabled) {
    return (
      <div className="text-xs text-light-grey italic">
        Delete is disabled for this account tier.
      </div>
    );
  }

  if (step === "closed") {
    return (
      <button
        type="button"
        onClick={() => setStep("interstitial")}
        className="inline-flex items-center gap-1.5 rounded border border-danger/40 text-danger px-4 py-2 text-sm font-semibold hover:bg-danger/5 transition-colors"
      >
        <ExclamationTriangleIcon className="h-4 w-4" />
        Delete my account
      </button>
    );
  }

  if (step === "interstitial") {
    const headline = hasHireHistory
      ? isHiringSide
        ? "You've already hired reps here."
        : "You've already found a role here."
      : "Consider pausing instead.";

    const pauseCopy = isHiringSide
      ? "Pause hides your company profile and every listing from search. Your listings, chats, and hire history stay intact so nothing is lost when you come back."
      : "Pause hides your profile from search. Your chats, applications, and hire history stay intact so nothing is lost when you come back.";

    const deleteCopy = isHiringSide
      ? "Deleting removes your company, every listing you posted, every chat, and every application record. It cannot be undone."
      : "Deleting removes your profile, every application you sent, every chat, and every notification. It cannot be undone.";

    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-warning/40 bg-warning/5 p-3">
          <div className="flex items-start gap-2">
            <PauseCircleIcon className="h-5 w-5 text-warning mt-0.5 shrink-0" />
            <div className="text-sm">
              <div className="font-semibold mb-1">{headline}</div>
              <p className="text-xs text-light-grey leading-relaxed">
                {pauseCopy}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-danger/40 bg-danger/[0.03] p-3">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-danger mt-0.5 shrink-0" />
            <div className="text-sm">
              <div className="font-semibold mb-1">If you delete instead</div>
              <p className="text-xs text-light-grey leading-relaxed">
                {deleteCopy}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {!isAlreadyPaused && (
            <form action={pauseAction} className="contents">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded bg-primary text-white px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <PauseCircleIcon className="h-4 w-4" />
                Pause my account instead
              </button>
            </form>
          )}
          <button
            type="button"
            onClick={() => setStep("confirm")}
            className="rounded border border-danger/40 text-danger px-4 py-2 text-sm font-semibold hover:bg-danger/5 transition-colors"
          >
            Continue to delete
          </button>
          <button
            type="button"
            onClick={() => setStep("closed")}
            className="text-sm text-light-grey hover:text-primary transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // step === "confirm"
  return (
    <form action={action} className="space-y-3">
      <div className="rounded border border-danger/40 bg-danger/[0.04] p-3 text-xs">
        <p className="font-semibold text-danger mb-1">Last chance.</p>
        <p className="text-light-grey leading-snug">
          Everything on this account will be permanently removed and you&apos;ll
          be signed out. Nothing here can be recovered — even by us.
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
            setStep("interstitial");
            setConfirmText("");
          }}
          className="rounded border border-border px-4 py-1.5 text-sm hover:bg-surface-3"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => {
            setStep("closed");
            setConfirmText("");
          }}
          className="text-sm text-light-grey hover:text-primary transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
