-- Widen listing_details.commitment and compensation_type to arrays so a
-- single listing can be open to multiple modes (e.g., Full-time + Part-time)
-- and multiple compensation structures (e.g., Base + commission + bonuses).
-- Also add a free-text compensation_details field for the nuance those
-- structured fields can't capture.
--
-- Migration is safe: any existing single-value row is wrapped into an
-- array of length 1, so no data is lost.

alter table public.listing_details
  alter column commitment type public.commitment_type[]
    using case when commitment is null then null else array[commitment] end;

alter table public.listing_details
  alter column compensation_type type public.compensation_type[]
    using case when compensation_type is null then null else array[compensation_type] end;

alter table public.listing_details
  add column if not exists compensation_details text
    check (
      compensation_details is null
      or char_length(compensation_details) between 1 and 2000
    );

comment on column public.listing_details.commitment is
  'Acceptable commitment modes for this listing (multi). Reps can filter by any one.';
comment on column public.listing_details.compensation_type is
  'Acceptable compensation structures for this listing (multi). Reps can filter by any one.';
comment on column public.listing_details.compensation_details is
  'Free-text compensation breakdown — OTE, base/variable split, bonuses, SPIFFs, etc. Descriptive only, not filterable.';
