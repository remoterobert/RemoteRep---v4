"use client";

import { useState } from "react";
import { SparklesIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import {
  AI_DISCLOSURE_TITLE,
  AI_DISCLOSURE_LEAD,
  AI_DISCLOSURE_BULLETS,
  AI_DISCLOSURE_FOOTER,
} from "@/lib/ai-disclosure";

/**
 * Blocks the candidate's view of a concierge-enabled chat until they
 * either consent to AI interaction or opt out (in which case the AI
 * stops replying but the chat continues with humans only).
 */
export function AiConsentGate({
  tenantName,
  chatId,
  tenantId,
  consentAction,
  optOutAction,
}: {
  tenantName: string;
  chatId: string;
  tenantId: string;
  consentAction: (fd: FormData) => void;
  optOutAction: (fd: FormData) => void;
}) {
  const [submitting, setSubmitting] = useState<null | "consent" | "opt_out">(null);

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      <div className="rounded-2xl border border-primary/30 bg-surface-2 p-5 md:p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <SparklesIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold mb-0.5">
              {AI_DISCLOSURE_TITLE}
            </h1>
            <p className="text-sm text-light-grey">
              {tenantName} is using the RemoteRep concierge assistant.{" "}
              {AI_DISCLOSURE_LEAD}
            </p>
          </div>
        </div>

        <ul className="space-y-3 mb-5">
          {AI_DISCLOSURE_BULLETS.map((b) => (
            <li
              key={b.title}
              className="rounded-lg border border-border bg-surface-3 p-3"
            >
              <div className="text-sm font-semibold mb-0.5">{b.title}</div>
              <p className="text-xs text-light-grey leading-relaxed">
                {b.body}
              </p>
            </li>
          ))}
        </ul>

        <p className="text-[11px] text-light-grey mb-4 leading-relaxed">
          {AI_DISCLOSURE_FOOTER}
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border">
          <form
            action={consentAction}
            onSubmit={() => setSubmitting("consent")}
            className="contents"
          >
            <input type="hidden" name="chat_id" value={chatId} />
            <input type="hidden" name="tenant_id" value={tenantId} />
            <button
              type="submit"
              disabled={submitting !== null}
              className="rounded bg-primary text-white px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting === "consent"
                ? "Saving…"
                : "I consent and continue"}
            </button>
          </form>
          <form
            action={optOutAction}
            onSubmit={() => setSubmitting("opt_out")}
            className="contents"
          >
            <input type="hidden" name="chat_id" value={chatId} />
            <input type="hidden" name="tenant_id" value={tenantId} />
            <button
              type="submit"
              disabled={submitting !== null}
              className="rounded border border-border px-4 py-2 text-sm font-medium hover:bg-surface-3 transition-colors disabled:opacity-50"
            >
              <ExclamationTriangleIcon className="inline h-4 w-4 mr-1" />
              Only humans, please
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
