"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  SparklesIcon,
  XMarkIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

/**
 * A button that pretends to trigger a premium feature but actually opens
 * an upgrade modal. Use in place of the real feature button when the
 * viewer is on the Free tier.
 */
export function PaywallButton({
  feature,
  children,
  className,
  ariaLabel,
}: {
  feature: "ai_basic" | "ai_concierge";
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={ariaLabel}
        className={className}
      >
        {children}
      </button>

      {open && <PaywallModalDialog onClose={close} feature={feature} />}
    </>
  );
}

function PaywallModalDialog({
  onClose,
  feature,
}: {
  onClose: () => void;
  feature: "ai_basic" | "ai_concierge";
}) {
  const isConcierge = feature === "ai_concierge";
  const title = isConcierge
    ? "Concierge is a paid feature"
    : "AI features are a paid feature";
  const lead = isConcierge
    ? "Let an AI agent source, invite, and interview candidates on your behalf. $299/mo or $2,874/yr (20% off)."
    : "Unlock the AI listing writer, profile helpers, and more with Premium. $59/mo.";

  const perks = isConcierge
    ? [
        "AI agent sources and invites your best-fit candidates 24/7",
        "Answers candidate questions and books interviews automatically",
        "Every AI action logged; final hiring decisions stay with your team",
        "Includes all Premium AI features",
      ]
    : [
        "AI listing writer (Default / Repel / Inclusive styles)",
        "AI profile helpers coming this quarter",
        "Priority support",
      ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface-2 shadow-2xl p-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-surface-3 text-light-grey"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <SparklesIcon className="h-5 w-5" />
          </div>
          <h2 id="paywall-title" className="text-lg font-semibold">
            {title}
          </h2>
        </div>

        <p className="text-sm text-light-grey mb-4">{lead}</p>

        <ul className="space-y-2 mb-6">
          {perks.map((p) => (
            <li key={p} className="flex items-start gap-2 text-sm">
              <CheckCircleIcon className="h-4 w-4 text-success mt-0.5 shrink-0" />
              <span>{p}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/settings/billing"
            className="rounded bg-primary text-white px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            See pricing &amp; upgrade
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-border px-4 py-2 text-sm hover:bg-surface-3"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
