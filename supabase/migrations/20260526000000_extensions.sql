-- Enable pgvector for embedding storage (matching algorithm, AI features).
-- See docs/V4-ARCHITECTURE.md §2.5.B for why this is enabled from day 1.
create extension if not exists vector with schema extensions;
