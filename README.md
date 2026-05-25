# RemoteRep v4

A complete rebuild of RemoteRep, designed to escape AWS lock-in and support a smarter product (ML-driven matching, AI features, multi-tenancy).

**Status:** Phase 0 (foundation) — see [docs/V4-MIGRATION-PLAN.md](docs/V4-MIGRATION-PLAN.md) for the full build plan.

---

## Read These First

Before contributing or making changes, read:

| File | What it is |
|---|---|
| [CLAUDE.md](CLAUDE.md) | The rules Claude follows on this project (safety, communication, workflow) |
| [BACKUPS.md](BACKUPS.md) | How code is backed up and how to restore previous versions |
| [WORKFLOW.md](WORKFLOW.md) | Step-by-step of how any task gets done on this repo |

## The Planning Docs (decisions that shape v4)

| Doc | Topic |
|---|---|
| [docs/V4-ARCHITECTURE.md](docs/V4-ARCHITECTURE.md) | The stack: Railway + Supabase + Resend + Cloudflare R2 |
| [docs/V3-FEATURE-AUDIT.md](docs/V3-FEATURE-AUDIT.md) | Everything v3 does today (so v4 doesn't drop anything) |
| [docs/V4-DATA-MODEL.md](docs/V4-DATA-MODEL.md) | Postgres schema, multi-tenancy, RBAC |
| [docs/V4-MIGRATION-PLAN.md](docs/V4-MIGRATION-PLAN.md) | Phased build plan, cutover runbook |

---

## Tech Stack

- **Frontend + Backend:** [Next.js 16](https://nextjs.org) (App Router) — one codebase, frontend pages + API routes
- **Database + Auth + Storage:** [Supabase](https://supabase.com) (Postgres + RLS for multi-tenancy)
- **Email:** [Resend](https://resend.com)
- **File uploads:** [Cloudflare R2](https://www.cloudflare.com/products/r2/) (S3-compatible)
- **Hosting:** [Railway](https://railway.app)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com)
- **Language:** TypeScript (strict)
- **Package manager:** npm

---

## Local Development

### Prerequisites

- Node.js 22+ (project tested on Node 24)
- npm 11+
- Git (with SSH set up for `git@github.com:remoterobert/RemoteRep---v4.git`)

### Setup

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Available Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server (hot reload) |
| `npm run build` | Build for production |
| `npm start` | Start the production server (after build) |
| `npm run lint` | Run ESLint |

---

## Project Structure

```
RemoteRep---v4/
├── src/
│   └── app/                 # Next.js App Router (pages + API routes)
│       ├── layout.tsx       # Root layout
│       ├── page.tsx         # Landing page
│       └── globals.css      # Global styles
├── public/                  # Static assets
├── docs/                    # Planning + architecture docs
├── v3-archive/              # Read-only archive of v3 code (for reference during rebuild)
├── CLAUDE.md                # Claude rules
├── BACKUPS.md               # Backup + restore guide
├── WORKFLOW.md              # How tasks happen on this repo
└── package.json
```

---

## Deployment

Auto-deploys via Railway on every push to `main`. Staging URL: TBD (set during Phase 0 completion).

---

## v3 Reference Code

The v3 source code is preserved at `v3-archive/` for reference during the v4 rebuild. It is **not** part of the v4 build — Railway / npm scripts ignore it. When v4 is fully launched and stable, this archive can be removed (or kept indefinitely).

The v3 production system continues to run separately from this repo at [github.com/RemoteRep-com/remoterep-v3](https://github.com/RemoteRep-com/remoterep-v3) until v4 cutover (see [docs/V4-MIGRATION-PLAN.md](docs/V4-MIGRATION-PLAN.md) Section 4).
