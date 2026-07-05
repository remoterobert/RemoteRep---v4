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
  PencilSquareIcon,
  StarIcon,
  ArchiveBoxIcon,
  TrashIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import { EditUserModal, type EditableUser } from "./EditUserModal";

export function UserRowActions({
  user,
  impersonateAction,
  passwordResetAction,
  toggleCompAction,
  toggleArchiveAction,
  deleteAction,
  editAction,
  disableImpersonate,
  disableDelete,
  isArchived,
  isComp,
}: {
  user: EditableUser;
  impersonateAction: (fd: FormData) => void;
  passwordResetAction: (fd: FormData) => void;
  toggleCompAction: (fd: FormData) => void;
  toggleArchiveAction: (fd: FormData) => void;
  deleteAction: (fd: FormData) => void;
  editAction: (fd: FormData) => void;
  disableImpersonate?: boolean;
  disableDelete?: boolean;
  isArchived?: boolean;
  isComp?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<null | "id" | "url">(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  const profileUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/profiles/${user.id}`
      : "";

  function copy(kind: "id" | "url", text: string) {
    navigator.clipboard.writeText(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 1500);
  }

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
            onClick={() => {
              setOpen(false);
              setConfirmingDelete(false);
              setDeleteText("");
            }}
          />
          <div
            role="menu"
            className="absolute right-0 mt-1 w-60 rounded-lg border border-border bg-surface-2 shadow-xl z-50 py-1 text-left"
          >
            {/* View */}
            <Link
              href={`/admin/users/${user.id}`}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-3"
              onClick={() => setOpen(false)}
            >
              <ChartBarIcon className="h-4 w-4 text-light-grey" />
              View analytics
            </Link>
            <Link
              href={`/profiles/${user.id}`}
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-3"
              onClick={() => setOpen(false)}
            >
              <UserCircleIcon className="h-4 w-4 text-light-grey" />
              View profile page
            </Link>

            {/* Edit */}
            <EditUserModal
              user={user}
              action={editAction}
              trigger={
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-3"
                >
                  <PencilSquareIcon className="h-4 w-4 text-light-grey" />
                  Edit user
                </button>
              }
            />

            {/* Copy */}
            <button
              type="button"
              onClick={() => copy("id", user.id)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-3"
            >
              <ClipboardIcon className="h-4 w-4 text-light-grey" />
              {copied === "id" ? "Copied!" : "Copy user ID"}
            </button>
            <button
              type="button"
              onClick={() => copy("url", profileUrl)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-3"
            >
              <LinkIcon className="h-4 w-4 text-light-grey" />
              {copied === "url" ? "Copied!" : "Copy profile URL"}
            </button>

            <div className="my-1 border-t border-border" />

            {/* Auth actions */}
            <form action={passwordResetAction} className="contents">
              <input type="hidden" name="target_user_id" value={user.id} />
              <button
                type="submit"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-3"
              >
                <KeyIcon className="h-4 w-4 text-warning" />
                Send password reset
              </button>
            </form>

            <form action={impersonateAction} className="contents">
              <input type="hidden" name="target_user_id" value={user.id} />
              <button
                type="submit"
                disabled={disableImpersonate}
                title={
                  disableImpersonate ? "Cannot impersonate this account" : ""
                }
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-3 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ArrowsRightLeftIcon className="h-4 w-4 text-primary" />
                Impersonate
              </button>
            </form>

            <div className="my-1 border-t border-border" />

            {/* Grant / revoke comp */}
            <form action={toggleCompAction} className="contents">
              <input type="hidden" name="target_user_id" value={user.id} />
              <button
                type="submit"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-3"
              >
                <StarIcon
                  className={`h-4 w-4 ${isComp ? "text-warning" : "text-light-grey"}`}
                />
                {isComp ? "Revoke premium (comp)" : "Grant premium (comp)"}
              </button>
            </form>

            {/* Archive */}
            <form action={toggleArchiveAction} className="contents">
              <input type="hidden" name="target_user_id" value={user.id} />
              <button
                type="submit"
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-surface-3"
              >
                <ArchiveBoxIcon className="h-4 w-4 text-light-grey" />
                {isArchived ? "Unarchive" : "Archive"}
              </button>
            </form>

            <div className="my-1 border-t border-border" />

            {/* Delete with confirmation */}
            {!confirmingDelete ? (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                disabled={disableDelete}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-danger/5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <TrashIcon className="h-4 w-4" />
                Delete permanently
              </button>
            ) : (
              <form action={deleteAction} className="px-3 py-2 space-y-2">
                <input
                  type="hidden"
                  name="target_user_id"
                  value={user.id}
                />
                <div className="text-[11px] text-light-grey leading-snug">
                  Type <b>DELETE</b> to confirm. This removes the auth user
                  and cascades all their data.
                </div>
                <input
                  type="text"
                  name="confirm"
                  value={deleteText}
                  onChange={(e) => setDeleteText(e.target.value)}
                  autoFocus
                  className="w-full rounded border border-border bg-surface-3 px-2 py-1 text-xs"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={deleteText !== "DELETE"}
                    className="flex-1 rounded bg-danger text-white px-2 py-1 text-xs font-semibold disabled:opacity-40"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmingDelete(false);
                      setDeleteText("");
                    }}
                    className="rounded border border-border px-2 py-1 text-xs"
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
