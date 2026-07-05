"use client";

import Link from "next/link";
import { useState } from "react";
import {
  EllipsisHorizontalIcon,
  ChartBarIcon,
  UserCircleIcon,
  KeyIcon,
  ArrowsRightLeftIcon,
  ClipboardIcon,
} from "@heroicons/react/24/outline";

export function UserRowActions({
  userId,
  targetHasProfile,
  impersonateAction,
  passwordResetAction,
  disableImpersonate,
}: {
  userId: string;
  targetHasProfile: boolean;
  impersonateAction: (fd: FormData) => void;
  passwordResetAction: (fd: FormData) => void;
  disableImpersonate?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1 rounded-md p-1.5 hover:bg-surface-3 transition-colors"
      >
        <EllipsisHorizontalIcon className="h-5 w-5 text-light-grey" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 mt-1 w-56 rounded-lg border border-border bg-surface-2 shadow-xl z-50 py-1 text-left"
          >
            <Link
              href={`/admin/users/${userId}`}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-3"
              role="menuitem"
              onClick={() => setOpen(false)}
            >
              <ChartBarIcon className="h-4 w-4 text-light-grey" />
              View analytics
            </Link>

            {targetHasProfile && (
              <Link
                href={`/profiles/${userId}`}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-3"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <UserCircleIcon className="h-4 w-4 text-light-grey" />
                View profile page
              </Link>
            )}

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                navigator.clipboard.writeText(userId);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-3"
            >
              <ClipboardIcon className="h-4 w-4 text-light-grey" />
              {copied ? "Copied!" : "Copy user ID"}
            </button>

            <div className="my-1 border-t border-border" />

            <form action={passwordResetAction} className="contents">
              <input type="hidden" name="target_user_id" value={userId} />
              <button
                type="submit"
                role="menuitem"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-3"
              >
                <KeyIcon className="h-4 w-4 text-warning" />
                Send password reset
              </button>
            </form>

            <form action={impersonateAction} className="contents">
              <input type="hidden" name="target_user_id" value={userId} />
              <button
                type="submit"
                role="menuitem"
                disabled={disableImpersonate}
                title={
                  disableImpersonate
                    ? "Cannot impersonate this account"
                    : undefined
                }
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-3 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowsRightLeftIcon className="h-4 w-4 text-primary" />
                Impersonate
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
