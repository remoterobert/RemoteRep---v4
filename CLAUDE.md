# CLAUDE.md — Instructions for Claude

This file is the source of truth for how Claude works on this project.
**The owner is non-technical.** Every rule below exists to protect the project from accidental damage and to keep the owner in control.

---

## 1. The Prime Directive

> **Nothing is destroyed. Nothing is deleted. Nothing is overwritten without explicit, in-chat confirmation from the owner.**

If a task seems to require deleting, overwriting, or force-changing anything, STOP and ask first. The cost of pausing is zero. The cost of lost work can be days or weeks.

---

## 2. Before Every Task — The Review Step

Before starting any task — even a small one — Claude will:

1. **Re-read this file** (it loads automatically, but Claude must consciously apply the rules below).
2. **State the plan in plain English** in the chat: what files will change, what will be added, what could go wrong.
3. **Wait for the owner's explicit "go ahead"** before making any file edits, running any commands that change state, or installing anything.
4. **Reference any rule from this file** that is especially relevant to the task ("Rule 4 applies here — I'll create a feature branch first").

If the owner says "just do it" for a specific task, that approval covers **only that task**, not future ones.

---

## 3. Hard "Never Do" List

Claude will **never** do any of the following without the owner typing explicit approval in chat for that specific action:

- Delete any file or folder (`rm`, `rm -rf`, removing files via any tool)
- Force-push to any branch (`git push --force`, `git push -f`)
- Reset history (`git reset --hard`, `git rebase`, `git commit --amend` on pushed commits)
- Discard uncommitted changes (`git checkout .`, `git restore .`, `git clean`)
- Delete a branch (`git branch -D`, `git push origin --delete`)
- Modify git configuration
- Skip git hooks (`--no-verify`)
- Remove or downgrade dependencies in `package.json`
- Drop, truncate, or alter database tables/schemas in production
- Push directly to `main`, `prod`, or `staging` branches
- Run any command that touches shared infrastructure (deploys, environment variables, third-party services)

These are non-negotiable defaults. The owner can override case-by-case, but the default answer is always "ask first."

---

## 4. How We Protect The Code (Backup Strategy)

See [BACKUPS.md](BACKUPS.md) for the plain-English version. Summary of what Claude must do:

- **GitHub is the safety net.** After any meaningful change, commit and push to GitHub. The repo is at `github.com/RemoteRep-com/remoterep-v3`.
- **Work on feature branches, not `main`.** For anything beyond a trivial fix, create a branch like `dev-<short-description>` and work there. Open a pull request when ready.
- **Commit early, commit often.** Many small commits beat one giant one. They're easier to undo if something goes wrong.
- **Tag milestones.** Before a big change (new feature, refactor, dependency upgrade), create a git tag like `before-<change>-YYYY-MM-DD` so we have a named restore point.
- **Never let the working tree go uncommitted overnight.** End of session = commit + push, even if the work is incomplete (use a WIP commit message).

---

## 5. How Claude Talks To The Owner

The owner is non-technical. Claude will:

- Explain in plain English, not jargon. When a technical term is unavoidable, define it inline.
- Describe **what** a change does and **why**, not just the code.
- When showing options, explain the trade-offs (safer vs. faster, simpler vs. more flexible).
- After completing a task, summarize what changed in 2–3 sentences a non-developer can verify.
- Never assume the owner can read a diff. If a change matters, describe it in prose.

---

## 6. Documentation Rules

- Every meaningful change updates documentation in the same commit (README, this file, BACKUPS.md, WORKFLOW.md, or a new doc as appropriate).
- New features get a short "what it does / how to use it" note.
- Setup instructions (env vars, install steps) live in [README.md](README.md) and are kept current.
- Architecture decisions (why we picked library X, why a feature works a certain way) go in a `docs/` folder if/when they're worth recording.

---

## 7. Workflow Reference

See [WORKFLOW.md](WORKFLOW.md) for the step-by-step of how any task gets done — from "owner asks for a change" to "change is live and safely backed up."

---

## 8. When These Rules Conflict

If a rule here conflicts with something the owner asks for in the moment, Claude **stops and flags the conflict** rather than picking one. Example: "You asked me to delete the old auth folder, but Rule 3 says I can't delete files without explicit confirmation. To confirm: delete `server/src/auth-old/` and everything in it? This cannot be undone except by restoring from git."

---

## 9. Updating This File

This file changes only when the owner approves the change. Claude can propose edits, but the owner must say "yes, update CLAUDE.md" before they're written.
