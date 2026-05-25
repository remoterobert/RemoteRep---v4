# WORKFLOW.md — How We Get Anything Done

This is the step-by-step recipe Claude follows for any task on this project. The owner is non-technical, so every step is designed to keep the owner informed and in control.

---

## The 7 Steps Of Any Task

### Step 1 — Understand The Request

Owner describes what they want. Claude:
- Restates it back in plain English to confirm understanding.
- Asks clarifying questions if anything is ambiguous.
- Says if the request is bigger than it sounds, or has hidden complications.

**Owner approval required to continue.**

### Step 2 — Plan In Plain English

Claude writes out:
- What files will be created, changed, or deleted.
- What new dependencies (libraries) might be needed and why.
- What could go wrong and how Claude will avoid it.
- Roughly how long this should take.

**Owner approval required to continue.**

### Step 3 — Safety Setup (For Anything Non-Trivial)

Before touching code, Claude will:
- Confirm the current branch and that the working tree is clean (no uncommitted changes hiding).
- For anything beyond a tiny fix: **create a new branch** (e.g., `dev-add-login-page`). This means the change is isolated — `main` is never put at risk.
- For risky changes (database, dependencies, big refactors): **create a git tag** as a named save point first.

Claude tells the owner: *"Created branch `dev-add-login-page`. Created tag `before-login-feature-2026-05-25` as a restore point. Ready to start."*

### Step 4 — Make The Change

Claude makes file changes. For each one:
- Describes what's being changed in plain English.
- Shows the change if asked (but doesn't assume the owner wants to read code).
- Pauses to confirm before anything destructive per [CLAUDE.md](CLAUDE.md) Rule 3.

### Step 5 — Test It Works

Claude verifies the change by:
- Running the app (or the relevant part of it).
- Doing the thing the owner asked for, end-to-end.
- Checking nothing else broke (the "did I cause a regression?" check).
- Reporting honestly: "I tested X and Y. Z is hard to test without you clicking through it — can you check?"

If Claude can't test something, Claude **says so explicitly** rather than claiming it works.

### Step 6 — Commit And Push

Claude:
- Stages the specific files changed (never `git add -A`, which can grab files we don't want).
- Writes a commit message that explains **why**, not just **what**.
- Pushes to GitHub immediately so the work is backed up.

Confirms: *"Committed and pushed. The change is now safely on GitHub on branch `dev-add-login-page`."*

### Step 7 — Summarize And Hand Back

Claude writes 2–3 sentences:
- What was done.
- What the owner should test or verify.
- What's next (open pull request? deploy? more work needed?).

---

## Branch & Pull Request Pattern

For anything beyond a trivial fix:

```
main (always stable, deployable)
  └── dev-feature-name (where we build)
        └── pull request (review before merging back to main)
              └── merge → main updates
```

This means:
- `main` is **always safe**. If something on a branch goes wrong, we throw the branch away and start over. `main` is untouched.
- Every feature gets a pull request — a final review before it joins `main`.
- The owner can always test on a branch before it goes live.

---

## What Counts As "Trivial" vs. "Non-Trivial"

| Trivial (work on current branch is OK) | Non-Trivial (new branch required) |
| --- | --- |
| Typo in a comment | Any new feature |
| One-line text change in a UI label | Any database change |
| Updating this documentation | Adding/upgrading/removing a dependency |
| Adding a missing semicolon | Any change to authentication, payments, or user data |
| | Anything that touches more than 2 files |
| | Anything the owner says feels big |

**When in doubt, treat it as non-trivial.** Creating a branch costs nothing.

---

## What Happens At The End Of A Session

Before the owner stops for the day, Claude will:
1. **Commit any work in progress** — even if incomplete. Message: `WIP: <what was being worked on>`.
2. **Push to GitHub.**
3. **Summarize where things stand**: what's done, what's not, what to pick up next time.

This guarantees that "I'll finish this tomorrow" doesn't mean "I have unsaved work for 16 hours."

---

## What Happens If Claude Hits An Obstacle

If a change doesn't work, an error appears, or something unexpected comes up, Claude will:

1. **Stop.** Not push through with workarounds.
2. **Describe what happened** in plain English. ("I tried to install package X, but it failed because Y.")
3. **Offer 2–3 options** with trade-offs. ("We can A, B, or C. A is fastest. B is safest. C means we change the goal slightly.")
4. **Wait for the owner to choose.**

Claude will **never** silently take a shortcut, disable a safety check, or bypass a problem with a workaround. The owner is the decision-maker on changes of direction.

---

## What The Owner Can Always Ask

At any moment, the owner can ask:

- *"What's the current state of things?"* → Claude reports what branch we're on, what's committed, what's pushed.
- *"Is everything backed up?"* → Claude verifies and reports honestly.
- *"What did we change today?"* → Claude lists the day's commits in plain English.
- *"Take me back to before you started this."* → Claude restores the project to the pre-task tag.
- *"What are you about to do?"* → Claude explains the next step before doing it.
- *"Stop."* → Claude stops immediately and waits for next instruction.

---

## Reviewing The Rules

These instructions ([CLAUDE.md](CLAUDE.md), [BACKUPS.md](BACKUPS.md), this file) are reviewed:
- **Before any new task**, briefly — Claude states which rules apply.
- **Anytime the owner wants** — just ask "let's review the rules."
- **Whenever the rules feel wrong** — the owner can change them at any time. The instructions exist to serve the owner, not the other way around.
