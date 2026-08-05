# v3 → v4 migration tooling

One-off scripts that migrated the v3 (AWS DynamoDB) data into v4 (Supabase).
Run from the repo root with env: `V3` (path to the exported data dir),
`NODE_PATH=$(pwd)/node_modules`, and Supabase creds from `.env.local`.

Order: industry-resolve → import-users (MIGRATE_FILES=1) → import-listings →
import-applications → import-chats → retry-files-curl (mop up any files).
Every script has a `MODE=dry` preview and is idempotent (safe to re-run).

The raw v3 export lives locally in `.v3-data/` (gitignored — contains PII).
