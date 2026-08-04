-- Fix the "comission" typo (missing an "m") in the compensation_type enum.
-- The v4 enum originally copied v3's misspelling to ease the data migration,
-- but it surfaces to users completing their profile / posting a listing.
--
-- RENAME VALUE is an in-place metadata change: every existing row using the
-- old label automatically reflects the new one. No data migration needed.

alter type public.compensation_type rename value 'Base + comission' to 'Base + commission';
alter type public.compensation_type rename value 'Comission-only' to 'Commission-only';
alter type public.compensation_type rename value 'Draw against comission' to 'Draw against commission';
