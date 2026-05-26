-- Shared utility function used by every table with an updated_at column.
-- Attach via: BEFORE UPDATE FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Trigger function: sets new.updated_at = now() on UPDATE.';
