# BACKUPS.md — How Your Code Is Protected

This file explains, in plain English, how your project is backed up and how to restore previous versions if anything goes wrong.

---

## The Short Version

Your code is protected by **three layers**:

1. **Your local computer** — the files in `RemoteRep---v4/` on your Mac.
2. **Git history** — every change is saved as a "commit" with a description, like a save point in a video game. You can always go back to any commit.
3. **GitHub** — a copy of the project + all its history lives on GitHub's servers. If your Mac dies, the project survives.

For something to be truly lost, **all three layers** would have to fail at the same time. As long as we follow the rules in [CLAUDE.md](CLAUDE.md), this won't happen.

---

## What "Commit" and "Push" Mean

- **Commit** = save a snapshot of the project to git history on your computer. Like saving a Word doc, but every save is permanent and labeled.
- **Push** = upload your local commits to GitHub. This is what gets the code off your Mac and onto GitHub's servers.

**A commit that hasn't been pushed only exists on your laptop.** Claude will push after every meaningful set of commits so GitHub always has the latest.

---

## How To Go Back To A Previous Version

There are three ways to restore, listed from safest to most involved.

### Option A — Look at an old version (zero risk)

You can view any previous version of any file without changing anything current:

> "Claude, show me what `client/src/app/page.tsx` looked like a week ago."

Claude will pull it up from git history. Nothing is modified. This is for "I just want to see what was there before."

### Option B — Restore a specific file to a previous version (low risk)

If one file got messed up and you want it back the way it was:

> "Claude, restore `client/src/app/page.tsx` to how it was before yesterday's change."

Claude will:
1. Find the previous version in git history.
2. Show you what's about to change.
3. Wait for your OK.
4. Replace the current file with the old version, **as a new commit** (so the bad version is still in history if you change your mind).

### Option C — Restore the whole project to a previous point in time (bigger move)

If something went very wrong and you want the entire project back to how it was at a specific moment:

> "Claude, restore the whole project to how it was on Monday morning."

Claude will:
1. Find that point in git history (we'll have **tags** for major milestones — see below).
2. Explain exactly what will change and what could be lost.
3. Wait for your **explicit, typed-out approval**.
4. Create a **new branch** at the old state — your current code is NOT destroyed; you can still get back to it.

---

## Milestone Tags (Named Save Points)

Before any big change, Claude will create a "tag" — a named save point that's easy to find later.

Examples:
- `before-payment-integration-2026-05-25`
- `working-version-2026-05-25`
- `pre-database-migration-2026-06-01`

To restore to a tag, you just say: *"Claude, take me back to `working-version-2026-05-25`."*

To see all available tags: *"Claude, list all the save points we have."*

---

## How To Check Things Are Backed Up Right Now

Anytime you're nervous, ask:

> "Claude, is everything currently backed up to GitHub?"

Claude will check:
- Are there any uncommitted changes? (= unsaved work on your Mac only)
- Are there any commits that haven't been pushed? (= saved locally but not on GitHub yet)
- Is the GitHub copy up to date with your local copy?

If the answer to all three is "yes, everything is on GitHub," your work is safe.

---

## Rules Claude Follows Automatically

- **Never delete files** without explicit confirmation in chat.
- **Never force-push** (this can erase GitHub's history).
- **Never reset history** (this can erase commits).
- **Never end a session with uncommitted work.** If we're stopping mid-task, Claude will make a "work-in-progress" commit and push it so it's safe on GitHub.
- **Tag milestones before risky changes.**
- **Work on feature branches**, not directly on `main` — so even if a branch goes sideways, `main` stays clean and deployable.

See [CLAUDE.md](CLAUDE.md) Section 3 for the full "never do" list.

---

## What's NOT Backed Up By Git

A few things are intentionally NOT in git, because they're either sensitive or auto-generated:

- **`.env` files** — these contain secrets (API keys, database passwords). They live only on your Mac and on the server. **You should back these up separately** (e.g., save them in a password manager like 1Password or Bitwarden).
- **`node_modules/` folders** — these are downloaded automatically when you set the project up; no need to back them up.
- **`uploads/` folder** — user-uploaded files (resumes, profile pics, etc.). These belong in cloud storage (S3, etc.), not git. If we're using local uploads in development, we'll discuss backup separately.

---

## If Something Goes Wrong

1. **Don't panic and don't try to fix it yourself.** Most "disasters" in git are recoverable if you don't make it worse.
2. **Stop touching the project.** Don't run any commands, don't delete anything.
3. **Tell Claude what happened.** Even if it was Claude's mistake. The first step is to figure out what state things are in.
4. **Claude will explain the recovery options** and wait for your approval before doing anything.

Almost everything is recoverable from GitHub or git history. The things that aren't recoverable are usually the result of force-pushes, hard resets, or deleting branches — which is exactly why those are on the "never do without confirmation" list.
