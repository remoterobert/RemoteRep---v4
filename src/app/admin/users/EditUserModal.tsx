"use client";

import { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export type EditableUser = {
  id: string;
  email: string;
  displayName: string;
  tags: string[];
  notes: string;
  accessLevel: string;
  referenceSource: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
};

/**
 * Client-side modal for editing user fields inline in the admin table.
 * Renders a trigger button; opens on click; submits the form action
 * on save.
 */
export function EditUserModal({
  user,
  action,
  trigger,
}: {
  user: EditableUser;
  action: (fd: FormData) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState(user.tags.join(", "));
  const [notes, setNotes] = useState(user.notes);
  const [accessLevel, setAccessLevel] = useState(user.accessLevel);
  const [refSource, setRefSource] = useState(user.referenceSource);
  const [makeAdmin, setMakeAdmin] = useState(user.isAdmin);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-surface-2 shadow-2xl p-6">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-surface-3 text-light-grey"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-semibold mb-1">Edit user</h2>
            <p className="text-xs text-light-grey mb-4">
              {user.displayName} · {user.email}
            </p>

            <form action={action} className="space-y-4">
              <input type="hidden" name="target_user_id" value={user.id} />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-light-grey mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="ghl-onboarded, cold-list, vip"
                  className="w-full rounded border border-border bg-surface-3 px-3 py-2 text-sm"
                />
                <p className="text-[11px] text-light-grey mt-1">
                  Comma-separated. Used to trigger GHL automations.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-light-grey mb-1">
                    Access level
                  </label>
                  <select
                    name="access_level"
                    value={accessLevel}
                    onChange={(e) => setAccessLevel(e.target.value)}
                    className="w-full rounded border border-border bg-surface-3 px-3 py-2 text-sm"
                  >
                    <option value="free">Free</option>
                    <option value="premium">Premium (paying)</option>
                    <option value="comp">Comp (admin-granted)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-light-grey mb-1">
                    Reference source
                  </label>
                  <input
                    type="text"
                    name="reference_source"
                    value={refSource}
                    onChange={(e) => setRefSource(e.target.value)}
                    placeholder="Self-registered"
                    className="w-full rounded border border-border bg-surface-3 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-light-grey mb-1">
                  Admin notes
                </label>
                <textarea
                  name="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Internal notes — only visible to platform admins."
                  className="w-full rounded border border-border bg-surface-3 px-3 py-2 text-sm"
                />
              </div>

              {user.isSuperAdmin ? (
                <div className="rounded-lg border border-danger/30 bg-danger/5 p-2.5 text-xs">
                  <div className="font-semibold text-danger mb-0.5">
                    Super Admin — role locked
                  </div>
                  <div className="text-light-grey leading-snug">
                    This account is the business owner. Role changes and
                    deletion are locked from the UI. Change via SQL only.
                  </div>
                </div>
              ) : (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="make_admin"
                    value="1"
                    checked={makeAdmin}
                    onChange={(e) => setMakeAdmin(e.target.checked)}
                  />
                  <span>Platform admin</span>
                  <span className="text-[11px] text-light-grey ml-auto">
                    Full access to /admin/*
                  </span>
                </label>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded border border-border px-4 py-1.5 text-sm hover:bg-surface-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-primary text-white px-4 py-1.5 text-sm font-semibold hover:opacity-90"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
