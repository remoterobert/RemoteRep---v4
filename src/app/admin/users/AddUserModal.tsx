"use client";

import { useState, useEffect } from "react";
import { XMarkIcon, PlusIcon } from "@heroicons/react/24/outline";
import { createUser } from "./actions";

export function AddUserModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [accessLevel, setAccessLevel] = useState("free");
  const [refSource, setRefSource] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");

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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90"
      >
        <PlusIcon className="h-4 w-4" />
        Add user
      </button>

      {open && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} aria-hidden="true" />

          <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface-2 shadow-2xl p-6">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-surface-3 text-light-grey"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-semibold mb-1">Create user</h2>
            <p className="text-xs text-light-grey mb-4">Create a new account manually.</p>

            <form action={createUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-light-grey mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="user@example.com"
                  className="w-full rounded border border-border bg-surface-3 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-light-grey mb-1">First name</label>
                  <input name="first_name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full rounded border border-border bg-surface-3 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-light-grey mb-1">Last name</label>
                  <input name="last_name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full rounded border border-border bg-surface-3 px-3 py-2 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-light-grey mb-1">Access level</label>
                  <select name="access_level" value={accessLevel} onChange={(e) => setAccessLevel(e.target.value)} className="w-full rounded border border-border bg-surface-3 px-3 py-2 text-sm">
                    <option value="free">Free</option>
                    <option value="premium">Premium</option>
                    <option value="comp">Comp</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-light-grey mb-1">Reference source</label>
                  <input name="reference_source" value={refSource} onChange={(e) => setRefSource(e.target.value)} className="w-full rounded border border-border bg-surface-3 px-3 py-2 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-light-grey mb-1">Tags</label>
                <input name="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="comma,separated" className="w-full rounded border border-border bg-surface-3 px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-light-grey mb-1">Admin notes</label>
                <textarea name="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded border border-border bg-surface-3 px-3 py-2 text-sm" />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button type="button" onClick={() => setOpen(false)} className="rounded border border-border px-4 py-1.5 text-sm hover:bg-surface-3">Cancel</button>
                <button type="submit" className="rounded bg-primary text-white px-4 py-1.5 text-sm font-semibold hover:opacity-90">Create user</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default AddUserModal;
